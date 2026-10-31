/** Trust forwarded device IPs only from the local Vite proxy in development. */
function configureDevelopmentProxy(app, mode) {
  if (mode === 'development') app.set('trust proxy', 'loopback');
}
module.exports = configureDevelopmentProxy;
