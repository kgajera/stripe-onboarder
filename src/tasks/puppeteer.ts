import type { Page } from "puppeteer";

export async function waitForNavigation(page: Page) {
  await page.waitForNetworkIdle({ idleTime: 3000 });
}
