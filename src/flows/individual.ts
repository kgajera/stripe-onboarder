import { 
    clickSubmitButton,
    clickSubmitButton as clickSubmitEverythingButton,
    fillOutAccountNumber,
    fillOutAddress,
    fillOutBusinessType,
    fillOutCountry,
    fillOutDateOfBirth,
    fillOutEmail, 
    fillOutIndustry, 
    fillOutLastDigitsOfSocialSecurityNumber, 
    fillOutPersonalName, 
    fillOutPhoneNumber, 
    fillOutRoutingNumber, 
    fillOutVerificationCode,
    fillOutWebsite
} from "../tasks/stripe";

import type { FlowContext } from "./context";

export default async function fillOutIndividualFlow(context: FlowContext) {
    await fillOutGetPaidByPage(context);
    await fillOutVerificationCodePage(context);
    await fillOutTellUsAboutYourBusinessPage(context);
    await fillOutVerifyYourPersonalDetailsPage(context);
    await fillOutProfessionalDetailsPage(context);
    await fillOutSelectAnAccountForPayoutsPage(context);
    await fillOutReviewAndSubmitPage(context);
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

async function fillOutVerifyYourPersonalDetailsPage(context: FlowContext) {
    await fillOutPersonalName(context);
    await fillOutDateOfBirth(context);
    await fillOutAddress(context);
    await fillOutPhoneNumber(context);
    await fillOutLastDigitsOfSocialSecurityNumber(context);
}

async function fillOutProfessionalDetailsPage(context: FlowContext) {
    await fillOutIndustry(context);
    await fillOutWebsite(context);
}

async function fillOutSelectAnAccountForPayoutsPage(context: FlowContext) {
    await fillOutRoutingNumber(context);
    await fillOutAccountNumber(context);
}

async function fillOutReviewAndSubmitPage(context: FlowContext) {
    await clickSubmitEverythingButton(context);
}

