import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import AmazonLogo from "./AmazonLogo";
import { Button } from "../ui/button";

const footerGroups = [
  { title: "Get to Know Us", links: [
    ["About Amazon", "https://www.aboutamazon.in/"],
    ["Careers", "https://www.amazon.jobs/"],
    ["Press Releases", "https://press.aboutamazon.in/"],
    ["Amazon Science", "https://www.amazon.science/"],
  ] },
  { title: "Connect with Us", links: [
    ["Facebook", "https://www.facebook.com/AmazonIN"],
    ["Twitter", "https://twitter.com/AmazonIN"],
    ["Instagram", "https://www.instagram.com/amazonin/"],
  ] },
  { title: "Make Money with Us", links: [
    ["Sell on Amazon", "https://sell.amazon.in/"],
    ["Sell under Amazon Accelerator", "https://accelerator.amazon.in/"],
    ["Protect and Build Your Brand", "https://brandservices.amazon.in/"],
    ["Amazon Global Selling", "https://sell.amazon.in/grow-your-business/amazon-global-selling.html"],
    ["Supply to Amazon", "https://supply.amazon.com/"],
    ["Become an Affiliate", "https://affiliate-program.amazon.in/"],
    ["Fulfilment by Amazon", "https://services.amazon.in/services/fulfilment-by-amazon/benefits.html"],
    ["Advertise Your Products", "https://advertising.amazon.com/"],
    ["Amazon Pay on Merchants", "https://www.amazonpay.in/merchant"],
  ] },
  { title: "Let Us Help You", links: [
    ["Your Account", "/account/profile"],
    ["Returns Centre", "https://www.amazon.in/gp/css/returns/homepage.html"],
    ["Recalls and Product Safety Alerts", "https://www.amazon.in/your-product-safety-alerts"],
    ["100% Purchase Protection", "https://www.amazon.in/gp/help/customer/display.html?nodeId=201083470"],
    ["Amazon App Download", "https://www.amazon.in/gp/browse.html?node=6967393031"],
    ["Help", "https://www.amazon.in/gp/help/customer/display.html"],
  ] },
];

const services = [
  ["AbeBooks", "Books, art & collectibles", "https://www.abebooks.com/"],
  ["Amazon Web Services", "Scalable Cloud Computing Services", "https://aws.amazon.com/"],
  ["Audible", "Download Audio Books", "https://www.audible.in/"],
  ["IMDb", "Movies, TV & Celebrities", "https://www.imdb.com/"],
  ["Shopbop", "Designer Fashion Brands", "https://www.shopbop.com/"],
  ["Amazon Business", "Everything For Your Business", "https://business.amazon.in/"],
  ["Amazon Music", "Stream millions of songs", "https://music.amazon.in/"],
];

function FooterLink({ href, children }) {
  return href.startsWith("/")
    ? <Link to={href}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

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
              <li key={label}><FooterLink href={href}>{label}</FooterLink></li>
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
      <nav id="footer-services" className="footer-services" aria-label="Amazon services">
        <div className="footer-services-grid">
          {services.map(([name, description, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer">
              <span>{name}</span><span>{description}</span>
            </a>
          ))}
        </div>
      </nav>
      <div className="footer-legal">
        <nav aria-label="Footer legal links">
          <FooterLink href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940">Conditions of Use &amp; Sale</FooterLink>
          <FooterLink href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200534380">Privacy Notice</FooterLink>
          <FooterLink href="https://www.amazon.in/gp/help/customer/display.html?nodeId=202075050">Interest-Based Ads</FooterLink>
        </nav>
        <p>© {new Date().getFullYear()} E-commerce storefront</p>
      </div>
    </footer>
  );
}
