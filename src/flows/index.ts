import type { BusinessType } from "../onboard";
import type { FlowContext } from "./context";

import fillOutIndividualFlow from "./individual";

type AllFlows = {
    [key in BusinessType]: (context: FlowContext) => Promise<void>;
}

const flows: AllFlows = {
    individual: fillOutIndividualFlow,
    company: () => {throw new Error("Not implemented.")},
    non_profit: () => {throw new Error("Not implemented.")},
};

export default flows;