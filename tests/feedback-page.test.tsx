// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import FeedbackPage from "@/app/feedback/page";

const { back } = vi.hoisted(() => ({ back: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/feedback page", () => {
  it("has no identity fields, validates the rating, and submits rating + comment", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ enabled: true }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackPage />);

    expect(
      await screen.findByRole("heading", { name: "Beri masukan" })
    ).toBeTruthy();
    expect(screen.queryByLabelText(/Nama|Gender/i)).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Nama|Gender/i })).toBeNull();

    const submit = screen.getByRole("button", {
      name: /Kirim masukan/,
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);

    fireEvent.click(submit);
    expect(
      screen.getByText("Pilih rating dulu sebelum mengirim.")
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const five = screen.getByRole("button", { name: /5 bintang/ });
    fireEvent.click(five);
    expect(five.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Sangat membantu — 5 dari 5")).toBeTruthy();

    fireEvent.change(
      screen.getByRole("textbox", { name: /Apa yang bisa kami perbaiki/ }),
      { target: { value: "cepat" } }
    );
    fireEvent.click(submit);

    expect(await screen.findByText("Terima kasih")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/feedback");
    expect(JSON.parse(String(init.body))).toEqual({
      rating: 5,
      comment: "cepat",
    });
  });

  it("shows the disabled message and keeps 119", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(jsonResponse({ enabled: false }))
    );

    render(<FeedbackPage />);

    expect(
      await screen.findByText("Masukan sedang tidak tersedia")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Kirim masukan/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: /Telepon 119, darurat nasional/ })
        .getAttribute("href")
    ).toBe("tel:119");
  });

  it("keeps the comment counter within 1000 characters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(jsonResponse({ enabled: true }))
    );

    render(<FeedbackPage />);
    await screen.findByRole("heading", { name: "Beri masukan" });

    const textarea = screen.getByRole("textbox", {
      name: /Apa yang bisa kami perbaiki/,
    }) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(1000);
    expect(screen.getByText("0/1000")).toBeTruthy();
  });

  it("shows the sending state while the request is pending", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ enabled: true }))
      .mockReturnValueOnce(new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackPage />);
    await screen.findByRole("heading", { name: "Beri masukan" });

    fireEvent.click(screen.getByRole("button", { name: /5 bintang/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kirim masukan/ }));

    const sending = (await screen.findByRole("button", {
      name: /Mengirim/,
    })) as HTMLButtonElement;
    expect(sending.disabled).toBe(true);
  });
});

describe("feedback submission failure and reset", () => {
  it("shows the API error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ enabled: true }))
      .mockResolvedValueOnce(
        jsonResponse({ error: "Gagal menyimpan feedback" }, 500)
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackPage />);
    await screen.findByRole("heading", { name: "Beri masukan" });

    fireEvent.click(screen.getByRole("button", { name: /4 bintang/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kirim masukan/ }));

    await waitFor(() => {
      expect(screen.getByText("Gagal menyimpan feedback")).toBeTruthy();
    });
  });

  it("resets the form from the success panel", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ enabled: true }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackPage />);
    await screen.findByRole("heading", { name: "Beri masukan" });

    fireEvent.click(screen.getByRole("button", { name: /5 bintang/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kirim masukan/ }));
    await screen.findByText("Terima kasih");

    fireEvent.click(
      screen.getByRole("button", { name: "Kirim masukan lain" })
    );

    expect(
      screen.getByRole("heading", { name: "Beri masukan" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /5 bintang/ }).getAttribute(
        "aria-pressed"
      )
    ).toBe("false");
  });
});