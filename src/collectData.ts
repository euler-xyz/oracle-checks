import fs from "fs";

import {
  Adapter,
  Asset,
  ChainlinkFeed,
  ChronicleFeed,
  EOracleFeed,
  fetchChainlinkMetadata,
  fetchEOracleMetadata,
  fetchPendleMetadata,
  fetchPythMetadata,
  fetchRedStoneMetadata,
  IdleCDO,
  IdleTranche,
  indexAdapters,
  indexAssets,
  indexChainlinkFeeds,
  indexChronicleFeeds,
  indexEOracleFeeds,
  indexIdleCDOs,
  indexIdleTranches,
  indexMevLinearDiscountFeeds,
  indexRedStoneFeeds,
  MevLinearDiscountFeed,
  RedStoneFeed,
  RegistryEntry,
} from "@objectivelabs/oracle-sdk";
import dotenv from "dotenv";
import { Address, getAddress, Hex, isAddress, zeroAddress } from "viem";

import { batchArray } from "./batchArray";
import { chainConfigs } from "./config/chainConfigs";
import { fallbackAssets } from "./config/fallbackAssets";
import {
  fetchEulerApiDeployedRouters,
  fetchEulerApiHistoricalAdapters,
  fetchEulerApiWhitelistedAdapters,
} from "./eulerApi";
import { extractAssetAddresses } from "./extractAssetAddresses";
import { CollectedData } from "./types";

dotenv.config();

const BATCH_SIZE = 50;

