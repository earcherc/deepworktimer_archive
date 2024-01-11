"""Optional study block fields

Revision ID: 57d14e441171
Revises: 077e1b37396b
Create Date: 2024-01-11 22:07:08.473376

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '57d14e441171'
down_revision: Union[str, None] = '077e1b37396b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('studyblock', sa.Column('is_countdown', sa.Boolean(), nullable=False))
    op.alter_column('studyblock', 'end',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    op.alter_column('studyblock', 'rating',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=True)
    op.drop_column('studyblock', 'title')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('studyblock', sa.Column('title', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.alter_column('studyblock', 'rating',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=False)
    op.alter_column('studyblock', 'end',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    op.drop_column('studyblock', 'is_countdown')
    # ### end Alembic commands ###
