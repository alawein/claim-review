import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const expected = JSON.parse(await readFile("examples/expected.json", "utf8"));
const input = await readFile("examples/packet.json", "utf8");

test("CRLF selection preserves original source offsets", async ({ page }) => {
  const p = JSON.parse(input);
  p.sources[0].text = "first\r\nSECOND";
  p.sources[0].sha256 = createHash("sha256").update(p.sources[0].text).digest("hex");
  await page.goto("./");
  await page.getByLabel("Import packet").setInputFiles({
    name: "crlf.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(p)),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
  await page
    .getByLabel("Source text")
    .evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 12));
  await page.getByRole("button", { name: "Use selected span" }).press("Enter");
  await expect(page.getByLabel("Span start")).toHaveValue("7");
  await expect(page.getByLabel("Span end")).toHaveValue("13");
  await expect(page.locator("#excerpt")).toHaveText("SECOND");
});

test("large valid packet exports within import byte bound", async ({ page }) => {
  const digest = createHash("sha256").update("X").digest("hex");
  const sources = Array.from({ length: 100 }, (_, i) => ({
    id: `s${i}`,
    title: "Synthetic",
    text: "X",
    sha256: digest,
  }));
  const p = {
    schema_version: 1,
    sources,
    claims: Array.from({ length: 1000 }, (_, i) => ({
      id: `c${i}`,
      text: "x".repeat(3800),
      citation_ids: sources.map((s) => s.id),
    })),
    reviews: [],
  };
  const raw = JSON.stringify(p);
  expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(5 * 1024 * 1024);
  await page.goto("./");
  await page
    .getByLabel("Import packet")
    .setInputFiles({ name: "large.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  await expect(page.getByRole("status")).toContainText("Imported");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const path = await (await event).path();
  const exported = await readFile(path!);
  expect(exported.length).toBeLessThanOrEqual(5 * 1024 * 1024);
  await page.getByLabel("Import packet").setInputFiles(path!);
  await expect(page.getByRole("status")).toContainText("Imported");
});

async function importPacket(page: import("@playwright/test").Page) {
  await page.getByLabel("Import packet").setInputFiles({
    name: "packet.json",
    mimeType: "application/json",
    buffer: Buffer.from(input),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
}

async function fourReviews(page: import("@playwright/test").Page) {
  for (let i = 0; i < 4; i++) {
    await page.getByLabel("Claim", { exact: true }).selectOption(`c${i + 1}`);
    await page.getByLabel("Span start").fill(String(expected.spans[i][0]));
    await page.getByLabel("Span end").fill(String(expected.spans[i][1]));
    await page.getByLabel("Verdict").selectOption(expected.verdicts[i]);
    await page.getByLabel("Rationale").fill(expected.rationales[i]);
    await page.getByLabel("Reviewer label").fill("Synthetic exercise");
    await page.getByRole("button", { name: "Save review" }).press("Enter");
    await expect(page.getByRole("status")).toContainText("Saved");
  }
}

test("four judgments export and reimport exactly, without input-driven requests", async ({
  page,
}, info) => {
  await page.goto("./");
  const requests: string[] = [];
  await page.route("**/*", (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await importPacket(page);
  await fourReviews(page);
  await expect(page.getByLabel("Review history")).toContainText("c1 / policy-1 [0,44)");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).press("Enter");
  const download = await event;
  const path = await download.path();
  expect(path).toBeTruthy();
  const raw = await readFile(path!, "utf8");
  const result = JSON.parse(raw);
  expect(result.reviews.map((r: { verdict: string }) => r.verdict)).toEqual(expected.verdicts);
  expect(result.reviews.map((r: { start: number; end: number }) => [r.start, r.end])).toEqual(
    expected.spans,
  );
  expect(result.reviews.map((r: { rationale: string }) => r.rationale)).toEqual(
    expected.rationales,
  );
  await writeFile(info.outputPath("reviewed-packet.json"), raw);
  await page.getByLabel("Import packet").setInputFiles(path!);
  await expect(page.locator("#status")).toContainText("Imported");
  await expect(page.getByLabel("Review history")).toContainText(
    "absence does not establish falsity",
  );
  const corrupt = JSON.parse(input);
  corrupt.sources[0].text += " Changed";
  await page.getByLabel("Import packet").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(corrupt)),
  });
  await expect(page.locator("#status")).toContainText("current work kept");
  await expect(page.getByLabel("Review history")).toContainText("Source states the same rule");
  expect(requests).toEqual([]);
});

test("keyboard navigation saves and exports", async ({ page }) => {
  await page.goto("./");
  await importPacket(page);
  await page.getByLabel("Import packet").press("Tab");
  await expect(page.getByRole("button", { name: "Load synthetic example" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "New packet" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Claim", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab"); // citation
  await page.keyboard.press("Tab"); // readonly source
  await page.keyboard.press("Tab"); // use selection
  await page.keyboard.press("Tab"); // start
  await expect(page.getByLabel("Span start")).toBeFocused();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("0");
  await page.keyboard.press("Tab");
  await page.keyboard.type("44");
  await page.keyboard.press("Tab"); // supported verdict
  await page.keyboard.press("Tab");
  await page.keyboard.type("Source states the same rule.");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Synthetic exercise");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Export packet" })).toBeFocused();
  const download = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  expect(await (await download).path()).toBeTruthy();
});

test("standalone offline file imports, reviews, exports and reimports", async ({ page }, info) => {
  await page.goto(pathToFileURL(resolve(process.env.RELEASE_HTML ?? "dist/index.html")).href);
  await page.route(/^https?:/, (route) => route.abort());
  await page.getByRole("button", { name: "Load synthetic example" }).click();
  await expect(page.getByRole("status")).toContainText("Imported");
  expect(await page.evaluate(() => !!globalThis.crypto?.subtle)).toBe(true);
  await fourReviews(page);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const path = await (await event).path();
  expect(path).toBeTruthy();
  const saved = info.outputPath("offline-review.json");
  await writeFile(saved, await readFile(path!));
  await page.getByLabel("Import packet").setInputFiles(saved);
  await expect(page.getByRole("status")).toContainText("Imported");
  await expect(page.getByLabel("Review history")).toContainText("unverifiable");
});

test("builder creates, downloads, reviews, exports and reimports", async ({ page }, info) => {
  await page.goto("./");
  await page.getByRole("button", { name: "New packet" }).click();
  await expect(page.locator("#builder")).toBeVisible();
  await expect(page.locator("#builder legend").first()).toHaveText("Source 1");
  await page.locator("#builder-sources input").first().fill("policy-1");
  await page.locator("#builder-sources input").nth(1).fill("Synthetic policy");
  await page.locator("#builder-sources textarea").first().fill("Refunds within 30 days.");
  await expect(page.locator("#builder-sources")).toContainText("SHA-256:");
  await page.locator("#builder-claims input").first().fill("c1");
  await page.locator("#builder-claims input").nth(1).fill("Refunds within 30 days.");
  await page.locator("#builder-claims input").nth(2).fill("policy-1");
  const packetFile = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download packet file" }).click();
  const packetDownload = await packetFile;
  expect(packetDownload.suggestedFilename()).toBe("packet.json");
  await expect(page.locator("#builder-status")).toContainText("download requested");
  await page.getByRole("button", { name: "Use packet" }).click();
  await expect(page.locator("#status")).toContainText("Built packet");
  await expect(page.getByRole("button", { name: "Export packet" })).toBeEnabled();
  await expect(page.getByLabel("Claim", { exact: true })).toContainText("c1: Refunds");
  await page.getByLabel("Span start").fill("0");
  await page.getByLabel("Span end").fill("7");
  await page.getByLabel("Rationale").fill("Source states the same rule.");
  await page.getByLabel("Reviewer label").fill("Synthetic exercise");
  await page.getByRole("button", { name: "Save review" }).press("Enter");
  await expect(page.locator("#status")).toContainText("Saved");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const path = await (await event).path();
  const raw = await readFile(path!, "utf8");
  await writeFile(info.outputPath("built-packet.json"), raw);
  await page.getByLabel("Import packet").setInputFiles(path!);
  await expect(page.locator("#status")).toContainText("Imported");
  await expect(page.getByLabel("Review history")).toContainText("Source states the same rule");
  const downloaded = await packetDownload.path();
  await page.getByLabel("Import packet").setInputFiles(downloaded!);
  await expect(page.locator("#status")).toContainText("Imported");
});

test("builder rejects empty citations, confirms once, keeps review work", async ({ page }) => {
  await page.goto("./");
  await importPacket(page);
  await fourReviews(page);
  await page.getByRole("button", { name: "New packet" }).click();
  await page.locator("#builder-sources input").first().fill("s1");
  await page.locator("#builder-sources input").nth(1).fill("Title");
  await page.locator("#builder-sources textarea").first().fill("Some text.");
  await page.locator("#builder-claims input").first().fill("c1");
  await page.locator("#builder-claims input").nth(1).fill("Some claim.");
  await page.getByRole("button", { name: "Use packet" }).click();
  await expect(page.locator("#builder-status")).toContainText("Unsaved reviews will be replaced");
  await page.getByRole("button", { name: "Use packet" }).click();
  await expect(page.locator("#builder-status")).toContainText("citation");
  await expect(page.locator("#builder-status")).toBeFocused();
  await expect(page.getByLabel("Review history")).toContainText("Source states the same rule");
});

test("import errors use the alert role and same file reselects", async ({ page }) => {
  await page.goto("./");
  await importPacket(page);
  const corrupt = JSON.parse(input);
  corrupt.sources[0].text += " Changed";
  const payload = {
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(corrupt)),
  };
  await page.getByLabel("Import packet").setInputFiles(payload);
  const status = page.locator("#status");
  await expect(status).toContainText("current work kept");
  await expect(status).toHaveAttribute("role", "alert");
  await expect(status).toHaveClass(/error/);
  await expect(status).toBeFocused();
  await page.getByLabel("Import packet").setInputFiles(payload);
  await expect(status).toContainText("current work kept");
});

