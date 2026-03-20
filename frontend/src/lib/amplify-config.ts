import { Amplify } from 'aws-amplify';

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      loginWith: {
        email: true,
        username: true,
      },
    },
  },
};

export function configureAmplify() {
  Amplify.configure(amplifyConfig);
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
