import secrets
from datetime import datetime, timedelta
from typing import Annotated, Dict

import fastapi
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Depends
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlmodel import Session, SQLModel, create_engine, select
from web3 import Web3

from model import SignRequest, Token, User, VerifyRequest
from utils import (
    ALGORITHM,
    SECRET_KEY,
    generate_public_key,
    get_accounts,
    get_loaded_accounts,
    initialize_contract,
    print_user,
    register_did,
    verify_signature,
)

# CORS Configuration
origins = ["*"]  # Allow all origins for now


# Secret key for encoding and decoding JWT tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
############### PROFILE ROUTES ###############
##############################################
"""


@app.post("/api/profile/")
async def get_user_profile(request: Request, session: SessionDep):
    # Assume since the user is logged in, the token is valid
    body = await request.json()
    token = body.get("token")
    print(f"token: {token}")

    # Get the user from the database based on the token
    with Session(engine) as session:
        statement = select(User).where(User.access_token == token)
        user = session.exec(statement).first()

    # Load user profile into User Object
    user = {
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "public_key": user.public_key,
        "private_key": user.private_key,
        "blockchain_address": user.blockchain_address,
        "did": user.did,
        "role": user.role,
        "isPWLess": user.isPWLess,
        "isOnline": user.isOnline,
    }

    print(user)

    return JSONResponse(status_code=200, content=user)


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


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"[VRFY_TKN] TOKEN email: {email}")
        if email is None:
            raise HTTPException(status_code=403, detail="Token is invalid or expired")
        return email
    except JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid or expired")


@app.post("/verify-token")
async def verify_user_token(request: Request):
    try:
        body = await request.json()
        print(f"[VRFY_TKN] Body: {body}")
        token = body.get("token")
        print(f"Verifying token: {token}")
        email = verify_token(token=token)
        # Set the rest of the users to offline
        with Session(engine) as session:
            statement = select(User).where(User.email != email)
            users = session.exec(statement).all()
            for user in users:
                user.isOnline = False
                session.add(user)
                session.commit()
                session.refresh(user)

        # Set Token in the DB
        with Session(engine) as session:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            user.access_token = token
            user.isOnline = True
            session.add(user)
            session.commit()
            session.refresh(user)

        return JSONResponse(status_code=200, content="Token is valid")
    except Exception as e:
        print(e)
        return JSONResponse(status_code=400, content="Error verifying token.")


# Helper function to create the JWT token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@app.post("/token", response_model=Token)
async def login_for_access_token(request: Request, db: Session = Depends(get_session)):

    # Grab the role from the request body
    body = await request.json()
    role = body.get("email").split("@")[1].split(".")[0]

    # Use the existing `verify_password` function for user authentication
    authentication_result = await verify_password(request, db)

    print(f"Authentication Result: {authentication_result}")

    if not authentication_result.get("authenticated"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=authentication_result.get("error", "Invalid credentials"),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # If authentication is successful, return the token
    return JSONResponse(
        content={
            "access_token": authentication_result["access_token"],
            "role": role,
            "token_type": "bearer",
        }
    )


# Function to verify password and authenticate user
async def verify_password(request: Request, db: Session) -> Dict:
    body = await request.json()
    email = body.get("email")
    password = body.get("password")

    print(f"[VRFY_PW] Body: {body}")

    if not email or not password:
        return {"authenticated": False, "error": "Missing email or password in BODY"}

    # Query user from the database
    statement = select(User).where(User.email == email)
    user = db.exec(statement).first()

    # If user not found or password is incorrect, return error
    if not user or password != user.password_hash:
        return {"authenticated": False, "error": "Invalid email or password"}

    # if not user or not pwd_context.verify(
    #     password, user.password_hash
    # ):  # Use bcrypt to verify password hash
    #     return {"authenticated": False, "error": "Invalid email or password"}

    role = email.split("@")[1].split(".")[0]
    if role not in ["admin", "user"]:
        role = "user"

    # Generate JWT token
    access_token = create_access_token(data={"sub": user.email, "role": role})

    return {
        "authenticated": True,
        "access_token": access_token,
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

        # print(f"Users in DB: {users}")

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
        # did = register_did(address, public_key)
        did = f"did:key:{public_key}"
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


@app.get("/contract-info")
async def contract_info():
    contract = initialize_contract()
    return {"contract_address": contract.address, "contract_abi": contract.abi}


"""
#############################################
######### TEST UTIL FUNCTIONS ###############
#############################################
"""


@app.get("/test/jsonaccounts")
async def json_accounts():
    accounts = get_accounts()
    return {"accounts": accounts}


@app.get("/test/loadedaccounts")
async def loaded_accounts():
    accounts = get_loaded_accounts()
    return {"accounts": accounts}
