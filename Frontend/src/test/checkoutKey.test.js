import { afterEach, expect, it, vi } from "vitest";
import { createCheckoutKey } from "../lib/checkout";

afterEach(() => vi.unstubAllGlobals());
it("creates UUID checkout keys in the HTTP LAN preview without randomUUID", () => {
  const original = globalThis.crypto;
  vi.stubGlobal("crypto", { getRandomValues: values => original.getRandomValues(values) });
  const a = createCheckoutKey();
  const b = createCheckoutKey();
  expect(a).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i);
  expect(a).not.toBe(b);
});
