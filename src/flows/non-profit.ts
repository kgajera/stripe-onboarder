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
  fillOutPercentOwnershipConfirmation,
  fillOutJobTitle,
  fillOutProductDescription,
  fillOutPeopleForm,
} from "../tasks/stripe";

import type { FlowContext } from "./context";

export default [
  fillOutTellUsAboutYourBusinessPage,
  fillOutTellUsMoreAboutYourBusinessPage,
  fillOutVerifyYouRepresentThisBusiness,
  fillOutBusinessDirectorsPage,
  fillOutBusinessExecutivesPage,
  fillOutSelectAnAccountForPayoutsPage,
];

async function fillOutTellUsAboutYourBusinessPage(context: FlowContext) {
  await clickSubmitButton(context);
}

async function fillOutTellUsMoreAboutYourBusinessPage(context: FlowContext) {
  await fillOutLegalBusinessName(context);
  await fillOutEmployerIdentificationNumber(context);
  await fillOutRegisteredBusinessAddress(context);
  await fillOutPhoneNumber(context, "company");
  await fillOutIndustry(context);
  await fillOutWebsite(context);
  await fillOutProductDescription(context);

  await clickSubmitButton(context);
}

async function fillOutVerifyYouRepresentThisBusiness(context: FlowContext) {
  await fillOutPersonalName(context);
  await fillOutEmail(context);
  await fillOutJobTitle(context);
  await fillOutDateOfBirth(context);
  await fillOutAddress(context);
  await fillOutPhoneNumber(context, "personal");
  await fillOutLastDigitsOfSocialSecurityNumber(context);
  await fillOutPercentOwnershipConfirmation(context);

  await clickSubmitButton(context);
}

async function fillOutBusinessExecutivesPage(context: FlowContext) {
  await fillOutPeopleForm(context);
}

async function fillOutBusinessDirectorsPage(context: FlowContext) {
  await fillOutPeopleForm(context);
}

async function fillOutSelectAnAccountForPayoutsPage(context: FlowContext) {
  await fillOutPayoutDetails(context);

  await clickSubmitButton(context);
}
