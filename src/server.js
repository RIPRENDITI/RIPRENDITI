const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RIPRENDI.TI su http://0.0.0.0:${PORT}`);
});
