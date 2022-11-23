import "dotenv/config";
import { faker } from "@faker-js/faker";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { BusinessType, onboard, OnboardValues } from "../src/onboard";

if (!process.env["STRIPE_SECRET_KEY"]) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"], {
  apiVersion: "2022-11-15",
});

const describeMatrix = <TParams extends Record<string, any>>(
  fn: (params: TParams) => void,
  input: { [Key in keyof TParams]: TParams[Key][]}
) => {
  const keys = Object.keys(input) as (keyof TParams)[];
  const values = keys.map((key) => input[key]);

  const combinations = values.reduce(
    (acc: any, value: any) => acc.flatMap((x: any) => value.map((y: any) => [...x, y])),
    [[]] as TParams[keyof TParams][]
  );
  throw new Error(JSON.stringify(combinations));

  for (const combination of combinations) {
    const params = keys.reduce((acc, key, index) => {
      acc[key] = combination[index];
      return acc;
    }, {} as TParams);

    describe(
      JSON.stringify(params), 
      { timeout: 60 * 1000 * 3 },
      () => {
        fn(params);
      });
  }
};

describe("onboard", { concurrency: 32 }, () => {
  describeMatrix(
    async ({ 
      business_type, 
      country,
      capabilities
    }) => {
      const account = await createAndOnboardAccount(
        {
          business_type,
          country
        },
        { 
          capabilities 
        }
      );
      await waitForAccountVerification(account.id);
      const paymentIntent = await confirmPayment(account.id);
      assert.deepEqual(paymentIntent.status, "succeeded");
    },
    {
      business_type: ["company", "individual", "non_profit"] as BusinessType[],
      country: ["US", "DK"],
      capabilities: [
        {}, 
        {
          card_payments: { requested: true },
          transfers: { requested: true },
        }
      ],
    }
  );
});

async function createAndOnboardAccount(
  values: Partial<OnboardValues> = {},
  accountOptions: Partial<Stripe.AccountCreateParams> = {}
) {
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    ...accountOptions,
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: "https://stripe.com",
    return_url: "https://stripe.com",
  });

  await onboard({
    headless: false,
    url: accountLink.url,
    values,
  });

  return account;
}

async function waitForAccountVerification(accountId: string, timeout = 180000) {
  const intervalLength = 5000;

  return new Promise((resolve, reject) => {
    let time = 0;

    const interval = setInterval(async () => {
      if (time >= timeout) {
        clearInterval(interval);
        reject();
      }

      const account = await stripe.accounts.retrieve(accountId);

      if (account.charges_enabled) {
        clearInterval(interval);
        resolve(account);
      }

      time += intervalLength;
    }, intervalLength);
  });
}

async function confirmPayment(accountId: string) {
  const paymentMethod = await stripe.paymentMethods.create(
    {
      card: {
        cvc: "123",
        exp_month: 1,
        exp_year: new Date().getFullYear() + 2,
        number: "4242424242424242",
      },
      type: "card",
    },
    {
      stripeAccount: accountId,
    }
  );

  return stripe.paymentIntents.create(
    {
      amount: faker.datatype.number({ min: 100, max: 1000000 }),
      confirm: true,
      currency: "usd",
      payment_method: paymentMethod.id,
    },
    {
      stripeAccount: accountId,
    }
  );
}
