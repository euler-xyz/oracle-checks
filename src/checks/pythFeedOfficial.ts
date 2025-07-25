import { PythMetadata, PythOracle, PythPriceFeed } from "@objectivelabs/oracle-sdk";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";
import { OracleMethodology } from "../types";

type Params = {
  adapter: PythOracle;
  pythMetadata: PythMetadata | undefined;
};

export function pythFeedOfficial({ adapter, pythMetadata }: Params): {
  result: CheckResultWithId;
  feed: PythPriceFeed | undefined;
  methodology: OracleMethodology;
} {
  const matchingPythFeed = pythMetadata?.find((feed) => feed.id === adapter.feedId);
  if (matchingPythFeed) {
    const methodology =
      matchingPythFeed.attributes.asset_type === "Crypto Redemption Rate"
        ? "Exchange Rate"
        : matchingPythFeed.attributes.asset_type === "Crypto"
          ? "Market Price"
          : "Unknown";
    return {
      result: passCheck(
        CHECKS.OFFICIAL_PYTH_FEED,
        `Adapter is connected to an official Pyth feed: ${matchingPythFeed.attributes.display_symbol}`,
      ),
      feed: matchingPythFeed,
      methodology,
    };
  } else {
    return {
      result: failCheck(CHECKS.OFFICIAL_PYTH_FEED, "Could not find matching Pyth feed"),
      feed: undefined,
      methodology: "Unknown",
    };
  }
}
