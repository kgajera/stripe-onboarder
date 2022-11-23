import "dotenv/config";
import { faker } from "@faker-js/faker";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { onboard, OnboardValues } from "../src/onboard";

if (!process.env["STRIPE_SECRET_KEY"]) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"], {
  apiVersion: "2022-11-15",
});

const timeout = 60 * 1000 * 3;

describe("onboard", () => {
  it("onboards 'company' business type", { timeout }, async () => {
    const account = await createAndOnboardAccount({ business_type: "company" });
    await waitForAccountVerification(account.id);
    const paymentIntent = await confirmPayment(account.id);
    assert.deepEqual(paymentIntent.status, "succeeded");
  });

  it("onboards 'individual' business type", { timeout }, async () => {
    const account = await createAndOnboardAccount({
      business_type: "individual",
    });
    await waitForAccountVerification(account.id);
    const paymentIntent = await confirmPayment(account.id);
    assert.deepEqual(paymentIntent.status, "succeeded");
  });

  it("onboards 'non_profit' business type", { timeout }, async () => {
    const account = await createAndOnboardAccount({
      business_type: "non_profit",
    });
    await waitForAccountVerification(account.id);
    const paymentIntent = await confirmPayment(account.id);
    assert.deepEqual(paymentIntent.status, "succeeded");
  });
});

async function createAndOnboardAccount(values: Partial<OnboardValues> = {}) {
  const account = await stripe.accounts.create({ type: "express" });

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
