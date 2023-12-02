from fastapi import FastAPI, Request
from redis.asyncio import Redis
from strawberry.fastapi import GraphQLRouter
from .graphql.schemas.schema import schema
from .auth.auth_routes import router as auth_router
from .auth.auth_utils import get_user_id_from_session
from contextlib import asynccontextmanager


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    redis_client = Redis.from_url("redis://redis:6379")
    app.state.redis = redis_client
    yield
    await redis_client.close()


app = FastAPI(lifespan=app_lifespan)


# Middleware for authentication
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    session_id = request.cookies.get("session_id")
    if session_id:
        redis = request.app.state.redis
        user_id = await get_user_id_from_session(redis, session_id)
        if user_id:
            request.state.user_id = int(user_id)
            response = await call_next(request)
            return response
    return await call_next(request)


# Include routers
app.include_router(auth_router, prefix="/auth")
app.add_route("/graphql", GraphQLRouter(schema))
