import { CheckDefinition } from "../types";

export const CHECKS: Record<string, CheckDefinition> = {
  SOURCE_CODE_PROVENANCE: {
    id: "Source code provenance",
    severity: "High",
  },
  CONSISTENT_ASSET: {
    id: "Consistent asset",
    severity: "High",
  },
  DISTINCT_ASSETS: {
    id: "Distinct assets",
    severity: "High",
  },
  ADAPTER_EXISTS: {
    id: "Adapter existence",
    severity: "High",
  },
  RECOGNIZED_AGGREGATOR_V3_FEED: {
    id: "Recognized AggregatorV3 feed",
    severity: "Med",
  },
  PUSH_STALENESS_BUFFER: {
    id: "Push oracle staleness buffer",
    severity: "Med",
  },
  OFFICIAL_PYTH_FEED: {
    id: "Recognized Pyth feed",
    severity: "High",
  },
  OFFICIAL_PYTH_PROXY: {
    id: "Recognized Pyth proxy",
    severity: "High",
  },
  PYTH_STALENESS_RANGE: {
    id: "Sane Pyth staleness range",
    severity: "High",
  },
  PYTH_BASE_CORRESPONDENCE: {
    id: "Pyth base correspondence",
    severity: "Info",
  },
  PYTH_QUOTE_CORRESPONDENCE: {
    id: "Pyth quote correspondence",
    severity: "Info",
  },
  OFFICIAL_CHRONICLE_FEED: {
    id: "Recognized Chronicle feed",
    severity: "High",
  },
  OFFICIAL_PENDLE_POOL: {
    id: "Recognized Pendle pool",
    severity: "High",
  },
  UNUSUAL_FIXED_RATE: {
    id: "Unusual fixed rate",
    severity: "Med",
  },
  OFFICIAL_LIDO_ORACLE: {
    id: "Recognized Lido oracle",
    severity: "High",
  },
  FIXED_RATE_ONE: {
    id: "Sane fixed rate",
    severity: "High",
  },
  ADAPTER_REGISTRY: {
    id: "Adapter whitelist",
    severity: "Med",
  },
};
