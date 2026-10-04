import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const target = pathToFileURL(resolve("dist/index.html")).href;
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(target);
await page.getByRole("button", { name: "Load synthetic example" }).click();
await page.getByRole("status").filter({ hasText: "Imported" }).waitFor();
await page.getByRole("button", { name: "New packet" }).click();
await page.locator("#builder-sources input").first().fill("memo-1");
await page.locator("#builder-sources input").nth(1).fill("Synthetic refund memo");
await page
  .locator("#builder-sources textarea")
  .first()
  .fill("Refunds are available within 30 days of purchase.");
await page.locator("#builder-claims input").first().fill("c5");
await page.locator("#builder-claims input").nth(1).fill("Refunds last 30 days.");
await page.locator("#builder-claims input").nth(2).fill("memo-1");
await page.locator("#builder-claims input").nth(2).blur();
await page.waitForTimeout(300);
await page.screenshot({ path: "docs/screenshots/app.png", fullPage: true });
await browser.close();
