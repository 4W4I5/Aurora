# Deployment Steps

## Blockchain

Run the following:

- Spawn a new terminal in the blockchain directory
- npm install
- npx hardhat init
- Spawn another terminal -> npx hardhat compile; npx hardhat node
- In current terminal -> npx hardhat ignition deploy ignition/modules/DIDRegistryModule.ts --network localhost

## Frontend

Run the following:

- Spawn a new terminal in the frontend directory
- npm install
- npm run dev

## Connector

Run the following:

- Spawn a new terminal in the connector directory
- python3 -m venv .venv
- .\\.venv\Scripts\Activate.ps1
- python3 -m pip install -r requirements.txt
- fastapi dev
