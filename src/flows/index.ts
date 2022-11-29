import type { BusinessType } from "../onboard";
import type { FlowContext } from "./context";

import fillOutCompanyFlow from "./company";
import fillOutIndividualFlow from "./individual";
import fillOutNonProfitFlow from "./non-profit";

type AllFlows = {
  [key in BusinessType]: ((context: FlowContext) => Promise<void>)[];
};

const flows: AllFlows = {
  individual: fillOutIndividualFlow,
  company: fillOutCompanyFlow,
  non_profit: fillOutNonProfitFlow,
};

export default flows;
