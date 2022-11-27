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
    fillOutWebsite,
    fillOutEmployerIdentificationNumber,
    fillOutLegalBusinessName,
    fillOutRegisteredBusinessAddress,
    fillOutTwentyFivePercentOwnershipConfirmation
} from "../tasks/stripe";

import type { FlowContext } from "./context";

export default [
    fillOutTellUsAboutYourBusinessPage,
    fillOutTellUsMoreAboutYourBusinessPage,
    fillOutVerifyYourPersonalDetailsPage,
    fillOutBusinessExecutivesPage,
    fillOutSelectAnAccountForPayoutsPage
];

async function fillOutTellUsAboutYourBusinessPage(context: FlowContext) {
    await clickSubmitButton(context);
}

async function fillOutTellUsMoreAboutYourBusinessPage(context: FlowContext) {
    await fillOutLegalBusinessName(context);
    await fillOutEmployerIdentificationNumber(context);
    await fillOutRegisteredBusinessAddress(context);
    await fillOutIndustry(context);
    await fillOutWebsite(context);

    await clickSubmitButton(context);
}

async function fillOutVerifyYourPersonalDetailsPage(context: FlowContext) {
    await fillOutPersonalName(context);
    await fillOutEmail(context);
    await fillOutDateOfBirth(context);
    await fillOutAddress(context);
    await fillOutPhoneNumber(context);
    await fillOutLastDigitsOfSocialSecurityNumber(context);
    await fillOutTwentyFivePercentOwnershipConfirmation(context);

    await clickSubmitButton(context);
}

async function fillOutBusinessExecutivesPage(context: FlowContext) {
    //this page only seems to pop up randomly, so we have to check if it is there.
    const isPagePresent = 
        !await context.page.$(".db-ConsumerUIWrapper-right input") &&
        !await context.page.$(".db-ConsumerUIWrapper-right select") &&
        await context.page.$(".db-ConsumerUIWrapper-right button");
    if(!isPagePresent) {
        return;
    }

    const blueButton = await context.page.$(".Button--color--blue button");
    if(!blueButton) {
        throw new Error("Could not find confirmation button.");
    }

    await blueButton.click();
}

async function fillOutSelectAnAccountForPayoutsPage(context: FlowContext) {
    await fillOutPayoutDetails(context);

    await clickSubmitButton(context);
}
