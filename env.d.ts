declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    // Discord (used by API routes)
    DISCORD_BOT_TOKEN?: string;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    // Bot integration
    PATROL_BOT_URL?: string;
    PATROL_BOT_SECRET?: string;
    PATROL_BOT_PORT?: string;
    PATROL_CHANNEL_ID?: string;
  }
}