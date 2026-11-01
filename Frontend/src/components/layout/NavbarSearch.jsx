import { T } from "@/components/common/Translation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/axios";
import { useTranslation } from "@/hooks/useTranslation";

function Completion({ text, query }) {
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) return <strong>{text}</strong>;
  return <><strong>{text.slice(0, index)}</strong>{text.slice(index, index + query.length)}<strong>{text.slice(index + query.length)}</strong></>;
}

export default function NavbarSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories = [] } = useCategories();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();
  const term = query.trim();
  const debouncedTerm = useDebounce(term, 350);
  const visible = open && term.length >= 2;
  const settled = term === debouncedTerm;

  const { data = [], isFetching, isError } = useQuery({
    queryKey: ["searchSuggestions", debouncedTerm, categoryId],
    queryFn: async ({ signal }) => {
      const response = await api.get("/products", { params: { search: debouncedTerm, ...(categoryId ? { categoryId } : {}), limit: 8 }, signal });
      const products = Array.isArray(response.data?.data) ? response.data.data : [];
      return [...new Set(products.map(product => product.name?.trim()).filter(Boolean))].slice(0, 8);
    },
    enabled: visible && settled,
    staleTime: 60_000,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  const suggestions = settled ? data : [];
  const loading = !settled || (isFetching && suggestions.length === 0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("search") || "");
    setCategoryId(params.get("categoryId") || "");
    setOpen(false);
    setActiveIndex(-1);
  }, [location.pathname, location.search]);

  useEffect(() => { setActiveIndex(-1); }, [term, categoryId, data]);

  useEffect(() => {
    if (!visible) return;
    const dismiss = event => {
      if (!formRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [visible]);

  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, listId]);

  const search = value => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (categoryId) params.set("categoryId", categoryId);
    setQuery(value);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    navigate(`/products${params.size ? `?${params}` : ""}`);
  };
  const onKeyDown = event => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActiveIndex(-1); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length) setActiveIndex(index => event.key === "ArrowDown" ? (index + 1) % suggestions.length : index <= 0 ? suggestions.length - 1 : index - 1);
    }
  };

  return <>
    {visible && createPortal(<div className="search-suggestions-backdrop" aria-hidden="true" onPointerDown={() => setOpen(false)} />, document.body)}
    <form id="navbar-search" ref={formRef} role="search" style={{ "--search-category-width": categoryId ? "96px" : "64px" }} className="navbar-search-form flex-1 flex h-[44px] sm:h-[48px] min-w-0 mx-1 sm:mx-2 rounded-[6px] focus-within:ring-2 focus-within:ring-[#FF9900] bg-white"
      onSubmit={event => { event.preventDefault(); if (!event.nativeEvent.isComposing) search(visible && activeIndex >= 0 && suggestions[activeIndex] ? suggestions[activeIndex] : query); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActiveIndex(-1); } }}>
      <div className="navbar-search-category relative bg-[#E6E6E6] hover:bg-[#D4D4D4] border-r border-[#CDCDCD] flex items-center shrink-0 rounded-l-[6px]">
        <select value={categoryId} onChange={event => { setCategoryId(event.target.value); setActiveIndex(-1); }} aria-label="Select Category filter" className={`appearance-none bg-transparent h-full pl-3 pr-7 text-[14px] text-[#555555] font-normal cursor-pointer outline-none truncate ${categoryId ? "w-[110px] sm:w-[150px]" : "w-[64px]"}`}>
          <option value=""><T>{"All"}</T></option>
          {categories.map(category => <option key={category.id} value={category.id}>{t(category.name)}</option>)}
        </select>
        <span aria-hidden="true" className="absolute right-3 h-0 w-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#666666] pointer-events-none" />
      </div>
      <div className="navbar-search-field relative min-w-0 flex-1">
        <input ref={inputRef} type="search" role="combobox" aria-label={t("Search Amazon.in")} placeholder={t("Search Amazon.in")} autoComplete="off" spellCheck={false}
          aria-autocomplete="list" aria-expanded={visible && !loading && suggestions.length > 0} aria-controls={visible && suggestions.length > 0 ? listId : undefined} aria-activedescendant={visible && activeIndex >= 0 && suggestions[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          value={query} onChange={event => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }} onFocus={() => setOpen(true)} onKeyDown={event => { if (!event.nativeEvent.isComposing) onKeyDown(event); }}
          className="h-full w-full min-w-0 px-3 text-[16px] sm:text-[18px] text-[#0F1111] bg-white outline-none placeholder:text-[#707070]" />
        {visible && <div className="search-suggestions-panel">
          {loading ? <div className="search-suggestions-status" role="status" aria-label="Loading search suggestions">{[0, 1, 2].map(index => <Skeleton key={index} className="h-5 my-4 w-4/5" />)}</div> : suggestions.length ? (
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {suggestions.map((suggestion, index) => <li key={suggestion} role="presentation">
                <button id={`${listId}-${index}`} type="button" role="option" aria-label={suggestion} aria-selected={index === activeIndex} tabIndex={-1} className="search-suggestion" onMouseDown={event => event.preventDefault()} onPointerMove={event => { if (event.pointerType === "mouse") setActiveIndex(index); }} onClick={() => search(suggestion)}>
                  <Search aria-hidden="true" strokeWidth={1.8} /><span><Completion text={suggestion} query={term} /></span>
                </button>
              </li>)}
            </ul>
          ) : <p className="search-suggestions-status" role="status">{isError ? "Suggestions are unavailable. Press Enter to search." : "No matching suggestions. Press Enter to search."}</p>}
        </div>}
      </div>
      <button type="submit" className="w-[52px] h-full rounded-r-[6px] bg-[#FEBD69] hover:bg-[#F3A847] flex items-center justify-center shrink-0 cursor-pointer transition-colors" aria-label="Submit search"><Search className="h-7 w-7 text-[#30383D] stroke-[2]" /></button>
    </form>
  </>;
}
