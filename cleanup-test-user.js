/**
 * Cleanup Test User from Cognito
 * Deletes the test user so we can test fresh signup -> verify flow
 */

require('dotenv').config({ path: '.env.local' });

const { CognitoIdentityProviderClient, AdminDeleteUserCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const testPhoneNumber = '+919876543210';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function cleanupUser() {
  console.log('🧹 Cleaning up test user from Cognito...\n');
  console.log('Phone Number:', testPhoneNumber);
  console.log('User Pool ID:', process.env.NEXT_PUBLIC_USER_POOL_ID);
  console.log('');

  try {
    // First check if user exists
    console.log('Checking if user exists...');
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      Username: testPhoneNumber,
    });

    const userResult = await client.send(getUserCommand);
    console.log('✅ User found in Cognito');
    console.log('User Status:', userResult.UserStatus);
    console.log('User Attributes:', userResult.UserAttributes);
    console.log('');

    // Delete the user
    console.log('Deleting user...');
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      Username: testPhoneNumber,
    });

    await client.send(deleteCommand);
    console.log('✅ User deleted successfully from Cognito!');
    console.log('');
    console.log('Now you can run: node test-verify-flow.js');

  } catch (error) {
    if (error.name === 'UserNotFoundException') {
      console.log('ℹ️  User not found in Cognito (already deleted or never existed)');
      console.log('You can proceed with fresh signup');
    } else {
      console.error('❌ Error:', error.name);
      console.error('Message:', error.message);
      
      if (error.name === 'NotAuthorizedException') {
        console.error('\n⚠️  Permission denied! Your IAM user needs cognito-idp:AdminDeleteUser permission');
      }
    }
  }
}

cleanupUser();
