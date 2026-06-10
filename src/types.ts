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
  | "Smart Value Recapture"
  | "Exchange Rate"
  | "TWAP"
  | "Unknown";

export type AdapterToResults = Record<
  Address,
  {
    label?: string;
    provider: string;
    methodology: OracleMethodology;
    model: OracleModel;
    checks: CheckResult[];
  }
>;
