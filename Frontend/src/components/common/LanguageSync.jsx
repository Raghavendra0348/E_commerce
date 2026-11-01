import { useEffect } from "react";

export default function LanguageSync() {
  useEffect(() => {
    document.documentElement.lang = "en-IN";
    document.documentElement.dataset.language = "EN";
  }, []);
  return null;
}
