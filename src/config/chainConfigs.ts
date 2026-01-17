import { hyperEvm } from "viem/chains";

import { fallbackAssets } from "./fallbackAssets";
import { getAddressesForChain } from "./getAddressesForChain";
import { getClient } from "./getClient";
import { metadataHashes } from "./metadataHashes";
import { CheckConfig } from "./types";

const defaultBounds = {
  minPushHeartbeatBuffer: 1800,
  pythStalenessLowerBound: 30,
  pythStalenessUpperBound: 300,
};

export const chainConfigs: Record<number, CheckConfig> = {
  [hyperEvm.id]: {
    publicClient: getClient(hyperEvm),
    metadataHashes,
    fallbackAssets,
    otherRecognizedAggregatorV3Feeds: {},
    ...defaultBounds,
    ...getAddressesForChain(hyperEvm.id),
  },
};
