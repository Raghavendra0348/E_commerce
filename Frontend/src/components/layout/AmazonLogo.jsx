export default function AmazonLogo({ className = "", tone = "dark" }) {
  const src = tone === "white" ? "/original_logo_white.svg" : "/brand/amazon-logo-dark.svg";
  return <img src={src} alt="Amazon.in" className={`brand-logo ${className}`} />;
}
