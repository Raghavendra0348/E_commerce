// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { phonePreviewUrls } from '../../scripts/phone-preview-qr.js';
import phonePreviewQr from '../../scripts/phone-preview-qr.js';

describe('phone preview QR', () => {
  it('prioritizes Wi-Fi and excludes loopback and unusable URLs', () => {
    expect(phonePreviewUrls(['http://172.20.0.1:5174/', 'http://localhost:5174/', 'http://192.168.1.12:5174/', 'http://127.0.0.1:5174/', 'invalid', 'http://169.254.1.1:5174/'], { 'Wi-Fi': [{ address: '192.168.1.12', internal: false }] })).toEqual(['http://192.168.1.12:5174/', 'http://172.20.0.1:5174/']);
  });
  it('prints a QR for the actual Vite port after its normal startup URLs', async () => {
    const renderQr = vi.fn().mockResolvedValue('QR-BLOCKS');
    const server = { printUrls: vi.fn(), resolvedUrls: { network: ['http://192.168.1.12:5174/'] }, config: { logger: { info: vi.fn(), warn: vi.fn() } } };
    const original = server.printUrls;
    phonePreviewQr({ renderQr }).configureServer(server);
    server.printUrls();
    await vi.waitFor(() => expect(server.config.logger.info).toHaveBeenCalledWith(expect.stringContaining('QR-BLOCKS')));
    expect(original).toHaveBeenCalledTimes(1);
    expect(renderQr).toHaveBeenCalledWith('http://192.168.1.12:5174/', expect.objectContaining({ type: 'terminal', small: true }));
  });
});
