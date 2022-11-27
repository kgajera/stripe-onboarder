import type { BusinessType } from "../onboard";
import fillOutCompanyFlow from "./company";
import type { FlowContext } from "./context";

import getIndividualFlowPages from "./individual";

type AllFlows = {
    [key in BusinessType]: ((context: FlowContext) => Promise<void>)[];
}

const flows: AllFlows = {
    individual: getIndividualFlowPages,
    company: fillOutCompanyFlow,
    non_profit: [],
};

export default flows;