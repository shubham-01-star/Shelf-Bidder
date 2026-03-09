import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class ShelfBidderStack extends cdk.Stack {
  public readonly backendInstance: ec2.Instance;
  public readonly photoBucket: s3.Bucket;
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      isDefault: true,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'ShelfBidderEc2SecurityGroup', {
      vpc,
      description: 'Security group for ShelfBidder EC2 Docker host',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');

    const instanceRole = new iam.Role(this, 'ShelfBidderEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for the ShelfBidder EC2 instance running Docker workloads',
    });

    instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'connect:StartOutboundVoiceContact',
          'ses:SendEmail',
          'ses:SendRawEmail',
        ],
        resources: ['*'],
      })
    );

    this.photoBucket = new s3.Bucket(this, 'PhotoBucket', {
      bucketName: `shelf-bidder-photos-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'TransitionPhotosToInfrequentAccess',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          id: 'ExpireOldPhotos',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    this.backupBucket = new s3.Bucket(this, 'PostgresBackupBucket', {
      bucketName: `shelf-bidder-db-backups-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'ExpireOldDatabaseBackups',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    this.photoBucket.grantReadWrite(instanceRole);
    this.backupBucket.grantReadWrite(instanceRole);

    this.backendInstance = new ec2.Instance(this, 'ShelfBidderBackendInstance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup,
      role: instanceRole,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    const elasticIp = new ec2.CfnEIP(this, 'ShelfBidderElasticIp', {
      instanceId: this.backendInstance.instanceId,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.backendInstance.instanceId,
      description: 'ID of the EC2 instance running ShelfBidder',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: elasticIp.ref,
      description: 'Elastic IP attached to the ShelfBidder EC2 instance',
    });

    new cdk.CfnOutput(this, 'EC2PublicDnsName', {
      value: this.backendInstance.instancePublicDnsName,
      description: 'Public DNS name of the EC2 instance',
    });

    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: this.photoBucket.bucketName,
      description: 'S3 bucket used for application photo storage',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket used for PostgreSQL backups',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region for the deployed stack',
    });

    cdk.Tags.of(this).add('Project', 'ShelfBidder');
    cdk.Tags.of(this).add('Environment', 'Production');
  }
}
