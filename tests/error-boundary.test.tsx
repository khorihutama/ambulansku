// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AppError from "@/app/error";

afterEach(cleanup);

describe("app error boundary", () => {
  it("keeps the 119 call bar visible and hides the raw error", () => {
    render(<AppError error={new Error("boom")} reset={() => undefined} />);

    expect(screen.getByText("Terjadi kesalahan")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
    expect(screen.queryByText("boom")).toBeNull();
  });
});