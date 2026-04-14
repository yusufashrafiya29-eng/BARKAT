from supabase import create_client, Client
from core.config import settings

def get_supabase_client() -> Client:
    """Returns the initialized Supabase client."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

supabase_client: Client = get_supabase_client()
