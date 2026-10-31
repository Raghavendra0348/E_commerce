import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar({
  placeholder = "Search Amazon.in",
  initialValue = "",
  onSearch,
  className,
}) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-center rounded-md overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#FF9900]",
        className
      )}
      role="search"
    >
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3.5 py-2 text-xs text-[#0F1111] placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-9 w-11 items-center justify-center bg-[#FF9900] hover:bg-[#E68A00] transition-colors text-[#0F1111]"
        aria-label="Submit search"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
