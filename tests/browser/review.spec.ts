import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const expected = JSON.parse(await readFile("examples/expected.json", "utf8"));
const input = await readFile("examples/packet.json", "utf8");

const acceptanceCases = [
  {
    id: "refund-confirmed",
    verdict: "supported",
    rationale: "The refund-enabled observation is within the allowed 120 seconds.",
  },
  {
    id: "refund-contradicted",
    verdict: "contradicted",
    rationale: "The source records USD 100, which contradicts the claimed USD 120.",
  },
  {
    id: "refund-stale",
    verdict: "unverifiable",
    rationale: "The completion observation is older than 120 seconds; the receipt is insufficient.",
  },
  {
    id: "refund-baseline",
    verdict: "contradicted",
    rationale: "The baseline was already true and the required change has no known action receipt.",
  },
];

test("acceptance example starts unreviewed and carries human judgments through export and reimport", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route(/^https?:/, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto(pathToFileURL(resolve(process.env.RELEASE_HTML ?? "dist/index.html")).href);
  await page.getByRole("button", { name: "Load acceptance example", exact: true }).press("Enter");
  await expect(page.locator("#status")).toContainText("unreviewed");
  await expect(page.locator("#review-state")).toContainText("Unreviewed");
  await expect(page.locator("#history p")).toHaveCount(0);
  await expect(page.getByLabel("Claim", { exact: true }).locator("option")).toHaveCount(4);

  for (const review of acceptanceCases) {
    await page.getByLabel("Claim", { exact: true }).selectOption(review.id);
    await expect(page.locator("#review-state")).toContainText("Unreviewed");
    await page.getByLabel("Source text", { exact: true }).press("ControlOrMeta+A");
    await page.getByRole("button", { name: "Use selected span" }).press("Enter");
    await expect(page.getByLabel("Span start")).toHaveValue("0");
    await expect(page.getByLabel("Span end")).toHaveValue("440");
    await page.getByLabel("Verdict").selectOption(review.verdict);
    await page.getByLabel("Rationale").fill(review.rationale);
    await page.getByLabel("Reviewer label").fill("Local human exercise");
    await page.getByRole("button", { name: "Save review" }).press("Enter");
    await expect(page.locator("#review-state")).toContainText(review.verdict);
  }

  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).press("Enter");
  const path = await (await event).path();
  const raw = await readFile(path!, "utf8");
  const exported = JSON.parse(raw);
  const acceptance = JSON.parse(await readFile("examples/acceptance.json", "utf8"));
  expect(exported).toEqual({
    ...acceptance,
    schema_version: 2,
    sources: acceptance.sources.map((source: { sha256: string }) => ({
      ...source,
      nfc_sha256: source.sha256,
    })),
    reviews: acceptanceCases.map((review, i) => ({
      id: `review-${i + 1}`,
      claim_id: review.id,
      source_id: "refund-record-1042",
      source_sha256: acceptance.sources[0].sha256,
      start: 0,
      end: 440,
      verdict: review.verdict,
      rationale: review.rationale,
      reviewer: "Local human exercise",
      reviewer_identity_assurance: "self-reported",
      source_nfc_sha256: acceptance.sources[0].sha256,
      text_position: { type: "TextPositionSelector", start: 0, end: 440 },
      text_quote: {
        type: "TextQuoteSelector",
        exact: acceptance.sources[0].text,
        prefix: "",
        suffix: "",
      },
    })),
  });
  expect(exported.claims.map((claim: { id: string }) => claim.id)).toEqual([
    "refund-confirmed",
    "refund-contradicted",
    "refund-stale",
    "refund-baseline",
  ]);
  expect(exported.sources[0].id).toBe("refund-record-1042");
  expect(exported.reviews.map((review: { verdict: string }) => review.verdict)).toEqual([
    "supported",
    "contradicted",
    "unverifiable",
    "contradicted",
  ]);
  expect(
    exported.reviews.map((review: { start: number; end: number }) => [review.start, review.end]),
  ).toEqual([
    [0, 440],
    [0, 440],
    [0, 440],
    [0, 440],
  ]);
  expect(exported.reviews.map((review: { rationale: string }) => review.rationale)).toEqual(
    acceptanceCases.map((review) => review.rationale),
  );
  await page.getByLabel("Import packet").setInputFiles(path!);
  await expect(page.locator("#status")).toContainText("Imported");
  await expect(page.locator("#history p")).toHaveCount(4);
  await page.getByLabel("Claim", { exact: true }).selectOption("refund-stale");
  await expect(page.locator("#review-state")).toContainText("unverifiable");

  const corrupt = JSON.parse(raw);
  corrupt.sources[0].text += " Changed source";
  await page.getByLabel("Import packet").setInputFiles({
    name: "bad-acceptance.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(corrupt)),
  });
  await expect(page.locator("#status")).toContainText("current work kept");
  await expect(page.locator("#review-state")).toContainText(acceptanceCases[2].rationale);
  await expect(page.getByLabel("Claim", { exact: true })).toHaveValue("refund-stale");
  await expect(page.locator("#history p")).toHaveCount(4);
  const retainedDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const retainedPath = await (await retainedDownload).path();
  expect(await readFile(retainedPath!, "utf8")).toBe(raw);
  expect(requests).toEqual([]);
});

