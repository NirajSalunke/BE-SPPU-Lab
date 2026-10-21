
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CharityDonation", function () {
    async function deployCharity() {
        const [owner, donor, stranger] = await ethers.getSigners();
        const charity = await ethers.deployContract("CharityDonation");

        return { charity, owner, donor, stranger };
    }

    it("should set the deployer as owner", async function () {
        const { charity, owner } = await deployCharity();

        expect(await charity.owner()).to.equal(owner.address);
    });

    it("should accept donations and update balances", async function () {
        const { charity, donor } = await deployCharity();
        const amount = ethers.parseEther("1");

        await charity.connect(donor).donate({ value: amount });

        expect(await charity.donations(donor.address)).to.equal(amount);
        expect(await charity.totalDonated()).to.equal(amount);
        expect(await charity.getBalance()).to.equal(amount);
    });

    it("should reject zero-value donations", async function () {
        const { charity, donor } = await deployCharity();

        await expect(
            charity.connect(donor).donate()
        ).to.be.revertedWith("Donation must be greater than zero");
    });

    it("should allow only the owner to withdraw", async function () {
        const { charity, donor, stranger } = await deployCharity();

        await charity.connect(donor).donate({
            value: ethers.parseEther("1"),
        });

        await expect(
            charity.connect(stranger).withdraw()
        ).to.be.revertedWith("Only the owner can do this");
    });

    it("should allow the owner to withdraw all funds", async function () {
        const { charity, donor } = await deployCharity();

        await charity.connect(donor).donate({
            value: ethers.parseEther("1"),
        });

        await charity.withdraw();

        expect(await charity.getBalance()).to.equal(0n);
    });
});
