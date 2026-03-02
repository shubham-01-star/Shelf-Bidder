const { CognitoIdentityProviderClient, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_pKUh37Sru';
const USERNAME = '+919856231478';

const client = new CognitoIdentityProviderClient({ region: REGION });

async function deleteUser() {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: USERNAME,
    });
    
    await client.send(command);
    console.log(`Successfully deleted user ${USERNAME} from Cognito! You can now sign up again.`);
  } catch (error) {
    if (error.name === 'UserNotFoundException') {
      console.log(`User ${USERNAME} does not exist. Good to go!`);
    } else {
      console.error('Error deleting user:', error);
    }
  }
}

deleteUser();
