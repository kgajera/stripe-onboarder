import "dotenv/config";
import { faker } from "@faker-js/faker";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { Sema } from 'async-sema';
import { BusinessType, getDefaultOnboardValues, onboard, OnboardValues } from "../src/onboard";

if (!process.env["STRIPE_SECRET_KEY"]) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"], {
  apiVersion: "2022-11-15",
});

const itMatrix = <TParams extends Record<string, unknown>>(
  fn: (params: TParams) => Promise<void>,
  input: { [Key in keyof TParams]: TParams[Key][]}
) => {
  const keys = Object.keys(input) as (keyof TParams)[];
  const values = keys.map((key) => input[key]);

  function cartesianProduct<T>(...allEntries: T[][]): T[][] {
    return allEntries.reduce<T[][]>(
      (results, entries) =>
        results
          .map(result => entries.map(entry => [...result, entry] ))
          .reduce((subResults, result) => [...subResults, ...result]   , []), 
      [[]]
    )
  }

  const combinations = cartesianProduct(...values);

  for (const combination of combinations) {
    const params = keys.reduce((acc, key, index) => {
      const value = combination[index];
      if(value) {
        acc[key] = value;
      }
      return acc;
    }, {} as TParams);

    it(
      JSON.stringify(params), 
      { timeout: 60 * 1000 * 3 },
      async () => {
        await fn(params);
      });
  }
};

describe("onboard", { concurrency: 32 }, () => {
  itMatrix(
    async ({ 
      business_type, 
      country,
      capabilities
    }) => {
      const countrySpecificOnboardValues = getDefaultOnboardValues();

      switch(country) {
        case "US":
          break;

        case "DK":
          countrySpecificOnboardValues.phone = "00000000";
          countrySpecificOnboardValues.company_phone = "00000000";
          countrySpecificOnboardValues.address.zip = "8000";
          countrySpecificOnboardValues.address.city = "Aarhus";
          break;

        default:
          throw new Error(`Can't infer test phone number for current country: ${country}`);
      }

      const account = await createAndOnboardAccount(
        {
          ...countrySpecificOnboardValues,
          business_type,
          country
        },
        { 
          capabilities 
        }
      );
      // await waitForAccountVerification(account.id);
      // const paymentIntent = await confirmPayment(account.id);
      // assert.deepEqual(paymentIntent.status, "succeeded");
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

//Stripe only allows us to create 5 accounts per second, so we use a semaphore to limit it to even less.
const accountCreateSemaphore = new Sema(3);

async function createAndOnboardAccount(
  values: Partial<OnboardValues> = {},
  accountOptions: Partial<Stripe.AccountCreateParams> = {}
) {
  let account: Stripe.Response<Stripe.Account>;

  await accountCreateSemaphore.acquire();
  try {
    //wait for one second before account creation. due to the semaphore, up to 5 accounts will do this at the same time.
    await new Promise(resolve => setTimeout(resolve, 1250));

    account = await stripe.accounts.create({
      type: "express",
      ...accountOptions,
    });
  } finally {
   accountCreateSemaphore.release();
  }

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: "https://stripe.com",
    return_url: "https://stripe.com",
  });

  throw new Error(accountLink.url);

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
