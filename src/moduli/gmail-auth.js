const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS_PATHS = [
  path.join(__dirname, '..', '..', 'config', 'gmail-credentials.json'),
  '/etc/secrets/gmail-credentials.json',
  path.join(__dirname, '..', '..', 'gmail-credentials.json')
];
const TOKEN_PATH = path.join(__dirname, '..', '..', 'config', 'gmail-token.json');

class GmailAuth {
  constructor() {
    this.oAuth2Client = null;
  }

  // Carica le credenziali da file
  loadCredentials() {
    if (CREDENTIALS_PATHS.length === 0) return false;
    for (const p of CREDENTIALS_PATHS) {
      try {
        const creds = JSON.parse(fs.readFileSync(p, 'utf8'));
        const { client_secret, client_id, redirect_uris } = creds.web || creds.installed;
        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        return true;
      } catch (e) {
        console.log('Errore caricamento credenziali da', p, e.message);
      }
    }
    return false;
  }

  // Carica token salvato
  loadToken() {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        this.oAuth2Client.setCredentials(token);
        return true;
      }
    } catch (e) {}
    return false;
  }

  // Salva token
  saveToken(token) {
    const dir = path.dirname(TOKEN_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  }

  // Genera URL per OAuth
  getAuthUrl() {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  // Scambia il codice con il token
  async getToken(code) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    this.oAuth2Client.setCredentials(tokens);
    this.saveToken(tokens);
    return tokens;
  }

  // Refresh token automatico
  async refreshToken() {
    if (this.oAuth2Client && this.oAuth2Client.isTokenExpiring()) {
      const { credentials } = await this.oAuth2Client.refreshAccessToken();
      this.saveToken(credentials);
    }
  }

  // Rinnova automaticamente
  autoRefresh() {
    setInterval(() => this.refreshToken(), 30 * 60 * 1000); // ogni 30 min
  }

  isReady() {
    return this.oAuth2Client && this.oAuth2Client.credentials && this.oAuth2Client.credentials.access_token;
  }
}

module.exports = new GmailAuth();
