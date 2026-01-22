import fs from "fs";
import path from "path";
import { Address, getAddress } from "viem";
import { AdapterEntry } from "./eulerApi";

export function readWhitelistCsv(chainId: number): AdapterEntry[] {
  const csvPath = path.join(
    __dirname,
    `../euler-interfaces/addresses/${chainId}/OracleAdaptersAddresses.csv`,
  );

  if (!fs.existsSync(csvPath)) {
    return [];
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const adapterIdx = header.indexOf("adapter");
  const baseIdx = header.indexOf("base");
  const quoteIdx = header.indexOf("quote");
  const whitelistIdx = header.indexOf("whitelist");

  if (adapterIdx === -1 || whitelistIdx === -1) return [];

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

    entries.push({
      element: getAddress(adapter) as Address,
      asset0: base.startsWith("0x") ? (getAddress(base) as Address) : ("0x" as Address),
      asset1: quote.startsWith("0x") ? (getAddress(quote) as Address) : ("0x" as Address),
      addedAt: "0",
    });
  }

  return entries;
}
