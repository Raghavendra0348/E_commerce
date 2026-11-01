export default function LanguageSelector({ compact = false, className = "" }) {
  return <span className={`language-selector min-h-10 shrink-0 items-center justify-center gap-1.5 rounded px-2 text-white ${className}`} aria-label="India, English">
    <img src="/india_flag.jpg" alt="India" className={compact ? "h-3 w-[18px] object-cover" : "h-4 w-6 object-cover"} />
    <span className="text-xs font-bold">EN</span>
  </span>;
}
