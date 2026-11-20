import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import AmazonLogo from "./AmazonLogo";
import { Button } from "../ui/button";

const footerGroups = [
  { title: "Shop", links: [
    ["Home", "/"],
    ["All Products", "/products"],
    ["Your Cart", "/cart"],
  ] },
  { title: "Your Account", links: [
    ["Your Profile", "/account/profile"],
    ["Saved Addresses", "/account/addresses"],
  ] },
  { title: "Orders & Lists", links: [
    ["Your Orders", "/account/orders"],
    ["Your Wishlist", "/wishlist"],
  ] },
];

export default function Footer() {
  const backToTop = () => window.scrollTo({
    top: 0,
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });

  return (
    <footer id="storefront-footer" className="storefront-footer mt-auto">
      <Button id="footer-back-to-top" variant="ghost" className="footer-back-to-top" onClick={backToTop}>
        Back to top
      </Button>
      <nav id="footer-main-links" className="footer-main-links" aria-label="Footer navigation">
        {footerGroups.map(({ title, links }) => (
          <section key={title} className="footer-link-group" aria-label={title}>
            <h2>{title}</h2>
            <ul>{links.map(([label, href]) => (
              <li key={label}><Link to={href}>{label}</Link></li>
            ))}</ul>
          </section>
        ))}
      </nav>
      <div className="footer-region-row">
        <Link to="/" className="footer-brand" aria-label="Amazon India Homepage">
          <AmazonLogo className="footer-amazon-logo" tone="white" />
        </Link>
        <div className="footer-region-badges">
          <span className="footer-region-badge" aria-label="Interface language: English">
            <Globe size={14} aria-hidden="true" /> English
          </span>
          <span className="footer-region-badge" aria-label="Shopping region: India">
            <img src="/india_flag.jpg" width="18" height="12" alt="" /> India
          </span>
        </div>
      </div>
      <div className="footer-legal">
        <p>© {new Date().getFullYear()} E-commerce storefront</p>
      </div>
    </footer>
  );
}
