import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Deploying ComplianceCertificate contract...");

    const ComplianceFactory = await hre.ethers.getContractFactory(
        "ComplianceCertificate"
    );
    const contract = await ComplianceFactory.deploy();

    // wait for deployment to be mined
    if (contract.deployed) {
        try {
        await contract.deployed();
        } catch (e) {
        // some environments use waitForDeployment
        if (contract.waitForDeployment) {
            await contract.waitForDeployment();
        }
        }
    }

    console.log("Contract deployed to:", contract.address);
    console.log(
        "To verify or interact, set CONTRACT_ADDRESS to this value in your .env or scripts."
    );
    }

    main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
