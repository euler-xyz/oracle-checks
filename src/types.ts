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

export type CollectedData = {
  chainId: number;
  adapterAddresses: Address[];
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

export type OracleMethodology = "Market Price" | "Exchange Rate" | "TWAP" | "Unknown";

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
