const localtunnel = require('localtunnel');
(async () => {
  try {
    const tunnel = await localtunnel({ port: 3000, subdomain: 'riprenditi' });
    console.log('PUBBLICA: ' + tunnel.url);
    tunnel.on('error', e => console.log('ERR:', e.message));
  } catch(e) {
    console.log('ERR:', e.message);
  }
})();
