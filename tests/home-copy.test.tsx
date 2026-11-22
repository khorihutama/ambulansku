// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import HomePage from "@/app/page";

afterEach(cleanup);

describe("home safety copy", () => {
  it("keeps the title, search copy, 119, and feedback link", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Apa yang terjadi?" })
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Tulis singkat. Kami carikan fasilitas medis terdekat dari lokasimu."
      )
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "119" }).getAttribute("href")).toBe(
      "tel:119"
    );
    expect(
      screen.getByRole("link", { name: /Telepon 119, darurat nasional/ })
        .getAttribute("href")
    ).toBe("tel:119");
    expect(
      screen.getByRole("link", { name: "Beri masukan" }).getAttribute("href")
    ).toBe("/feedback");
  });
});