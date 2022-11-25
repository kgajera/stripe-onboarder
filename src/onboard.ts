import { faker } from "@faker-js/faker";
import { clickSubmitButton, fillOutFlow } from "./tasks/stripe";
import allFlows from "./flows";

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