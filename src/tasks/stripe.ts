import type { FlowContext } from "../flows/context";

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

export async function fillOutTwentyFivePercentOwnershipConfirmation(context: FlowContext) {
    const ownershipConfirmationCheckbox = await context.page.$('input[type="checkbox"][name="relationship.owner"]');
    if(!ownershipConfirmationCheckbox) {
        //this ownership confirmation checkbox is only present for the "business" type in some countries.
        return;
    }

    await ownershipConfirmationCheckbox.click();
}

export async function fillOutLegalBusinessName(context: FlowContext) {
    await context.page.type('*[id="company[name]"]', context.values.company_name);
}

export async function fillOutEmployerIdentificationNumber(context: FlowContext) {
    await context.page.type('*[id="company[tax_id]"]', context.values.company_tax_id);
}

export async function fillOutRegisteredBusinessAddress(context: FlowContext) {
    await fillOutAddress(context);
}

export async function clickSubmitButton(context: FlowContext, dataTest?: string) {
    await context.page.click(dataTest ?
        `button[data-test="${dataTest}"]` :
        `button[type="submit"]`);
}