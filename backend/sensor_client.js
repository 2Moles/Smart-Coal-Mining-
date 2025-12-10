import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Wallet, JsonRpcProvider, Contract } from "ethers";

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.argv[2];

if (!RPC_URL) {
  console.error("Missing RPC_URL in environment");
  process.exit(1);
}
if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY in environment");
  process.exit(1);
}
if (!CONTRACT_ADDRESS) {
  console.error(
    "Missing CONTRACT_ADDRESS. Provide via .env or first arg: node backend/sensor_client.js <contractAddress>"
  );
  process.exit(1);
}

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

// Minimal ABI for interactions
const ABI = [
  "function submitReading(uint256,uint256,uint256,uint256) returns (uint256)",
  "event CertificateIssued(uint256 indexed id, address indexed submitter, uint256 timestamp, bytes32 hash)",
  "function getCertificate(uint256) view returns (tuple(uint256 id,uint256 timestamp,bytes32 hash,address submitter,uint256 co2,uint256 pm25,uint256 so2,uint256 noise))",
  "function getCertificateIdsBy(address) view returns (uint256[])",
];

const contract = new Contract(CONTRACT_ADDRESS, ABI, wallet);

const DATA_FILE = path.join(process.cwd(), "sensor_data.json");
const OUTPUT_FILE = path.join(process.cwd(), "certificates_output.json");

async function submitAllReadings() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(
      `No sensor data file found at ${DATA_FILE}. Create a sensor_data.json (see README).`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const readings = JSON.parse(raw);

  const results = [];

  for (const r of readings) {
    console.log("Submitting reading:", r);
    const tx = await contract.submitReading(r.co2, r.pm25, r.so2, r.noise);
    console.log(
      "Tx sent, waiting for confirmation...",
      tx.hash || tx.transactionHash
    );
    const receipt = await tx.wait?.();
    // For ethers v6 deploy via hardhat, tx.wait should exist; fallback: provider.waitForTransaction
    if (!receipt) {
      await provider.waitForTransaction(tx.hash || tx.transactionHash);
    }

    console.log("Submitted. Transaction mined.");
    results.push({ reading: r, txHash: tx.hash || tx.transactionHash });
  }

  // save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Saved submission results to ${OUTPUT_FILE}`);
}

function listenForCertificates() {
  console.log("Listening for CertificateIssued events...");
  contract.on(
    "CertificateIssued",
    async (id, submitter, timestamp, hash, ev) => {
      console.log("CertificateIssued:", {
        id: id.toString(),
        submitter,
        timestamp: timestamp.toString(),
        hash,
      });

      // read certificate details from contract
      try {
        const cert = await contract.getCertificate(id);
        const out = {
          id: cert.id.toString(),
          timestamp: cert.timestamp.toString(),
          hash: cert.hash,
          submitter: cert.submitter,
          co2: cert.co2.toString(),
          pm25: cert.pm25.toString(),
          so2: cert.so2.toString(),
          noise: cert.noise.toString(),
        };

        // append to output file
        let existing = [];
        if (fs.existsSync(OUTPUT_FILE)) {
          existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
        }
        existing.push(out);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
        console.log(`Appended certificate ${out.id} to ${OUTPUT_FILE}`);
      } catch (err) {
        console.error("Failed to fetch certificate details:", err);
      }
    }
  );
}

// run both: listen and submit
async function main() {
  listenForCertificates();
  await submitAllReadings();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