export async function collectData(chainId: number): Promise<CollectedData> {
  fs.mkdirSync(`./data/${chainId}`, { recursive: true });

  const { publicClient, otherRecognizedAggregatorV3Feeds } = chainConfigs[chainId];

  const logPrefix = `[${chainId} ${publicClient.chain?.name}]`;
  console.log(`${logPrefix} Begin data collection step`);

  const historicalAdapters = await fetchEulerApiHistoricalAdapters(chainId);
  console.log(`${logPrefix} Fetched ${historicalAdapters.length} historical adapters`);

  const whitelistedAdapters = await fetchEulerApiWhitelistedAdapters(chainId);
  console.log(`${logPrefix} Fetched ${whitelistedAdapters.length} whitelisted adapters`);

  const deployedRouters = await fetchEulerApiDeployedRouters(chainId);
  console.log(`${logPrefix} Fetched ${deployedRouters.length} routers`);

  const [chainlinkResult, redstoneResult, pythResult, pendleResult, eoracleResult] =
    await Promise.allSettled([
      fetchChainlinkMetadata(chainId),
      fetchRedStoneMetadata(chainId),
      fetchPythMetadata(),
      fetchPendleMetadata(chainId),
      fetchEOracleMetadata(chainId),
    ]);

  const getMetadata = <T>(p: PromiseSettledResult<T>, metadataName: string): T | [] => {
    if (p.status === "fulfilled") {
      return p.value;
    } else {
      console.error(`Error fetching ${metadataName} metadata: ${p.reason}`);
      return [];
    }
  };

  const chainlinkMetadata = getMetadata(chainlinkResult, "Chainlink");
  const redstoneMetadata = getMetadata(redstoneResult, "RedStone");
  const pythMetadata = getMetadata(pythResult, "Pyth");
  const pendleMetadata = getMetadata(pendleResult, "Pendle");
  const eoracleMetadata = getMetadata(eoracleResult, "eOracle");

  pendleMetadata.sort((a, b) => a.pt.localeCompare(b.pt));
  console.log(`${logPrefix} Fetched oracle provider metadata`);

  const csvAdapterAddresses = chainConfigs[chainId].oracleAdaptersAddresses;
  const adapterRegistryAddresses = whitelistedAdapters.map((adapter) => adapter.element);
  const historicalAdapterAddresses = historicalAdapters;
  const adapterRegistryEntries = whitelistedAdapters.reduce(
    (acc, adapter) => {
      acc[adapter.element] = {
        addedAt: BigInt(adapter.addedAt),
        revokedAt: 0n,
      };
      return acc;
    },
    {} as Record<`0x${string}`, RegistryEntry>,
  );

  const adapterAddresses = Array.from(
    new Set(
      [...historicalAdapterAddresses, ...csvAdapterAddresses, ...adapterRegistryAddresses]
        .filter((a) => a !== zeroAddress)
        .map((a) => getAddress(a)),
    ),
  );

  console.log(
    `${logPrefix} Found ${adapterAddresses.length} unique adapters (${historicalAdapterAddresses.length} in router history, ${csvAdapterAddresses.length} in csv, ${adapterRegistryAddresses.length} in adapter registry)`,
  );

  const addressBatches = batchArray(adapterAddresses, BATCH_SIZE);

  const newlyFoundUnderlyingAdapterAddresses: Address[] = [];
  const adapters: (Adapter | null)[] = [];
  const bytecodes: (Hex | undefined)[] = [];
  for (const [i, addressBatch] of addressBatches.entries()) {
    const adapterBatch = await indexAdapters({ adapterAddresses: addressBatch, publicClient });
    adapterBatch.forEach((adapter) => {
      if (adapter?.name === "CrossAdapter") {
        if (isAddress(adapter.oracleBaseCross)) {
          newlyFoundUnderlyingAdapterAddresses.push(getAddress(adapter.oracleBaseCross));
        }
        if (isAddress(adapter.oracleCrossQuote)) {
          newlyFoundUnderlyingAdapterAddresses.push(getAddress(adapter.oracleCrossQuote));
        }
      }
    });
    adapters.push(...adapterBatch);

    const bytecodeBatch = await Promise.all(
      addressBatch.map((address) =>
        publicClient.getCode({
          address,
        }),
      ),
    );
    bytecodes.push(...bytecodeBatch);
    console.log(`${logPrefix} Indexed adapters ${i + 1}/${addressBatches.length}`);
  }

  const newAdapterAddresses = Array.from(
    new Set(
      newlyFoundUnderlyingAdapterAddresses.filter((address) => !adapterAddresses.includes(address)),
    ),
  );

  if (newAdapterAddresses.length > 0) {
    adapterAddresses.push(...newAdapterAddresses);
    const newAdapters = await indexAdapters({
      adapterAddresses: newAdapterAddresses,
      publicClient,
    });
    adapters.push(...newAdapters);

    const newBytecodes = await Promise.all(
      newAdapterAddresses.map((address) =>
        publicClient.getCode({
          address,
        }),
      ),
    );
    bytecodes.push(...newBytecodes);
    console.log(
      `${logPrefix} Indexed ${newAdapterAddresses.length} newly found cross underlying adapters`,
    );
  }

  const aggregatorV3Feeds = adapters
    .filter(
      (adapter) =>
        adapter?.name === "ChainlinkOracle" || adapter?.name === "ChainlinkInfrequentOracle",
    )
    .map(({ feed }) => feed);

  const chainlinkFeedAddresses = chainlinkMetadata
    .map((metadata) => metadata.proxyAddress as Address)
    .filter(
      (proxyAddress) =>
        !!proxyAddress &&
        aggregatorV3Feeds.some((feed) => feed.toLowerCase() === proxyAddress.toLowerCase()),
    );

  let chainlinkFeeds: ChainlinkFeed[] = [];
  if (chainlinkFeedAddresses.length > 0) {
    chainlinkFeeds = await indexChainlinkFeeds({
      publicClient,
      addresses: chainlinkFeedAddresses,
    });
    console.log(`${logPrefix} Indexed ${chainlinkFeeds.length} Chainlink feeds`);
  }

  const chronicleFeedAddresses = adapters
    .filter((adapter) => adapter?.name === "ChronicleOracle")
    .map(({ feed }) => feed);

  let chronicleFeeds: ChronicleFeed[] = [];
  if (chronicleFeedAddresses.length > 0) {
    chronicleFeeds = await indexChronicleFeeds({
      publicClient,
      addresses: chronicleFeedAddresses,
    });
    console.log(`${logPrefix} Indexed ${chronicleFeeds.length} Chronicle feeds`);
  }

  const redstoneFeedAddresses = redstoneMetadata
    .map((metadata) => metadata.priceFeedAddress)
    .filter(
      (priceFeedAddress) =>
        !!priceFeedAddress &&
        aggregatorV3Feeds.some((feed) => feed.toLowerCase() === priceFeedAddress.toLowerCase()),
    );
  let redstoneFeeds: RedStoneFeed[] = [];
  if (redstoneFeedAddresses.length > 0) {
    redstoneFeeds = await indexRedStoneFeeds({
      publicClient,
      addresses: redstoneFeedAddresses,
    });
    console.log(`${logPrefix} Indexed ${redstoneFeeds.length} RedStone feeds`);
  }

  const mevLinearDiscountFeedAddresses = Object.entries(otherRecognizedAggregatorV3Feeds)
    .filter(([_, { provider }]) => provider === "MEV Linear Discount")
    .map(([address]) => address);

  let mevLinearDiscountFeeds: MevLinearDiscountFeed[] = [];
  if (mevLinearDiscountFeedAddresses.length > 0) {
    mevLinearDiscountFeeds = await indexMevLinearDiscountFeeds({
      publicClient,
      addresses: mevLinearDiscountFeedAddresses as `0x${string}`[],
    });
    console.log(`${logPrefix} Indexed ${mevLinearDiscountFeeds.length} MEV Linear Discount feeds`);
  }

  const eoracleFeedAddresses = eoracleMetadata.map((feed) => feed.feedAddress);
  let eoracleFeeds: EOracleFeed[] = [];
  if (eoracleFeedAddresses.length > 0) {
    eoracleFeeds = await indexEOracleFeeds({
      publicClient,
      addresses: eoracleFeedAddresses,
    });
    console.log(`${logPrefix} Indexed ${eoracleFeeds.length} EOracle feeds`);
  }

  const idleoracles = adapters.filter((adapter) => adapter?.name === "IdleTranchesOracle");
  const idleCDOAddresses = idleoracles.map(({ cdo }) => cdo);
  let idleCDOs: IdleCDO[] = [];
  if (idleCDOAddresses.length > 0) {
    idleCDOs = await indexIdleCDOs({
      publicClient,
      addresses: idleCDOAddresses,
    });
    console.log(`${logPrefix} Indexed ${idleCDOs.length} IdleCDOs`);
  }

  const idleTrancheAddresses = idleoracles.map(({ tranche }) => tranche);
  let idleTranches: IdleTranche[] = [];
  if (idleTrancheAddresses.length > 0) {
    idleTranches = await indexIdleTranches({
      publicClient,
      addresses: idleTrancheAddresses,
    });
    console.log(`${logPrefix} Indexed ${idleTranches.length} IdleTranches`);
  }

  const assetAddresses = Array.from(
    new Set(adapters.flatMap((adapter) => extractAssetAddresses(adapter))),
  );

  let assets: Asset[] = [];
  if (assetAddresses.length > 0) {
    assets = await indexAssets({
      publicClient,
      addresses: assetAddresses,
      fallbacks: fallbackAssets,
    });
    console.log(`${logPrefix} Indexed ${assets.length} unique assets`);
  }

  return {
    chainId,
    adapterAddresses,
    adapters,
    adapterRegistryEntries,
    bytecodes,
    routerAddresses: deployedRouters.map((router) => router.router),
    chainlinkMetadata,
    chainlinkFeeds,
    chronicleFeeds,
    eoracleFeeds,
    eoracleMetadata,
    idleCDOs,
    idleTranches,
    redstoneMetadata,
    redstoneFeeds,
    pythMetadata,
    pendleMetadata,
    mevLinearDiscountFeeds,
    assets,
  };
}
