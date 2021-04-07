import { OAuth2Client } from 'google-auth-library';
import { google, oauth2_v1 } from 'googleapis';

import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';

export interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

// If modifying these scopes, delete token.json.
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

export const authorizeAccount = async (credentials: ClientCredentials): Promise<OAuth2Client> => {
  const auth = new google.auth.OAuth2({
    // more info on the interface "OAuth2ClientOptions" in 'googleapis' package
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    redirectUri: credentials.redirect_uris[0],
  });

  const token = await getToken(auth);

  if (token) {
    auth.setCredentials(token);
  }
  return auth;
};

const getCredentials = (credentialsJsonPath: string): ClientCredentials => {
  let allCredentials: any;
  try {
    const credentialsString = readFileSync(credentialsJsonPath, { encoding: 'utf8' });
    allCredentials = JSON.parse(credentialsString);
  } catch (e) {
    log('Unable to find or parse credentials json file:', e.message);
  }
  const credentialsDataKey: string = Object.keys(allCredentials)[0];
  if (!credentialsDataKey) {
    log('credentials json file contains no data, expected object with credentials');
  }
  const credentials = allCredentials[credentialsDataKey];
  if (
    !credentials ||
    !credentials.client_id ||
    !credentials.client_secret ||
    !credentials.redirect_uris ||
    !credentials.redirect_uris[0]
  ) {
    log('Credentials do not contain required attributes client_id, client_secret and at least one redirect_uris item');
  }

  return credentials;
};

const getToken = async (
  oAuth2Client: OAuth2Client,
): Promise<any /* interface 'Credentials' (could not import from googleapis types) */ | null> => {
  // means we got no valid token to use, so we request a new one
  return getNewToken(oAuth2Client);
};

const getNewToken = async (oAuth2Client: OAuth2Client): Promise<any> => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const readLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    readLine.question('Enter the code from that page here: ', async code => {
      readLine.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  });
};

const log = (...messages: string[]) => {
  messages.unshift('Gmail-inbox:');
  console.log.apply(console, messages as any);
  // throw new Error(...messages);
};
