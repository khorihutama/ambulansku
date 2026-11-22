// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import AppError from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFound from "@/app/not-found";

afterEach(cleanup);

describe("error boundaries", () => {
  it("keeps the 119 call bar visible in the app error boundary", () => {
    render(<AppError error={new Error("boom")} reset={() => undefined} />);

    expect(screen.getByText("Terjadi kesalahan")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
    expect(screen.queryByText("boom")).toBeNull();
  });

  it("renders a standalone 119 in the root global error", () => {
    const html = renderToStaticMarkup(
      <GlobalError error={new Error("root boom")} reset={() => undefined} />
    );

    expect(html).toContain("<html");
    expect(html).toContain('href="tel:119"');
    expect(html).toContain("Hubungi 119");
    expect(html).not.toContain("root boom");
  });

  it("keeps 119 on the not-found page", () => {
    render(<NotFound />);

    expect(screen.getByText("Halaman tidak ditemukan")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
  });
});