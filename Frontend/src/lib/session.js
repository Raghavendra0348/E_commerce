import { queryClient } from "./queryClient";

let revision = 0;
const listeners = new Set();
export const getSessionRevision = () => revision;
export const onSessionReset = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function resetSessionData() {
  revision += 1;
  // Clear synchronously before another account can render cached private data.
  queryClient.clear();
  listeners.forEach(listener => listener());
}
