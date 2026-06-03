import duckdb
from .config import settings


def get_connection() -> duckdb.DuckDBPyConnection:
    return duckdb.connect(settings.duckdb_path, read_only=True)
