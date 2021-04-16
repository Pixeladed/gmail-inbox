import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import * as readline from 'readline';

export interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

export const getAuthClient = (credentials: ClientCredentials) => {
  return new google.auth.OAuth2({
    // more info on the interface "OAuth2ClientOptions" in 'googleapis' package
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    redirectUri: credentials.redirect_uris[0],
  });
}

export const authorizeAccount = async (credentials: ClientCredentials, refreshToken: string): Promise<OAuth2Client> => {
  const auth = getAuthClient(credentials)

  auth.setCredentials({ refresh_token: refreshToken })

  let newCredentials: Credentials;

  try {
    newCredentials = await new Promise<Credentials>(async (resolve, reject) => {
      auth.refreshAccessToken((error, cred) => {
        if (error) {
          return reject(error)
        } else {
          if (cred) {
            resolve(cred)
          }
        }
      })
    })
  } catch (error) {
    console.error('errored whole refreshing token', error)
    console.log('getting new token code instead')
    newCredentials = await getNewToken(auth)
  }
  auth.setCredentials(newCredentials);
  return auth;
};

export const getAuthUrl = (oAuth2Client: OAuth2Client) => {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
  return authUrl
}

export const tokenToCred = async (oAuth2Client: OAuth2Client, code: string) => {
  return new Promise((resolve, reject) => {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        reject(err);
      } else {
        console.log('received token', token)
        resolve(token);
      }
    });
  })
}

const getNewToken = async (oAuth2Client: OAuth2Client): Promise<any> => {
  const authUrl = getAuthUrl(oAuth2Client)
  console.log('Authorize this app by visiting this url:', authUrl);
  const readLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    readLine.question('Enter the code from that page here: ', async code => {
      readLine.close();
      try {
        const cred = await tokenToCred(oAuth2Client, code)
        resolve(cred)
      } catch (error) {
        reject(error)
      }
    });
  });
};