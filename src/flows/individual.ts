import {
    clickSubmitButton,
    fillOutAddress,
    fillOutDateOfBirth,
    fillOutEmail,
    fillOutIndustry,
    fillOutLastDigitsOfSocialSecurityNumber,
    fillOutPersonalName,
    fillOutPhoneNumber,
    fillOutPayoutDetails,
    fillOutWebsite
} from "../tasks/stripe";

import type { FlowContext } from "./context";

export default [
    fillOutTellUsAboutYourBusinessPage,
    fillOutVerifyYourPersonalDetailsPage,
    fillOutProfessionalDetailsPage,
    fillOutSelectAnAccountForPayoutsPage
];

async function fillOutTellUsAboutYourBusinessPage(context: FlowContext) {
    await clickSubmitButton(context);
}

async function fillOutVerifyYourPersonalDetailsPage(context: FlowContext) {
    await fillOutPersonalName(context);
    await fillOutEmail(context);
    await fillOutDateOfBirth(context);
    await fillOutAddress(context);
    await fillOutPhoneNumber(context, "personal");
    await fillOutLastDigitsOfSocialSecurityNumber(context);

    await clickSubmitButton(context);
}

async function fillOutProfessionalDetailsPage(context: FlowContext) {
    await fillOutIndustry(context);
    await fillOutWebsite(context);

    await clickSubmitButton(context);
}

async function fillOutSelectAnAccountForPayoutsPage(context: FlowContext) {
    await fillOutPayoutDetails(context);

    await clickSubmitButton(context);
}
