import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NavbarSearch from "@/components/layout/NavbarSearch";
import api from "@/api/axios";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@/hooks/useCategories", () => ({ useCategories: () => ({ data: [{ id: 4, name: "Electronics" }] }) }));
let client;
function CurrentLocation() { const location = useLocation(); return <output aria-label="Current location">{location.pathname + location.search}</output>; }
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><NavbarSearch /><CurrentLocation /><button>Outside search</button></MemoryRouter></QueryClientProvider>);
  return screen.getByRole("combobox", { name: "Search Amazon.in" });
}
beforeEach(() => {
  api.get.mockResolvedValue({ data: { data: [{ name: "Keyboard for laptop" }, { name: "Keyboard mouse wireless" }, { name: "Keyboard for laptop" }] } });
});
afterEach(() => { cleanup(); client?.clear(); vi.clearAllMocks(); });

describe("live search autocomplete", () => {
  it("debounces typing, deduplicates suggestions and bolds the completion", async () => {
    const input = show();
    fireEvent.change(input, { target: { value: "k" } });
    expect(api.get).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "key" } });
    expect(api.get).not.toHaveBeenCalled();
    const option = await screen.findByRole("option", { name: "Keyboard for laptop" });
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(2);
    expect(option.querySelector("strong:last-child")).toHaveTextContent("board for laptop");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/products", expect.objectContaining({ params: { search: "key", limit: 8 } }));
  });
  it("searches a tapped suggestion with the selected category", async () => {
    const input = show();
    fireEvent.change(screen.getByLabelText("Select Category filter"), { target: { value: "4" } });
    fireEvent.change(input, { target: { value: "key" } });
    fireEvent.click(await screen.findByRole("option", { name: "Keyboard for laptop" }));
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=Keyboard+for+laptop&categoryId=4");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/products", expect.objectContaining({ params: { search: "key", categoryId: "4", limit: 8 } }));
  });
  it("supports arrow selection and Enter submission", async () => {
    const input = show();
    fireEvent.change(input, { target: { value: "key" } });
    const option = await screen.findByRole("option", { name: "Keyboard mouse wireless" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", option.id);
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=Keyboard+mouse+wireless");
  });
  it("dismisses suggestions on Escape and outside pointer input", async () => {
    const input = show();
    fireEvent.change(input, { target: { value: "key" } });
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside search" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("keeps ordinary search working when suggestions fail", async () => {
    api.get.mockRejectedValue(new Error("Rate limited"));
    const input = show();
    fireEvent.change(input, { target: { value: "key" } });
    expect(await screen.findByText("Suggestions are unavailable. Press Enter to search.")).toBeInTheDocument();
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=key");
  });
  it("does not display old results after the shopper types another query", async () => {
    let finishOld;
    api.get.mockImplementation((url, config) => config.params.search === "key" ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve({ data: { data: [{ name: "Wireless mouse" }] } }));
    const input = show();
    fireEvent.change(input, { target: { value: "key" } });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    fireEvent.change(input, { target: { value: "mouse" } });
    await screen.findByRole("option", { name: "Wireless mouse" });
    await act(async () => { finishOld({ data: { data: [{ name: "Old keyboard" }] } }); });
    expect(screen.queryByRole("option", { name: "Old keyboard" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Wireless mouse" })).toBeInTheDocument();
  });
});
