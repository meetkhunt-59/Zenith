from pydantic import BaseModel, EmailStr, Field


class AuthRequest(BaseModel):
  email: EmailStr = Field(..., examples=["user@example.com"])
  password: str = Field(..., min_length=6, max_length=128, examples=["StrongPass123!"])
  role: str | None = Field(None, examples=["inventory_manager"])


class AuthResponse(BaseModel):
  user_id: str
  email: EmailStr
  access_token: str | None
  refresh_token: str | None
  requires_email_confirmation: bool = False
