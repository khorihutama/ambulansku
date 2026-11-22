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
  it("has no name or gender field and submits rating + comment", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ enabled: true }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackPage />);

    expect(
      await screen.findByRole("heading", { name: "Feedback" })
    ).toBeTruthy();
    expect(screen.queryByLabelText(/Nama|Gender/i)).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Nama|Gender/i })).toBeNull();
    expect(screen.queryByText("Nama / Inisial")).toBeNull();

    const submit = screen.getByRole("button", {
      name: /Kirim Feedback/,
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "5 bintang" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Komentar/ }), {
      target: { value: "cepat" },
    });
    expect(submit.disabled).toBe(false);

    fireEvent.click(submit);

    expect(await screen.findByText("Terima Kasih!")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/feedback");
    expect(JSON.parse(String(init.body))).toEqual({
      rating: 5,
      comment: "cepat",
    });
  });

  it("shows the disabled message instead of the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(jsonResponse({ enabled: false }))
    );

    render(<FeedbackPage />);

    expect(await screen.findByText("Feedback Tidak Tersedia")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Kirim Feedback/ })).toBeNull();
  });

  it("keeps the comment counter within 1000 characters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(jsonResponse({ enabled: true }))
    );

    render(<FeedbackPage />);
    await screen.findByRole("heading", { name: "Feedback" });

    const textarea = screen.getByRole("textbox", {
      name: /Komentar/,
    }) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(1000);
  });
});

describe("feedback submission failure", () => {
  it("shows the API error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ enabled: true }))
      .mockResolvedValueOnce(
        jsonResponse({ error: "Gagal menyimpan feedback" }, 500)
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackPage />);
    await screen.findByRole("heading", { name: "Feedback" });

    fireEvent.click(screen.getByRole("button", { name: "4 bintang" }));
    fireEvent.click(screen.getByRole("button", { name: /Kirim Feedback/ }));

    await waitFor(() => {
      expect(screen.getByText("Gagal menyimpan feedback")).toBeTruthy();
    });
  });
});