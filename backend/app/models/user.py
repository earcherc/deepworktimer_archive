from datetime import date, datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .daily_goal import DailyGoal
    from .study_block import StudyBlock
    from .study_category import StudyCategory


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    NOT_SPECIFIED = "NOT_SPECIFIED"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    profile_photo_key: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    study_blocks: List["StudyBlock"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "delete"}
    )
    daily_goals: List["DailyGoal"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "delete"}
    )
    study_categories: List["StudyCategory"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "delete"}
    )


User.update_forward_refs()
