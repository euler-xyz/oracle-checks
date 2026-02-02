import fs from "fs";
import path from "path";
import { collectData } from "./collectData";
import { chainConfigs } from "./config/chainConfigs";
import { saveJSON, cleanDataDir } from "./fs";
import { runChecks } from "./runChecks";
import { SOURCE_TO_TAGS } from "./types";

function copyWhitelistCsv(chainId: number, dirPath: string): void {
  const srcPath = path.join(__dirname, `../euler-interfaces/addresses/${chainId}/OracleAdaptersAddresses.csv`);
  const destPath = `${dirPath}/whitelist.csv`;
  
  try {
    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`[${chainId}] Copied whitelist CSV`);
    }
  } catch (err) {
    console.log(`[${chainId}] No whitelist CSV found in euler-interfaces`);
  }
}

async function runChecksForAllChains(): Promise<void> {
  cleanDataDir();
  for (const chainId of Object.keys(chainConfigs)) {
    const dirPath = `./data/${chainId}`;

    const data = await collectData(+chainId);
    saveJSON(data.chainlinkFeeds, `${dirPath}/chainlink/feeds.json`);
    saveJSON(data.chainlinkMetadata, `${dirPath}/chainlink/metadata.json`);
    saveJSON(data.chronicleFeeds, `${dirPath}/chronicle/feeds.json`);
    saveJSON(data.idleCDOs, `${dirPath}/idle/cdos.json`);
    saveJSON(data.idleTranches, `${dirPath}/idle/tranches.json`);
    saveJSON(data.pythMetadata, `${dirPath}/pyth/metadata.json`);
    saveJSON(data.pendleMetadata, `${dirPath}/pendle/metadata.json`);
    saveJSON(data.redstoneFeeds, `${dirPath}/redstone/feeds.json`);
    saveJSON(data.redstoneMetadata, `${dirPath}/redstone/metadata.json`);
    saveJSON(data.mevLinearDiscountFeeds, `${dirPath}/mev-linear-discount/feeds.json`);
    saveJSON(data.eoracleMetadata, `${dirPath}/eoracle/metadata.json`);
    saveJSON(data.eoracleFeeds, `${dirPath}/eoracle/feeds.json`);

    data.assets.forEach((asset) => {
      saveJSON(asset, `${dirPath}/assets/${asset.address}.json`);
    });
    saveJSON(data.assets, `${dirPath}/assets/all.json`);

    const checkResults = runChecks(data);

    const allResults = [];
    for (let i = 0; i < data.adapterAddresses.length; i++) {
      const address = data.adapterAddresses[i];

      // Get tags from adapter sources
      const sources = data.adapterSources[address] || [];
      const tags = Array.from(
        new Set(sources.flatMap((source) => SOURCE_TO_TAGS[source] || [])),
      );

      const combined = {
        ...data.adapters[i],
        ...checkResults[address],
        address,
        tags,
      };

      saveJSON(combined, `${dirPath}/adapters/${address}.json`);
      allResults.push(combined);
    }

    saveJSON(allResults, `${dirPath}/adapters/all.json`);

    // Filter and save Pyth adapters to pyth/all.json
    const pythAdapters = allResults.filter(
      (result) => result.provider === "Pyth"
    );
    saveJSON(pythAdapters, `${dirPath}/pyth/all.json`);

    copyWhitelistCsv(+chainId, dirPath);

    console.log(`Wrote results to ${dirPath}`);
  }
}

runChecksForAllChains();
