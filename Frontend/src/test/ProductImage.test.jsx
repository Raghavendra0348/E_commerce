import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ProductImage from "@/components/common/ProductImage";
describe("Product image fallback", () => {
  it("shows coming soon for a missing image without requesting a placeholder", () => {
    render(<ProductImage alt="Mouse" />);
    expect(screen.getByText("Images coming soon")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull(); cleanup();
  });
  it("does not request dead loopback image services", () => {
    for (const port of [7070, 7071, 37857]) {
      render(<ProductImage src={`http://localhost:${port}/123456.png`} alt="Mouse" />);
      expect(document.querySelector("img")).toBeNull(); cleanup();
    }
  });
  it("replaces failed images and recovers when a new source is supplied", () => {
    const { rerender } = render(<ProductImage src="/uploads/mouse.jpg" alt="Mouse" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("Images coming soon")).toBeInTheDocument();
    rerender(<ProductImage src="/uploads/new-mouse.jpg" alt="Mouse" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/new-mouse.jpg"); cleanup();
  });
});
