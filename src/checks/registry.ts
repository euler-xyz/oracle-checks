import { RegistryEntry } from "@objectivelabs/oracle-sdk";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  entry: RegistryEntry | null;
};

export function registry({ entry }: Params): CheckResultWithId {
  if (!entry) {
    return failCheck(
      CHECKS.ADAPTER_REGISTRY,
      "Adapter is not whitelisted in the adapter registry.",
    );
  }

  if (entry.addedAt > entry.revokedAt) {
    return passCheck(CHECKS.ADAPTER_REGISTRY, "Adapter is whitelisted in the adapter registry.");
  }

  return failCheck(
    CHECKS.ADAPTER_REGISTRY,
    `Adapter was revoked from the adapter registry at ${new Date(
      Number(entry.revokedAt) * 1000,
    ).toISOString()}.`,
  );
}
