import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PriceDisplay from "@/components/common/PriceDisplay";

describe("Discount prices", () => {
  it("shows selling price, original price, configured percentage and exact savings", () => {
    render(<PriceDisplay price="749.99" mrp="999.99" discountPercent={25} />);
    expect(screen.getByText("749.99")).toBeInTheDocument();
    expect(screen.getByLabelText("Original price")).toHaveTextContent("999.99");
    expect(screen.getByText("-25%")).toBeInTheDocument();
    expect(screen.getByText("You save ₹250")).toBeInTheDocument();
  });
  it("does not claim a discount for unchanged prices", () => {
    render(<PriceDisplay price={100} mrp={100} discountPercent={0} />);
    expect(screen.queryByLabelText("Original price")).not.toBeInTheDocument();
    expect(screen.queryByText(/you save|% off/i)).not.toBeInTheDocument();
  });
});
