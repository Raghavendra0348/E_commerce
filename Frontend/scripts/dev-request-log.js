// Development middleware only; the root launcher adds the frontend color label.
export default function devRequestLog() {
  return {
    name: 'dev-request-log',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const started = performance.now();
        // Query strings may contain private values and are not needed here.
        const pathname = (request.url || '/').split('?')[0];
        response.once('finish', () => {
          const elapsed = (performance.now() - started).toFixed(1);
          server.config.logger.info(`${request.method} ${pathname} ${response.statusCode} ${elapsed} ms`);
        });
        next();
      });
    },
  };
}
