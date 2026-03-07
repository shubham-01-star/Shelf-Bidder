import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Staging Stack for Shelf-Bidder
 *
 * A lighter-weight copy of the production stack with:
 *  - DESTROY removal policies (easy cleanup)
 *  - "Staging-" table name prefixes
 *  - No S3 replication bucket
 */
export class ShelfBidderStagingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── VPC & Security ───────────────────────────────────────────
    // Using default VPC for Free Tier simplicity
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true,
    });

    // Security Group for EC2
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ShelfBidderEC2SG', {
      vpc,
      description: 'Security group for ShelfBidder EC2 instance',
      allowAllOutbound: true, // Allow outgoing traffic (e.g., Docker pull, OS updates)
    });

    // Allow inbound HTTP, HTTPS, and SSH traffic
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP Traffic');
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS Traffic');
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Traffic');

    // ── IAM Role for EC2 ─────────────────────────────────────────
    const ec2Role = new iam.Role(this, 'ShelfBidderEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for ShelfBidder EC2 instance to access S3, Bedrock, etc.',
    });

    // Add necessary permissions
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: ['*'], // Specify specific Bedrock models if needed later
    }));

    // Grant SES permissions for Lambda/Email Notification fallback
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail'
      ],
      resources: ['*'],
    }));

    // ── S3 Bucket (no replication for staging) ───────────────────
    const photoBucket = new s3.Bucket(this, 'PhotoBucket', {
      bucketName: `staging-shelf-bidder-photos-${this.account}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // ── Cognito ──────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'StagingUserPool', {
      userPoolName: 'Staging-ShelfBidder-Shopkeepers',
      selfSignUpEnabled: true,
      signInAliases: { phone: true, email: false, username: false },
      autoVerify: { phone: true },
      standardAttributes: {
        phoneNumber: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const pwaClient = userPool.addClient('StagingPWAClient', {
      userPoolClientName: 'Staging-ShelfBidder-PWA',
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    // Grant S3 access to the EC2 role
    photoBucket.grantReadWrite(ec2Role);

    // ── EC2 Instance ─────────────────────────────────────────────
    // Use t3.small for running PostgreSQL Docker + Next.js build simultaneously
    const ec2Instance = new ec2.Instance(this, 'ShelfBidderBackendInstance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      // Key pair configuration is omitted deliberately. 
      // You should connect via AWS Systems Manager (SSM) Session Manager.
      // E.g., adding `AmazonSSMManagedInstanceCore` to ec2Role if ssh isn't used.
    });
    
    // Attach AWS Systems Manager Managed Instance Core to connect without SSH keys
    ec2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // Associate an Elastic IP
    const eip = new ec2.CfnEIP(this, 'ShelfBidderEIP', {
      instanceId: ec2Instance.instanceId,
    });

    // ── Outputs ──────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of the EC2 Instance',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: eip.ref,
      description: 'Public Elastic IP of the EC2 Instance',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'CognitoClientId', {
      value: pwaClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: photoBucket.bucketName,
      description: 'S3 Photo Bucket Name',
    });

    // ── Tags ─────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'ShelfBidder');
    cdk.Tags.of(this).add('Environment', 'Staging');
  }
}
