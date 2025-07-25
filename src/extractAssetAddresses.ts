import { Adapter } from "@objectivelabs/oracle-sdk";
import { Address } from "viem";

export function extractAssetAddresses(adapter: Adapter | null): Address[] {
  if (!adapter) return [];
  const addresses: Address[] = [];

  if ("base" in adapter) addresses.push(adapter.base);
  if ("quote" in adapter) addresses.push(adapter.quote);
  if ("cross" in adapter) addresses.push(adapter.cross);
  if ("WSTETH" in adapter) addresses.push(adapter.WSTETH);
  if ("STETH" in adapter) addresses.push(adapter.STETH);
  if ("WETH" in adapter) addresses.push(adapter.WETH);
  if ("tokenA" in adapter) addresses.push(adapter.tokenA);
  if ("tokenB" in adapter) addresses.push(adapter.tokenB);
  if ("pool" in adapter) addresses.push(adapter.pool);
  if ("safeguardPool" in adapter) addresses.push(adapter.safeguardPool);
  if ("pendleMarket" in adapter) addresses.push(adapter.pendleMarket);
  if ("tranche" in adapter) addresses.push(adapter.tranche);
  if ("underlying" in adapter) addresses.push(adapter.underlying);

  return addresses.filter((address) => address !== undefined);
}
