import QRCode from 'qrcode';
import { networkInterfaces } from 'node:os';
import { isIP } from 'node:net';

export function phonePreviewUrls(urls, interfaces = networkInterfaces()) {
  const wifi = new Set(Object.entries(interfaces)
    .filter(([name]) => /wi-?fi|wlan|wireless/i.test(name))
    .flatMap(([, addresses]) => (addresses || []).filter(address => !address.internal).map(address => address.address)));
  return [...new Set(urls || [])].filter(value => {
    try { const url = new URL(value); return isIP(url.hostname) === 4 && !url.hostname.startsWith('127.') && !url.hostname.startsWith('169.254.'); }
    catch { return false; }
  }).sort((a, b) => Number(wifi.has(new URL(b).hostname)) - Number(wifi.has(new URL(a).hostname)));
}

export default function phonePreviewQr({ renderQr = QRCode.toString } = {}) {
  return {
    name: 'phone-preview-qr',
    apply: 'serve',
    configureServer(server) {
      const originalPrintUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        originalPrintUrls();
        const urls = phonePreviewUrls(server.resolvedUrls?.network);
        if (!urls.length) {
          server.config.logger.info('\n  Phone preview: connect this computer to Wi-Fi to get a scannable network URL.\n');
          return;
        }
        // Vite calls printUrls after listening, including its actual fallback port.
        void (async () => {
          for (const url of urls) {
            const qr = await renderQr(url, { type: 'terminal', small: true, errorCorrectionLevel: 'M', margin: 2 });
            server.config.logger.info(`\n  Scan to open on your phone: ${url}\n${qr}\n  Keep your phone and computer on the same Wi-Fi.\n`);
          }
        })().catch(error => server.config.logger.warn(`Phone preview QR unavailable: ${error.message}`));
      };
    },
  };
}
