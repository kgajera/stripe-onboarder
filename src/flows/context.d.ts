import type { Page } from "puppeteer";
import type { OnboardOptions, OnboardValues } from "../onboard";

type FlowContext = {
  page: Page;
  values: OnboardValues;
  options: Exclude<OnboardOptions, "values">;
};
