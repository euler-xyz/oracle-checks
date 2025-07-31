import { readFileSync } from "fs";
import { join } from "path";

import { Address } from "viem";

import { SystemAddresses } from "./types";

export function getAddressesForChain(chainId: number): SystemAddresses {
  const peripheryAddressesPath = join(
    process.cwd(),
    `euler-interfaces/addresses/${chainId}/PeripheryAddresses.json`,
  );

  const oracleAdaptersAddressesPath = join(
    process.cwd(),
    `euler-interfaces/addresses/${chainId}/OracleAdaptersAddresses.csv`,
  );

  let peripheryAddresses: unknown;

  try {
    peripheryAddresses = JSON.parse(readFileSync(peripheryAddressesPath, "utf-8"));
  } catch (error) {
    console.error(error);
    throw new Error(`No addresses found for chain ${chainId}`);
  }

  let oracleAdaptersAddresses: Address[] = [];
  try {
    const oracleAdaptersAddressesFile = readFileSync(oracleAdaptersAddressesPath, "utf-8");
    oracleAdaptersAddresses = extractAddressesFromOracleAdaptersCsv(oracleAdaptersAddressesFile);
  } catch (error) {
    console.error(`No oracle adapters addresses found for chain ${chainId}`);
  }

  return {
    oracleRouterFactory: (peripheryAddresses as any).oracleRouterFactory,
    oracleAdapterRegistry: (peripheryAddresses as any).oracleAdapterRegistry,
    oracleAdaptersAddresses,
  };
}

function extractAddressesFromOracleAdaptersCsv(file: string): Address[] {
  const rows = file.split("\n");
  return rows.slice(1, rows.length - 1)
    .map((row) => {
      const parts = row.split(",");
      const address = parts[4]; // 5th column (0-indexed)
      return address ? address.trim() : null;
    })
    .filter((address): address is Address => !!address && address.startsWith("0x"));
}
