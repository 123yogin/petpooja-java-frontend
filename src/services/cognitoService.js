// Cognito Service for authentication
const COGNITO_REGION = 'ap-south-1';
const COGNITO_USER_POOL_ID = 'ap-south-1_eGnW5Jp5S';
const COGNITO_CLIENT_ID = '7ovicjpved8vonv7dt82pudk6a';
const COGNITO_CLIENT_SECRET = '190sh1s24q6eh4hjfhd7ve1t82m0edl0p9cvet2s54ffbsug5e7q';

// Helper to compute secret hash
function computeSecretHash(username) {
  const crypto = window.crypto || window.msCrypto;
  const encoder = new TextEncoder();
  const data = encoder.encode(username + COGNITO_CLIENT_ID);
  const key = encoder.encode(COGNITO_CLIENT_SECRET);
  
  // For browser, we'll use a simpler approach - actually, we need to use AWS SDK or make backend calls
  // Since we can't easily compute HMAC in browser without AWS SDK, let's use backend endpoints
  return null; // Will use backend for signup/login with client secret
}

// Sign up user in Cognito (via backend)
export async function signUp(email, password, username, role) {
  try {
    const response = await fetch('http://localhost:8080/api/auth/cognito/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        username,
        role
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Sign up failed');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// Sign in user with Cognito (via backend)
export async function signIn(email, password) {
  try {
    const response = await fetch('http://localhost:8080/api/auth/cognito/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Sign in failed');
    }
    return data; // Returns { idToken, accessToken, refreshToken }
  } catch (error) {
    throw error;
  }
}

// Direct Cognito API calls (if needed)
export async function signInDirect(email, password) {
  const params = new URLSearchParams();
  params.append('AuthFlow', 'USER_PASSWORD_AUTH');
  params.append('ClientId', COGNITO_CLIENT_ID);
  params.append('AuthParameters', JSON.stringify({
    USERNAME: email,
    PASSWORD: password,
    SECRET_HASH: computeSecretHash(email)
  }));

  try {
    const response = await fetch(
      `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`,
      {
        method: 'POST',
        headers: {
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'Content-Type': 'application/x-amz-json-1.1',
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        })
      }
    );

    const data = await response.json();
    if (data.AuthenticationResult) {
      return {
        idToken: data.AuthenticationResult.IdToken,
        accessToken: data.AuthenticationResult.AccessToken,
        refreshToken: data.AuthenticationResult.RefreshToken
      };
    }
    throw new Error(data.__type || 'Authentication failed');
  } catch (error) {
    throw error;
  }
}

