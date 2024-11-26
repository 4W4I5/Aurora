import base64
import json
import secrets
from typing import Annotated

import bcrypt
import fastapi
from brownie import Contract
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Depends
from fastapi.requests import Request
from pydantic import BaseModel
from sqlmodel import Session, SQLModel, create_engine, select
from web3 import Web3

from model import ChallengeRequest, SignRequest, User, VerifyRequest
from utils import (
    get_contract_details,
    initialize_contract,
    print_user,
    verify_signature,
)

# CORS Configuration
origins = [
    # "http://localhost:5173",
    # "http://localhost:5174",
    # "http://localhost:8000",
    "*"
]

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

# Allow frontend to interact with the server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to restrict domains if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Web3 setup
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))  # Hardhat testnet

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
####################################
###### ADMIN DASHBOARD ROUTES ######
####################################
"""


@app.get("/api/users")
async def get_all_users(session: SessionDep):
    """
    Fetch all users from the database.
    """
    users = session.exec(select(User)).all()
    return users


@app.get("/api/users/active")
async def get_active_users(session: SessionDep):
    """
    Fetch the number of active users.
    """
    active_users_count = len(
        session.exec(select(User).where(User.isOnline == True)).all()
    )
    return {"active_users": active_users_count}


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, session: SessionDep):
    """
    Delete a user by their ID.
    """
    user = session.get(User, user_id)
    if not user:
        return fastapi.HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"success": True}


@app.put("/api/users/{user_id}")
async def update_user(user_id: int, user_data: dict, session: SessionDep):
    """
    Update a user by their ID using a raw dictionary to avoid validation issues.
    """
    # Fetch the user from the database
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    print(f"User: \n{user}")

    # Iterate over provided fields and update the user object
    for key, value in user_data.items():
        if hasattr(user, key):  # Only update valid attributes of the model
            setattr(user, key, value)

    # Log updated fields for debugging
    for key, value in user_data.items():
        print(f"Updated {key} to {value}")

    # Commit the changes to the database
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"success": True, "user": user}


"""
#########################################
##### PASSWORD-BASED AUTHENTICATION #####
#########################################
"""


@app.post("/api/auth/password/verify")
async def verify_password(request: Request):
    """
    Verify the user's password.
    """

    body = await request.json()
    username = body.get("username")
    password = body.get("password")

    if not username or not password:
        return {"authenticated": False, "error": "Missing username or password."}
    # password_hash = (bcrypt.hashpw(password=password, salt=bcrypt.gensalt(rounds=10)))
    # print(f"Password Hash: {password_hash}")

    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()

    if not user:
        return {"authenticated": False, "error": "User not found."}

    if user.password_hash != password:
        return {"authenticated": False, "error": "Invalid password."}

    return {
        "authenticated": True,
        "role": "user",
    }


@app.post("/api/auth/password/register")
async def register_user(request: Request):
    """
    Register a new user with a password. Assign a public/private key pair for the user.
    """
    try:
        # Get data from body
        body = await request.json()
        print(f"Body:\n{body}")
        username = body.get("username")
        email = body.get("email")
        phoneNumber = body.get("phone")
        role = body.get("role")
        password = body.get("password")
        isPWLess = body.get("isPWLess", False)

        # Print the data for debugging
        print(
            f"Got user from Body: \nUsername: {username} \nEmail: {email} \nPhone: {phoneNumber} \nRole:{role} \nPW: {password} \nisPWLess: {isPWLess}"
        )

        # Generate a new RSA key pair for the user
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()

        # Serialize the keys to PEM format
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),  # No encryption
        )

        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        # Encode the keys as base64 strings for storage
        private_key = base64.b64encode(private_pem).decode("utf-8")
        public_key = base64.b64encode(public_pem).decode("utf-8")

        # Generate a new Ethereum address for the user
        address = w3.eth.account.create().address

        # Generate DID for user
        did = f"did:key:{public_key}"

        # Register the user in the database
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
            isOnline=False,  # Default to offline for new users
        )

        # Print User
        print_user(user)

        with Session(engine) as session:
            session.add(user)
            session.commit()

        return {"success": True, "address": address}
    except Exception as e:
        return {"success": False, "error": str(e)}


"""
###################################
### PASSWORDLESS AUTHENTICATION ###
###################################
"""


@app.get("/api/auth/PKI/challenge")
async def get_challenge(address: str):
    """
    Generate a challenge message for the provided address.
    """
    if not Web3.isAddress(address):
        return fastapi.HTTPException(
            status_code=400, detail="Invalid Ethereum address."
        )

    # Generate a random challenge string
    challenge = secrets.token_hex(16)
    challenges[address] = challenge
    return {"message": challenge}


@app.post("/api/auth/PKI/sign")
async def sign_message(sign_request: SignRequest):
    """
    Sign the message using the in-memory challenge storage.
    """
    address = sign_request.address
    message = challenges.get(address)

    if not message or message != sign_request.message:
        return fastapi.HTTPException(
            status_code=400, detail="Invalid challenge or address."
        )

    return {"signature": "This would normally be handled by the user's wallet."}


@app.post("/api/auth/PKI/verify")
async def verify_login(verify_request: VerifyRequest):
    """
    Verify the login using the signed message and signature.
    """
    address = verify_request.address
    signature = verify_request.signature
    message = verify_request.message

    if not Web3.isAddress(address):
        return fastapi.HTTPException(
            status_code=400, detail="Invalid Ethereum address."
        )

    # Verify the signature
    is_valid = verify_signature(message, signature, address, w3)

    if not is_valid:
        return {"success": False, "error": "Invalid signature."}

    # Optionally, check if the user exists in the database
    with Session(engine) as session:
        statement = select(User).where(User.did == address)
        user = session.exec(statement).first()

    if not user:
        return {"success": False, "error": "User not found."}

    return {"success": True, "role": "user"}  # Role can be fetched from DB if needed.


"""
#####################################
#### CONTRACT INTERACTION ROUTES #### 
#####################################
"""


@app.post("/api/blockchain/registerDID")
async def register_did(address: str, public_key: str):
    """
    Register a DID on the blockchain.
    """
    try:
        tx = Contract.functions.registerDID(address, public_key).transact(
            {"from": address}
        )
        w3.eth.wait_for_transaction_receipt(tx)
        return {"success": True, "transaction": tx.hex()}
    except Exception as e:
        return fastapi.HTTPException(status_code=400, detail=str(e))


@app.post("/api/blockchain/issueVC")
async def issue_vc(issuer: str, holder: str, credential_hash: str):
    """
    Issue a verifiable credential (VC).
    """
    try:
        tx = Contract.functions.issueVC(holder, credential_hash).transact(
            {"from": issuer}
        )
        w3.eth.wait_for_transaction_receipt(tx)
        return {"success": True, "transaction": tx.hex()}
    except Exception as e:
        return fastapi.HTTPException(status_code=400, detail=str(e))


# Example usage in a route
@app.get("/contract-info")
async def contract_info():
    contract = initialize_contract()
    return {"contract_address": contract.address, "contract_abi": contract.abi}
