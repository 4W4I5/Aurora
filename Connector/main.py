import base64
import json
import secrets
from typing import Annotated

import bcrypt
import fastapi
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Depends
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlmodel import Session, SQLModel, create_engine, select
from web3 import Account, Web3, contract

from model import ChallengeRequest, SignRequest, User, VerifyRequest
from utils import generate_public_key  # spawnContract,
from utils import (
    generate_private_key,
    get_accounts,
    get_loaded_accounts,
    initialize_contract,
    issue_vc,
    print_user,
    register_did,
    sign_message,
    verify_signature,
)

# CORS Configuration
origins = ["*"]  # Allow all origins for now

# FastAPI setup
app = fastapi.FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Web3 setup
w3 = Web3(Web3.IPCProvider("http://127.0.0.1:8545"))  # Hardhat testnet

# Database setup
sqlite_file_name = "./awais_database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


SessionDep = Annotated[Session, Depends(get_session)]

# In-memory storage for challenges
challenges = {}


@app.get("/")
async def read_root():
    return {"Connector": "Running!"}


"""
##############################################
######## ADMIN DASHBOARD ROUTES ##############
##############################################
"""


@app.get("/api/users")
async def get_all_users(session: SessionDep):
    users = session.exec(select(User)).all()
    return users


@app.get("/api/users/active")
async def get_active_users(session: SessionDep):
    active_users_count = len(
        session.exec(select(User).where(User.isOnline == True)).all()
    )
    return {"active_users": active_users_count}


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, session: SessionDep):
    user = session.get(User, user_id)
    if not user:
        return HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"success": True}


