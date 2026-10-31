import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderStatusBadge from "../components/admin/OrderStatusBadge";

describe("OrderStatusBadge Component", () => {
  it("renders DELIVERED status badge with correct green text", () => {
    render(<OrderStatusBadge status="DELIVERED" />);
    const badge = screen.getByText("Delivered");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-[#067D62]");
  });

  it("renders CANCELLED status badge with correct red text", () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    const badge = screen.getByText("Cancelled");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-[#CC0C39]");
  });

  it("renders CONFIRMED status badge with blue accents", () => {
    render(<OrderStatusBadge status="CONFIRMED" />);
    const badge = screen.getByText("Confirmed");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-[#2B6CB0]");
  });

  it("falls back gracefully for unknown status", () => {
    render(<OrderStatusBadge status="CUSTOM_NEW" />);
    const badge = screen.getByText("CUSTOM_NEW");
    expect(badge).toBeInTheDocument();
  });
});
