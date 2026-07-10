import fs from "fs";

import {
  Adapter,
  Asset,
  ChainlinkFeed,
  ChainlinkInfrequentXStocksOracle,
  ChainlinkMetadata,
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
} from "@objectivelabs/oracle-sdk";
import { config as loadEnv } from "dotenv";
import { Address, getAddress, Hex, isAddress, type PublicClient, zeroAddress } from "viem";

import { batchArray } from "./batchArray";
import { extractMetadataHash } from "./checks/knownMetadataHash";
import { chainConfigs } from "./config/chainConfigs";
import { fallbackAssets } from "./config/fallbackAssets";
import {
  POPPIE_EULER_ADAPTER_CONTRACT_NAME,
  POPPIE_EULER_ADAPTER_METADATA_HASH,
  PoppieEulerAdapter,
} from "./customAdapters";
import { fetchEulerApiDeployedRouters, fetchEulerApiHistoricalAdapters } from "./eulerApi";
import { extractAssetAddresses } from "./extractAssetAddresses";
import { CollectedData, OracleAdapter } from "./types";

type ChainlinkFeedMetadataWithSecondaryProxy = ChainlinkMetadata[number] & {
  secondaryProxyAddress?: Address | null;
};

loadEnv();

const BATCH_SIZE = 50;

