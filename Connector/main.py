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
from web3.exceptions import ContractLogicError

from model import SignRequest, Token, User, VerifyRequest
from utils import (
    ALGORITHM,
    SECRET_KEY,
    generate_public_key,
    get_accounts,
    get_did,
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
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))  # Hardhat testnet

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
    """
    Update a user's information based on the user_id and the new data provided in the request body.
    """
    # Fetch user from the database
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    print(f"Updating user ({user.email})")
    print(f"Changes:")

    # Update user attributes based on the user_data
    for key, value in user_data.items():
        if hasattr(user, key):  # Only update valid attributes
            old_value = getattr(user, key)
            setattr(user, key, value)
            if old_value != value:
                print(f"  {key}: {old_value} -> {value}")

    # If the user is passwordless, generate keys
    if user.isPWLess:
        print(f"Checking if any address is available")

        accounts = get_accounts()
        address = None
        private_key = None

        # Get the list of existing users with blockchain addresses
        users_in_db = session.exec(select(User)).all()

        for account in accounts:
            # Ensure the address is not already in use
            if account["account"] not in [
                user.blockchain_address for user in users_in_db
            ]:
                address = account["account"]
                private_key = account["privateKey"]
                break

        if not address:
            return {"success": False, "error": "No available accounts."}

        # Generate the public key from the private key
        public_key = generate_public_key(private_key, isBase64=False, isPEM=False)

        # Register DID (just simulating here)
        did = f"did:key:{public_key}"

        # Update user blockchain-related fields
        user.blockchain_address = address
        user.private_key = private_key
        user.public_key = public_key

        print(
            f"SUCCESS! Generated:\n Address: {address}\n Private Key: {private_key}\n Public Key: {public_key}\n DID: {did}"
        )

    elif not user.isPWLess:
        # Clear blockchain-related fields if not passwordless
        user.public_key = None
        user.private_key = None
        user.blockchain_address = None

    # Add and commit the changes to the database
    session.add(user)
    session.commit()  # Ensure changes are committed to DB
    session.refresh(user)  # Refresh the user object to get the latest data from DB

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

        user = User(
            username=username,
            email=email,
            phone=phoneNumber,
            password_hash=password,
            role=role,
            isPWLess=False,  # Only enable passwordless when user triggers it
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

        return {"success": True}
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
    if not w3.is_address(address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address.")

    # Generate a random challenge for the user
    challenge = secrets.token_hex(32)
    challenges[address] = challenge
    print(f"Generated challenge for {address}: {challenge}")
    return {"message": challenge}


from web3 import Web3


# Helper function to verify the signature (updated to work with message hash and Ethereum prefix)
def verify_signature(message: str, signature: str, address: str, web3: Web3) -> bool:
    try:
        # Ensure the message is a hex string, if not, raise an error
        if message.startswith("0x"):
            message_bytes = bytes.fromhex(
                message[2:]
            )  # Convert from hex to bytes (ignore '0x')
        else:
            # If it's a string message, encode it as bytes
            message_bytes = message.encode("utf-8")

        # Step 1: Hash the message
        message_hash = web3.solidity_keccak(
            ["bytes"], [message_bytes]
        )  # keccak256 of the message

        # Step 2: Prefix the message hash with the Ethereum message prefix
        prefix = f"\x19Ethereum Signed Message:\n{len(message)}".encode("utf-8")
        prefixed_hash = web3.solidity_keccak(
            ["bytes", "bytes"], [prefix, message_bytes]
        )

        # Step 3: Recover the address from the signature
        recovered_address = web3.eth.account._recover_hash(
            prefixed_hash, signature=signature
        )

        # Step 4: Compare the recovered address with the provided address
        return recovered_address.lower() == address.lower()
    except Exception as e:
        print(f"Error: {e}")
        return False


@app.post("/api/auth/PKI/sign")
async def sign_message(request: Request):
    body = await request.json()
    address = body.get("address")
    message = body.get("message")
    originalMessage = challenges.get(address)  # This is the original challenge message
    signature = body.get("signature")

    print(f"Original Message: {originalMessage} {type(originalMessage)}")
    print(f"Message:          {message} {type(message)}")
    print(f"Message Length: {len(message)}")
    print(f"Signature: {signature}")

    if not message or message != originalMessage:
        raise HTTPException(status_code=400, detail="Invalid challenge or address.")

    # Verify the signature using the message hash with Ethereum prefix
    is_valid = verify_signature(message, signature, address, w3)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature.")

    return {"authenticated": True, "message": "Signature is valid, user authenticated."}
