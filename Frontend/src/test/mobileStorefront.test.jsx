import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileCategoryTabs from "@/components/layout/MobileCategoryTabs";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

afterEach(() => { cleanup(); useAuthStore.getState().logout(); useCartStore.getState().clearCartState(); });
describe("phone storefront navigation", () => {
  it("keeps guest account/wishlist destinations behind sign-in and displays the cart count", () => {
    useAuthStore.setState({ isAuthenticated: false });
    useCartStore.setState({ itemCount: 9 });
    render(<MemoryRouter initialEntries={["/cart"]}><MobileBottomNav /></MemoryRouter>);
    const nav = within(screen.getByRole("navigation", { name: "Mobile primary navigation" }));
    expect(nav.getByRole("link", { name: "You" })).toHaveAttribute("href", "/login?redirect=/account/profile");
    expect(nav.getByRole("link", { name: "Wishlist" })).toHaveAttribute("href", "/login?redirect=/wishlist");
    expect(nav.getByRole("link", { name: /Cart/ })).toHaveAttribute("aria-current", "page");
    expect(nav.getByLabelText("9 items")).toHaveTextContent("9");
  });
  it("opens Browse without navigating and links signed-in shoppers to their account", () => {
    useAuthStore.setState({ isAuthenticated: true });
    const onBrowse = vi.fn();
    render(<MemoryRouter><MobileBottomNav onBrowse={onBrowse} browseOpen /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "You" })).toHaveAttribute("href", "/account/profile");
    fireEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(onBrowse).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Browse" })).toHaveAttribute("aria-expanded", "true");
  });
  it("uses real category IDs, shows the active category and puts primary shopping categories first", () => {
    const categories = [{ id: 8, slug: "books", name: "Books" }, { id: 4, slug: "fashion", name: "Fashion" }, { id: 2, slug: "electronics", name: "Electronics" }];
    render(<MemoryRouter initialEntries={["/products?categoryId=4"]}><MobileCategoryTabs categories={categories} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Fashion" })).toHaveAttribute("href", "/products?categoryId=4");
    expect(screen.getByRole("link", { name: "Fashion" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link").map(link => link.textContent)).toEqual(["For you", "Electronics", "Fashion", "Books"]);
    expect(screen.queryByRole("link", { name: "Mobiles" })).not.toBeInTheDocument();
  });
  it("provides a usable browse destination before category data arrives", () => {
    render(<MemoryRouter><MobileCategoryTabs /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "All products" })).toHaveAttribute("href", "/products");
  });
});
