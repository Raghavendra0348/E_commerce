import { Link, useNavigate } from "react-router-dom";
import { Menu, Tag, Zap, Smartphone, Shirt, Home, Tv, Dumbbell, BookOpen, Baby, Car, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

const STATIC_CATEGORIES = [
  { name: "Today's Deals", href: "/products?sort=newest", icon: Tag },
  { name: "Electronics", href: "/products?category=electronics", icon: Zap },
  { name: "Mobiles", href: "/products?category=mobiles", icon: Smartphone },
  { name: "Fashion", href: "/products?category=fashion", icon: Shirt },
  { name: "Home & Kitchen", href: "/products?category=home", icon: Home },
  { name: "TV & Appliances", href: "/products?category=tv", icon: Tv },
  { name: "Sports", href: "/products?category=sports", icon: Dumbbell },
  { name: "Books", href: "/products?category=books", icon: BookOpen },
  { name: "Baby", href: "/products?category=baby", icon: Baby },
  { name: "Automotive", href: "/products?category=automotive", icon: Car },
];

export default function SubNav() {
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const navItems = categories?.length
    ? categories.slice(0, 10).map((cat) => ({
        name: cat.name,
        href: `/products?categoryId=${cat.id}`,
      }))
    : STATIC_CATEGORIES;

  return (
    <nav
      className="bg-[#232F3E]"
      aria-label="Category navigation"
    >
      <div className="mx-auto max-w-[1500px] px-2">
        <ul className="flex items-center overflow-x-auto no-scrollbar">
          {/* All menu trigger */}
          <li className="flex-shrink-0">
            <Link
              to="/products"
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-white font-semibold hover:bg-white/10 hover:outline hover:outline-1 hover:outline-white rounded transition-colors whitespace-nowrap"
            >
              <Menu className="h-4 w-4" />
              All
            </Link>
          </li>

          {navItems.map((item, idx) => (
            <li key={item.href || idx} className="flex-shrink-0">
              <Link
                to={item.href}
                className="flex items-center px-3 py-2.5 text-sm text-white hover:bg-white/10 hover:outline hover:outline-1 hover:outline-white rounded transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
