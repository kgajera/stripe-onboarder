import { faker } from "@faker-js/faker";
import ora, { Options, oraPromise } from "ora";
import { Browser, Page, launch } from "puppeteer";
export type BusinessType = "company" | "non_profit" | "individual";

export interface OnboardValues {
  account_number: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    zip: string;
  };
  business_type: BusinessType;
  company_name: string;
  company_phone: string;
  company_tax_id: string;
  company_url: string;
  date_of_birth: string;
  country: string;
  email: string;
  first_name: string;
  id_number: string;
  last_name: string;
  phone: string;
  routing_number: string;
  ssn_last_4: string;
  title: string;
}
export interface OnboardOptions {
  headless?: boolean;
  silent?: boolean;
  values?: Partial<OnboardValues>;
  url: string;
}
export async function onboard({
  headless = true,
  silent = true,
  url,
  values: customValues,
}: OnboardOptions) {
  // Merge default values and given values to use for onboarding forms
  const values: OnboardValues = Object.assign(
    getDefaultOnboardValues(),
    customValues
  );
  const oraOptions = (text: string): Options => ({
    isSilent: silent,
    text,
  });

  const browser = await oraPromise<Browser>(
    async () => launch({ headless }),
    oraOptions(`Launching${headless ? " headless" : ""} browser`)
  );

  const page = await oraPromise<Page>(async () => {
    const page = await browser.newPage();
    await page.goto(url);
    return page;
  }, oraOptions("Navigating to Stripe"));

  const enhancedPage = enhancePage(page, {
    oraOptions,
    values,
  });

  /**
   * Fill out all onboarding forms
   */
  await enhancedPage.tasks(
    submitSetUpPayments,
    submitBusinessType,
    values.business_type !== "individual" && submitTellUsAboutBusiness,
    submitBusinessRepForm,
    values.business_type === "individual" && submitTellUsAboutBusiness,
    submitPayoutBankAccount,
    submitReviewDetails
  );

  await oraPromise(async () => browser.close(), oraOptions("Closing browser"));
}

/**
 * Subset of Page methods that are overridden to wait for a selector to
 * be available before performing the action.
 */
function enhancePage(
  page: Page,
  {
    oraOptions,
    values,
  }: { oraOptions: (text: string) => Options; values: OnboardValues }
): EnhancedPage {
  const enhancedPage: EnhancedPage = {
    click: async (selector: string) => {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.click(selector);
      } catch (error) {
        // Error will be thrown if selector is not found
      }
    },
    evaluate: (...params) => page.evaluate(...params),
    keyboard: page.keyboard,
    select: async (selector: string, ...value: string[]) => {
      try {
        const element = await page.waitForSelector(selector, { timeout: 10000 });
        return (await element?.select(...value)) || [];
      } catch (error) {
        // Error will be thrown if selector is not found
        return [];
      }
    },
    task: async (promise: PageTask) => {
      const navOra = ora(oraOptions("Navigating...")).start();
      await page.waitForNetworkIdle({ idleTime: 500 });
      navOra.stop();

      const headingElement = await page.waitForSelector("h1", { timeout: 10000 });
      const heading = await headingElement?.evaluate((el) => el.textContent);
      await oraPromise(
        async () => promise(enhancedPage, values),
        oraOptions(heading?.trim() ?? "")
      );
    },
    tasks: async (...promises: (PageTask | false)[]) => {
      for (const promise of promises) {
        if (promise) {
          await enhancedPage.task(promise);
        }
      }
    },
    type: async (selector: string, value: string) => {
      try {
        const element = await page.waitForSelector(selector, { timeout: 10000 });
        await element?.click({ clickCount: 3 });
        await element?.type(value);
      } catch (error) {
        // Error will be thrown if selector is not found
      }
    },
    waitForNavigation: async () => page.waitForNavigation(),
    waitForNetworkIdle: async () => page.waitForNetworkIdle(),
  };

  return enhancedPage;
}
/**
 * Default values that will pass verification: https://stripe.com/docs/connect/testing
 */
export function getDefaultOnboardValues(): OnboardValues {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  return {
    account_number: "000123456789",
    address: {
      line1: "address_full_match",
      line2: "",
      city: "Beverly Hills",
      state: "CA",
      zip: "90210",
    },
    country: "US",
    business_type: "company",
    company_name: faker.company.name(),
    company_phone: "0000000000",
    company_tax_id: "000000000",
    company_url: faker.internet.url(),
    date_of_birth: "01011901",
    email: faker.internet.exampleEmail(firstName, lastName),
    first_name: firstName,
    id_number: "000000000",
    last_name: lastName,
    phone: "0000000000",
    routing_number: "110000000",
    ssn_last_4: "0000",
    title: faker.name.jobTitle(),
  };
}