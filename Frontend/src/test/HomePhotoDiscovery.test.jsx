import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePhotoDiscovery from "../components/home/HomePhotoDiscovery";
import photos from "../data/home-inspiration.json";

const carousel = vi.hoisted(() => ({ scrollPrev: vi.fn(), scrollNext: vi.fn() }));
vi.mock("embla-carousel-react", () => ({ default: () => [vi.fn(), carousel] }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("homepage photo discovery", () => {
  it("links all 15 hosted illustrations to catalogue searches and keeps carousel controls functional", () => {
    render(<MemoryRouter><HomePhotoDiscovery /></MemoryRouter>);
    expect(photos).toHaveLength(15);
    expect(new Set(photos.map(photo => photo.url)).size).toBe(15);
    for (const photo of photos) {
      expect(photo.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
      expect(screen.getByRole("link", { name: photo.label })).toHaveAttribute("href", `/products?search=${encodeURIComponent(photo.search)}`);
      expect(screen.getByAltText(photo.label)).toHaveAttribute("src", photo.url);
    }
    fireEvent.click(screen.getByRole("button", { name: "Previous product collections" }));
    fireEvent.click(screen.getByRole("button", { name: "Next product collections" }));
    expect(carousel.scrollPrev).toHaveBeenCalledOnce();
    expect(carousel.scrollNext).toHaveBeenCalledOnce();
  });
});
