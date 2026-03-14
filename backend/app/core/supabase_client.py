from supabase import Client, create_client

from app.core.config import settings

# Initialize Supabase client once. The auth methods are synchronous but fast enough for our usage.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
