
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CharityDonationModule", (m) => {
    const charity = m.contract("CharityDonation");

    return { charity };
});
