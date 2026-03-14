from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Role, User


async def get_or_create_role(db: AsyncSession, role_name: str) -> Role:
    stmt = select(Role).where(Role.name == role_name)
    role = (await db.execute(stmt)).scalar_one_or_none()
    if role:
        return role

    role = Role(name=role_name)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


async def upsert_user(db: AsyncSession, supabase_user_id: str, email: str, role_name: str) -> User:
    uid = UUID(str(supabase_user_id))

    user = await db.get(User, uid)
    if user:
        return user

    role = await get_or_create_role(db, role_name)
    user = User(id=uid, email=email, role_id=role.id)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
