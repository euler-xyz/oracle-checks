import {
  ChainlinkMetadata,
  PythMetadata,
  Adapter,
  Asset,
  ChainlinkFeed,
  ChronicleFeed,
  RedStoneFeed,
  RedStoneMetadata,
  IdleCDO,
  IdleTranche,
  PendleMetadata,
  RegistryEntry,
  MevLinearDiscountFeed,
  EOracleMetadata,
  EOracleFeed,
} from "@objectivelabs/oracle-sdk";
import { Address, Hex } from "viem";

import { CheckResult } from "./checks";
import { CsvAdapterMetadata } from "./readWhitelistCsv";

// Adapter sources - add new sources here as needed
export type AdapterSource =
  | "euler-api-historical"
  | "euler-api-whitelisted"
  | "csv-whitelist"
  | "csv-pooled"
  | "cross-adapter-discovery";

// Map of source to tags - add new tag mappings here
export const SOURCE_TO_TAGS: Record<AdapterSource, string[]> = {
  "euler-api-historical": ["Mewler"],
  "euler-api-whitelisted": ["Mewler"],
  "csv-whitelist": ["Mewler"],
  "csv-pooled": ["Pooled"],
  "cross-adapter-discovery": ["Mewler"],
};

export type CollectedData = {
  chainId: number;
  adapterAddresses: Address[];
  adapterSources: Record<Address, AdapterSource[]>;
  csvMetadata: Map<Address, CsvAdapterMetadata>;
  routerAddresses: Address[];
  adapterRegistryEntries: Record<Address, RegistryEntry>;
  chainlinkMetadata: ChainlinkMetadata;
  redstoneMetadata: RedStoneMetadata;
  pythMetadata: PythMetadata;
  pendleMetadata: PendleMetadata;
  chainlinkFeeds: ChainlinkFeed[];
  redstoneFeeds: RedStoneFeed[];
  chronicleFeeds: ChronicleFeed[];
  mevLinearDiscountFeeds: MevLinearDiscountFeed[];
  eoracleMetadata: EOracleMetadata;
  eoracleFeeds: EOracleFeed[];
  idleCDOs: IdleCDO[];
  idleTranches: IdleTranche[];
  adapters: (Adapter | null)[];
  bytecodes: (Hex | undefined)[];
  assets: Asset[];
};

export type OracleModel = "Unknown" | "Push" | "Pull";

export type OracleMethodology =
  | "Market Price"
  | "Market Price (Bolt)"
  | "Exchange Rate"
  | "TWAP"
  | "Composite"
  | "Unknown";

export type AdapterToResults = Record<
  Address,
  {
    label?: string;
    provider: string;
    whitelisted: boolean;
    methodology: OracleMethodology;
    model: OracleModel;
    checks: CheckResult[];
  }
>;
