import { Options, oraPromise } from "ora";
import { type Browser, launch, type Page } from "puppeteer";
import type { FlowContext } from "../flows/context";
import type { OnboardOptions, OnboardValues } from "../onboard";
import { waitForNavigation } from "./puppeteer";

export async function fillOutFlow(
    options: OnboardOptions,
    flow: (context: FlowContext) => Promise<void>
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

        await flow(context);

        await clickSubmitButton(context, "requirements-index-done-button");

        await waitForNavigation(page);

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

export async function fillOutPages(
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

export async function fillOutEmail(context: FlowContext) {
    // check if email field is disabled. may occur in test mode.
    const disabledEmailNode = await context.page.$('input[type="email"][disabled]');
    if (disabledEmailNode)
        return;

    await context.page.type("#email", context.values.email);
}

export async function fillOutPhoneNumber(context: FlowContext) {
    const phoneSelectField = await context.page.$('.PhoneInput select');
    if (phoneSelectField) {
        await phoneSelectField.select(context.values.country);
        await context.page.type("#phone_number", context.values.phone);
    } else {
        await context.page.type('input[name="phone"]', context.values.phone);
    }
}

export async function fillOutVerificationCode(context: FlowContext) {
    await context.page.click('button[data-test="test-mode-fill-button"]');
}

export async function fillOutCountry(context: FlowContext) {
    const countrySelectField = await context.page.$('#country');
    if (!countrySelectField) {
        //when capabilities are specified, the country field may not be present.
        return;
    }

    await countrySelectField.select(context.values.country);
}

export async function fillOutBusinessType(context: FlowContext) {
    await context.page.select("#business_type", context.values.business_type);
}

export async function fillOutPersonalName(context: FlowContext) {
    await context.page.type("#first_name", context.values.first_name);
    await context.page.type("#last_name", context.values.last_name);
}

export async function fillOutDateOfBirth(context: FlowContext) {
    await context.page.type(
        'input[name="dob-month"]',
        context.values.date_of_birth.substring(0, 2).replace(/^0/, "")
    );
    await context.page.type(
        'input[name="dob-day"]',
        context.values.date_of_birth.substring(2, 4).replace(/^0/, "")
    );
    await context.page.type(
        'input[name="dob-year"]',
        context.values.date_of_birth.substring(4)
    );
}

export async function fillOutAddress(context: FlowContext) {
    await context.page.type('input[name="address"]', context.values.address.line1);

    if (context.values.address.line2)
        await context.page.type('input[name="address-line2"]', context.values.address.line2);

    await context.page.type('input[name="locality"]', context.values.address.city);

    if (context.values.address.state) {
        const stateSelectField = await context.page.$('select[name="subregion"]');
        if (stateSelectField) {
            //not all countries have states, and therefore do not have a state select field.
            await stateSelectField.select('select[name="subregion"]', context.values.address.state);
        }
    }

    await context.page.type('input[name="zip"]', context.values.address.zip);
}

export async function fillOutLastDigitsOfSocialSecurityNumber(context: FlowContext) {
    const socialSecurityNumberField = await context.page.$('input[name="ssn_last_4"]');
    if (!socialSecurityNumberField) {
        //some countries (like DK) do not have a social security number field.
        return;
    }

    await socialSecurityNumberField.type(context.values.ssn_last_4);
}

export async function fillOutIndustry(context: FlowContext) {
    await context.page.click('button[name="industry"]');
    await context.page.click('.ScrollableMenu li[aria-selected="false"]');
}

export async function fillOutWebsite(context: FlowContext) {
    await context.page.type('*[id="business_profile[url]"]', context.values.company_url);
}

export async function fillOutPayoutDetails(context: FlowContext) {
    if (context.values.routing_number) {
        const routingNumberField = await context.page.$("#routing_number");
        if (routingNumberField) {
            //the routing number field is only present for some countries like the US.
            await routingNumberField.type(context.values.routing_number);
        }
    }

    await context.page.type('*[id="account_numbers[account_number]"]', context.values.account_number);
    await context.page.type('*[id="account_numbers[account_number_validate]"]', context.values.account_number);
}

//data-test="test-mode-fill-button"

export async function clickSubmitButton(context: FlowContext, dataTest?: string) {
    await context.page.click(dataTest ?
        `button[data-test="${dataTest}"]` :
        `button[type="submit"]`);
}

function getOraOptions(options: OnboardOptions, text: string): Options {
    return {
        text: text,
        isSilent: options?.silent ?? true,
        isEnabled: options?.silent ?? true
    };
}