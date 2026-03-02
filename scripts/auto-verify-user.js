const { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');

const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_pKUh37Sru';
const USERNAME = '+919856231478';

const client = new CognitoIdentityProviderClient({ region: REGION });

async function autoConfirmUser() {
  try {
    const command = new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: USERNAME,
    });
    
    await client.send(command);
    console.log(`Successfully verified user ${USERNAME} in Cognito!`);
    console.log(`You can now go to http://localhost:3000/signin and login with ${USERNAME} and your password.`);
  } catch (error) {
    console.error('Error confirming user:', error.message);
  }
}

autoConfirmUser();
