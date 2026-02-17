"""
SQLAlchemy ORM models for the CRM + Knowledge Base system.

All models use SQLAlchemy 2.0 mapped_column style with PostgreSQL-specific
types (ARRAY, JSONB). UUIDs are used as primary keys throughout.
"""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)

if TYPE_CHECKING:
    pass


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """Declarative base for all models."""
    pass


# ---------------------------------------------------------------------------
# Python Enums
# ---------------------------------------------------------------------------

class ClientStatus(str, enum.Enum):
    active = "active"
    dormant = "dormant"
    prospect = "prospect"
    lost = "lost"


class ClientValueTier(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class ContactPreferredChannel(str, enum.Enum):
    email = "email"
    phone = "phone"
    chat = "chat"
    in_person = "in_person"


class ContactStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class ContractType(str, enum.Enum):
    retainer = "retainer"
    project = "project"
    license = "license"
    other = "other"


class ContractStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    expired = "expired"
    terminated = "terminated"


class OpportunityStage(str, enum.Enum):
    prospecting = "prospecting"
    qualification = "qualification"
    proposal = "proposal"
    negotiation = "negotiation"
    closed_won = "closed_won"
    closed_lost = "closed_lost"


class RiskType(str, enum.Enum):
    churn = "churn"
    payment = "payment"
    satisfaction = "satisfaction"
    competitive = "competitive"
    operational = "operational"
    legal = "legal"
    other = "other"


class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ProjectType(str, enum.Enum):
    website = "website"
    social_campaign = "social_campaign"
    rebrand = "rebrand"
    video_series = "video_series"
    content_production = "content_production"
    other = "other"


class ProjectStatus(str, enum.Enum):
    planning = "planning"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class SuccessFlag(str, enum.Enum):
    success = "success"
    failure = "failure"
    neutral = "neutral"


class DeliverableType(str, enum.Enum):
    web_page = "web_page"
    KV = "KV"
    video = "video"
    social_post = "social_post"
    report = "report"
    other = "other"


class DeliverableStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    review = "review"
    completed = "completed"


class ProjectTeamRole(str, enum.Enum):
    AE = "AE"
    PM = "PM"
    designer = "designer"
    developer = "developer"
    copywriter = "copywriter"
    strategist = "strategist"
    other = "other"


class MilestoneStatus(str, enum.Enum):
    upcoming = "upcoming"
    completed = "completed"
    delayed = "delayed"


class BrandProfileStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    archived = "archived"


class TasteExampleType(str, enum.Enum):
    campaign = "campaign"
    KV = "KV"
    video = "video"
    social_post = "social_post"
    website = "website"
    copy = "copy"


class TasteExampleCategory(str, enum.Enum):
    likes = "likes"
    dislikes = "dislikes"


class FeedbackSource(str, enum.Enum):
    email = "email"
    meeting_notes = "meeting_notes"
    form = "form"
    chat = "chat"
    phone = "phone"
    other = "other"


class Sentiment(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class FeedbackSeverity(str, enum.Enum):
    info = "info"
    minor = "minor"
    major = "major"
    critical = "critical"


class FeedbackStatus(str, enum.Enum):
    new = "new"
    reviewed = "reviewed"
    converted_to_rule = "converted_to_rule"
    converted_to_pattern = "converted_to_pattern"
    ignored = "ignored"


class RuleType(str, enum.Enum):
    hard = "hard"
    soft = "soft"


class RuleStatus(str, enum.Enum):
    active = "active"
    deprecated = "deprecated"


class PatternScope(str, enum.Enum):
    global_ = "global"
    segment = "segment"
    client = "client"


class PatternCategory(str, enum.Enum):
    error_pattern = "error_pattern"
    best_practice = "best_practice"
    playbook = "playbook"
    standard = "standard"


class UserRole(str, enum.Enum):
    admin = "admin"
    account_director = "account_director"
    AE = "AE"
    PM = "PM"
    designer = "designer"
    developer = "developer"
    finance = "finance"
    guest = "guest"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class User(Base):
    """Internal platform user."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[Optional[str]] = mapped_column(String(256))
    name: Mapped[Optional[str]] = mapped_column(String(200))
    role: Mapped[UserRole] = mapped_column(
        String(30), nullable=False, default=UserRole.guest
    )
    status: Mapped[UserStatus] = mapped_column(
        String(20), nullable=False, default=UserStatus.active
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    opportunities: Mapped[List["Opportunity"]] = relationship(
        back_populates="owner", foreign_keys="Opportunity.owner_id"
    )
    client_risks: Mapped[List["ClientRisk"]] = relationship(
        back_populates="marked_by_user", foreign_keys="ClientRisk.marked_by"
    )
    project_teams: Mapped[List["ProjectTeam"]] = relationship(
        back_populates="user"
    )
    taste_examples: Mapped[List["TasteExample"]] = relationship(
        back_populates="added_by_user", foreign_keys="TasteExample.added_by"
    )
    feedback_processed: Mapped[List["FeedbackEvent"]] = relationship(
        back_populates="processed_by_user",
        foreign_keys="FeedbackEvent.processed_by",
    )
    client_rules_created: Mapped[List["ClientRule"]] = relationship(
        back_populates="created_by_user",
        foreign_keys="ClientRule.created_by",
    )
    patterns_created: Mapped[List["Pattern"]] = relationship(
        back_populates="created_by_user",
        foreign_keys="Pattern.created_by",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class Client(Base):
    """A client / account in the CRM."""

    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    legal_name: Mapped[Optional[str]] = mapped_column(String(300))
    industry: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    region: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    languages: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    status: Mapped[ClientStatus] = mapped_column(
        String(20), nullable=False, default=ClientStatus.prospect
    )
    timezone: Mapped[Optional[str]] = mapped_column(String(50))
    website_url: Mapped[Optional[str]] = mapped_column(String(500))
    company_size: Mapped[Optional[str]] = mapped_column(String(50))
    parent_company: Mapped[Optional[str]] = mapped_column(String(300))
    internal_notes: Mapped[Optional[str]] = mapped_column(Text)
    client_value_tier: Mapped[Optional[ClientValueTier]] = mapped_column(
        String(2)
    )
    health_score: Mapped[int] = mapped_column(
        Integer,
        default=100,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    __table_args__ = (
        CheckConstraint(
            "health_score >= 0 AND health_score <= 100",
            name="ck_clients_health_score_range",
        ),
    )

    # Relationships
    contacts: Mapped[List["Contact"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    contracts: Mapped[List["Contract"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    opportunities: Mapped[List["Opportunity"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    risks: Mapped[List["ClientRisk"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    health_score_history: Mapped[List["HealthScoreHistory"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    projects: Mapped[List["Project"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    brand_profile: Mapped[Optional["BrandProfile"]] = relationship(
        back_populates="client", uselist=False, cascade="all, delete-orphan"
    )
    taste_examples: Mapped[List["TasteExample"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    feedback_events: Mapped[List["FeedbackEvent"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    rules: Mapped[List["ClientRule"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    patterns: Mapped[List["Pattern"]] = relationship(
        back_populates="client",
    )

    def __repr__(self) -> str:
        return f"<Client {self.name}>"


class Contact(Base):
    """A contact person associated with a client."""

    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[Optional[str]] = mapped_column(String(150))
    email: Mapped[Optional[str]] = mapped_column(String(320))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    preferred_channel: Mapped[Optional[ContactPreferredChannel]] = mapped_column(
        String(20)
    )
    decision_power: Mapped[Optional[int]] = mapped_column(Integer)
    is_primary: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    status: Mapped[ContactStatus] = mapped_column(
        String(20), nullable=False, default=ContactStatus.active
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    __table_args__ = (
        CheckConstraint(
            "decision_power >= 0 AND decision_power <= 3",
            name="ck_contacts_decision_power_range",
        ),
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="contacts")

    def __repr__(self) -> str:
        return f"<Contact {self.name}>"


class Contract(Base):
    """A contract tied to a client."""

    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[ContractType] = mapped_column(String(20), nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    value: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="HKD"
    )
    status: Mapped[ContractStatus] = mapped_column(
        String(20), nullable=False, default=ContractStatus.draft
    )
    document_ref: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="contracts")

    def __repr__(self) -> str:
        return f"<Contract {self.id} ({self.type})>"


class Opportunity(Base):
    """A sales opportunity linked to a client."""

    __tablename__ = "opportunities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description: Mapped[Optional[str]] = mapped_column(Text)
    stage: Mapped[OpportunityStage] = mapped_column(
        String(20), nullable=False, default=OpportunityStage.prospecting
    )
    estimated_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2)
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="HKD"
    )
    probability: Mapped[Optional[int]] = mapped_column(Integer)
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "probability >= 0 AND probability <= 100",
            name="ck_opportunities_probability_range",
        ),
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="opportunities")
    owner: Mapped[Optional["User"]] = relationship(
        back_populates="opportunities", foreign_keys=[owner_id]
    )

    def __repr__(self) -> str:
        return f"<Opportunity {self.id} ({self.stage})>"


class ClientRisk(Base):
    """A risk flag associated with a client."""

    __tablename__ = "client_risks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    risk_type: Mapped[RiskType] = mapped_column(String(30), nullable=False)
    severity: Mapped[Severity] = mapped_column(String(10), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    marked_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    marked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="risks")
    marked_by_user: Mapped[Optional["User"]] = relationship(
        back_populates="client_risks", foreign_keys=[marked_by]
    )

    def __repr__(self) -> str:
        return f"<ClientRisk {self.risk_type} ({self.severity})>"


class HealthScoreHistory(Base):
    """Historical snapshot of a client's health score."""

    __tablename__ = "health_score_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    factors: Mapped[Optional[dict]] = mapped_column(JSONB)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    client: Mapped["Client"] = relationship(
        back_populates="health_score_history"
    )

    def __repr__(self) -> str:
        return f"<HealthScoreHistory client={self.client_id} score={self.score}>"


class Project(Base):
    """A project executed for a client."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    type: Mapped[ProjectType] = mapped_column(String(30), nullable=False)
    brief: Mapped[Optional[str]] = mapped_column(Text)
    brief_documents: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[ProjectStatus] = mapped_column(
        String(20), nullable=False, default=ProjectStatus.planning
    )
    success_flag: Mapped[Optional[SuccessFlag]] = mapped_column(String(10))
    success_notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="projects")
    deliverables: Mapped[List["ProjectDeliverable"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    team_members: Mapped[List["ProjectTeam"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    milestones: Mapped[List["ProjectMilestone"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    feedback_events: Mapped[List["FeedbackEvent"]] = relationship(
        back_populates="project"
    )

    def __repr__(self) -> str:
        return f"<Project {self.name}>"


class ProjectDeliverable(Base):
    """A deliverable within a project."""

    __tablename__ = "project_deliverables"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[DeliverableType] = mapped_column(String(20), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[DeliverableStatus] = mapped_column(
        String(20), nullable=False, default=DeliverableStatus.not_started
    )
    file_refs: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="deliverables")

    def __repr__(self) -> str:
        return f"<ProjectDeliverable {self.id} ({self.type})>"


class ProjectTeam(Base):
    """A team member assignment to a project."""

    __tablename__ = "project_team"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[ProjectTeamRole] = mapped_column(
        String(20), nullable=False
    )
    allocation: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "project_id", "user_id", name="uq_project_team_project_user"
        ),
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="team_members")
    user: Mapped["User"] = relationship(back_populates="project_teams")

    def __repr__(self) -> str:
        return f"<ProjectTeam project={self.project_id} user={self.user_id}>"


class ProjectMilestone(Base):
    """A milestone within a project."""

    __tablename__ = "project_milestones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[MilestoneStatus] = mapped_column(
        String(20), nullable=False, default=MilestoneStatus.upcoming
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="milestones")

    def __repr__(self) -> str:
        return f"<ProjectMilestone {self.name}>"


class BrandProfile(Base):
    """Brand guidelines and identity for a client (one-to-one)."""

    __tablename__ = "brand_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    brand_tone: Mapped[Optional[str]] = mapped_column(Text)
    brand_values: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    key_messages: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    do_list: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    dont_list: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    legal_sensitivities: Mapped[Optional[str]] = mapped_column(Text)
    visual_rules: Mapped[Optional[dict]] = mapped_column(JSONB)
    documents: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    status: Mapped[BrandProfileStatus] = mapped_column(
        String(20), nullable=False, default=BrandProfileStatus.draft
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="brand_profile")

    def __repr__(self) -> str:
        return f"<BrandProfile client={self.client_id} v{self.version}>"


class TasteExample(Base):
    """A creative taste reference (like/dislike) for a client."""

    __tablename__ = "taste_examples"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[TasteExampleType] = mapped_column(
        String(20), nullable=False
    )
    category: Mapped[TasteExampleCategory] = mapped_column(
        String(10), nullable=False
    )
    media_ref: Mapped[Optional[str]] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text)
    why_client_likes_or_dislikes: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    added_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="taste_examples")
    added_by_user: Mapped[Optional["User"]] = relationship(
        back_populates="taste_examples", foreign_keys=[added_by]
    )

    def __repr__(self) -> str:
        return f"<TasteExample {self.type} ({self.category})>"


class FeedbackEvent(Base):
    """A feedback event captured from a client."""

    __tablename__ = "feedback_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        index=True,
    )
    source: Mapped[FeedbackSource] = mapped_column(
        String(20), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    sentiment: Mapped[Optional[Sentiment]] = mapped_column(String(10))
    sentiment_score: Mapped[Optional[int]] = mapped_column(Integer)
    topics: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    severity: Mapped[Optional[FeedbackSeverity]] = mapped_column(String(10))
    extracted_requirements: Mapped[Optional[dict]] = mapped_column(JSONB)
    status: Mapped[FeedbackStatus] = mapped_column(
        String(30), nullable=False, default=FeedbackStatus.new
    )
    processed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    processing_notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    client: Mapped["Client"] = relationship(
        back_populates="feedback_events"
    )
    project: Mapped[Optional["Project"]] = relationship(
        back_populates="feedback_events"
    )
    processed_by_user: Mapped[Optional["User"]] = relationship(
        back_populates="feedback_processed", foreign_keys=[processed_by]
    )

    def __repr__(self) -> str:
        return f"<FeedbackEvent {self.id} ({self.source})>"


class ClientRule(Base):
    """A rule derived from client feedback or preferences."""

    __tablename__ = "client_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    origin_feedback_ids: Mapped[Optional[list]] = mapped_column(
        ARRAY(UUID(as_uuid=True))
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rule_type: Mapped[RuleType] = mapped_column(String(10), nullable=False)
    applies_to: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    validation_type: Mapped[Optional[str]] = mapped_column(String(50))
    validation_pattern: Mapped[Optional[str]] = mapped_column(Text)
    priority: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3
    )
    status: Mapped[RuleStatus] = mapped_column(
        String(20), nullable=False, default=RuleStatus.active
    )
    deprecated_reason: Mapped[Optional[str]] = mapped_column(Text)
    deprecated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    usage_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "priority >= 1 AND priority <= 5",
            name="ck_client_rules_priority_range",
        ),
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="rules")
    created_by_user: Mapped[Optional["User"]] = relationship(
        back_populates="client_rules_created", foreign_keys=[created_by]
    )

    def __repr__(self) -> str:
        return f"<ClientRule {self.id} ({self.rule_type})>"


class Pattern(Base):
    """A reusable pattern or best practice (global, segment, or client-scoped)."""

    __tablename__ = "patterns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scope: Mapped[PatternScope] = mapped_column(String(10), nullable=False)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="SET NULL"),
        index=True,
    )
    segment_tags: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[PatternCategory] = mapped_column(
        String(20), nullable=False
    )
    trigger_conditions: Mapped[Optional[str]] = mapped_column(Text)
    recommended_actions: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    example_cases: Mapped[Optional[dict]] = mapped_column(JSONB)
    applicable_channels: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    usage_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    effectiveness_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2)
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    client: Mapped[Optional["Client"]] = relationship(
        back_populates="patterns"
    )
    created_by_user: Mapped[Optional["User"]] = relationship(
        back_populates="patterns_created", foreign_keys=[created_by]
    )

    def __repr__(self) -> str:
        return f"<Pattern {self.name} ({self.scope})>"


class AuditLog(Base):
    """Immutable audit trail for all user actions."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[Optional[str]] = mapped_column(String(50))
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True)
    )
    old_value: Mapped[Optional[dict]] = mapped_column(JSONB)
    new_value: Mapped[Optional[dict]] = mapped_column(JSONB)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        back_populates="audit_logs"
    )

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} by {self.user_id}>"


