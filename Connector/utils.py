import json
import os

import web3
from web3 import Web3

from model import User


# Utility Functions
def verify_signature(message: str, signature: str, address: str, w3Prov: Web3) -> bool:
    """
    Verifies that a given signature is valid for a given message and address.

    Args:
        message (str): The original message that was signed.
        signature (str): The signature to verify.
        address (str): The Ethereum address of the signer.

    Returns:
        bool: True if the signature is valid and matches the address, False otherwise.
    """
    message_hash = web3.solidityKeccak(["string"], [message])
    signer = web3.eth.account.recoverHash(message_hash, signature=signature)
    return signer.lower() == address.lower()


# Load the deployment information
def get_contract_details():
    # Define the base directory (prefix path)
    base_dir = r"..\blockchain\ignition\deployments\chain-31337"

    # Construct the paths to the ABI and address JSON files by prefixing the base directory
    abi_json_path = os.path.join(
        base_dir, "artifacts", "DIDRegistryModule#DIDRegistry.json"
    )
    address_json_path = os.path.join(base_dir, "deployed_addresses.json")

    print(f"Loading contract details...")
    print(f"  ABI Path: {abi_json_path}")
    print(f"  Address Path: {address_json_path}")

    # Load the ABI and contract address in one go
    with open(abi_json_path, "r") as abi_file:
        contract_data = json.load(abi_file)

    with open(address_json_path, "r") as address_file:
        deployed_addresses = json.load(address_file)

    # Extract contract ABI and address
    contract_abi = contract_data["abi"]
    contract_address = deployed_addresses.get("DIDRegistryModule#DIDRegistry", "")

    # Print contract address
    print(f"  Contract Address: {contract_address}\n")

    # Loop through the ABI and print details for each function
    for item in contract_abi:
        # Only print function details, skip events
        if item["type"] == "function":
            print(f"Function Name: {item['name']}")

            # Print function inputs
            if item["inputs"]:
                print("  Inputs:")
                for input_param in item["inputs"]:
                    print(f"    - Name: {input_param['name']}({input_param['type']})")
            else:
                print("  Inputs: None")

            # Print function outputs
            if item["outputs"]:
                print("  Outputs:")
                for output_param in item["outputs"]:
                    print(f"    - Name: {output_param['name']}({output_param['type']})")
            else:
                print("  Outputs: None")

            print("-" * 50)

    # Return both the contract address and ABI for further use
    return contract_address, contract_abi


# Initialize Web3 and the contract
def initialize_contract():
    w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))
    contract_address, contract_abi = get_contract_details()
    return w3.eth.contract(address=contract_address, abi=contract_abi)


# Print the user object
def print_user(user: User):
    print(f"User {user.username} ({user.email})")
    print(f"  ID: {user.id}")
    print(f"  Phone Number: {user.phone}")
    print(f"  Role: {user.role}")
    print(f"  DID: {user.did}")
    print(f"  Is Passwordless: {user.isPWLess}")
    print(f"  Is Online: {user.isOnline}")
    print(f"  Blockchain Address: {user.blockchain_address}")
    print(f"  Public Key: {user.public_key}")
    print(f"  Private Key: {user.private_key}")
    print()
