import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

describe("DIDRegistry", function () {
  let DIDRegistry: any;
  let didRegistry: any;
  let owner: Signer;
  let addr1: Signer;

  beforeEach(async function () {
    // Get the contract factory and signers
    [owner, addr1] = await ethers.getSigners();
    DIDRegistry = await ethers.getContractFactory("DIDRegistry");

    // Deploy the contract
    didRegistry = await DIDRegistry.deploy();
  });

  it("Should deploy the contract and verify initial state", async function () {
    const ownerAddress = await owner.getAddress();
    expect(await didRegistry.getDID(ownerAddress)).to.equal("");
    console.log("DIDRegistry deployed at:", didRegistry.address);
  });

  it("Should register a DID for a user", async function () {
    const ownerAddress = await owner.getAddress();
    const publicKey = ethers.toUtf8Bytes("ownerPublicKey");

    await didRegistry.registerDID(ownerAddress, publicKey);

    const expectedDID = `did:key:${ethers.hexlify(publicKey)}`;
    const storedDID = await didRegistry.getDID(ownerAddress);

    expect(storedDID).to.equal(expectedDID);
  });

  it("Should register multiple DIDs for different users", async function () {
    const ownerAddress = await owner.getAddress();
    const addr1Address = await addr1.getAddress();

    const ownerPublicKey = ethers.toUtf8Bytes("ownerPublicKey");
    const addr1PublicKey = ethers.toUtf8Bytes("addr1PublicKey");

    await didRegistry.registerDID(ownerAddress, ownerPublicKey);
    await didRegistry.registerDID(addr1Address, addr1PublicKey);

    const expectedOwnerDID = `did:key:${ethers.hexlify(ownerPublicKey)}`;
    const expectedAddr1DID = `did:key:${ethers.hexlify(addr1PublicKey)}`;

    expect(await didRegistry.getDID(ownerAddress)).to.equal(expectedOwnerDID);
    expect(await didRegistry.getDID(addr1Address)).to.equal(expectedAddr1DID);
  });

  it("Should issue a VC from one DID to another", async function () {
    const ownerAddress = await owner.getAddress();
    const addr1Address = await addr1.getAddress();

    const ownerPublicKey = ethers.toUtf8Bytes("ownerPublicKey");
    const addr1PublicKey = ethers.toUtf8Bytes("addr1PublicKey");

    // Register DIDs for both users
    await didRegistry.registerDID(ownerAddress, ownerPublicKey);
    await didRegistry.registerDID(addr1Address, addr1PublicKey);

    // Issue a VC
    const vcHash = ethers.keccak256(
      ethers.toUtf8Bytes("Test Credential")
    );

    await didRegistry.issueVC(addr1Address, vcHash);

    const isValid = await didRegistry.verifyVC(addr1Address, vcHash);
    expect(isValid).to.be.true;
  });

  it("Should revoke a previously issued VC", async function () {
    const ownerAddress = await owner.getAddress();
    const addr1Address = await addr1.getAddress();

    const ownerPublicKey = ethers.toUtf8Bytes("ownerPublicKey");
    const addr1PublicKey = ethers.toUtf8Bytes("addr1PublicKey");

    // Register DIDs for both users
    await didRegistry.registerDID(ownerAddress, ownerPublicKey);
    await didRegistry.registerDID(addr1Address, addr1PublicKey);

    // Issue a VC
    const vcHash = ethers.keccak256(
      ethers.toUtf8Bytes("Test Credential")
    );

    await didRegistry.issueVC(addr1Address, vcHash);

    // Verify the VC is valid initially
    let isValid = await didRegistry.verifyVC(addr1Address, vcHash);
    expect(isValid).to.be.true;

    // Revoke the VC
    await didRegistry.revokeVC(addr1Address, vcHash);

    // Verify the VC is no longer valid
    isValid = await didRegistry.verifyVC(addr1Address, vcHash);
    expect(isValid).to.be.false;
  });

  it("Should prevent unregistered issuers from issuing VCs", async function () {
    const addr1Address = await addr1.getAddress();

    const vcHash = ethers.keccak256(
      ethers.toUtf8Bytes("Unauthorized Credential")
    );

    // addr1 tries to issue a VC without registering a DID
    await expect(
      didRegistry.connect(addr1).issueVC(addr1Address, vcHash)
    ).to.be.revertedWith("Issuer DID not registered");
  });

  it("Should prevent unregistered holders from being issued a VC", async function () {
    const ownerAddress = await owner.getAddress();

    const vcHash = ethers.keccak256(
      ethers.toUtf8Bytes("Invalid Holder Credential")
    );

    const ownerPublicKey = ethers.toUtf8Bytes("ownerPublicKey");

    // Register DID for the issuer
    await didRegistry.registerDID(ownerAddress, ownerPublicKey);

    // Attempt to issue a VC to an unregistered holder
    await expect(
      didRegistry.issueVC(await addr1.getAddress(), vcHash)
    ).to.be.revertedWith("Holder DID not registered");
  });

  it("Should emit events for DID registration and VC issuance/revocation", async function () {
    const ownerAddress = await owner.getAddress();
    const addr1Address = await addr1.getAddress();

    const ownerPublicKey = ethers.toUtf8Bytes("ownerPublicKey");
    const addr1PublicKey = ethers.toUtf8Bytes("addr1PublicKey");

    // Expect DID registration events
    await expect(didRegistry.registerDID(ownerAddress, ownerPublicKey))
      .to.emit(didRegistry, "DIDRegistered")
      .withArgs(
        ownerAddress,
        `did:key:${ethers.hexlify(ownerPublicKey)}`
      );

    await expect(didRegistry.registerDID(addr1Address, addr1PublicKey))
      .to.emit(didRegistry, "DIDRegistered")
      .withArgs(
        addr1Address,
        `did:key:${ethers.hexlify(addr1PublicKey)}`
      );

    // Issue a VC and expect an event
    const vcHash = ethers.keccak256(
      ethers.toUtf8Bytes("Test Credential")
    );

    await expect(didRegistry.issueVC(addr1Address, vcHash))
      .to.emit(didRegistry, "VCIssued")
      .withArgs(ownerAddress, addr1Address, vcHash);

    // Revoke the VC and expect an event
    await expect(didRegistry.revokeVC(addr1Address, vcHash))
      .to.emit(didRegistry, "VCRevoked")
      .withArgs(addr1Address, vcHash);
  });
});
