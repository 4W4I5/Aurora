import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DIDRegistryModule", (m) => {
  // Deploy the DIDRegistry contract
  const didRegistry = m.contract("DIDRegistry");

  // Return the deployed contract instance
  return { didRegistry };
});