test("acceptance source and human judgment stay together on desktop and stack on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");
  await page.getByRole("button", { name: "Load acceptance example", exact: true }).click();
  await expect(page.locator("#review-state")).toContainText("Unreviewed");
  const source = page.locator("#source-panel");
  const judgment = page.locator("#judgment-panel");
  const wideSource = (await source.boundingBox())!;
  const wideJudgment = (await judgment.boundingBox())!;
  expect(Math.abs(wideSource.y - wideJudgment.y)).toBeLessThan(2);
  expect(wideSource.x + wideSource.width).toBeLessThanOrEqual(wideJudgment.x);
  await expect(page.getByLabel("Source text", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Verdict")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const narrowSource = (await source.boundingBox())!;
  const narrowJudgment = (await judgment.boundingBox())!;
  expect(narrowSource.y + narrowSource.height).toBeLessThanOrEqual(narrowJudgment.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Claim", { exact: true }).selectOption("refund-baseline");
  await expect(page.locator("#claim-text")).toHaveText(
    "The agent changed refund-enabled from false to true.",
  );
});

test("acceptance worked example requires confirmation before replacing unsaved human reviews", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Load acceptance example", exact: true }).click();
  await expect(page.locator("#review-state")).toContainText("Unreviewed");
  await page.getByLabel("Span start").fill("0");
  await page.getByLabel("Span end").fill("17");
  await page.getByLabel("Rationale").fill("Keep this unsaved human rationale.");
  await page.getByLabel("Reviewer label").fill("Local human exercise");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.locator("#history p")).toHaveCount(1);
  await page.getByText("Synthetic worked judgments", { exact: true }).click();
  await page.getByRole("button", { name: "Load synthetic worked judgments", exact: true }).click();
  await expect(page.locator("#status")).toContainText("again to confirm");
  await expect(page.locator("#history p")).toHaveCount(1);
  await expect(page.locator("#review-state")).toContainText("Keep this unsaved human rationale.");
  await page.getByRole("button", { name: "Load synthetic example", exact: true }).click();
  await expect(page.locator("#status")).toContainText("again to confirm");
  await expect(page.locator("#history p")).toHaveCount(1);
  await page.getByRole("button", { name: "Load synthetic worked judgments", exact: true }).click();
  await expect(page.locator("#status")).toContainText("again to confirm");
  await expect(page.locator("#history p")).toHaveCount(1);
  await page.getByRole("button", { name: "Load synthetic worked judgments", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Synthetic worked judgments");
  await expect(page.locator("#history p")).toHaveCount(4);
  await expect(page.locator("#review-state")).not.toContainText(
    "Keep this unsaved human rationale.",
  );
});

test("acceptance worked judgments are synthetic and revised sources retain stale history", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByText("Synthetic worked judgments", { exact: true }).click();
  await page.getByRole("button", { name: "Load synthetic worked judgments", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Synthetic worked judgments");
  await expect(page.locator("#history p")).toHaveCount(4);
  await expect(page.locator("#review-state")).toContainText("Synthetic");
  const worked = JSON.parse(await readFile("examples/acceptance-reviewed.json", "utf8"));
  worked.sources[0].text =
    "REVISED_SOURCE_SENTINEL: current evidence differs from all prior quoted passages.";
  worked.sources[0].sha256 = createHash("sha256").update(worked.sources[0].text).digest("hex");
  await page.getByLabel("Import packet").setInputFiles({
    name: "revised-acceptance.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(worked)),
  });
  await expect(page.locator("#status")).toContainText("Imported");
  await expect(page.locator("#review-state")).toContainText("stale");
  await expect(page.locator("#review-state")).toContainText("Original passage unavailable");
  await expect(page.locator("#history p")).toHaveCount(4);
  await expect(page.locator("#history")).not.toContainText("REVISED_SOURCE_SENTINEL");
  await expect(page.locator("#review-state")).not.toContainText("REVISED_SOURCE_SENTINEL");
  await expect(page.getByLabel("Source text", { exact: true })).toHaveValue(worked.sources[0].text);
  await page.getByLabel("Span start").fill("0");
  await page.getByLabel("Span end").fill("17");
  await page.getByLabel("Verdict").selectOption("partial");
  await page.getByLabel("Rationale").fill("Reviewing the revised source in this local exercise.");
  await page.getByLabel("Reviewer label").fill("Local human exercise");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.locator("#review-state")).toContainText("partial");
  await expect(page.locator("#review-state")).not.toContainText("stale");
  await expect(page.locator("#history p")).toHaveCount(5);
  await expect(page.locator("#history")).toContainText("stale, prior");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const path = await (await download).path();
  const raw = await readFile(path!, "utf8");
  const revised = JSON.parse(raw);
  expect(revised.reviews.slice(0, 4)).toEqual(
    worked.reviews.map((review: Record<string, unknown>) => ({
      ...review,
      reviewer_identity_assurance: "self-reported",
      source_nfc_sha256: null,
      text_position: null,
      text_quote: null,
    })),
  );
  expect(revised.reviews[4].source_sha256).toBe(worked.sources[0].sha256);
  await page.getByLabel("Import packet").setInputFiles(path!);
  await expect(page.locator("#history p")).toHaveCount(5);
  const roundTrip = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const roundTripPath = await (await roundTrip).path();
  expect(await readFile(roundTripPath!, "utf8")).toBe(raw);
});

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
  await expect(page.getByRole("status")).toContainText("Imported", { timeout: 20000 });
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export packet" }).click();
  const path = await (await event).path();
  const exported = await readFile(path!);
  expect(exported.length).toBeLessThanOrEqual(5 * 1024 * 1024);
  await page.getByLabel("Import packet").setInputFiles(path!);
  await expect(page.getByRole("status")).toContainText("Imported", { timeout: 20000 });
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
  await expect(
    page.getByRole("button", { name: "Load acceptance example", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "New packet" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("summary")).toBeFocused();
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
  // Simulate doubled text through the existing stylesheet, whose hash is allowed.
  // Adding a new inline style correctly fails under the standalone CSP.
  await page.evaluate(() => document.styleSheets[0].insertRule("body{font-size:34px}"));
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

test("normalization-only source changes remain stale and never quote revised offsets", async ({
  page,
}) => {
  const { parsePacket } = await import("../../src/packet");
  const { appendReview } = await import("../../src/reviews");
  const hash = async (text: string) => createHash("sha256").update(text).digest("hex");
  const legacy = (text: string) => ({
    schema_version: 1,
    sources: [
      {
        id: "s",
        title: "Synthetic",
        text,
        sha256: createHash("sha256").update(text).digest("hex"),
      },
    ],
    claims: [{ id: "c", text: "A synthetic claim", citation_ids: ["s"] }],
    reviews: [],
  });
  const old = await parsePacket(JSON.stringify(legacy("Cafe\u0301")), hash);
  const reviewed = appendReview(old, {
    id: "r",
    claim_id: "c",
    source_id: "s",
    source_sha256: old.sources[0].sha256,
    start: 0,
    end: 5,
    verdict: "supported",
    rationale: "Original decomposed passage",
    reviewer: "Synthetic",
  });
  const next = await parsePacket(JSON.stringify(legacy("Caf\u00e9")), hash);
  next.reviews = reviewed.reviews;
  await page.goto("./");
  await page.getByLabel("Import packet").setInputFiles({
    name: "normalized.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(next)),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
  await expect(page.locator("#review-state")).toContainText("normalization-only stale");
  await expect(page.locator("#review-state")).not.toContainText("valid for current source");
  await expect(page.locator("#review-state")).not.toContainText("Passage:");
  await expect(page.locator("#review-state")).toContainText("changed source is not quoted");
});
