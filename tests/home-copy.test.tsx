// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/PenilaianFABWrapper", () => ({
  default: () => null,
}));

import HomePage from "@/app/page";

afterEach(cleanup);

describe("home safety copy", () => {
  it("keeps the title, search copy, and 119 link", async () => {
    render(<HomePage />);

    expect(
      await screen.findByRole("heading", { name: "AmbulansKu" })
    ).toBeTruthy();
    expect(
      screen.getByText("Temukan ambulans & fasilitas medis terdekat")
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "119" }).getAttribute("href")).toBe(
      "tel:119"
    );
  });
});