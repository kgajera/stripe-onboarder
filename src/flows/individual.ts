import { waitForNavigation } from "../tasks/puppeteer";
import {
    clickSubmitButton,
    fillOutAddress,
    fillOutBusinessType,
    fillOutCountry,
    fillOutDateOfBirth,
    fillOutEmail,
    fillOutIndustry,
    fillOutLastDigitsOfSocialSecurityNumber,
    fillOutPages,
    fillOutPersonalName,
    fillOutPhoneNumber,
    fillOutPayoutDetails,
    fillOutVerificationCode,
    fillOutWebsite
} from "../tasks/stripe";

import type { FlowContext } from "./context";

export default async function fillOutIndividualFlow(context: FlowContext) {
    await fillOutPages(
        context,
        [
            fillOutGetPaidByPage,
            fillOutVerificationCodePage,
            fillOutTellUsAboutYourBusinessPage,
            fillOutVerifyYourPersonalDetailsPage,
            fillOutProfessionalDetailsPage,
            fillOutSelectAnAccountForPayoutsPage
        ]);
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

    await clickSubmitButton(context);
}

async function fillOutVerifyYourPersonalDetailsPage(context: FlowContext) {
    await fillOutPersonalName(context);
    await fillOutEmail(context);
    await fillOutDateOfBirth(context);
    await fillOutAddress(context);
    await fillOutPhoneNumber(context);
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
