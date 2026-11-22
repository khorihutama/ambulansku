import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase-schema.sql"), "utf8");
const feedbackStart = sql.indexOf("create table feedback");
const feedbackBlock = feedbackStart >= 0 ? sql.slice(feedbackStart) : "";

describe("feedback SQL policy", () => {
  it("creates the feedback table with rating and one comment", () => {
    expect(feedbackStart).toBeGreaterThan(-1);
    expect(feedbackBlock).toContain("rating integer not null check");
    expect(feedbackBlock).toContain("comment text");
    expect(feedbackBlock).toContain("char_length(comment) <= 1000");
  });

  it("enables RLS and allows insert only for anon", () => {
    expect(feedbackBlock).toContain(
      "alter table feedback enable row level security"
    );
    expect(feedbackBlock).toContain('policy "Anyone can insert feedback"');
    expect(feedbackBlock).toContain("on feedback for insert");
    expect(feedbackBlock).not.toContain("on feedback for select");
    expect(feedbackBlock).not.toContain("using (true)");
  });

  it("leaves the legacy penilaian table unchanged", () => {
    expect(sql).toContain("create table penilaian");
    expect(sql).toContain("on penilaian for select");
  });
});