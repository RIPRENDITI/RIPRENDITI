const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API = 'https://api-m.paypal.com';

class PayPalClient {
  constructor() {
    this.accessToken = null;
    this.tokenExpires = 0;
  }

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpires) {
      return this.accessToken;
    }
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpires = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async createOrder(amount, description, requestId) {
    const token = await this.getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'PayPal-Request-Id': requestId
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: description,
          amount: {
            currency_code: 'EUR',
            value: amount.toFixed(2)
          }
        }]
      })
    });
    return res.json();
  }

  async captureOrder(orderId) {
    const token = await this.getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return res.json();
  }

  async verifyWebhook(headers, body) {
    // Verifica webhook - per ora skip, gestiamo manualmente
    return true;
  }

  isConfigured() {
    return PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET;
  }

  getClientId() {
    return PAYPAL_CLIENT_ID;
  }

  getMode() {
    return 'live';
  }
}

module.exports = new PayPalClient();