# ---------------------------------------------------------------------------
# Debug Enums
# ---------------------------------------------------------------------------


class DebugSubjectType(str, enum.Enum):
    web_page = "web_page"
    design = "design"
    video = "video"
    social_post = "social_post"
    agent_workflow = "agent_workflow"
    document = "document"
    other = "other"


class DebugSessionStatus(str, enum.Enum):
    open = "open"
    in_review = "in_review"
    addressed = "addressed"
    ignored = "ignored"
    archived = "archived"


class DebugOverallStatus(str, enum.Enum):
    pass_ = "pass"
    warning = "warning"
    fail = "fail"


class IssueArea(str, enum.Enum):
    WebPerf = "WebPerf"
    WebQC = "WebQC"
    Design = "Design"
    Video = "Video"
    Social = "Social"
    Brand = "Brand"
    Logic = "Logic"
    AgentBehavior = "AgentBehavior"


class IssueSeverity(str, enum.Enum):
    critical = "critical"
    major = "major"
    minor = "minor"
    info = "info"


class IssuePriority(str, enum.Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class ResolutionStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    accepted_risk = "accepted_risk"
    wont_fix = "wont_fix"
    duplicate = "duplicate"


class BusinessImpact(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"
    none = "none"


class TraceStepType(str, enum.Enum):
    llm_call = "llm_call"
    tool_call = "tool_call"
    decision = "decision"
    eval = "eval"
    api_call = "api_call"
    other = "other"


# ---------------------------------------------------------------------------
# Debug Models
# ---------------------------------------------------------------------------


class DebugModuleDefinition(Base):
    """Registry of available debug modules."""

    __tablename__ = "debug_module_definitions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    applicable_subject_types: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    version: Mapped[str] = mapped_column(
        String(20), nullable=False, default="1.0"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<DebugModuleDefinition {self.id}>"


class DebugSession(Base):
    """A single debug task executed against a deliverable."""

    __tablename__ = "debug_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
    )
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        index=True,
    )
    subject_type: Mapped[DebugSubjectType] = mapped_column(
        String(20), nullable=False, default=DebugSubjectType.other
    )
    subject_ref: Mapped[Optional[str]] = mapped_column(Text)
    modules_invoked: Mapped[Optional[dict]] = mapped_column(JSONB)
    overall_score: Mapped[Optional[int]] = mapped_column(Integer)
    overall_status: Mapped[Optional[DebugOverallStatus]] = mapped_column(
        String(10)
    )
    overall_summary: Mapped[Optional[str]] = mapped_column(Text)
    kb_entries_used: Mapped[Optional[dict]] = mapped_column(JSONB)
    status: Mapped[DebugSessionStatus] = mapped_column(
        String(20), nullable=False, default=DebugSessionStatus.open
    )
    status_notes: Mapped[Optional[str]] = mapped_column(Text)
    initiated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    report_ref: Mapped[Optional[str]] = mapped_column(Text)
    trace_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "overall_score >= 0 AND overall_score <= 100",
            name="ck_debug_sessions_score_range",
        ),
    )

    # Relationships
    project: Mapped["Project"] = relationship()
    client: Mapped["Client"] = relationship()
    initiated_by_user: Mapped[Optional["User"]] = relationship(
        foreign_keys=[initiated_by]
    )
    issues: Mapped[List["DebugIssue"]] = relationship(
        back_populates="debug_session", cascade="all, delete-orphan"
    )
    trace_steps: Mapped[List["DebugTraceStep"]] = relationship(
        back_populates="debug_session", cascade="all, delete-orphan",
        foreign_keys="DebugTraceStep.debug_session_id",
    )

    def __repr__(self) -> str:
        return f"<DebugSession {self.id} ({self.status})>"


