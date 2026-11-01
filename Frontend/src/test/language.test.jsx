import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import LanguageSelector from "@/components/layout/LanguageSelector";
import LanguageSync from "@/components/common/LanguageSync";
import { useTranslation } from "@/hooks/useTranslation";
import { T } from "@/components/common/Translation";

afterEach(() => { cleanup(); localStorage.removeItem("storefront_language"); });
describe("English storefront region display", () => {
  it("shows the Indian flag and EN without an interactive language control", () => {
    render(<LanguageSelector className="flex" />);
    expect(screen.getByRole("img", { name: "India" })).toHaveAttribute("src", "/india_flag.jpg");
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
  it("keeps English despite legacy preferences and other-tab changes", () => {
    localStorage.setItem("storefront_language", "TE");
    render(<><LanguageSync /><h1><T>{"Your Orders"}</T></h1></>);
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "storefront_language", newValue: "HI" })));
    expect(screen.getByRole("heading", { name: "Your Orders" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en-IN");
  });
  it("preserves dynamic English labels and catalog text", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.language).toBe("EN");
    expect(result.current.t("Hello, {name}", { name: "Alex" })).toBe("Hello, Alex");
    expect(result.current.t("Original product name")).toBe("Original product name");
  });
});
