import { collectData } from "./collectData";
import { chainConfigs } from "./config/chainConfigs";
import { saveJSON, cleanDataDir } from "./fs";
import { runChecks } from "./runChecks";

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
      const combined = {
        ...data.adapters[i],
        ...checkResults[address],
        address,
      };

      saveJSON(combined, `${dirPath}/adapters/${address}.json`);
      allResults.push(combined);
    }

    saveJSON(allResults, `${dirPath}/adapters/all.json`);
    console.log(`Wrote results to ${dirPath}`);
  }
}

runChecksForAllChains();
