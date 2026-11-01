import { T } from "@/components/common/Translation";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const footerLinks = [
  {
    title: "Get to Know Us",
    links: [
      { label: "About Us", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Press Releases", href: "/" },
      { label: "Amazon Science", href: "/" },
    ],
  },
  {
    title: "Connect with Us",
    links: [
      { label: "Facebook", href: "/" },
      { label: "Twitter", href: "/" },
      { label: "Instagram", href: "/" },
    ],
  },
  {
    title: "Make Money with Us",
    links: [
      { label: "Sell on Amazon", href: "/" },
      { label: "Sell under Amazon Accelerator", href: "/" },
      { label: "Amazon Global Selling", href: "/" },
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "COVID-19 and Amazon", href: "/" },
      { label: "Your Account", href: "/account/profile" },
      { label: "Returns Centre", href: "/account/orders" },
      { label: "100% Purchase Protection", href: "/" },
      { label: "Help", href: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#232F3E] text-white mt-auto">
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="block w-full bg-[#37475A] py-3 text-center text-sm text-white hover:bg-[#485769] transition-colors"
      >
        <T>{"Back to top"}</T>
      </button>

      {/* Main footer links */}
      <div className="mx-auto max-w-[1500px] px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-bold text-white"><T>{section.title}</T></h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-[#CCCCCC] hover:text-white transition-colors"
                    >
                      <T>{link.label}</T>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#3A4553]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-white font-extrabold text-lg">amazon</span>
            <span className="text-[#FF9900] font-extrabold text-lg">.in</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#CCCCCC]">
            <Link to="/" className="hover:text-white">Conditions of Use & Sale</Link>
            <Link to="/" className="hover:text-white">Privacy Notice</Link>
            <Link to="/" className="hover:text-white">Interest-Based Ads</Link>
          </div>
          <p className="text-xs text-[#CCCCCC]">
            © 2026 Amazon.in 
          </p>
        </div>
      </div>
    </footer>
  );
}
