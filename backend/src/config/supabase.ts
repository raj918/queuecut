import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './env';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (ENV.SUPABASE_URL && (ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY)) {
    try {
      const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;
      supabaseClient = createClient(ENV.SUPABASE_URL, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('✅ Supabase client initialized for Realtime notifications and subscriptions');
      return supabaseClient;
    } catch (err) {
      console.warn('⚠️ Could not initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

/**
 * Broadcast an authorized real-time event to Supabase channel
 */
export async function broadcastRealtimeEvent(channelName: string, event: string, payload: Record<string, any>) {
  const supabase = getSupabase();
  if (!supabase) {
    // If Supabase is not configured, silently log in development
    return;
  }

  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (error) {
    console.error(`⚠️ Failed to broadcast to channel ${channelName}:`, error);
  }
}
