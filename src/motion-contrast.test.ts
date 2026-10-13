import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
const tokens = JSON.parse(readFileSync("design-tokens/tokens.json", "utf8"));
const rgb = (hex: string) =>
  hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16));
const luminance = (rgb: number[]) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
test.each(["dark", "light"])("stale animation-start text retains AA contrast in %s", (theme) => {
  const css = readFileSync("src/style.css", "utf8");
  const start = css.match(/@keyframes stale-arrive\s*\{\s*from\s*\{([^}]*)\}/)![1];
  const opacity = Number(start.match(/opacity:\s*([0-9.]+)/)?.[1] ?? 1);
  const ink = rgb(tokens[theme].ink),
    background = rgb(tokens[theme].surface);
  const composed = ink.map((value, i) => value * opacity + background[i] * (1 - opacity));
  const a = luminance(composed),
    b = luminance(background);
  expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
});
