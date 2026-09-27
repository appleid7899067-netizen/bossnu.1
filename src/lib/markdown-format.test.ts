import assert from "node:assert/strict";
import test from "node:test";
import { fenceBareSvg } from "./markdown-format.ts";

test("wraps bare multiline SVG in a code fence", () => {
  const source = 'Logo:\n<svg viewBox="0 0 10 10">\n  <path d="M0 0h10" />\n</svg>\nDone.';
  assert.equal(
    fenceBareSvg(source),
    'Logo:\n```svg\n<svg viewBox="0 0 10 10">\n  <path d="M0 0h10" />\n</svg>\n```\nDone.',
  );
});

test("leaves already-fenced SVG and ordinary text untouched", () => {
  const fenced = "```svg\n<svg></svg>\n```";
  assert.equal(fenceBareSvg(fenced), fenced);
  assert.equal(
    fenceBareSvg("A normal answer with <svg> mentioned inline."),
    "A normal answer with <svg> mentioned inline.",
  );
});
