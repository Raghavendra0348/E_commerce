import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SubNav from "@/components/layout/SubNav";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn().mockResolvedValue({ data: { data: [] } }) } }));
let client;
afterEach(() => { cleanup(); client?.clear(); });
describe("homepage-only mobile categories", () => {
  it("does not render the mobile category strip for inner pages", () => {
    client = new QueryClient();
    render(<QueryClientProvider client={client}><MemoryRouter><SubNav showMobileCategories={false} /></MemoryRouter></QueryClientProvider>);
    expect(screen.queryByLabelText("Shop by category")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Category navigation" })).toHaveAttribute("data-mobile-visible", "false");
  });
});