class DebugIssue(Base):
    """A specific issue found during a debug session."""

    __tablename__ = "debug_issues"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    debug_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("debug_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        index=True,
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
    )
    module: Mapped[str] = mapped_column(String(100), nullable=False)
    area: Mapped[IssueArea] = mapped_column(String(20), nullable=False)
    severity: Mapped[IssueSeverity] = mapped_column(
        String(10), nullable=False, default=IssueSeverity.info
    )
    finding: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[Optional[dict]] = mapped_column(JSONB)
    recommendation: Mapped[Optional[str]] = mapped_column(Text)
    priority: Mapped[IssuePriority] = mapped_column(
        String(5), nullable=False, default=IssuePriority.P2
    )
    related_rule_ids: Mapped[Optional[list]] = mapped_column(
        ARRAY(UUID(as_uuid=True))
    )
    related_pattern_ids: Mapped[Optional[list]] = mapped_column(
        ARRAY(UUID(as_uuid=True))
    )
    score_impact: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    business_impact: Mapped[Optional[BusinessImpact]] = mapped_column(
        String(10)
    )
    user_impact: Mapped[Optional[str]] = mapped_column(Text)
    resolution_status: Mapped[ResolutionStatus] = mapped_column(
        String(20), nullable=False, default=ResolutionStatus.open
    )
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    debug_session: Mapped["DebugSession"] = relationship(
        back_populates="issues"
    )
    client: Mapped["Client"] = relationship()
    project: Mapped["Project"] = relationship()
    assigned_to_user: Mapped[Optional["User"]] = relationship(
        foreign_keys=[assigned_to]
    )

    def __repr__(self) -> str:
        return f"<DebugIssue {self.id} ({self.severity})>"


