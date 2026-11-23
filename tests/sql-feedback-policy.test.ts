import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase-schema.sql"), "utf8");
const feedbackStart = sql.indexOf("create table feedback");
const feedbackBlock = feedbackStart >= 0 ? sql.slice(feedbackStart) : "";
const penilaianStart = sql.indexOf("create table penilaian");
const penilaianBlock =
  penilaianStart >= 0 && feedbackStart > penilaianStart
    ? sql.slice(penilaianStart, feedbackStart)
    : "";
const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/2026-11-23_drop_penilaian_public_select.sql"
  ),
  "utf8"
);

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

  it("keeps the penilaian table and insert policy but removes public select", () => {
    expect(sql).toContain("create table penilaian");
    expect(penilaianBlock).toContain('policy "Anyone can insert penilaian"');
    expect(penilaianBlock).not.toContain('policy "Anyone can read penilaian"');
    expect(penilaianBlock).not.toMatch(/for\s+select/i);
    expect(penilaianBlock).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it("ships a migration that drops the select policy without deleting data", () => {
    expect(migration).toContain(
      'drop policy if exists "Anyone can read penilaian" on penilaian;'
    );
    expect(migration.toLowerCase()).not.toContain("drop table");
    expect(migration.toLowerCase()).not.toContain("delete from");
  });
});