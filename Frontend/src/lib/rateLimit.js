// Shared cooldown for the API's Retry-After response. Never retry a 429 immediately.
let retryAt = 0;
export const isRateLimited = () => Date.now() < retryAt;
export function recordRateLimit(error) {
  if (error.response?.status !== 429) return;
  const value = error.response.headers?.['retry-after'];
  const seconds = Number(value);
  const until = value && Number.isFinite(seconds) ? Date.now() + Math.max(1, seconds) * 1000 : Date.parse(value);
  retryAt = Math.max(retryAt, Number.isFinite(until) ? until : Date.now() + 60_000);
}
export function rateLimitError(config) {
  const error = new Error('Too many requests. Automatic updates will resume after the server cooldown.');
  error.config = config;
  error.response = { status: 429, data: { message: error.message }, headers: { 'retry-after': String(Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))) } };
  return error;
}
