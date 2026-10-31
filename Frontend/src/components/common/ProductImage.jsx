import { useState } from "react";
import { ImageOff } from "lucide-react";

const fallback = "/product-placeholder.svg";
function resolveSource(src) {
  if (!src || /placehold\.co|placeholder\.(png|svg)/i.test(src)) return null;
  try {
    const url = new URL(src, window.location.origin);
    if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && ["7070", "7071", "37857"].includes(url.port)) return null;
    if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) return null;
  } catch { return null; }
  if (src.startsWith("/uploads/")) return src;
  return src;
}

export default function ProductImage({ src, alt = "Product", className = "", onError: _onError, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  const source = resolveSource(src);
  if (!source || failedSource === source || source === fallback) {
    return <div {...props} className={`product-image-coming-soon ${className}`} role="img" aria-label={`${alt}: images coming soon`}><ImageOff aria-hidden="true" /><span>Images coming soon</span></div>;
  }
  return <img {...props} className={className} src={source} alt={alt} onError={() => setFailedSource(source)} />;
}
