import assert from "node:assert/strict";
import test from "node:test";
import { addDays, eachDate, monthCells } from "./tracking-dates.ts";
import { trackingCopy } from "./tracking-copy.ts";

test("calendar dates stay on local calendar days", () => {
  assert.equal(addDays("2026-11-01", 4), "2026-11-05");
  assert.deepEqual(eachDate("2026-11-01", "2026-11-03"), ["2026-11-01", "2026-11-02", "2026-11-03"]);
  assert.deepEqual(eachDate("2026-11-05", "2026-11-01"), []);
});

test("November 2026 starts on Sunday", () => {
  const cells = monthCells(2026, 10);
  assert.equal(cells.length, 42);
  assert.equal(cells[0].key, "2026-11-01");
  assert.equal(cells[0].inMonth, true);
  assert.equal(cells[30].key, "2026-12-01");
  assert.equal(cells[30].inMonth, false);
});

test("Bangla copy covers every English tracking label", () => {
  const english = flatten(trackingCopy.en);
  const bangla = flatten(trackingCopy.bn);
  assert.deepEqual(Object.keys(bangla), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.notEqual(bangla[key], "", key);
  }
});

function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (Array.isArray(value)) {
    return Object.assign({}, ...value.map((item, index) => flatten(item, `${prefix}.${index}`)));
  }
  if (value && typeof value === "object") {
    return Object.assign(
      {},
      ...Object.entries(value).map(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key)),
    );
  }
  return {};
}
