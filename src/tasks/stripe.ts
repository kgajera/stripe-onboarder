import { Options, oraPromise } from "ora";
import type { FlowContext } from "../flows/context";
import { waitForNavigation } from "./puppeteer";

export async function fillOutPages(
    context: FlowContext,
    ...pageTasks: Array<(context: FlowContext) => Promise<void>>
) {
    for(const task of pageTasks) {
        const headingElement = await context.page.waitForSelector("h1", { timeout: 100 });
        const headingText = await headingElement?.evaluate((el) => el.textContent);

        await oraPromise(
            async () => await task(context),
            getOraOptions(headingText?.trim() ?? "")
        );
    }
}

export async function fillOutEmail(context: FlowContext) {
    // check if email field is disabled. may occur in test mode.
    const disabledEmailNode = await context.page.$('input[type="email"][disabled]');
    if(disabledEmailNode)
        return;

    await context.page.type("#email", context.values.email);
}

export async function fillOutPhoneNumber(context: FlowContext) {
    const phoneSelectField = await context.page.$('.PhoneInput select');
    if(phoneSelectField) {
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
    await context.page.select("#country", context.values.country);
}

export async function fillOutBusinessType(context: FlowContext) {
    await context.page.select("#business_type", context.values.business_type);
}

export async function fillOutPersonalName(context: FlowContext) {
    await context.page.type("#first_name", context.values.first_name);
    await context.page.type("#last_name", context.values.last_name);
}

export async function fillOutDateOfBirth(context: FlowContext) {
    await context.page.select(
      "#dob-month",
      context.values.date_of_birth.substring(0, 2).replace(/^0/, "")
    );
    await context.page.select(
      "#dob-day",
      context.values.date_of_birth.substring(2, 4).replace(/^0/, "")
    );
    await context.page.select("#dob-year", context.values.date_of_birth.substring(4));
}

export async function fillOutAddress(context: FlowContext) {
    await context.page.type("input[name='address']", context.values.address.line1);

    if(context.values.address.line2)
        await context.page.type("input[name='address-line2']", context.values.address.line2);

    await context.page.type("input[name='locality']", context.values.address.city);

    if(context.values.address.state)
        await context.page.select("select[name='subregion']", context.values.address.state);
}

export async function fillOutLastDigitsOfSocialSecurityNumber(context: FlowContext) {
    await context.page.type("#ssn_last_4", context.values.ssn_last_4);
}

export async function fillOutIndustry(context: FlowContext) {
    await context.page.click('button[name="industry"]');
    await context.page.click('.ScrollableMenu li[aria-selected="false"]');
}

export async function fillOutWebsite(context: FlowContext) {
    await context.page.type("#business_profile[url]", context.values.company_url);
}

export async function fillOutRoutingNumber(context: FlowContext) {
    await context.page.type("#routing_number", context.values.routing_number);
}

export async function fillOutAccountNumber(context: FlowContext) {
    await context.page.type("#account_numbers[account_number]", context.values.account_number);
    await context.page.type("#account_numbers[account_number_validate]", context.values.account_number);
}

export async function clickSubmitButton(context: FlowContext) {
    await context.page.click('button[type="submit"]');

    await oraPromise(
        async () => await waitForNavigation(context.page),
        getOraOptions("Navigating..."));
}

function getOraOptions(text: string): Options {
    return {
        text: text,
        isSilent: true
    };
}