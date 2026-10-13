import { test, expect } from "@playwright/test";
test("theme storage failure and reduced motion preserve offline queue and label exports", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Appearance").selectOption("light");
  await page.getByLabel("Motion vibe").selectOption("pixel");
  await expect(page.locator("html")).toHaveAttribute("data-vibe", "pixel");
  await page.getByRole("button", { name: "Load acceptance example", exact: true }).click();
  await page.getByRole("button", { name: "Next unreviewed" }).click();
  await expect(page.locator("#claim")).not.toHaveValue("c1");
  await expect(page.locator("#agreement")).toContainText("self-reported");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("claim-review.csv");
});
import AxeBuilder from "@axe-core/playwright";
for (const theme of ["dark", "light"])
  for (const vibe of ["cartoon", "calm", "pixel", "lab"]) {
    test(`axe WCAG22 AA ${theme}/${vibe} offline reduced motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.route("**/*", (r) => r.abort());
      await page.getByLabel("Appearance").selectOption(theme);
      await page.getByLabel("Motion vibe").selectOption(vibe);
      await page.getByRole("button", { name: "Load acceptance example", exact: true }).click();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations).toEqual([]);
    });
  }
test("trace import and reviewer merge reject invalid replacements atomically", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Import RAG trace JSON or JSONL").setInputFiles({
    name: "trace.jsonl",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        result: "Claim",
        source_documents: [{ page_content: "Literal evidence 😀", metadata: { title: "Trace" } }],
      }),
    ),
  });
  await expect(page.locator("#status")).toContainText("Trace imported");
  await page.getByLabel("Span start").fill("0");
  await page.getByLabel("Span end").fill("7");
  await page.getByLabel("Rationale").fill("Scripted synthetic judgment");
  await page.getByLabel("Reviewer label").fill("A");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet", exact: true }).click();
  const fs = await import("node:fs/promises");
  const exported = JSON.parse(await fs.readFile((await (await download).path())!, "utf8"));
  const second = structuredClone(exported);
  second.reviews[0].id = "second";
  second.reviews[0].reviewer = "B";
  await page.getByLabel("Merge reviewer packet").setInputFiles({
    name: "second.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(second)),
  });
  await expect(page.locator("#status")).toContainText("histories merged");
  await expect(page.locator("#history p")).toHaveCount(2);
  second.sources[0].text = "Tamper";
  await page.getByLabel("Merge reviewer packet").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(second)),
  });
  await expect(page.locator("#status")).toContainText("current work kept");
  await expect(page.locator("#history p")).toHaveCount(2);
  const preserve = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet", exact: true }).click();
  await preserve;
  await page.getByLabel("Import RAG trace JSON or JSONL").setInputFiles({
    name: "bad.jsonl",
    mimeType: "application/json",
    buffer: Buffer.from("{}\n{}"),
  });
  await expect(page.locator("#status")).toContainText("current work kept");
  await expect(page.locator("#history p")).toHaveCount(2);
});
test("selected evidence links claim/source for pointer and keyboard without reduced-motion cursor work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load acceptance example", exact: true }).click();
  await page.getByLabel("Span start").fill("0");
  await page.getByLabel("Span end").fill("10");
  await expect(page.locator("#claim-text")).toHaveClass(/evidence-linked/);
  await expect(page.locator("#source-panel")).toHaveClass(/evidence-linked/);
  const excerpt = page.locator("#excerpt");
  const bounds = (await excerpt.boundingBox())!;
  await excerpt.dispatchEvent("pointermove", { clientX: bounds.x + 30, clientY: bounds.y + 20 });
  const cursor = excerpt.locator(".evidence-cursor");
  await expect(cursor).toHaveAttribute("style", /translate3d/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Span end").fill("11");
  await expect(page.locator("#claim-text")).toHaveClass(/evidence-linked/);
  await excerpt.dispatchEvent("pointermove", { clientX: bounds.x + 50, clientY: bounds.y + 30 });
  await expect(cursor).not.toHaveAttribute("style", /translate3d/);
  await expect(cursor).toBeHidden();
});
for (const appearance of ["dark", "light"]) {
  test(`stale text retains AA contrast at paused animation start in ${appearance}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        for (const node of Array.from(document.querySelectorAll(".stale")))
          for (const animation of node.getAnimations()) {
            animation.pause();
            animation.currentTime = 0;
          }
      });
      observer.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    });
    await page.goto("/");
    await page.getByLabel("Appearance").selectOption(appearance);
    const fs = await import("node:fs/promises");
    const packet = JSON.parse(await fs.readFile("examples/reviewed.json", "utf8"));
    packet.reviews = packet.reviews.map((row: Record<string, unknown>) => ({
      ...row,
      source_sha256: "a".repeat(64),
    }));
    await page.getByLabel("Import packet", { exact: true }).setInputFiles({
      name: "stale.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(packet)),
    });
    await expect(page.locator("#status")).toContainText("Imported");
    const contrast = await page.locator("#review-state.stale").evaluate((node) => {
      const style = getComputedStyle(node),
        opacity = Number(style.opacity);
      const rgb = (s: string) =>
        s
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number);
      const foreground = rgb(style.color),
        background = rgb(style.backgroundColor);
      const composed = foreground.map((v, i) => v * opacity + background[i] * (1 - opacity));
      const lum = (v: number[]) =>
        v
          .map((c) => c / 255)
          .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
          .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
      const a = lum(composed),
        b = lum(background);
      return {
        opacity,
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        paused: node.getAnimations().some((a) => a.playState === "paused" && a.currentTime === 0),
      };
    });
    expect(contrast.paused).toBe(true);
    expect(contrast.opacity).toBe(1);
    expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
