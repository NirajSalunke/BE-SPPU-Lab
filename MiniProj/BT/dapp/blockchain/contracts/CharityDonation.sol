// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CharityDonation {
    address public owner;
    string public campaignName = "GiveChain Community Relief Fund";

    uint256 public totalDonated;

    mapping(address => uint256) public donations;

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );

    event FundsWithdrawn(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can do this");
        _;
    }

    function donate() external payable {
        require(msg.value > 0, "Donation must be greater than zero");

        donations[msg.sender] += msg.value;
        totalDonated += msg.value;

        emit DonationReceived(msg.sender, msg.value, block.timestamp);
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");

        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner, amount, block.timestamp);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
