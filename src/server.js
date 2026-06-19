const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Gmail integration
const gmailAuth = require('./moduli/gmail-auth');
const GmailScanner = require('./moduli/gmail');

// PayPal integration
const paypal = require('./moduli/paypal');


const DIRITTI = {
  treni: {
    nome: 'Treni',
    icon: '🚄',
    color: '#6c5ce7',
    max: 600,
    items: [
      { diritto: 'Ritardo 30-59 min', importo: '25% del biglietto' },
      { diritto: 'Ritardo 60-119 min', importo: '50% del biglietto' },
      { diritto: 'Ritardo oltre 2 ore', importo: '100% del biglietto' },
      { diritto: 'Treno cancellato', importo: '100% + indennizzo extra' },
      { diritto: 'Abbonamento con ritardi frequenti', importo: 'Rimborso parziale mensile' }
    ]
  },
  voli: {
    nome: 'Voli',
    icon: '✈️',
    color: '#fd79a8',
    max: 600,
    items: [
      { diritto: 'Ritardo 3-4 ore', importo: '250€' },
      { diritto: 'Ritardo 4-5 ore', importo: '400€' },
      { diritto: 'Ritardo oltre 5 ore', importo: '600€' },
      { diritto: 'Volo cancellato', importo: '250€ - 600€' },
      { diritto: 'Negato imbarco (overbooking)', importo: '250€ - 600€' },
      { diritto: 'Bagaglio smarrito/danneggiato', importo: 'Fino a 1.500€' }
    ]
  },
  amazon: {
    nome: 'Amazon',
    icon: '📦',
    color: '#fdcb6e',
    max: 200,
    items: [
      { diritto: 'Consegna in ritardo (Prime)', importo: 'Mese Prime gratis' },
      { diritto: 'Pacco mai arrivato', importo: 'Rimborso 100%' },
      { diritto: 'Articolo danneggiato', importo: 'Rimborso o sostituzione' },
      { diritto: 'Prezzo sceso dopo acquisto', importo: 'Differenza rimborsata' },
      { diritto: 'Prodotto diverso dal descritto', importo: 'Rimborso 100%' }
    ]
  },
  banche: {
    nome: 'Banche',
    icon: '🏦',
    color: '#00b894',
    max: 500,
    items: [
      { diritto: 'Canone conto non dovuto', importo: 'Rimborso fino a 5 anni' },
      { diritto: 'Commissioni bonifico abusive', importo: 'Rimborso totale' },
      { diritto: 'Spese incasso bollette indebite', importo: 'Rimborso totale' },
      { diritto: 'Interessi su scoperto non autorizzato', importo: 'Rimborso totale' },
      { diritto: 'Commissioni prelievo ATM indebite', importo: 'Rimborso totale' }
    ]
  },
  assicurazioni: {
    nome: 'Assicurazioni',
    icon: '🛡️',
    color: '#e17055',
    max: 1000,
    items: [
      { diritto: 'RCA non goduta (vendita auto)', importo: 'Rimborso rate residue' },
      { diritto: 'Polizza sanitaria - prestazione negata', importo: 'Rimborso spese' },
      { diritto: 'Assicurazione smartphone - sinistro', importo: 'Rimborso riparazione' },
      { diritto: 'Polizza viaggio annullata', importo: 'Rimborso totale' },
      { diritto: 'Assicurazione casa - danno non liquidato', importo: 'Rivalutazione' }
    ]
  },
  bollette: {
    nome: 'Bollette',
    icon: '💡',
    color: '#a29bfe',
    max: 300,
    items: [
      { diritto: 'Doppia fatturazione stesso periodo', importo: 'Rimborso 100%' },
      { diritto: 'Penale cambio operatore illegittima', importo: 'Rimborso totale' },
      { diritto: 'Bolletta stimata errata (conguaglio)', importo: 'Differenza rimborsata' },
      { diritto: 'Disservizio telefonia/internet', importo: 'Giorni non fruiti' },
      { diritto: 'Velocità internet inferiore al contratto', importo: 'Penale + rimborso' }
    ]
  },
  pa: {
    nome: 'Pubblica Amministrazione',
    icon: '🏛️',
    color: '#fab1a0',
    max: 500,
    items: [
      { diritto: 'Multe ingiuste (ricorso vittorioso)', importo: 'Rimborso + spese' },
      { diritto: 'Ticket sanitari non dovuti', importo: 'Rimborso totale' },
      { diritto: 'Bollo auto pagato due volte', importo: 'Rimborso totale' },
      { diritto: 'TARI calcolata erroneamente', importo: 'Rimborso differenza' },
      { diritto: 'IMU pagata in eccesso', importo: 'Rimborso totale' }
    ]
  }
};

const richieste = [];

app.get('/api/categorie', (req, res) => {
  const data = Object.entries(DIRITTI).map(([k, v]) => ({
    id: k, nome: v.nome, icon: v.icon, color: v.color,
    max: v.max, count: v.items.length
  }));
  res.json(data);
});

