
export const CONTRACT_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function campaignName() view returns (string)",
    "function totalDonated() view returns (uint256)",
    "function donations(address) view returns (uint256)",
    "function donate() payable",
    "function withdraw()",
    "function getBalance() view returns (uint256)",
    "event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp)",
    "event FundsWithdrawn(address indexed recipient, uint256 amount, uint256 timestamp)"
];
