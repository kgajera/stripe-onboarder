import { faker } from "@faker-js/faker";
import ora, { oraPromise } from "ora";
import { Browser, Page, launch } from "puppeteer";

export type BusinessType = "company" | "non_profit" | "individual";

type PageTask = (page: EnhancedPage, values: OnboardValues) => Promise<void>;

type EnhancedPage = Pick<
  Page,
  | "click"
  | "evaluate"
  | "select"
  | "type"
  | "waitForNavigation"
  | "waitForNetworkIdle"
> & {
  task: (promise: PageTask) => Promise<void>;
  tasks: (...promises: (PageTask | false)[]) => Promise<void>;
};

export interface OnboardValues {
  account_number: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  business_type: BusinessType;
  company_name: string;
  company_phone: string;
  company_tax_id: string;
  company_url: string;
  date_of_birth: string;
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

  const oraOptions = (text: string) => ({
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
    silent,
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
  options: { silent: boolean; values: OnboardValues }
): EnhancedPage {
  const enhancedPage: EnhancedPage = {
    click: async (selector: string) => {
      try {
        await page.waitForSelector(selector, { timeout: 100 });
        await page.click(selector);
      } catch (error) {
        // Error will be thrown if selector is not found
      }
    },
    evaluate: (...params) => page.evaluate(...params),
    select: async (selector: string, ...value: string[]) => {
      try {
        const element = await page.waitForSelector(selector, { timeout: 100 });
        return (await element?.select(...value)) || [];
      } catch (error) {
        // Error will be thrown if selector is not found
        return [];
      }
    },
    task: async (promise: PageTask) => {
      const navOra = ora("Navigating...").start();
      await page.waitForNetworkIdle({ idleTime: 500 });
      navOra.stop();

      const headingElement = await page.waitForSelector("h1");
      const heading = await headingElement?.evaluate((el) => el.textContent);

      await oraPromise(async () => promise(enhancedPage, options.values), {
        isSilent: options.silent,
        text: heading?.trim() ?? "",
      });
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
        const element = await page.waitForSelector(selector, { timeout: 100 });
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

/**
 * Submits the "Set up payments" form
 */
async function submitSetUpPayments(page: EnhancedPage, values: OnboardValues) {
  // Business type when using OAuth
  if (values.business_type === "company") {
    await page.click("#radio2");
  } else if (values.business_type === "individual") {
    await page.click("#radio1");
  } else if (values.business_type === "non_profit") {
    await page.click("#radio3");
  }

  await page.type("#phone_number", values.phone);
  await page.type("#email", values.email);
  await page.click('button[type="submit"]');

  await page.waitForNetworkIdle();
  await page.click('[data-test="test-mode-fill-button"]');
}

/**
 * Submits the "Verify you represent this business" form
 */
async function submitBusinessRepForm(
  page: EnhancedPage,
  values: OnboardValues
) {
  await page.type("#first_name", values.first_name);
  await page.type("#last_name", values.last_name);
  await page.type("#email", values.email);

  if (values.business_type !== "individual") {
    await page.type('[id="relationship[title]"]', values.title);
  }

  await typeDateOfBirth(page, values);
  await typeAddress(page, values);

  await page.type("#phone", values.phone); // Used in non-OAuth flow
  await page.type("#phone_number", values.phone); // Used in OAuth flow
  await page.type("#ssn_last_4", values.ssn_last_4);
  await page.type("#id_number", values.id_number);

  if (values.business_type !== "individual") {
    await page.click('[name="relationship.owner"]');
  }

  await page.click('button[type="submit"]');
}

/**
 * Submits the "Tell us about your business" form
 */
async function submitBusinessType(page: EnhancedPage, values: OnboardValues) {
  await page.select("#business_type", values.business_type);
  await page.click('button[type="submit"]');
}

/**
 * Submits the "Let's review your details" form
 */
async function submitReviewDetails(page: EnhancedPage) {
  await page.click('[data-test="requirements-index-done-button"]');

  await page.evaluate(() => {
    (document.activeElement as HTMLButtonElement)?.click();
  });

  await page.waitForNavigation();
}

/**
 * Submits the "Tell us more about your business" form
 */
async function submitTellUsAboutBusiness(
  page: EnhancedPage,
  values: OnboardValues
) {
  if (values.business_type !== "individual") {
    await page.type('[id="company[name]"]', values.company_name);
    await page.type('[id="company[tax_id]"]', values.company_tax_id);
    await typeAddress(page, values);
    await page.type('[id="company[phone]"]', values.company_phone);
  }

  await page.click('button[name="industry"]');
  await page.click('.ScrollableMenu li[aria-selected="false"]');

  await page.type('[id="business_profile[url]"]', values.company_url);
  await page.click('button[type="submit"]');
}

/**
 * Submits the "Select an account for payouts" form
 */
async function submitPayoutBankAccount(
  page: EnhancedPage,
  values: OnboardValues
) {
  await page.type("#routing_number", values.routing_number);

  await page.type(
    '[id="account_numbers[account_number]"]',
    values.account_number
  );
  await page.type(
    '[id="account_numbers[account_number_validate]"]',
    values.account_number
  );

  await page.click('button[type="submit"]');
}

/**
 * Utility function to fill out address form fields
 */
async function typeAddress(page: EnhancedPage, values: OnboardValues) {
  await page.type('[name="address"]', values.address.line1);

  if (values.address.line2?.length) {
    await page.type('[name="address-line2"]', values.address.line2);
  }

  await page.type('[name="locality"]', values.address.city);
  await page.select("#subregion", values.address.state);
  await page.type('[name="zip"]', values.address.zip);
}

/**
 * Utility function to fill out date of birth form fields
 */
async function typeDateOfBirth(page: EnhancedPage, values: OnboardValues) {
  await page.type("#dob", values.date_of_birth);

  // Randomly, the date field is sometimes displayed as separate select fields
  await page.select(
    "#dob-month",
    values.date_of_birth.substring(0, 2).replace(/^0/, "")
  );
  await page.select(
    "#dob-day",
    values.date_of_birth.substring(2, 4).replace(/^0/, "")
  );
  await page.select("#dob-year", values.date_of_birth.substring(4));
}
