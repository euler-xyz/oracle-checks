import fs from "fs";
import path from "path";
import { Address, getAddress } from "viem";
import { AdapterEntry } from "./eulerApi";

// Extended CSV metadata for richer adapter info
export type CsvAdapterMetadata = {
  address: Address;
  base: Address;
  quote: Address;
  assetSymbol: string;
  quoteSymbol: string;
  provider: string;
  adapterName: string;
};

function readAdaptersCsvWithMetadata(csvPath: string): {
  entries: AdapterEntry[];
  metadata: Map<Address, CsvAdapterMetadata>;
} {
  const metadata = new Map<Address, CsvAdapterMetadata>();

  if (!fs.existsSync(csvPath)) {
    return { entries: [], metadata };
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { entries: [], metadata };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const assetSymbolIdx = header.indexOf("asset");
  const quoteSymbolIdx = header.findIndex((h, i) => h === "quote" && i < 4); // First "quote" column (symbol)
  const providerIdx = header.indexOf("provider");
  const adapterNameIdx = header.indexOf("adapter name");
  const adapterIdx = header.indexOf("adapter");
  const baseIdx = header.indexOf("base");
  const quoteIdx = header.lastIndexOf("quote"); // Last "quote" column (address)
  const whitelistIdx = header.indexOf("whitelist");

  if (adapterIdx === -1 || whitelistIdx === -1) return { entries: [], metadata };

  const entries: AdapterEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (row.length <= Math.max(adapterIdx, whitelistIdx)) continue;

    const adapter = (row[adapterIdx] || "").trim();
    const wl = (row[whitelistIdx] || "").trim().toLowerCase();

    if (!adapter || !adapter.startsWith("0x")) continue;
    if (wl !== "yes" && wl !== "true") continue;

    const base = baseIdx !== -1 ? (row[baseIdx] || "").trim() : "";
    const quote = quoteIdx !== -1 ? (row[quoteIdx] || "").trim() : "";
    const normalizedAddress = getAddress(adapter) as Address;

    entries.push({
      element: normalizedAddress,
      asset0: base.startsWith("0x") ? (getAddress(base) as Address) : ("0x" as Address),
      asset1: quote.startsWith("0x") ? (getAddress(quote) as Address) : ("0x" as Address),
      addedAt: "0",
    });

    // Store rich metadata
    metadata.set(normalizedAddress, {
      address: normalizedAddress,
      base: base.startsWith("0x") ? (getAddress(base) as Address) : ("0x" as Address),
      quote: quote.startsWith("0x") ? (getAddress(quote) as Address) : ("0x" as Address),
      assetSymbol: assetSymbolIdx !== -1 ? (row[assetSymbolIdx] || "").trim() : "",
      quoteSymbol: quoteSymbolIdx !== -1 ? (row[quoteSymbolIdx] || "").trim() : "",
      provider: providerIdx !== -1 ? (row[providerIdx] || "").trim() : "",
      adapterName: adapterNameIdx !== -1 ? (row[adapterNameIdx] || "").trim() : "",
    });
  }

  return { entries, metadata };
}

// Legacy function for backward compatibility
function readAdaptersCsv(csvPath: string): AdapterEntry[] {
  return readAdaptersCsvWithMetadata(csvPath).entries;
}

export function readWhitelistCsv(chainId: number): AdapterEntry[] {
  const csvPath = path.join(
    __dirname,
    `../euler-interfaces/addresses/${chainId}/OracleAdaptersAddresses.csv`,
  );
  return readAdaptersCsv(csvPath);
}

export function readPooledCsv(chainId: number): AdapterEntry[] {
  const csvPath = path.join(
    __dirname,
    `../euler-interfaces/addresses/${chainId}/pooled/OracleAdaptersAddresses.csv`,
  );
  return readAdaptersCsv(csvPath);
}

export function readWhitelistCsvWithMetadata(chainId: number): {
  entries: AdapterEntry[];
  metadata: Map<Address, CsvAdapterMetadata>;
} {
  const csvPath = path.join(
    __dirname,
    `../euler-interfaces/addresses/${chainId}/OracleAdaptersAddresses.csv`,
  );
  return readAdaptersCsvWithMetadata(csvPath);
}

export function readPooledCsvWithMetadata(chainId: number): {
  entries: AdapterEntry[];
  metadata: Map<Address, CsvAdapterMetadata>;
} {
  const csvPath = path.join(
    __dirname,
    `../euler-interfaces/addresses/${chainId}/pooled/OracleAdaptersAddresses.csv`,
  );
  return readAdaptersCsvWithMetadata(csvPath);
}
