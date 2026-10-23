
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BankAccount {
    // Store the balance of each customer's wallet address
    mapping(address => uint256) private balances;

    // Deposit money into the customer's account
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");

        balances[msg.sender] += msg.value;
    }

    // Withdraw money from the customer's account
    function withdraw(uint256 amount) public {
        require(amount > 0, "Withdrawal amount must be greater than zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Update balance before transferring Ether
        balances[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Ether transfer failed");
    }

    // Display the balance of the customer's account
    function showBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}