const chainlinkInfrequentXStocksOracleAbi = [
  {
    type: "function",
    name: "pauseTimeBefore",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pauseTimeAfter",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "maxAllowedMultiplierChange",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "xStocksToken",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
] as const;

const chainlinkInfrequentXStocksSelectors = [
  "0914dbf1", // xStocksToken()
  "0f743242", // maxAllowedMultiplierChange()
];

export async function collectData(chainId: number): Promise<CollectedData> {
  fs.mkdirSync(`./data/${chainId}`, { recursive: true });

  const { publicClient, otherRecognizedAggregatorV3Feeds } = chainConfigs[chainId];

  const logPrefix = `[${chainId} ${publicClient.chain?.name}]`;
  console.log(`${logPrefix} Begin data collection step`);

  const historicalAdapters = await fetchEulerApiHistoricalAdapters(chainId);
  console.log(`${logPrefix} Fetched ${historicalAdapters.length} historical adapters`);

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

  const historicalAdapterAddresses = historicalAdapters;

  const adapterAddresses = Array.from(
    new Set(historicalAdapterAddresses.filter((a) => a !== zeroAddress).map((a) => getAddress(a))),
  );

  console.log(
    `${logPrefix} Found ${adapterAddresses.length} unique adapters (${historicalAdapterAddresses.length} in router history)`,
  );

  const seenAdapterAddresses = new Set(adapterAddresses.map((address) => address.toLowerCase()));
  let pendingAdapterAddresses = [...adapterAddresses];

  const adapters: (OracleAdapter | null)[] = [];
  const bytecodes: (Hex | undefined)[] = [];

  while (pendingAdapterAddresses.length > 0) {
    const addressBatches = batchArray(pendingAdapterAddresses, BATCH_SIZE);
    const discoveredUnderlyingAdapterAddresses: Address[] = [];

    for (const [i, addressBatch] of addressBatches.entries()) {
      const adapterBatch = await indexAdapters({ adapterAddresses: addressBatch, publicClient });

      const bytecodeBatch = await Promise.all(
        addressBatch.map((address) =>
          publicClient.getCode({
            address,
          }),
        ),
      );

      const normalizedAdapterBatch = await Promise.all(
        adapterBatch.map((adapter, adapterIndex) =>
          normalizeAdapter({
            adapter,
            address: addressBatch[adapterIndex],
            code: bytecodeBatch[adapterIndex],
            chainId,
            publicClient,
          }),
        ),
      );

      normalizedAdapterBatch.forEach((adapter) => {
        if (adapter?.name !== "CrossAdapter") {
          return;
        }

        [adapter.oracleBaseCross, adapter.oracleCrossQuote].forEach((underlyingAddress) => {
          if (!isAddress(underlyingAddress) || underlyingAddress === zeroAddress) {
            return;
          }

          const address = getAddress(underlyingAddress);
          const lowerAddress = address.toLowerCase();
          if (seenAdapterAddresses.has(lowerAddress)) {
            return;
          }

          seenAdapterAddresses.add(lowerAddress);
          adapterAddresses.push(address);
          discoveredUnderlyingAdapterAddresses.push(address);
        });
      });

      adapters.push(...normalizedAdapterBatch);
      bytecodes.push(...bytecodeBatch);
      console.log(`${logPrefix} Indexed adapters ${i + 1}/${addressBatches.length}`);
    }

    if (discoveredUnderlyingAdapterAddresses.length > 0) {
      console.log(
        `${logPrefix} Discovered ${discoveredUnderlyingAdapterAddresses.length} cross underlying adapters`,
      );
    }

    pendingAdapterAddresses = discoveredUnderlyingAdapterAddresses;
  }

  const aggregatorV3Feeds = adapters
    .filter(
      (adapter) =>
        adapter?.name === "ChainlinkOracle" ||
        adapter?.name === "ChainlinkInfrequentOracle" ||
        adapter?.name === "ChainlinkInfrequentNanosecondOracle" ||
        adapter?.name === "ChainlinkInfrequentXStocksOracle",
    )
    .map(({ feed }) => feed);

  const chainlinkFeedAddresses = chainlinkMetadata
    .flatMap((metadata) => {
      const chainlinkFeed = metadata as ChainlinkFeedMetadataWithSecondaryProxy;
      return [chainlinkFeed.proxyAddress, chainlinkFeed.secondaryProxyAddress] as (
        | Address
        | null
        | undefined
      )[];
    })
    .filter((proxyAddress): proxyAddress is Address => {
      if (!proxyAddress) return false;
      return aggregatorV3Feeds.some((feed) => feed.toLowerCase() === proxyAddress.toLowerCase());
    });

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

async function normalizeAdapter({
  adapter,
  address,
  code,
  chainId,
  publicClient,
}: {
  adapter: Adapter | null;
  address: Address;
  code: Hex | undefined;
  chainId: number;
  publicClient: PublicClient;
}): Promise<OracleAdapter | null> {
  const normalizedAdapter = await normalizeChainlinkInfrequentXStocksOracle({
    adapter,
    code,
    publicClient,
  });
  if (normalizedAdapter) return normalizedAdapter;

  return normalizePoppieEulerAdapter({ address, code, chainId });
}

async function normalizeChainlinkInfrequentXStocksOracle({
  adapter,
  code,
  publicClient,
}: {
  adapter: Adapter | null;
  code: Hex | undefined;
  publicClient: PublicClient;
}): Promise<OracleAdapter | null> {
  if (
    adapter?.name !== "ChainlinkInfrequentOracle" ||
    !isChainlinkInfrequentXStocksBytecode(code)
  ) {
    return adapter;
  }

  const [pauseTimeBefore, pauseTimeAfter, maxAllowedMultiplierChange, xStocksToken] =
    await Promise.all([
      publicClient.readContract({
        address: adapter.address,
        abi: chainlinkInfrequentXStocksOracleAbi,
        functionName: "pauseTimeBefore",
      }),
      publicClient.readContract({
        address: adapter.address,
        abi: chainlinkInfrequentXStocksOracleAbi,
        functionName: "pauseTimeAfter",
      }),
      publicClient.readContract({
        address: adapter.address,
        abi: chainlinkInfrequentXStocksOracleAbi,
        functionName: "maxAllowedMultiplierChange",
      }),
      publicClient.readContract({
        address: adapter.address,
        abi: chainlinkInfrequentXStocksOracleAbi,
        functionName: "xStocksToken",
      }),
    ]);

  return {
    ...adapter,
    name: "ChainlinkInfrequentXStocksOracle",
    pauseTimeBefore,
    pauseTimeAfter,
    maxAllowedMultiplierChange,
    xStocksToken,
  } satisfies ChainlinkInfrequentXStocksOracle;
}

function normalizePoppieEulerAdapter({
  address,
  code,
  chainId,
}: {
  address: Address;
  code: Hex | undefined;
  chainId: number;
}): PoppieEulerAdapter | null {
  if (!code || code === "0x") return null;
  if (extractMetadataHash(code) !== POPPIE_EULER_ADAPTER_METADATA_HASH) return null;

  return {
    address,
    chainId,
    name: POPPIE_EULER_ADAPTER_CONTRACT_NAME,
  };
}

function isChainlinkInfrequentXStocksBytecode(code: Hex | undefined): boolean {
  if (!code || code === "0x") return false;

  const normalizedCode = code.toLowerCase();
  return chainlinkInfrequentXStocksSelectors.every((selector) => normalizedCode.includes(selector));
}
