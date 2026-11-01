const t = (source, values = {}) => source.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

export function useTranslation() {
  return { t, language: "EN", locale: "en-IN" };
}
