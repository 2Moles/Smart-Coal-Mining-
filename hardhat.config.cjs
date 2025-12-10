require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    amoy: {
      url: process.env.RPC_URL || "",
      accounts: (function () {
        const pk = process.env.PRIVATE_KEY;
        if (!pk) return [];
        // accept hex private key with or without 0x prefix
        const hex = pk.startsWith("0x") ? pk.slice(2) : pk;
        if (/^[0-9a-fA-F]{64}$/.test(hex)) {
          return [pk.startsWith("0x") ? pk : `0x${hex}`];
        }
        return [];
      })(),
    },
  },
};