@app.put("/api/users/{user_id}")
async def update_user(user_id: int, user_data: dict, session: SessionDep):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_data.items():
        if hasattr(user, key):  # Only update valid attributes of the model
            setattr(user, key, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return {"success": True, "user": user}


"""
##############################################
####### PASSWORD-BASED AUTHENTICATION ########
##############################################
"""


@app.post("/api/auth/password/verify")
async def verify_password(request: Request):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return {"authenticated": False, "error": "Missing email or password in BODY"}

    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()

    if not user or user.password_hash != password:
        return {"authenticated": False, "error": "Invalid email or password"}

    role = email.split("@")[1].split(".")[0]
    if role not in ["admin", "user"]:
        role = "user"

    return {
        "authenticated": True,
        "role": role,
    }


@app.post("/api/auth/password/register")
async def register_user(request: Request):
    try:
        body = await request.json()
        username = body.get("username")
        email = body.get("email")
        phoneNumber = body.get("phone")
        role = body.get("role")
        password = body.get("password")
        isPWLess = body.get("isPWLess", False)

        print(
            f"Got in Body:\n Username: {username}\n Email: {email}\n Phone: {phoneNumber}\n Role: {role}\n Password: {password}\n isPWLess: {isPWLess}"
        )

        # Check if user already exists, then return error
        with Session(engine) as session:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()

        if user:
            return {"success": False, "error": "User already exists."}

        # Pick an account from the JSON of available accounts, make sure it isnt already in use in the db then assign the address and priviate key
        accounts = get_accounts()

        # print(f"JSON Accounts: {accounts}")

        # Get all users from DB
        with Session(engine) as session:
            users = session.exec(select(User)).all()

        print(f"Users in DB: {users}")

        # Check if an address is free from the JSON accounts. if it is then assign it to the user along with its corresponding private key from the JSON accounts object
        print(f"Checking if any address is available")

        address = None
        private_key = None

        # Ensure that users is a list of dictionaries and each user has a 'blockchain_address' key
        for account in accounts:
            # Use correct key for accessing the account address
            if account["account"] not in [user.blockchain_address for user in users]:
                address = account["account"]
                private_key = account["privateKey"]
                break

        # Optional: if no address was found, you can check if the address and private_key were set
        if address and private_key:
            print(f"Found available address: {address}")
        else:
            print("No available address found.")

        print(f"Address: {address}\n Private Key: {private_key}")

        # If no address is found, return error
        if not address:
            return {"success": False, "error": "No available accounts."}

        # Generate a public key from the private key
        print(f"Generating Public Key:")
        public_key = generate_public_key(private_key, isBase64=False, isPEM=False)
        print(f"Public Key: {public_key}")

        # Register the DID on the blockchain
        print(f"Registering DID on blockchain:")
        did = f"did:key:{public_key[2:]}"
        print(f"Registered DID: {did}")

        print(
            f"SUCCESS! Generated: \n Account: {address}\n Private Key: {private_key}\n Public Key: {public_key}\n DID: {did}"
        )

        user = User(
            username=username,
            email=email,
            phone=phoneNumber,
            password_hash=password,
            public_key=public_key,
            private_key=private_key,
            blockchain_address=address,
            role=role,
            did=did,
            isPWLess=isPWLess,
            isOnline=False,
        )

        print_user(user)
        try:
            with Session(engine) as session:
                session.add(user)
                session.commit()
                session.refresh(user)
        except Exception as e:
            print(e)
            return JSONResponse(status_code=400, content="Error registering user.")

        return {"success": True, "address": address}
    except Exception as e:
        print(e)
        return JSONResponse(status_code=400, content="Error registering user.")


"""
#############################################
######## PASSWORDLESS AUTHENTICATION ########
#############################################
"""


@app.get("/api/auth/PKI/challenge")
async def get_challenge(address: str):
    if not Web3.isAddress(address):
        return HTTPException(status_code=400, detail="Invalid Ethereum address.")

    challenge = secrets.token_hex(16)
    challenges[address] = challenge
    return {"message": challenge}


@app.post("/api/auth/PKI/sign")
async def sign_message(sign_request: SignRequest):
    address = sign_request.address
    message = challenges.get(address)

    if not message or message != sign_request.message:
        return HTTPException(status_code=400, detail="Invalid challenge or address.")

    return {"signature": "This would normally be handled by the user's wallet."}


@app.post("/api/auth/PKI/verify")
async def verify_login(verify_request: VerifyRequest):
    address = verify_request.address
    signature = verify_request.signature
    message = verify_request.message

    if not Web3.isAddress(address):
        return HTTPException(status_code=400, detail="Invalid Ethereum address.")

    is_valid = verify_signature(message, signature, address, w3)

    if not is_valid:
        return {"success": False, "error": "Invalid signature."}

    with Session(engine) as session:
        statement = select(User).where(User.did == address)
        user = session.exec(statement).first()

    if not user:
        return {"success": False, "error": "User not found."}

    return {"success": True, "role": "user"}


"""
#############################################
######## CONTRACT INTERACTION ROUTES ########
#############################################
"""


@app.post("/api/blockchain/registerDID")
async def register_did(address: str, public_key: str):
    try:
        tx = Contract.functions.registerDID(address, public_key).transact(
            {"from": address}
        )
        w3.eth.wait_for_transaction_receipt(tx)
        return {"success": True, "transaction": tx.hex()}
    except Exception as e:
        return HTTPException(status_code=400, detail=str(e))


@app.post("/api/blockchain/issueVC")
async def issue_vc(issuer: str, holder: str, credential_hash: str):
    try:
        tx = Contract.functions.issueVC(holder, credential_hash).transact(
            {"from": issuer}
        )
        w3.eth.wait_for_transaction_receipt(tx)
        return {"success": True, "transaction": tx.hex()}
    except Exception as e:
        return HTTPException(status_code=400, detail=str(e))


@app.get("/contract-info")
async def contract_info():
    contract = initialize_contract()
    return {"contract_address": contract.address, "contract_abi": contract.abi}


"""
#############################################
######### TEST UTIL FUNCTIONS ###############
#############################################
"""


# @app.get("/test/listSigners")
# async def list_signers():
#     contract = initialize_contract()
#     signers = contract.functions.getSigners().call()
#     return {"signers": signers}


# # test new account gen
# @app.get("/test/newAccount")
# async def new_account():
#     account = w3.eth.account.create()
#     return {"address": account.address, "private_key": account._private_key.hex()}


@app.get("/test/jsonaccounts")
async def json_accounts():
    accounts = get_accounts()
    return {"accounts": accounts}


@app.get("/test/loadedaccounts")
async def loaded_accounts():
    accounts = get_loaded_accounts()
    return {"accounts": accounts}
