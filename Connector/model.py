from pydantic import BaseModel
from sqlmodel import Field, SQLModel


# Models
class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str
    email: str
    phone: str
    password_hash: str
    public_key: str = Field(nullable=True)
    private_key: str = Field(nullable=True)
    blockchain_address: str = Field(nullable=True)
    role: str
    did: str = Field(nullable=True)
    access_token: str = Field(default=None, nullable=True)
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


class RegisterDID(BaseModel):
    user: str
    public_key: str


class IssueVC(BaseModel):
    holder: str
    credential_hash: str


class RevokeVC(BaseModel):
    holder: str
    credential_hash: str
