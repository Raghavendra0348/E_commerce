/** Trust only the configured proxy addresses, never arbitrary forwarded headers. */
function configureDevelopmentProxy(app, mode, trustedProxyIps = '') {
  if (mode === 'development') app.set('trust proxy', 'loopback');
  else if (trustedProxyIps.trim()) app.set('trust proxy', trustedProxyIps.split(',').map(ip => ip.trim()).filter(Boolean));
}
module.exports = configureDevelopmentProxy;
