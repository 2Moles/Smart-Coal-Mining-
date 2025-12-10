// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ComplianceCertificate {
    address public owner;
    uint256 public certificateCount;

    struct Reading {
        uint256 co2;
        uint256 pm25;
        uint256 so2;
        uint256 noise;
        uint256 timestamp;
        address submitter;
    }

    struct Certificate {
        uint256 id;
        uint256 timestamp;
        bytes32 hash;
        address submitter;
        uint256 co2;
        uint256 pm25;
        uint256 so2;
        uint256 noise;
    }

    // simple thresholds (can be updated by owner)
    uint256 public thresholdCO2;
    uint256 public thresholdPM25;
    uint256 public thresholdSO2;
    uint256 public thresholdNoise;

    // storage
    mapping(uint256 => Certificate) private _certificates;
    mapping(address => uint256[]) private _certificatesBySubmitter;

    event CertificateIssued(uint256 indexed id, address indexed submitter, uint256 timestamp, bytes32 hash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        certificateCount = 0;
        // default thresholds (tunable)
        thresholdCO2 = 1000;    // ppm
        thresholdPM25 = 35;     // µg/m3
        thresholdSO2 = 75;      // µg/m3
        thresholdNoise = 70;    // dB
    }

    /// @notice Owner can update thresholds
    function setThresholds(uint256 co2, uint256 pm25, uint256 so2, uint256 noise) external onlyOwner {
        thresholdCO2 = co2;
        thresholdPM25 = pm25;
        thresholdSO2 = so2;
        thresholdNoise = noise;
    }

    /// @notice Submit a sensor reading. If the reading meets thresholds a Certificate is generated and emitted.
    /// @return certificateId returns the certificate id (0 if no certificate issued)
    function submitReading(uint256 co2, uint256 pm25, uint256 so2, uint256 noise) external returns (uint256) {
        bool compliant = (co2 <= thresholdCO2) && (pm25 <= thresholdPM25) && (so2 <= thresholdSO2) && (noise <= thresholdNoise);

        if (!compliant) {
            return 0; // no certificate
        }

        // generate certificate
        bytes32 h = keccak256(abi.encodePacked(msg.sender, co2, pm25, so2, noise, block.timestamp, certificateCount));
        certificateCount += 1;
        uint256 id = certificateCount;

        Certificate memory cert = Certificate({
            id: id,
            timestamp: block.timestamp,
            hash: h,
            submitter: msg.sender,
            co2: co2,
            pm25: pm25,
            so2: so2,
            noise: noise
        });

        _certificates[id] = cert;
        _certificatesBySubmitter[msg.sender].push(id);

        emit CertificateIssued(id, msg.sender, block.timestamp, h);

        return id;
    }

    /// @notice Retrieve certificate ids for an address
    function getCertificateIdsBy(address submitter) external view returns (uint256[] memory) {
        return _certificatesBySubmitter[submitter];
    }

    /// @notice Retrieve a certificate by id
    function getCertificate(uint256 id) external view returns (Certificate memory) {
        return _certificates[id];
    }

    /// @notice Owner can transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }
}
