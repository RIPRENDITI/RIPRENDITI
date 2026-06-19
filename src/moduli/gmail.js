const { google } = require('googleapis');

// Regex per trovare acquisti/rimborsi nelle email
const PATTERN_RIMBORSI = {
  amazon: {
    da: ['order-update@amazon.it', 'shipment-confirm@amazon.it', 'no-reply@amazon.it'],
    oggetti: ['ordine', 'conferma', 'spedizione', 'Consegna prevista'],
    rimborso: ['ritardo', 'danneggiato', 'sostituzione', 'resa', 'rimborso']
  },
  treni: {
    da: ['trenitalia@trenitalia.com', 'news@italotreno.it', 'conferma@italotreno.it'],
    oggetti: ['biglietto', 'prenotazione', 'ordine', 'conferma acquisto'],
    rimborso: ['ritardo', 'cancellato', 'sostituzione', 'rimborso', 'indennizzo']
  },
  voli: {
    da: ['confirmation@ryanair.com', 'booking@easyjet.com', 'info@wizzair.com', 'itau@ita-airways.com'],
    oggetti: ['booking', 'conferma', 'biglietto', 'prenotazione'],
    rimborso: ['cancellato', 'ritardo', 'overbooking', 'rimborso', 'compensazione']
  },
  bollette: {
    da: ['servizio@enel.it', 'info@enigas.com', 'notifica@edenred.it'],
    oggetti: ['bolletta', 'fattura', 'addebito'],
    rimborso: ['doppia fattura', 'errore', 'conguaglio', 'storno']
  }
};

class GmailScanner {
  constructor(auth) {
    this.gmail = google.gmail({ version: 'v1', auth });
    this.email = '';
  }

  async getProfile() {
    const res = await this.gmail.users.getProfile({ userId: 'me' });
    this.email = res.data.emailAddress;
    return res.data;
  }

  // Cerca email per parola chiave
  async cercaEmail(query, max = 20) {
    const res = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: max
    });
    return res.data.messages || [];
  }

  // Legge il contenuto di un'email
  async leggiEmail(messageId) {
    const res = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    return this._parseEmail(res.data);
  }

  // Scansiona email alla ricerca di rimborsi
  async scansionaRimborsi() {
    const risultati = [];

    for (const [categoria, patterns] of Object.entries(PATTERN_RIMBORSI)) {
      // Cerca email dai mittenti noti
      for (const mittente of patterns.da) {
        const query = `from:${mittente} after:2024/1/1`;
        try {
          const messages = await this.cercaEmail(query, 10);
          for (const msg of messages) {
            const email = await this.leggiEmail(msg.id);
            if (this._contienePattern(email, patterns.oggetti)) {
              const rimborsi = this._cercaRimborsiPossibili(email, categoria);
              risultati.push(...rimborsi);
            }
          }
        } catch (e) {
          console.log(`Errore scansione ${mittente}: ${e.message}`);
        }
      }
    }

    return risultati;
  }

  _parseEmail(message) {
    const headers = {};
    const payload = message.payload;
    const parts = [payload, ...(payload.parts || [])];
    
    for (const header of payload.headers) {
      headers[header.name.toLowerCase()] = header.value;
    }

    let corpo = '';
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        corpo += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      id: message.id,
      da: headers.from || '',
      a: headers.to || '',
      oggetto: headers.subject || '',
      data: headers.date || '',
      corpo: corpo
    };
  }

  _contienePattern(email, patterns) {
    const testo = `${email.oggetto} ${email.corpo}`.toLowerCase();
    return patterns.some(p => testo.includes(p.toLowerCase()));
  }

  _cercaRimborsiPossibili(email, categoria) {
    const risultati = [];
    const testo = `${email.oggetto} ${email.corpo}`.toLowerCase();
    const patterns = PATTERN_RIMBORSI[categoria];

    for (const keyword of patterns.rimborso) {
      if (testo.includes(keyword.toLowerCase())) {
        risultati.push({
          email_id: email.id,
          da: email.da,
          oggetto: email.oggetto,
          data: email.data,
          categoria,
          keyword_trovata: keyword,
          tipo: 'potenziale_rimborso'
        });
        break;
      }
    }

    // Estrai importo se presente
    const matchImporto = testo.match(/(\d+[,.]?\d*)\s*€/);
    if (matchImporto) {
      risultati[risultati.length - 1].importo = parseFloat(matchImporto[1].replace(',', '.'));
    }

    return risultati;
  }
}

module.exports = GmailScanner;
