// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TriageInput from "@/components/TriageInput";
import QuickSelect from "@/components/QuickSelect";
import EmergencyCallBar from "@/components/EmergencyCallBar";
import UrgencyBadge from "@/components/UrgencyBadge";

afterEach(cleanup);

describe("TriageInput", () => {
  it("submits non-empty text, disables when empty, and shows locating", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TriageInput
        value=""
        onChange={onChange}
        onSubmit={onSubmit}
        loading={false}
        locationError={null}
        networkError={false}
      />
    );

    expect(screen.getByText("Ceritakan situasinya")).toBeTruthy();
    expect(
      screen.getByText(/Lokasi dipakai untuk mencari fasilitas terdekat/)
    ).toBeTruthy();

    const button = screen.getByRole("button", {
      name: /Cari bantuan/,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(
      screen.getByText("Tulis dulu apa yang terjadi, lalu coba lagi.")
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "nyeri dada" },
    });
    expect(onChange).toHaveBeenCalledWith("nyeri dada");
    expect(
      screen.queryByText("Tulis dulu apa yang terjadi, lalu coba lagi.")
    ).toBeNull();

    rerender(
      <TriageInput
        value="nyeri dada"
        onChange={onChange}
        onSubmit={onSubmit}
        loading={false}
        locationError={null}
        networkError={false}
      />
    );
    expect(button.disabled).toBe(false);

    const enabledButton = screen.getByRole("button", {
      name: /Cari bantuan/,
    });
    fireEvent.click(enabledButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <TriageInput
        value="nyeri dada"
        onChange={onChange}
        onSubmit={onSubmit}
        loading
        locationError={null}
        networkError={false}
      />
    );
    const loadingButton = screen.getByRole("button", {
      name: /Mencari lokasi/,
    }) as HTMLButtonElement;
    expect(loadingButton.disabled).toBe(true);
  });

  it("replaces the CTA with a denied-location alert and 119", () => {
    const onSubmit = vi.fn();
    render(
      <TriageInput
        value="pingsan"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        loading={false}
        locationError="denied"
        networkError={false}
      />
    );

    expect(screen.getByText("Izin lokasi tidak aktif")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Cari bantuan/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("link", { name: "Telepon 119" }).getAttribute("href")
    ).toBe("tel:119");
  });

  it("shows the waiting label when the network is offline", () => {
    render(
      <TriageInput
        value="pingsan"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
        locationError={null}
        networkError
      />
    );

    const button = screen.getByRole("button", {
      name: /Menunggu koneksi/,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe("QuickSelect", () => {
  it("renders five emergency chips, two scheduled, and reports a value", () => {
    const onSelect = vi.fn();
    render(<QuickSelect onSelect={onSelect} />);

    expect(screen.getByText("Atau pilih situasi")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(7);
    expect(screen.getByText("Nyeri dada / stroke")).toBeTruthy();
    expect(screen.getByText("Sesak napas")).toBeTruthy();
    expect(screen.getByText("Pingsan")).toBeTruthy();

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