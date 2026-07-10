#!/usr/bin/env node

const fs = require("fs");
const { decode } = require("cbor-x");
const { createPublicClient, http, isAddress } = require("viem");

function usage() {
  console.error(`Usage:
  node scripts/extractArtifactMetadataHash.js <artifact.json> [--runtime|--creation]
  node scripts/extractArtifactMetadataHash.js --address <oracle> --rpc <rpc-url>`);
  process.exit(1);
}

function parseArgs(args) {
  const parsed = {
    artifactPath: null,
    mode: "runtime",
    address: null,
    rpcUrl: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--runtime") {
      parsed.mode = "runtime";
    } else if (arg === "--creation") {
      parsed.mode = "creation";
    } else if (arg === "--address") {
      parsed.address = args[++i];
    } else if (arg === "--rpc") {
      parsed.rpcUrl = args[++i];
    } else if (arg.startsWith("--")) {
      usage();
    } else if (!parsed.artifactPath) {
      parsed.artifactPath = arg;
    } else {
      usage();
    }
  }

  return parsed;
}

function getBytecodeObject(artifact, mode) {
  const bytecode =
    mode === "creation"
      ? artifact.bytecode
      : artifact.deployedBytecode ?? artifact.bytecode;

  if (typeof bytecode === "string") return bytecode;
  if (typeof bytecode?.object === "string") return bytecode.object;
  return null;
}

function extractMetadataHash(bytecode) {
  if (!bytecode || bytecode === "0x") {
    throw new Error("Bytecode is empty.");
  }

  const code = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  const cborLength = parseInt(code.slice(-4), 16);
  if (!Number.isFinite(cborLength) || cborLength <= 0) {
    throw new Error("Could not read CBOR metadata length from bytecode.");
  }

  const cborData = code.slice(-(4 + cborLength * 2), -4);
  const bytes = new Uint8Array(
    cborData.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
  );
  const metadata = decode(bytes);

  if (!metadata.ipfs) {
    throw new Error("CBOR metadata does not contain an IPFS hash.");
  }

  return (
    "0x" +
    Array.from(new Uint8Array(metadata.ipfs))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

async function getArtifactBytecode(artifactPath, mode) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bytecode = getBytecodeObject(artifact, mode);
  if (!bytecode) {
    throw new Error(`Artifact does not contain ${mode} bytecode.`);
  }

  return bytecode;
}

async function getOnChainBytecode(address, rpcUrl) {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }

  if (!rpcUrl) {
    throw new Error("--rpc is required when using --address.");
  }

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  return client.getCode({ address });
}

async function main() {
  const { artifactPath, mode, address, rpcUrl } = parseArgs(process.argv.slice(2));

  if (address && artifactPath) {
    usage();
  }

  if (!address && !artifactPath) {
    usage();
  }

  if (address && mode === "creation") {
    throw new Error("--creation only applies to local artifact JSON.");
  }

  const bytecode = address
    ? await getOnChainBytecode(address, rpcUrl)
    : await getArtifactBytecode(artifactPath, mode);
  console.log(extractMetadataHash(bytecode));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
