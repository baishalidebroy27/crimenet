from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "CrimeNet AI"
    debug: bool = True
    secret_key: str
    
    neo4j_uri: str
    neo4j_user: str
    neo4j_password: str
    
    mongodb_url: str
    mongodb_db: str
    
    redis_url: str
    
    upload_dir: str
    max_file_size_mb: int = 10
    
    model_path: str
    
    cors_origins: str
    
    log_level: str = "INFO"
    
    web3_rpc_url: str = ""
    web3_private_key: str = ""
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
