import { faker } from "@faker-js/faker";
import { clickSubmitButton, fillOutBusinessType, fillOutCountry, fillOutEmail, fillOutPhoneNumber, fillOutVerificationCode } from "./tasks/stripe";
import allFlows from "./flows";
import { Options, oraPromise } from "ora";
import { type Browser, launch, type Page } from "puppeteer";
import type { FlowContext } from "./flows/context";
import { waitForNavigation } from "./tasks/puppeteer";

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
  routing_number?: string;
  ssn_last_4: string;
  title: string;
}

export interface OnboardOptions {
  headless?: boolean;
  silent?: boolean;
  values?: Partial<OnboardValues>;
  url: string;
  debug?: boolean;
}

export async function onboard(options: OnboardOptions) {
  if(options.headless === undefined)
    options.headless = true;

  if(options.silent === undefined)
    options.silent = true;

  // Merge default values and given values to use for onboarding forms
  const values = {
    ...getDefaultOnboardValues(options.values?.country),
    ...options.values
  };

  await fillOutFlow(
    {
      ...options,
      values
    },
    allFlows[values.business_type]);
}

/**
 * Default values that will pass verification: https://stripe.com/docs/connect/testing
 */
export function getDefaultOnboardValues(country = "US"): OnboardValues {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  const defaultValues: OnboardValues = {
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

  switch(country) {
    case "DK":
      defaultValues.phone = "00000000";
      defaultValues.company_phone = "00000000";
      defaultValues.address.zip = "8000";
      defaultValues.address.city = "Aarhus";
      defaultValues.account_number = "DK5000400440116243";

      delete defaultValues.address.state;
      delete defaultValues.routing_number;

      break;
  }

  return defaultValues;
}

async function fillOutFlow(
    options: OnboardOptions,
    pageTasks: Array<(context: FlowContext) => Promise<void>>
) {
    if (!options.values) {
        throw new Error("Values must be set.");
    }

    const browser = await oraPromise<Browser>(
        async () => await launch({
            headless: options.headless ?? true,
            defaultViewport: {
                width: 900,
                height: 1000
            },
            slowMo: 0,
            args: ['--lang=en-US,en']
        }),
        getOraOptions(options, `Launching${options.headless ? " headless" : ""} browser`)
    );

    const closeBrowser = async () =>
        await oraPromise(
            async () => await browser.close(),
            getOraOptions(options, "Closing browser"));

    const page = await oraPromise<Page>(
        async () => {
            const page = await browser.newPage();

            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US'
            });

            await page.goto(options.url);

            return page;
        },
        getOraOptions(options, "Navigating to Stripe"));

    try {

        const context = {
            page,
            options,
            values: options.values as OnboardValues
        };

        await fillOutPages(context, [
          fillOutGetPaidByPage,
          fillOutVerificationCodePage,
          fillOutTellUsAboutYourBusinessPage,
          ...pageTasks,
          fillOutSummaryPage
        ]);

        if (options.debug) {
            await closeBrowser();
        }
    } catch (e: unknown) {
        if (options.debug) {
            await page.evaluate((e) => window.alert(e), (e as object).toString());
        } else {
            await closeBrowser();
            throw e;
        }
    }
}

async function fillOutSummaryPage(context: FlowContext) {
  await clickSubmitButton(context, "requirements-index-done-button");

  const dialogConfirmButton = await context.page.$('*[role="dialog"] button.Button--color--blue');
  if(dialogConfirmButton) {
    //sometimes, a dialog pops up with a confirmation because the information is still validated, asking if we want to continue anyway.
    await dialogConfirmButton.click();
  }
}

async function fillOutPages(
    context: FlowContext,
    pageTasks: Array<(context: FlowContext) => Promise<void>>
) {
    for (const task of pageTasks) {
        await waitForNavigation(context.page);

        const headingElement = await context.page.$("h1");
        const headingText = await headingElement?.evaluate((el) => el.textContent);

        await oraPromise(
            async () => {
                await task(context);
            },
            getOraOptions(context.options, headingText?.trim() ?? "")
        );

        const validationErrors = await context.page.$$('*[role="alert"]');
        if (validationErrors.length > 0) {
            const errorMessages = await Promise.all(
                validationErrors.map(async (el) =>
                    await el.evaluate(e => e.textContent)));
            throw new Error(`Validation errors found. ${errorMessages.join(". ")}`);
        }

        await oraPromise(
            async () => await waitForNavigation(context.page),
            getOraOptions(context.options, "Navigating..."));
    }
}

async function fillOutGetPaidByPage(context: FlowContext) {
    await fillOutEmail(context);
    await fillOutPhoneNumber(context);

    await clickSubmitButton(context);
}

async function fillOutVerificationCodePage(context: FlowContext) {
    await fillOutVerificationCode(context);
}

async function fillOutTellUsAboutYourBusinessPage(context: FlowContext) {
    await fillOutCountry(context);
    await fillOutBusinessType(context);
}

function getOraOptions(options: OnboardOptions, text: string): Options {
    return {
        text: text,
        isSilent: options?.silent ?? true,
        isEnabled: options?.silent ?? true
    };
}