import { Asset, PythPriceFeed } from "@objectivelabs/oracle-sdk";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  base?: Asset;
  feed?: PythPriceFeed;
};

export function pythBaseCorrespondence({ base, feed }: Params): CheckResultWithId {
  if (!base) {
    return failCheck(CHECKS.PYTH_BASE_CORRESPONDENCE, "Base asset is unknown.");
  }

  if (!feed) {
    return failCheck(CHECKS.PYTH_BASE_CORRESPONDENCE, "Feed is unknown.");
  }

  const baseSymbol = base.symbol;
  const feedBaseSymbol = feed.attributes.base;

  if (
    baseSymbol.toLocaleLowerCase() === feedBaseSymbol.toLocaleLowerCase() ||
    (baseSymbol.toLowerCase() === "weth" && feedBaseSymbol.toLowerCase() === "eth")
  ) {
    return passCheck(
      CHECKS.PYTH_BASE_CORRESPONDENCE,
      `Adapter's base asset (${baseSymbol}) corresponds to the Pyth feed's base asset from metadata (${feedBaseSymbol}).`,
    );
  } else {
    return failCheck(
      CHECKS.PYTH_BASE_CORRESPONDENCE,
      `Adapter's base asset (${baseSymbol}) does not correspond to the Pyth feed's base asset from metadata (${feedBaseSymbol}).`,
    );
  }
}
