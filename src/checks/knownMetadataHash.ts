import { Adapter } from "@objectivelabs/oracle-sdk";
import { decode } from "cbor-x";
import { Hex } from "viem";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: Adapter;
  code: Hex | undefined;
  allowedMetadataHashes?: string[];
};

export function knownMetadataHash({
  adapter,
  code,
  allowedMetadataHashes,
}: Params): CheckResultWithId {
  if (!code || code === "0x") {
    return failCheck(CHECKS.SOURCE_CODE_PROVENANCE, "Adapter contract has empty bytecode.");
  }

  const metadataHash = extractMetadataHash(code);
  if (!metadataHash) {
    return failCheck(
      CHECKS.SOURCE_CODE_PROVENANCE,
      "Failed to extract metadata hash from bytecode.",
    );
  }

  if (!allowedMetadataHashes) {
    return failCheck(CHECKS.SOURCE_CODE_PROVENANCE, `Unrecognized adapter class ${adapter.name}.`);
  }

  const expectedHash = allowedMetadataHashes.find((hash) => metadataHash === hash);

  if (metadataHash !== expectedHash) {
    console.warn(`${adapter.name} metadata hash mismatch: ${metadataHash}`);
    return failCheck(CHECKS.SOURCE_CODE_PROVENANCE, `Contract metadata hash is not recognized.`);
  }

  return passCheck(CHECKS.SOURCE_CODE_PROVENANCE, `Contract metadata hash matches a known hash.`);
}

function extractMetadataHash(bytecode: Hex): string | null {
  try {
    // Remove 0x prefix
    const code = bytecode.slice(2);

    // Last 2 bytes contain the CBOR length
    const cborLength = parseInt(code.slice(-4), 16);

    // Extract CBOR data using the length
    const cborData = code.slice(-(4 + cborLength * 2), -4);

    // Convert hex to bytes for CBOR decoding
    const bytes = new Uint8Array(
      cborData.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    );

    // Decode CBOR data
    const metadata = decode(bytes);

    // Convert ipfs byte array to hex string
    if (metadata.ipfs) {
      const ipfsBytes = new Uint8Array(metadata.ipfs);
      return (
        "0x" +
        Array.from(ipfsBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    }

    return null;
  } catch (e) {
    console.error("Failed to extract metadata hash:", e);
    return null;
  }
}