test("beforeunload guard warns with unsaved reviews and not after export", async ({ page }) => {
  let guards = 0;
  page.on("dialog", (dialog) => {
    guards++;
    void dialog.accept();
  });
  await page.goto("./");
  await importPacket(page);
  await fourReviews(page);
  await page.reload();
  expect(guards).toBe(1);
  await importPacket(page);
  await fourReviews(page);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  await event;
  await page.reload();
  expect(guards).toBe(1);
});

test("small screen reflow and doubled text size", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("./");
  await importPacket(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.addStyleTag({ content: "body{font-size:34px}" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Export packet" })).toBeVisible();
});

test("malicious text is inert; stale reviews do not quote changed source", async ({ page }) => {
  const p = JSON.parse(input);
  p.sources[0].text = "<script>globalThis.BAD=true</script> عربي 😀";
  const { createHash } = await import("node:crypto");
  p.sources[0].sha256 = createHash("sha256").update(p.sources[0].text).digest("hex");
  p.reviews = [
    {
      id: "old",
      claim_id: "c1",
      source_id: "policy-1",
      source_sha256: "b".repeat(64),
      start: 0,
      end: 44,
      verdict: "partial",
      rationale: "Prior source review",
      reviewer: "Synthetic",
    },
  ];
  await page.goto("./");
  await page.getByLabel("Import packet").setInputFiles({
    name: "script.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(p)),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
  await expect(page.getByLabel("Source text")).toHaveValue(p.sources[0].text);
  await expect(page.getByLabel("Review history")).toContainText("stale");
  expect(await page.evaluate(() => Object.hasOwn(globalThis, "BAD"))).toBe(false);
  expect(await page.locator("script").count()).toBe(1);
});
