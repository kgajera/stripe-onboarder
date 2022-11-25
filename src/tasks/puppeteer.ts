import type { Page } from "puppeteer";

export async function waitForNavigation(page: Page) {
    await page.waitForFunction(() => document.readyState === "complete");
    await page.waitForNetworkIdle({ idleTime: 500 });
    await page.waitForFunction(() => document.readyState === "complete");
}