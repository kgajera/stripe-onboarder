#!/usr/bin/env node

import chalk from "chalk";
import { oraPromise } from "ora";
import Stripe from "stripe";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  getDefaultOnboardValues,
  onboard,
  OnboardOptions,
  OnboardValues,
} from "./onboard";

type OnboardCommandArguments = OnboardOptions &
  OnboardValues & { secretKey?: string };

yargs(hideBin(process.argv))
  .scriptName("stripe-onboarder")
  .command<OnboardCommandArguments>(
    "onboard [url]",
    "Automate onboarding a Stripe Connect Express account using Puppeteer",
    (yargs) => {
      const defaults = getDefaultOnboardValues();

      yargs
        .positional("url", {
          type: "string",
          describe:
            "The URL of an Account Link object. If not given, a new Express Account and Account Link can be created.",
        })
        .env("STRIPE")
        .options({
          account_number: {
            type: "string",
            default: defaults.account_number,
          },
          ["address.line1"]: {
            type: "string",
            default: defaults.address.line1,
          },
          ["address.line2"]: {
            type: "string",
            default: defaults.address.line2,
          },
          ["address.city"]: {
            type: "string",
            default: defaults.address.city,
          },
          ["address.state"]: {
            type: "string",
            default: defaults.address.state,
          },
          ["address.zip"]: {
            type: "string",
            default: defaults.address.zip,
          },
          business_type: {
            type: "string",
            default: defaults.business_type,
          },
          company_name: {
            type: "string",
          },
          company_phone: {
            type: "string",
            default: defaults.company_phone,
          },
          company_tax_id: {
            type: "string",
            default: defaults.company_tax_id,
          },
          company_url: {
            type: "string",
          },
          date_of_birth: {
            type: "string",
            default: defaults.date_of_birth,
          },
          email: {
            type: "string",
          },
          first_name: {
            type: "string",
          },
          headless: {
            type: "boolean",
            default: true,
          },
          id_number: {
            type: "string",
            default: defaults.id_number,
          },
          last_name: {
            type: "string",
          },
          phone: {
            type: "string",
            default: defaults.phone,
          },
          routing_number: {
            type: "string",
            default: defaults.routing_number,
          },
          ssn_last_4: {
            type: "string",
            default: defaults.ssn_last_4,
          },
          title: {
            type: "string",
            default: defaults.title,
          },
        })
        .version(false);
    },
    async function (argv) {
      let url = argv.url;

      // If url is not given, create an account and account link
      if (!url?.length) {
        const stripeSecretKey = await getStripeSecretKey(argv);

        if (!stripeSecretKey) {
          return;
        }

        const { url: accountLinkUrl } = await oraPromise(
          async () => createStripeAccountAndAccountLink(stripeSecretKey),
          {
            text: "Creating connect Account and Account Link",
            successText: ({ id }) => `Created connect account: ${id}`,
          }
        );

        url = accountLinkUrl;
      }

      await onboard({
        headless: argv.headless ?? true,
        silent: false,
        url,
        values: argv,
      });

      process.exit(0);
    }
  )
  .demandCommand()
  .strictCommands()
  .recommendCommands()
  .help()
  .fail((message: string, error: Error, argv: yargs.Argv): void => {
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      message = "Invalid Stripe API key provided";
    } else if (message) {
      argv.showHelp("error");
    } else if (error.message) {
      message = error.message;
    }

    console.error(chalk.red(`\n${message}\n`));
    process.exit(1);
  })
  .parse();

/**
 * Creates an Express account and account link for onboarding
 *
 * @param stripeSecretKey API key to authenticate with Stripe client
 */
async function createStripeAccountAndAccountLink(
  stripeSecretKey: string
): Promise<Pick<Stripe.Account, "id"> & Pick<Stripe.AccountLink, "url">> {
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2022-11-15",
  });

  const account = await stripe.accounts.create({ type: "express" });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: "https://stripe.com",
    return_url: "https://stripe.com",
  });

  return {
    id: account.id,
    url: accountLink.url,
  };
}

/**
 * Get the Stripe secret API key from an environment variable or prompt
 */
async function getStripeSecretKey(
  argv: yargs.ArgumentsCamelCase<OnboardCommandArguments>
) {
  let stripeSecretKey = argv.secretKey;

  if (!stripeSecretKey) {
    console.log(
      chalk.gray(
        "The `url` argument was omitted so we will create a new Express account and onboarding link.\n"
      )
    );

    const { default: inquirer } = await import("inquirer");
    const answers = await inquirer.prompt([
      {
        message: "Enter your Stripe secret API key:",
        name: "stripeSecretKey",
        type: "password",
      },
    ]);

    stripeSecretKey = answers.stripeSecretKey;
  }

  return stripeSecretKey;
}
