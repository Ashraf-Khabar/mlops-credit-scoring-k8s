import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Kubernetes injectera ces valeurs via les Secrets/ConfigMaps
    DB_USER: str = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "db-service") # Le nom du K8s Service K8s
    DB_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME: str = os.getenv("POSTGRES_DB", "credit_db")

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()