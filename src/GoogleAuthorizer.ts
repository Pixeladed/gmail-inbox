import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

export const authorizeAccount = async (credentials: ClientCredentials, refreshToken: string): Promise<OAuth2Client> => {
  const auth = new google.auth.OAuth2({
    // more info on the interface "OAuth2ClientOptions" in 'googleapis' package
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    redirectUri: credentials.redirect_uris[0],
  });

  auth.setCredentials({ refresh_token: refreshToken })

  const newCredentials = await new Promise<Credentials>(async (resolve, reject) => {
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

  auth.setCredentials(newCredentials);
  return auth;
};