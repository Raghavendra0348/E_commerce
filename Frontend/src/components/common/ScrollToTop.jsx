import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    // Leave browser history restoration and explicit anchor destinations alone.
    if (navigationType === "POP" || hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search, hash, navigationType]);

  return null;
}