app.get('/api/categoria/:id', (req, res) => {
  const cat = DIRITTI[req.params.id];
  if (!cat) return res.status(404).json({ errore: 'Categoria non trovata' });
  res.json({ id: req.params.id, ...cat });
});

app.post('/api/calcola/:id', (req, res) => {
  const cat = DIRITTI[req.params.id];
  if (!cat) return res.status(404).json({ errore: 'Categoria non trovata' });
  const { speso } = req.body;
  const risultati = cat.items.map(item => {
    let importo;
    if (item.importo.includes('%')) {
      importo = Math.round((speso || 50) * parseInt(item.importo) / 100);
    } else if (item.importo.includes('€')) {
      importo = parseInt(item.importo.replace(/[^0-9]/g, '')) || 50;
    } else {
      importo = Math.round(50 + Math.random() * cat.max * 0.5);
    }
    importo = Math.max(5, Math.min(importo, cat.max));
    return {
      diritto: item.diritto,
      importo_previsto: importo,
      probabilita: Math.round(55 + Math.random() * 40)
    };
  });
  const totale = risultati.reduce((s, r) => s + r.importo_previsto, 0);
  res.json({ risultati, totale, max: cat.max });
});

app.post('/api/richiedi', (req, res) => {
  const { nome, email, diritto, categoria, importo } = req.body;
  const id = `RPT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,4).toUpperCase()}`;
  richieste.push({ id, nome, email, diritto, categoria, importo, data: new Date().toISOString(), stato: 'inviata' });
  res.json({ id, successo: true, messaggio: `Richiesta ${diritto} avviata! Ti aggiorneremo via email.` });
});

app.get('/api/storico', (req, res) => {
  res.json(richieste);
});

// ===================== GMAIL INTEGRAZIONE =====================

// Stato connessione Gmail
app.get('/api/gmail/status', (req, res) => {
  const autenticato = gmailAuth.isReady();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${baseUrl}/api/gmail/callback`;
  if (autenticato) {
    res.json({ autenticato: true, email: 'gianpaololiggieri6@gmail.com' });
  } else if (gmailAuth.loadCredentials() && gmailAuth.loadToken()) {
    res.json({ autenticato: true, email: 'gianpaololiggieri6@gmail.com' });
  } else if (gmailAuth.loadCredentials()) {
    res.json({ autenticato: false, url: gmailAuth.getAuthUrl(redirectUri), redirect_uri: redirectUri });
  } else {
    res.json({ autenticato: false, url: null, setup_necessaria: true });
  }
});

// Callback OAuth Google
app.get('/api/gmail/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ errore: 'Codice mancante' });
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/gmail/callback`;
    await gmailAuth.getToken(code, redirectUri);
    gmailAuth.autoRefresh();
    res.redirect('/?gmail=connected');
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

// Scansione email
app.post('/api/gmail/scansiona', async (req, res) => {
  if (!gmailAuth.isReady()) {
    if (!gmailAuth.loadCredentials() || !gmailAuth.loadToken()) {
      return res.status(401).json({ errore: 'Gmail non connesso' });
    }
  }
  try {
    const scanner = new GmailScanner(gmailAuth.oAuth2Client);
    const rimborsi = await scanner.scansionaRimborsi();
    res.json({ trovati: rimborsi.length, rimborsi });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

// ===================== PAYPAL INTEGRAZIONE =====================

// Stato connessione PayPal
app.get('/api/paypal/config', (req, res) => {
  if (!paypal.isConfigured()) {
    return res.json({ configurato: false });
  }
  res.json({
    configurato: true,
    client_id: paypal.getClientId(),
    mode: paypal.getMode()
  });
});

// Crea ordine PayPal (commissione 20%)
app.post('/api/paypal/create-order', async (req, res) => {
  if (!paypal.isConfigured()) {
    return res.status(400).json({ errore: 'PayPal non configurato. Vai in PUBBLICA.md per impostarlo.' });
  }
  const { importo, diritto, richiesta_id } = req.body;
  if (!importo || !diritto) {
    return res.status(400).json({ errore: 'Dati mancanti' });
  }
  const commissione = Math.round(importo * 20) / 100; // 20%
  if (commissione < 1) {
    return res.status(400).json({ errore: 'Importo troppo basso (min 1€)' });
  }
  try {
    const descrizione = `RIPRENDI.TI - 20% su ${diritto}`;
    const requestId = richiesta_id || `PP${Date.now()}`;
    const order = await paypal.createOrder(commissione, descrizione, requestId);
    res.json({ id: order.id, commissione });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

// Conferma pagamento PayPal
app.post('/api/paypal/capture-order', async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ errore: 'Order ID mancante' });
  try {
    const capture = await paypal.captureOrder(order_id);
    const status = capture.status;
    const pagato = status === 'COMPLETED';
    res.json({ pagato, status, capture });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RIPRENDI.TI su http://0.0.0.0:${PORT}`);
});
