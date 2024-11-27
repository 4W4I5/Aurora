from pydantic import BaseModel
from sqlmodel import Field, SQLModel


# Models
class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str
    email: str
    phone: str
    password_hash: str
    public_key: str
    private_key: str
    blockchain_address: str
    role: str
    did: str
    access_token: str = None
    isPWLess: bool
    isOnline: bool


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ChallengeRequest(BaseModel):
    address: str


class SignRequest(BaseModel):
    address: str
    message: str


class VerifyRequest(BaseModel):
    address: str
    message: str
    signature: str
