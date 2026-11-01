import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LocationModal from "@/components/layout/LocationModal";
import api from "@/api/axios";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));
let client;
const bangalore = { pincode: "560001", city: "Bangalore", state: "Karnataka", country: "India" };
beforeEach(() => { api.get.mockResolvedValue({ data: { data: bangalore } }); });
afterEach(() => { cleanup(); client?.clear(); vi.clearAllMocks(); });
function show(currentLocation = null) {
  const onLocationSelect = vi.fn(), onOpenChange = vi.fn();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><LocationModal open currentLocation={currentLocation} onLocationSelect={onLocationSelect} onOpenChange={onOpenChange} /></QueryClientProvider>);
  return { onLocationSelect, onOpenChange, input: screen.getByLabelText("Enter an Indian PIN code") };
}
describe("delivery PIN selection", () => {
  it("auto-fills verified city and state and saves only after Apply", async () => {
    const { input, onLocationSelect, onOpenChange } = show();
    fireEvent.change(input, { target: { value: "560001" } });
    expect(screen.getByRole("button", { name: /Checking|Apply/ })).toBeDisabled();
    await waitFor(() => expect(screen.getByLabelText("City / district")).toHaveValue("Bangalore"));
    expect(screen.getByLabelText("State")).toHaveValue("Karnataka");
    expect(screen.getByLabelText("State")).toHaveAttribute("readonly");
    expect(onLocationSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onLocationSelect).toHaveBeenCalledWith({ ...bangalore, verified: true });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
  it("rejects invalid six-digit codes without a request", () => {
    const { input } = show();
    fireEvent.change(input, { target: { value: "000000" } });
    expect(screen.getByRole("alert")).toHaveTextContent("valid 6-digit");
    expect(api.get).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });
  it("keeps the current location unchanged when a PIN is not found", async () => {
    api.get.mockRejectedValue({ response: { status: 404, data: { message: "PIN code not found" } } });
    const { input, onLocationSelect } = show();
    fireEvent.change(input, { target: { value: "999999" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("PIN code not found");
    expect(screen.getByLabelText("City / district")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(onLocationSelect).not.toHaveBeenCalled();
  });
  it("verifies a restored PIN before allowing it to be selected again", async () => {
    const { onLocationSelect } = show(bangalore);
    expect(onLocationSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText("City / district")).toHaveValue("Bangalore"));
    expect(api.get).toHaveBeenCalledWith("/locations/pincode/560001", expect.objectContaining({ signal: expect.anything() }));
  });
  it("ignores old PIN responses after the input changes", async () => {
    let finishOld;
    api.get.mockImplementation(url => url.endsWith("560001") ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve({ data: { data: { pincode: "400001", city: "Mumbai", state: "Maharashtra" } } }));
    const { input } = show();
    fireEvent.change(input, { target: { value: "560001" } });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    fireEvent.change(input, { target: { value: "400001" } });
    await waitFor(() => expect(screen.getByLabelText("City / district")).toHaveValue("Mumbai"));
    await act(async () => { finishOld({ data: { data: bangalore } }); });
    expect(screen.getByLabelText("City / district")).toHaveValue("Mumbai");
    expect(screen.getByLabelText("State")).toHaveValue("Maharashtra");
  });
});
