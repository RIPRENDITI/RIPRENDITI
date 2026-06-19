# RIPRENDI.TI — Guida Gmail API e PayPal

## PAYPAL (prima di tutto, 5 minuti)

### Crea un account PayPal Business

1. Vai su https://www.paypal.com/business
2. Clicca "Inizia" e segui la procedura
3. Usa l'email `gianpaololiggieri6@gmail.com`

### Ottieni le credenziali API

1. Vai su https://developer.paypal.com/dashboard/
2. Accedi con il tuo account PayPal
3. Clicca "Apps & Credentials" nel menu a sinistra
4. Sotto "REST API apps", clicca "Create App"
5. Nome app: `RIPRENDITI`
6. Verrà generato **Client ID** e **Secret**
7. Copia entrambi

### Inserisci le credenziali nel progetto

Crea il file `C:\Users\Utente\Desktop\RIPRENDITI\.env` (se non esiste) e incolla:

```
PAYPAL_CLIENT_ID=il_tuo_client_id
PAYPAL_CLIENT_SECRET=il_tuo_secret
```

**Niente più file .env per ora** — modifichiamo direttamente server.js per test veloce.

Apri `src\server.js` e in cima aggiungi:

```js
process.env.PAYPAL_CLIENT_ID = 'CLIENT_ID_QUI';
process.env.PAYPAL_CLIENT_SECRET = 'SECRET_QUI';
```

---

## GMAIL API

## Passo 1: Crea un progetto Google Cloud

1. Vai su https://console.cloud.google.com/
2. Clicca su "Seleziona un progetto" → "Nuovo progetto"
3. Nome: `RIPRENDITI` (o quello che vuoi)
4. Clicca "Crea"

## Passo 2: Abilita Gmail API

1. Nel progetto, vai su "API e servizi" → "Libreria"
2. Cerca "Gmail API"
3. Clicca "Abilita"

## Passo 3: Crea credenziali OAuth 2.0

1. Vai su "API e servizi" → "Credenziali"
2. Clicca "Crea credenziali" → "ID client OAuth"
3. Se richiesto, configura la schermata di consenso:
   - Tipo utente: **Esterno**
   - Inserisci nome app: `RIPRENDITI`
   - Inserisci email assistenza: `gianpaololiggieri6@gmail.com`
   - Email contatto sviluppatore: `gianpaololiggieri6@gmail.com`
   - Salva e continua (ignora scope)
4. Ora torna su "Crea credenziali" → "ID client OAuth"
5. Tipo applicazione: **App web**
6. Nome: `RIPRENDITI Web`
7. URI di reindirizzamento autorizzati:
   - `http://localhost:3000/api/gmail/callback`
8. Clicca "Crea"
9. **Scarica il JSON** — si chiamerà qualcosa come `client_secret_XXXXX.json`

## Passo 4: Inserisci le credenziali

Copia il file scaricato in:
```
C:\Users\Utente\Desktop\RIPRENDITI\config\gmail-credentials.json
```
(Il file esiste già con un template, **sostituiscilo** con quello vero scaricato da Google)

## Passo 5: Avvia e connetti

1. Avvia il server: `.\avvia.bat`
2. Vai su http://localhost:3000
3. Clicca "Connetti Gmail"
4. Accedi con `gianpaololiggieri6@gmail.com`
5. Autorizza l'app (apparirà "Verifica non completata" — clicca "Procedi comunque")
6. Fatto! Ora puoi scansionare le email per trovare rimborsi
