# Compliance Certificate — Smart Coal Mining (Digital Twin Integration)

This repository contains a minimal Hardhat project and example backend to issue Digital Compliance Certificates when environmental sensor readings meet predefined thresholds.

Files added

- `contracts/ComplianceCertificate.sol` — Solidity contract that accepts sensor readings, evaluates thresholds, issues certificates and stores them.
- `hardhat.config.js` — Hardhat configuration (ESM) that loads `.env` and configures the `amoy` network.
- `scripts/deploy.js` — Deploy script for the `amoy` network.
- `.env.example` — Template for environment variables.
- `backend/sensor_client.js` — Node.js example that reads `sensor_data.json`, submits readings, listens for `CertificateIssued` events and writes results to `certificates_output.json`.
- `sensor_data.json` — Example sensor readings.

## Visual Worflow 
<img width="1128" height="379" alt="image" src="https://github.com/user-attachments/assets/7537be6d-07e2-4ca1-beae-870fb5006662" />


## Quick setup

1. Copy `.env.example` to `.env` and fill values:

```powershell
copy .env.example .env
# edit .env and set RPC_URL and PRIVATE_KEY (and optionally CONTRACT_ADDRESS after deployment)
```

2. Install dependencies

```powershell
npm install
```

3. Compile contracts

```powershell
npm run compile
```

4. Deploy to Amoy testnet

```powershell
npm run deploy:amoy
# after deploy note the printed contract address and add it to .env as CONTRACT_ADDRESS
```

5. Push sensor readings and listen for certificates

```powershell
# Ensure .env contains CONTRACT_ADDRESS (or pass it as first arg)
npm run start-backend
# OR
node backend/sensor_client.js <contractAddress>
```

## How this integrates with QGIS digital twin layers

- The smart contract emits `CertificateIssued(id, submitter, timestamp, hash)` whenever a reading qualifies. Your backend app (or a separate listener service) collects these events and writes certificate objects (with id, timestamp, parameters and hash) to a database or a JSON file.
- In QGIS you can reference the stored certificate data to display certified locations (for example, locations of sensor stations that produced compliant readings) as a new layer. The certificate `hash` provides a verifiable fingerprint for the reading; you can display it and optionally link to a block explorer or the backend endpoint that returns certificate metadata.
- Typical integration flow:
  - Sensor station pushes readings to your backend (or the backend fetches them from an API).
  - Backend calls `submitReading()` on the smart contract and listens for the `CertificateIssued` event.
  - Backend persists the certificate object and associating spatial coordinates in your DB.
  - QGIS fetches certificate metadata via your API and renders features (points/polygons) with certificate attributes.

## Notes and next steps

- Thresholds are configurable by the contract owner using `setThresholds()`.
- For production, the backend should validate readings, use retries, handle gas price estimation, and protect the private key (use a secure signer or remote signer wallet).
- Replace sample thresholds with project-appropriate environmental standards.

If you want, I can:

- Run `npx hardhat compile` here to verify the contracts compile (requires correct Node version),
- Add a small Express endpoint that returns certificate metadata for QGIS, or
- Wire up a producer that reads from live sensor API instead of `sensor_data.json`.# Sample Hardhat 3 Beta Project (minimal)

This project has a minimal setup of Hardhat 3 Beta, without any plugins.

## What's included?

The project includes native support for TypeScript, Hardhat scripts, tasks, and support for Solidity compilation and tests.
