// @vitest-environment jsdom
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import HomePage from "@/app/page";

function setGeolocation(
  getCurrentPosition: (success: PositionCallback, error: PositionErrorCallback) => void
) {
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value: online,
    configurable: true,
  });
}

function typeSituation(value: string) {
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value },
  });
}

beforeEach(() => {
  push.mockReset();
  setOnline(true);
  setGeolocation(vi.fn());
  vi.spyOn(window, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  setOnline(true);
});

describe("home location states", () => {
  it("shows an inline denied message with retry and 119, without alert()", async () => {
    setGeolocation(
      vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1 } as GeolocationPositionError);
      })
    );

    render(<HomePage />);
    typeSituation("pingsan");
    fireEvent.click(screen.getByRole("button", { name: /Cari bantuan/ }));

    expect(await screen.findByText("Izin lokasi tidak aktif")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Telepon 119" }).getAttribute("href")
    ).toBe("tel:119");
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("shows the network banner and does not request geolocation offline", async () => {
    setOnline(false);
    const getCurrentPosition = vi.fn();
    setGeolocation(getCurrentPosition);

    render(<HomePage />);
    typeSituation("pingsan");
    fireEvent.click(screen.getByRole("button", { name: /Cari bantuan/ }));

    expect(await screen.findByText("Koneksi terputus")).toBeTruthy();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: /Menunggu koneksi/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it("shows the locating state while geolocation is pending", async () => {
    setGeolocation(vi.fn());

    render(<HomePage />);
    typeSituation("pingsan");
    fireEvent.click(screen.getByRole("button", { name: /Cari bantuan/ }));

    expect(
      await screen.findByText(/Kami meminta izin lokasi/)
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: /Mencari lokasi/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it("moves to /hasil with the same situation after permission is granted", async () => {
    setGeolocation(
      vi.fn((success: PositionCallback) => {
        success({
          coords: { latitude: -6.2, longitude: 106.8 },
        } as GeolocationPosition);
      })
    );

    render(<HomePage />);
    typeSituation("pingsan");
    fireEvent.click(screen.getByRole("button", { name: /Cari bantuan/ }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    const url = String(push.mock.calls[0][0]);

    expect(url).toContain("/hasil?");
    expect(url).toContain("situation=pingsan");
    expect(url).toContain("lat=-6.2");
    expect(url).toContain("lng=106.8");
  });
});