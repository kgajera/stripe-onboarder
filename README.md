# Stripe Onboarder

[![npm version](https://badge.fury.io/js/stripe-onboarder.svg)](https://badge.fury.io/js/stripe-onboarder)
[![Test](https://github.com/kgajera/stripe-onboarder/actions/workflows/test.yml/badge.svg)](https://github.com/kgajera/stripe-onboarder/actions/workflows/test.yml)

Automate the onboarding of Stripe [Express](https://stripe.com/docs/connect/express-accounts) accounts using [Puppeteer](https://pptr.dev). This is intended to be used in Stripe's test mode to onboard verified Connect accounts without having to manually complete the onboarding process.

![stripe-onboarder](https://user-images.githubusercontent.com/1087679/194986317-cc2117ec-0328-430b-94b7-7b9d6e928ab0.gif)

Onboarding accounts with the [`card_payments`](https://stripe.com/docs/api/accounts/object#account_object-capabilities-card_payments) and [`transfers`](https://stripe.com/docs/api/accounts/object#account_object-capabilities-transfers) capabilities are supported. Please open an [issue](https://github.com/kgajera/stripe-onboarder/issues/new) if the onboarder is not working with your account's requested capabilities.

## Installation

Install the package with:

```shell
npm install stripe-onboarder
# or
yarn add stripe-onboarder
```

## CLI Usage

Onboard an Express account using the following command:

```shell
stripe-onboarder onboard [url]
```

### Arguments

| Name    | Description                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[url]` | Optional Account Link [`url`](https://stripe.com/docs/api/account_links/object#account_link_object-url) or an [OAuth link](https://stripe.com/docs/connect/oauth-express-accounts#step-1:-you-provide-the-oauth-link). If omitted, a new Express Account and Account Link can be created by providing your Stripe secret API key via the `STRIPE_SECRET_KEY` environment variable or when prompted by the CLI. |

### Options

Default values are provided for all options that will allow the Express account to pass verifications: https://stripe.com/docs/connect/testing

| Name                                                                                                                                                | Default                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`--account_number`](https://stripe.com/docs/api/external_account_bank_accounts/create#account_create_bank_account-external_account-account_number) | "000123456789"                                                     |
| [`--address.line1`](https://stripe.com/docs/api/persons/create#create_person-address-line1)                                                         | "address_full_match"                                               |
| [`--address.line2`](https://stripe.com/docs/api/persons/create#create_person-address-line2)                                                         |                                                                    |
| [`--address.city`](https://stripe.com/docs/api/persons/create#create_person-address-city)                                                           | "Beverly Hills"                                                    |
| [`--address.state`](https://stripe.com/docs/api/persons/create#create_person-address-state)                                                         | "CA"                                                               |
| [`--address.zip`](https://stripe.com/docs/api/persons/create#create_person-address-postal_code)                                                     | "90210"                                                            |
| [`--business_type`](https://stripe.com/docs/api/accounts/create#create_account-business_type)                                                       | "company"                                                          |
| [`--company_name`](https://stripe.com/docs/api/accounts/create#create_account-company-name)                                                         | [Random company name](https://fakerjs.dev/api/company.html#name)   |
| [`--company_phone`](https://stripe.com/docs/api/accounts/create#create_account-company-phone)                                                       | "0000000000"                                                       |
| [`--company_tax_id`](https://stripe.com/docs/api/accounts/create#create_account-company-tax_id)                                                     | "000000000"                                                        |
| [`--company_url`](https://stripe.com/docs/api/accounts/create#create_account-business_profile-url)                                                  | [Random URL](https://fakerjs.dev/api/internet.html#url)            |
| [`--country`](https://stripe.com/docs/api/accounts/create#create_account-country)                                                                   | "US"                                                               |
| [`--date_of_birth`](https://stripe.com/docs/api/persons/create#create_person-dob)                                                                   | "01011901"                                                         |
| [`--email`](https://stripe.com/docs/api/persons/create#create_person-email)                                                                         | [Random email](https://fakerjs.dev/api/internet.html#exampleemail) |
| [`--first_name`](https://stripe.com/docs/api/persons/create#create_person-first_name)                                                               | [Random first name](https://fakerjs.dev/api/name.html#firstname)   |
| [`--headless`](https://pptr.dev/api/puppeteer.browserlaunchargumentoptions.headless)                                                                | `true`                                                             |
| [`--id_number`](https://stripe.com/docs/api/persons/create#create_person-id_number)                                                                 | "000000000"                                                        |
| [`--last_name`](https://stripe.com/docs/api/persons/create#create_person-last_name)                                                                 | [Random last name](https://fakerjs.dev/api/name.html#lastname)     |
| [`--phone`](https://stripe.com/docs/api/persons/create#create_person-phone)                                                                         | "0000000000"                                                       |
| [`--routing_number`](https://stripe.com/docs/api/external_account_bank_accounts/create#account_create_bank_account-external_account-routing_number) | "110000000"                                                        |
| [`--ssn_last_4`](https://stripe.com/docs/api/persons/create#create_person-ssn_last_4)                                                               | "0000"                                                             |
| [`--title`](https://stripe.com/docs/api/persons/create#create_person-relationship-title)                                                            | [Random job title](https://fakerjs.dev/api/name.html#jobtitle)     |

## Programmatic Usage

```ts
import { onboard } from "stripe-onboarder";

const account = await stripe.accounts.create({ type: "express" });

const accountLink = await stripe.accountLinks.create({
  account: account.id,
  type: "account_onboarding",
});

await onboard({
  headless: false, // Boolean flag for Puppeteer to run browser in headless mode. Defaults to true.
  url: accountLink.url, // Account Link URL for onboarding
  values: {}, // Optional object of onboarding form values to override default values
});
```

> **Note**
> Immediately after the promise returned by the `onboard` function is resolved, the Connect account's status will be "Pending" which means the account is still being verified by Stripe. This can take up to a few minutes to complete. You can poll [retrieving the account](https://stripe.com/docs/api/accounts/retrieve) to check if the account has [`charges_enabled`](https://stripe.com/docs/api/accounts/object#account_object-charges_enabled) and [`payouts_enabled`](https://stripe.com/docs/api/accounts/object#account_object-payouts_enabled).

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.MD) to learn about contributing to this project.
