import { Address } from "viem";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

export function assetsDistinct(addresses: Address[]): CheckResultWithId {
  const duplicates = addresses.filter((address, index, self) => self.indexOf(address) !== index);
  if (duplicates.length > 0) {
    return failCheck(CHECKS.DISTINCT_ASSETS, "Duplicate assets found.");
  }
  return passCheck(CHECKS.DISTINCT_ASSETS, "All assets are distinct.");
}