class DebugTraceStep(Base):
    """A single step in a debug session trace (optional detailed logging)."""

    __tablename__ = "debug_trace_steps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    debug_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("debug_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_step_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("debug_trace_steps.id", ondelete="SET NULL"),
    )
    type: Mapped[TraceStepType] = mapped_column(
        String(20), nullable=False, default=TraceStepType.other
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    input_summary: Mapped[Optional[str]] = mapped_column(Text)
    output_summary: Mapped[Optional[str]] = mapped_column(Text)
    raw_input_ref: Mapped[Optional[str]] = mapped_column(Text)
    raw_output_ref: Mapped[Optional[str]] = mapped_column(Text)
    model: Mapped[Optional[str]] = mapped_column(String(100))
    temperature: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 2))
    token_usage: Mapped[Optional[dict]] = mapped_column(JSONB)
    cost_estimate: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 6))
    tool_name: Mapped[Optional[str]] = mapped_column(String(100))
    tool_args: Mapped[Optional[dict]] = mapped_column(JSONB)
    tool_result: Mapped[Optional[dict]] = mapped_column(JSONB)
    error_flag: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    error_type: Mapped[Optional[str]] = mapped_column(String(100))
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    debug_session: Mapped["DebugSession"] = relationship(
        back_populates="trace_steps",
        foreign_keys=[debug_session_id],
    )
    parent_step: Mapped[Optional["DebugTraceStep"]] = relationship(
        remote_side="DebugTraceStep.id",
        foreign_keys=[parent_step_id],
    )

    def __repr__(self) -> str:
        return f"<DebugTraceStep {self.name} ({self.type})>"


class ChatMessage(Base):
    """Persisted chatbot conversation message."""

    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    session_id: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls: Mapped[Optional[dict]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship()

    def __repr__(self) -> str:
        return f"<ChatMessage {self.role} ({self.session_id})>"
