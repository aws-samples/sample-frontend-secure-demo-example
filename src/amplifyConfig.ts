import { Amplify } from 'aws-amplify';

// Auth only. Values come from the CDK stack outputs (UserPoolId, SpaClientId).
// Note: the app client has NO client secret — a browser is a public client, so
// Amplify uses SRP / PKCE rather than a secret.
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    },
  },
});
