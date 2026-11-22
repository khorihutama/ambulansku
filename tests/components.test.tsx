// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TriageInput from "@/components/TriageInput";
import QuickSelect from "@/components/QuickSelect";
import EmergencyCallBar from "@/components/EmergencyCallBar";
import UrgencyBadge from "@/components/UrgencyBadge";

afterEach(cleanup);

describe("TriageInput", () => {
  it("submits non-empty text, disables when empty, and shows loading", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TriageInput onSubmit={onSubmit} loading={false} />
    );

    expect(screen.getByText("Ceritakan situasinya")).toBeTruthy();
    expect(screen.getByText(/Jangan tulis nama/)).toBeTruthy();

    const button = screen.getByRole("button", {
      name: /Cari Sekarang/,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "nyeri dada" },
    });
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith("nyeri dada");

    rerender(<TriageInput onSubmit={onSubmit} loading />);
    const loadingButton = screen.getByRole("button", {
      name: /Mencari/,
    }) as HTMLButtonElement;
    expect(loadingButton.disabled).toBe(true);
  });
});

describe("QuickSelect", () => {
  it("renders six situations and reports the selected value", () => {
    const onSelect = vi.fn();
    render(<QuickSelect onSelect={onSelect} />);

    expect(screen.getByText("Atau pilih situasi")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(6);

    fireEvent.click(screen.getByRole("button", { name: /Kecelakaan/ }));

    expect(onSelect).toHaveBeenCalledWith(
      "Terjadi kecelakaan, butuh ambulans segera"
    );
  });

  it("disables every situation when disabled", () => {
    render(<QuickSelect onSelect={vi.fn()} disabled />);

    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe("safety copy", () => {
  it("keeps the 119 call target and label", () => {
    render(<EmergencyCallBar />);

    const call = screen.getByRole("link", { name: /Hubungi 119/ });
    expect(call.getAttribute("href")).toBe("tel:119");
    expect(screen.getByText("SPGDT Nasional")).toBeTruthy();
  });

  it("labels both urgency states", () => {
    const { rerender } = render(<UrgencyBadge urgency="emergency" />);
    expect(screen.getByText(/DARURAT/)).toBeTruthy();

    rerender(<UrgencyBadge urgency="scheduled" />);
    expect(screen.getByText(/TERJADWAL/)).toBeTruthy();
  });
});