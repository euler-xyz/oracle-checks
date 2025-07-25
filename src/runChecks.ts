import { chainIdToPythProxy } from "@objectivelabs/oracle-sdk";
import { Address, formatUnits, parseUnits } from "viem";

import {
  assetConsistent,
  assetsDistinct,
  CheckResult,
  chronicleFeedOfficial,
  existence,
  fixedRateOne,
  knownAggregatorV3Feed,
  knownMetadataHash,
  lidoFundamentalOfficial,
  lidoOfficial,
  pushHeartbeat,
  pythBaseCorrespondence,
  pythFeedOfficial,
  pythProxyOfficial,
  pythQuoteCorrespondence,
  pythStalenessRange,
  pendlePoolOfficial,
  registry,
} from "./checks";
import { chainConfigs } from "./config/chainConfigs";
import { extractAssetAddresses } from "./extractAssetAddresses";
import { AdapterToResults, CollectedData, OracleMethodology, OracleModel } from "./types";

export function runChecks({
  chainId,
  adapterAddresses,
  adapterRegistryEntries,
  adapters,
  bytecodes,
  assets,
  chainlinkMetadata,
  redstoneMetadata,
  eoracleMetadata,
  pythMetadata,
  chronicleFeeds,
  pendleMetadata,
}: CollectedData): AdapterToResults {
  const {
    fallbackAssets,
    minPushHeartbeatBuffer,
    pythStalenessLowerBound,
    pythStalenessUpperBound,
    otherRecognizedAggregatorV3Feeds,
    metadataHashes,
  } = chainConfigs[chainId];

  const adapterToResults: AdapterToResults = {};

  adapters.forEach((adapter, index) => {
    const checks: CheckResult[] = [];
    let label: string = "";
    let methodology: OracleMethodology = "Unknown";
    let model: OracleModel = "Unknown";
    let provider: string = "Unknown";

    const existenceCheck = existence({
      chainId,
      address: adapterAddresses[index],
      adapter,
    });
    checks.push(existenceCheck);

    if (!existenceCheck.pass || !adapter) {
      label = "Unknown adapter";
      return;
    }

    const adapterAddressLower = adapterAddresses[index].toLowerCase() as Address;
    const registryCheck = registry({
      entry: adapterRegistryEntries[adapterAddressLower],
    });
    checks.push(registryCheck);

    checks.push(
      knownMetadataHash({
        adapter,
        code: bytecodes[index],
        allowedMetadataHashes: metadataHashes[adapter.name],
      }),
    );

    const assetAddresses = extractAssetAddresses(adapter);
    checks.push(assetsDistinct(assetAddresses));

    const adapterAssets = assetAddresses.map((assetAddress) =>
      assets.find((asset) => asset.address === assetAddress),
    );
    adapterAssets.forEach((asset, i) => {
      checks.push(
        assetConsistent({
          asset,
          address: assetAddresses[i],
          recognizedDesignatorAddresses: fallbackAssets.map((asset) => asset.address),
        }),
      );
    });

    const name = adapter.name;
    if (name === "ChainlinkOracle" || name === "ChainlinkInfrequentOracle") {
      const aggregatorV3FeedCheck = knownAggregatorV3Feed({
        adapter,
        chainlinkMetadata,
        redstoneMetadata,
        eoracleMetadata,
        otherRecognizedAggregatorV3Feeds,
      });
      label = aggregatorV3FeedCheck.label;
      methodology = aggregatorV3FeedCheck.methodology;
      provider = aggregatorV3FeedCheck.provider;
      model = "Push";

      const heartbeatCheck = pushHeartbeat({
        maxStaleness: adapter.maxStaleness,
        heartbeat: aggregatorV3FeedCheck.heartbeat,
        minHeartbeatBuffer: minPushHeartbeatBuffer,
      });
      checks.push(heartbeatCheck);
    } else if (name === "ChronicleOracle") {
      const chronicleFeedCheck = chronicleFeedOfficial({
        adapter,
        chronicleFeeds,
      });
      label = chronicleFeedCheck.label;
      model = "Push";
      provider = "Chronicle";
    } else if (name === "PythOracle") {
      const pythFeedCheck = pythFeedOfficial({
        adapter,
        pythMetadata,
      });
      label = `${pythFeedCheck.feed?.attributes.symbol ?? "unknown feed"} (${adapter.maxStaleness}s, ±${adapter.maxConfWidth}bps)`;
      methodology = pythFeedCheck.methodology;
      model = "Pull";
      provider = "Pyth";
      checks.push(pythFeedCheck.result);

      checks.push(
        pythBaseCorrespondence({
          base: assets.find((asset) => asset.address === adapter.base),
          feed: pythFeedCheck.feed,
        }),
      );

      checks.push(
        pythQuoteCorrespondence({
          quote: assets.find((asset) => asset.address === adapter.quote),
          feed: pythFeedCheck.feed,
        }),
      );

      checks.push(
        pythProxyOfficial({
          adapter,
          pythProxyAddress: chainIdToPythProxy[chainId],
        }),
      );
      checks.push(
        pythStalenessRange({
          adapter,
          lowerBound: pythStalenessLowerBound,
          upperBound: pythStalenessUpperBound,
        }),
      );
    } else if (name === "LidoOracle") {
      checks.push(
        lidoOfficial({
          adapter,
        }),
      );
      label = `wstETH/stETH`;
      methodology = "Market Price";
      model = "Push";
      provider = "Lido";
    } else if (name === "LidoFundamentalOracle") {
      checks.push(
        lidoFundamentalOfficial({
          adapter,
        }),
      );
      label = `wstETH/ETH`;
      methodology = "Exchange Rate";
      model = "Push";
      provider = "Lido Fundamental";
    } else if (name === "FixedRateOracle") {
      const baseAsset = assets.find((asset) => asset.address === adapter.base);
      const quoteAsset = assets.find((asset) => asset.address === adapter.quote);
      checks.push(
        fixedRateOne({
          adapter,
          quoteAsset,
        }),
      );
      if (adapter.rate && baseAsset && quoteAsset) {
        if (adapter.rate === parseUnits("1", quoteAsset.decimals)) {
          label = `1:1 ${baseAsset.symbol}/${quoteAsset.symbol}`;
        } else {
          label = `1:${formatUnits(adapter.rate, quoteAsset.decimals)} ${baseAsset.symbol}/${quoteAsset.symbol}`;
        }
      } else {
        label = `Unknown Fixed Rate Oracle`;
      }
      methodology = "Exchange Rate";
      model = "Push";
      provider = "Fixed Rate";
    } else if (name === "RateProviderOracle") {
      const baseAsset = assets.find((asset) => asset.address === adapter.base);
      const quoteAsset = assets.find((asset) => asset.address === adapter.quote);
      label = `${baseAsset?.symbol}/${quoteAsset?.symbol}`;
      methodology = "Exchange Rate";
      model = "Push";
      provider = "Rate Provider";
    } else if (name === "PendleOracle" || name === "PendleUniversalOracle") {
      const pendlePoolCheck = pendlePoolOfficial({
        adapter,
        pendleMetadata,
      });
      label = pendlePoolCheck.label;
      methodology = "TWAP";
      model = "Push";
      provider = "Pendle";
    } else if (name === "UniswapV3Oracle") {
      const tokenASymbol = assets.find((asset) => asset.address === adapter.tokenA)?.symbol;
      const tokenBSymbol = assets.find((asset) => asset.address === adapter.tokenB)?.symbol;
      label = `${tokenASymbol}/${tokenBSymbol}`;
      methodology = "TWAP";
      model = "Push";
      provider = "Uniswap V3";
    } else if (name === "RedstoneCoreOracle") {
      const baseSymbol = assets.find((asset) => asset.address === adapter.base)?.symbol;
      const quoteSymbol = assets.find((asset) => asset.address === adapter.quote)?.symbol;
      label = `${baseSymbol}/${quoteSymbol}`;
      methodology = "Unknown";
      model = "Pull";
      provider = "RedStone Pull";
    } else if (name === "IdleTranchesOracle") {
      const trancheSymbol = assets.find((asset) => asset.address === adapter.tranche)?.symbol;
      const underlyingSymbol = assets.find((asset) => asset.address === adapter.underlying)?.symbol;
      label = `${trancheSymbol}/${underlyingSymbol}`;
      methodology = "Unknown";
      model = "Unknown";
      provider = "Idle";
    } else if (name === "SwaapSafeguardOracle") {
      const safeguardPoolSymbol = assets.find(
        (asset) => asset.address === adapter.safeguardPool,
      )?.symbol;
      const quoteSymbol = assets.find((asset) => asset.address === adapter.quote)?.symbol;
      label = `${safeguardPoolSymbol}/${quoteSymbol}`;
      methodology = "Unknown";
      model = "Unknown";
      provider = "Swaap";
    } else if (name === "CrossAdapter") {
      const baseSymbol = assets.find((asset) => asset.address === adapter.base)?.symbol;
      const crossSymbol = assets.find((asset) => asset.address === adapter.cross)?.symbol;
      const quoteSymbol = assets.find((asset) => asset.address === adapter.quote)?.symbol;
      label = `${baseSymbol}/${crossSymbol}/${quoteSymbol}`;
      methodology = "Unknown";
      model = "Unknown";
      provider = "Cross";
    }
    adapterToResults[adapter.address] = {
      checks,
      label,
      methodology,
      model,
      provider,
      whitelisted: registryCheck.pass,
    };
  });

  return adapterToResults;
}
