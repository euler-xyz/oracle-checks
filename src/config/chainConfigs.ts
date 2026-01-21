import { Address } from "viem";
import { hyperEvm } from "viem/chains";

import { fallbackAssets } from "./fallbackAssets";
import { getAddressesForChain } from "./getAddressesForChain";
import { getClient } from "./getClient";
import { metadataHashes } from "./metadataHashes";
import { CheckConfig } from "./types";

const defaultBounds = {
  minPushHeartbeatBuffer: 1800,
  pythStalenessLowerBound: 30,
  pythStalenessUpperBound: 300,
};

// RedStone HyperEVM feeds from official manifest
// https://github.com/redstone-finance/redstone-oracles-monorepo/blob/main/packages/relayer-remote-config/main/relayer-manifests-multi-feed/hyperevmMultiFeed.json
// Heartbeat: 21600s (6 hours), Deviation: 0.5%
const hyperEvmRedStoneFeeds: Record<
  Address,
  { provider: string; description: string; heartbeat: number; threshold: number }
> = {
  "0xa8a94Da411425634e3Ed6C331a32ab4fd774aa43": {
    provider: "RedStone",
    description: "HYPE/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x3587a73AA02519335A8a6053a97657BECe0bC2Cc": {
    provider: "RedStone",
    description: "BTC/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x4BAD96DD1C7D541270a0C92e1D4e5f12EEEA7a57": {
    provider: "RedStone",
    description: "ETH/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x3fd49f2146FE0e10c4AE7E3fE04b3d5126385Ac4": {
    provider: "RedStone",
    description: "SOL/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x197225B3B017eb9b72Ac356D6B3c267d0c04c57c": {
    provider: "RedStone",
    description: "wstETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xbbF121624c3b85C929Ac83872bf6c86b0976A55e": {
    provider: "RedStone",
    description: "weETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x09639692CE6ff12A06CA3AE9A24b3Aae4CD80DC8": {
    provider: "RedStone",
    description: "swETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x83c6f7F61A55Fc7A1337AbD45733AD9c1c68076D": {
    provider: "RedStone",
    description: "STONE/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x3401DAF2b1f150Ef0c709Cc0283b5F2e55c3DF29": {
    provider: "RedStone",
    description: "rswETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x6A1c87d11dDe3D1d52c24f8EC59B91019f14170D": {
    provider: "RedStone",
    description: "ezETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x84AD474c33c9cCefB1a2D8b77Bdd88bDc592f96b": {
    provider: "RedStone",
    description: "rsETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xe7f71d6a24EBc391f5ee57B867ED429EB7Bd74f4": {
    provider: "RedStone",
    description: "pufETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x65eD6a4ac085620eE943c0B15525C4428D23e4Db": {
    provider: "RedStone",
    description: "LBTC_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x24eDD61cdA334bFf871A80DEB135073a7d7a9187": {
    provider: "RedStone",
    description: "SolvBTC/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xddE3b77040cee3387C0cA661d1b619C3acA203b0": {
    provider: "RedStone",
    description: "WBTC/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x8B4736f5eaD8ed579Ecf65a13F9c1E8B44dEdF20": {
    provider: "RedStone",
    description: "eBTC/WBTC",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x4C89968338b75551243C99B452c84a01888282fD": {
    provider: "RedStone",
    description: "USDC/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x5e21f6530f656A38caE4F55500944753F662D184": {
    provider: "RedStone",
    description: "USDT/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xcA727511c9d542AAb9eF406d24E5bbbE4567c22d": {
    provider: "RedStone",
    description: "USDe/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x29D295409d5A20b2C851df18054D32A442791346": {
    provider: "RedStone",
    description: "sUSDe_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x29d2fEC890B037B2d34f061F9a50f76F85ddBcAE": {
    provider: "RedStone",
    description: "USR/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xC9e11c60e24BEF478cC999fA9fA2d89cC098A86e": {
    provider: "RedStone",
    description: "cbBTC/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x5C4c8d6f6Bf79B718F3e8399AaBdFEd01cB7e48f": {
    provider: "RedStone",
    description: "cmETH_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x243507C8C114618d7C8AD94b51118dB7b4e32ECe": {
    provider: "RedStone",
    description: "sUSDe/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x7d05cd5159F38694A7D4dBf58957146a63c8Ad5A": {
    provider: "RedStone",
    description: "UBTC/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xa42a6568f1df29ef95DDDF440c41e48D4cfB310E": {
    provider: "RedStone",
    description: "mHYPE_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xEC34D1Cf550dda751ff20cD4eCC7FF9219551B04": {
    provider: "RedStone",
    description: "stHYPE/HYPE",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xC328CDf06CBc77134B84e1f6ed452774947146b6": {
    provider: "RedStone",
    description: "hwHLP_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xa275809f06944c00E308FE764b0559ED84481042": {
    provider: "RedStone",
    description: "USR_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xB5d303b9F984e42EB5E3C00Bdf733A309c654630": {
    provider: "RedStone",
    description: "XAU/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xA3A75Fd9f19bd334605f59527552DBC6c7f6fD88": {
    provider: "RedStone",
    description: "XAUt/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x4cEC96A68cb9A979621b104F3C94884be1a66da0": {
    provider: "RedStone",
    description: "stHYPE/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x96572d32d699cE463Fdf36610273CC76B7d83f9b": {
    provider: "RedStone",
    description: "hbUSDT_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xDb924A25BfF353f98B066F692c38C3cFacb3a601": {
    provider: "RedStone",
    description: "hbHYPE_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x9ED559c2Ad1562aE8e919691A84A3320f547B248": {
    provider: "RedStone",
    description: "hbBTC_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xFfe5F5e9e18b88FBdD7e28d4A583a111C874fB47": {
    provider: "RedStone",
    description: "kHYPE_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x82721e2C5Ef2DF1796B09728376361892b155594": {
    provider: "RedStone",
    description: "kHYPE_FUNDAMENTAL/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xd6156F8177aA1a6E0c5278CE437A9BDB32F203ef": {
    provider: "RedStone",
    description: "RLP_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xA569E68B5D110F2A255482c2997DFDBe1b2ab912": {
    provider: "RedStone",
    description: "lstHYPE_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xF2448DC04B1d3f1767D6f7C03da8a3933bdDD697": {
    provider: "RedStone",
    description: "kHYPE/USD",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0x3519B2f175D22a4dFA0595c291fEfe0945F0656d": {
    provider: "RedStone",
    description: "kHYPE/HYPE",
    heartbeat: 21600,
    threshold: 0.5,
  },
  "0xBE4d4D2FDdE7408bD00B9912705De7bDC3F9bDeb": {
    provider: "RedStone",
    description: "beHYPE_FUNDAMENTAL",
    heartbeat: 21600,
    threshold: 0.5,
  },
};

export const chainConfigs: Record<number, CheckConfig> = {
  [hyperEvm.id]: {
    publicClient: getClient(hyperEvm),
    metadataHashes,
    fallbackAssets,
    otherRecognizedAggregatorV3Feeds: hyperEvmRedStoneFeeds,
    ...defaultBounds,
    ...getAddressesForChain(hyperEvm.id),
  },
};
