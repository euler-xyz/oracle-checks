import { readFileSync } from "fs";
import { join } from "path";

import { SystemAddresses } from "./types";

export function getAddressesForChain(chainId: number): SystemAddresses | null {
  const peripheryAddressesPath = join(
    process.cwd(),
    `euler-interfaces/addresses/${chainId}/PeripheryAddresses.json`,
  );

  let peripheryAddresses: unknown;

  try {
    peripheryAddresses = JSON.parse(readFileSync(peripheryAddressesPath, "utf-8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oracleRouterFactory: (peripheryAddresses as any).oracleRouterFactory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oracleAdapterRegistry: (peripheryAddresses as any).oracleAdapterRegistry,
  };
}
