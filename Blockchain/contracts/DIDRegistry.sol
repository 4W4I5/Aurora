// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract DIDRegistry {
    // Struct to represent a Verifiable Credential (VC)
    struct VerifiableCredential {
        address issuer; // Address of the issuer
        address holder; // Address of the VC holder
        string credentialHash; // Assumed Hash of the VC details (off-chain data reference)
        bool isRevoked; // Revocation status
    }

    // Mapping to store user DIDs
    mapping(address => string) private dids;

    // Mapping of holder to issued VCs
    mapping(address => VerifiableCredential[]) private holderVCs;

    // Event for DID registration
    event DIDRegistered(address indexed user, string did);

    // Event for VC issuance
    event VCIssued(
        address indexed issuer,
        address indexed holder,
        string credentialHash
    );

    // Event for VC revocation
    event VCRevoked(address indexed holder, string credentialHash);

    // Register a DID directly
    function registerDID(address user, string calldata did) public {
        require(bytes(dids[user]).length == 0, "DID already registered");
        dids[user] = did;
        emit DIDRegistered(user, did);
    }

    // Get a user's DID
    function getDID(address user) public view returns (string memory) {
        require(bytes(dids[user]).length > 0, "DID not found");
        return dids[user];
    }

    // Issue a Verifiable Credential (VC)
    function issueVC(
        address holder,
        string calldata credentialHash
    ) public {
        require(bytes(dids[msg.sender]).length > 0, "Issuer DID not registered");
        require(bytes(dids[holder]).length > 0, "Holder DID not registered");

        holderVCs[holder].push(
            VerifiableCredential({
                issuer: msg.sender,
                holder: holder,
                credentialHash: credentialHash,
                isRevoked: false
            })
        );
        emit VCIssued(msg.sender, holder, credentialHash);
    }

    // Revoke a Verifiable Credential (VC)
    function revokeVC(
        address holder,
        string calldata credentialHash
    ) public {
        require(bytes(dids[msg.sender]).length > 0, "Issuer DID not registered");

        VerifiableCredential[] storage credentials = holderVCs[holder];
        bool found = false;

        for (uint256 i = 0; i < credentials.length; i++) {
            if (
                keccak256(abi.encodePacked(credentials[i].credentialHash)) ==
                keccak256(abi.encodePacked(credentialHash)) &&
                credentials[i].issuer == msg.sender &&
                !credentials[i].isRevoked
            ) {
                credentials[i].isRevoked = true;
                found = true;
                emit VCRevoked(holder, credentialHash);
                break;
            }
        }
        require(found, "VC not found or already revoked");
    }

    // Verify a Verifiable Credential (VC)
    function verifyVC(
        address holder,
        string calldata credentialHash
    ) public view returns (bool) {
        VerifiableCredential[] storage credentials = holderVCs[holder];

        for (uint256 i = 0; i < credentials.length; i++) {
            if (
                keccak256(abi.encodePacked(credentials[i].credentialHash)) ==
                keccak256(abi.encodePacked(credentialHash)) &&
                !credentials[i].isRevoked
            ) {
                return true;
            }
        }
        return false;
    }


    // Return all signers
    function getSigners() public view returns (address[] memory) {
        address[] memory signers = new address[](2);
        signers[0] = msg.sender;
        signers[1] = address(this);
        return signers;
    }
}
