import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Link, useNavigate } from "react-router-dom";
import ScrollToTop from "../components/common/ScrollToTop";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Navigation() {
  const navigate = useNavigate();
  return <>
    <ScrollToTop />
    <Link to="/products/headphones">Product</Link>
    <Link to="/products?search=shoes">Search</Link>
    <Link to="/products/headphones#reviews">Reviews</Link>
    <button onClick={() => navigate(-1)}>Back</button>
  </>;
}

it("opens new pages and searches at the top without overriding history or anchor destinations", () => {
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(<MemoryRouter initialEntries={["/"]}><Navigation /></MemoryRouter>);
  expect(scroll).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: "Product" }));
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: "instant" });
  expect(scroll).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("link", { name: "Search" }));
  expect(scroll).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("link", { name: "Reviews" }));
  expect(scroll).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(scroll).toHaveBeenCalledTimes(2);
});
