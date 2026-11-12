import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import NotifyStockButton from "../components/product/NotifyStockButton";

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("shows a clearly labelled demo notification and hides the button once stock returns", () => {
  const product = { id: 4, name: "Test headphones", stock: 0 };
  const { rerender } = render(<NotifyStockButton product={product} />);
  fireEvent.click(screen.getByRole("button", { name: "Notify me about Test headphones" }));
  expect(toast.info).toHaveBeenCalledWith("Demo notification: Test headphones", {
    description: "This is a demo only. No restock alert has been registered or sent.", id: "demo-stock-4",
  });
  rerender(<NotifyStockButton product={{ ...product, stock: 3 }} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
