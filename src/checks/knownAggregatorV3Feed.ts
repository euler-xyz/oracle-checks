import {
  Asset,
  ChainlinkMetadata,
  ChainlinkInfrequentOracle,
  ChainlinkOracle,
  RedStoneMetadata,
  EOracleMetadata,
} from "@objectivelabs/oracle-sdk";
import { Address } from "viem";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";
import { OracleMethodology } from "../types";

type Params = {
  adapter: ChainlinkOracle | ChainlinkInfrequentOracle;
  chainlinkMetadata?: ChainlinkMetadata;
  redstoneMetadata?: RedStoneMetadata;
  eoracleMetadata?: EOracleMetadata;
  quoteAsset?: Asset;
  otherRecognizedAggregatorV3Feeds: Record<
    Address,
    { provider: string; description: string; threshold?: number; heartbeat?: number }
  >;
};

export function knownAggregatorV3Feed({
  adapter,
  chainlinkMetadata,
  redstoneMetadata,
  eoracleMetadata,
  quoteAsset,
  otherRecognizedAggregatorV3Feeds,
}: Params): {
  result: CheckResultWithId;
  label: string;
  methodology: OracleMethodology;
  provider: string;
  heartbeat?: number;
} {
  const matchingChainlinkFeed = chainlinkMetadata?.find(
    (feed) => feed.proxyAddress?.toLowerCase() === adapter.feed.toLowerCase(),
  );

  const matchingRedstoneFeed = redstoneMetadata?.find(
    (feed) => feed.priceFeedAddress === adapter.feed,
  );

  const matchingEoracleFeed = eoracleMetadata?.find((feed) => feed.feedAddress === adapter.feed);

  const matchingOtherFeed = otherRecognizedAggregatorV3Feeds[adapter.feed];

  if (matchingChainlinkFeed) {
    const isExchangeRate =
      matchingChainlinkFeed.docs?.productTypeCode === "ExRate" ||
      matchingChainlinkFeed.docs?.productSubType === "Exchange Rate" ||
      matchingChainlinkFeed.path?.toLowerCase().endsWith("exchange-rate");
    matchingChainlinkFeed.name?.toLowerCase().endsWith("exchange rate");

    return {
      result: passCheck(
        CHECKS.RECOGNIZED_AGGREGATOR_V3_FEED,
        `Adapter is connected to an official Chainlink feed: ${matchingChainlinkFeed.name}.`,
      ),
      label: `${matchingChainlinkFeed.name} (${matchingChainlinkFeed.threshold}%, ${matchingChainlinkFeed.heartbeat}s)`,
      heartbeat: matchingChainlinkFeed.heartbeat,
      methodology: isExchangeRate ? "Exchange Rate" : "Market Price",
      provider: "Chainlink",
    };
  } else if (matchingRedstoneFeed) {
    const isExchangeRate = matchingRedstoneFeed.symbol.includes("FUNDAMENTAL");

    const heartbeatLabel =
      matchingRedstoneFeed.heartbeat !== undefined
        ? `${matchingRedstoneFeed.heartbeat}s`
        : "Unknown";

    // If the adapter's quote asset is a special designator (e.g. USD, EUR, TRY, BTC),
    // append it to the RedStone symbol like "ETH/USD".
    const specialDesignatorSymbols = ["USD", "EUR", "TRY", "BTC"];
    const symbolWithQuote =
      quoteAsset && specialDesignatorSymbols.includes(quoteAsset.symbol)
        ? `${matchingRedstoneFeed.symbol}/${quoteAsset.symbol}`
        : matchingRedstoneFeed.symbol;

    return {
      result: passCheck(
        CHECKS.RECOGNIZED_AGGREGATOR_V3_FEED,
        `Adapter is connected to an official RedStone Push feed: ${matchingRedstoneFeed.symbol}.`,
      ),
      label: `${symbolWithQuote} (${matchingRedstoneFeed.deviationPercentage}%, ${heartbeatLabel})`,
      heartbeat: matchingRedstoneFeed.heartbeat,
      methodology: isExchangeRate ? "Exchange Rate" : "Market Price",
      provider: "RedStone",
    };
  } else if (matchingEoracleFeed) {
    return {
      result: passCheck(
        CHECKS.RECOGNIZED_AGGREGATOR_V3_FEED,
        `Adapter is connected to an official eOracle feed: ${matchingEoracleFeed.symbol}.`,
      ),
      label: `${matchingEoracleFeed.symbol} (${matchingEoracleFeed.deviationPercentage}, ${matchingEoracleFeed.heartbeat}s)`,
      heartbeat: matchingEoracleFeed.heartbeat,
      methodology: "Unknown",
      provider: "eOracle",
    };
  } else if (matchingOtherFeed) {
    let labelExtra = "";
    if (matchingOtherFeed.threshold && matchingOtherFeed.heartbeat) {
      labelExtra = `(${matchingOtherFeed.threshold}%, ${matchingOtherFeed.heartbeat}s)`;
    } else if (matchingOtherFeed.threshold) {
      labelExtra = `(${matchingOtherFeed.threshold}%)`;
    } else if (matchingOtherFeed.heartbeat) {
      labelExtra = `(${matchingOtherFeed.heartbeat}s)`;
    }
    return {
      result: passCheck(
        CHECKS.RECOGNIZED_AGGREGATOR_V3_FEED,
        `Adapter is connected to a recognized AggregatorV3-compatible feed: ${matchingOtherFeed.description}.`,
      ),
      label: `${matchingOtherFeed.description} ${labelExtra}`,
      heartbeat: matchingOtherFeed.heartbeat,
      methodology: "Unknown",
      provider: matchingOtherFeed.provider,
    };
  } else {
    return {
      result: failCheck(
        CHECKS.RECOGNIZED_AGGREGATOR_V3_FEED,
        `The connected price feed is not recognized.`,
      ),
      label: `Unknown AggregatorV3 Feed`,
      methodology: "Unknown",
      provider: "Unknown",
    };
  }
}
