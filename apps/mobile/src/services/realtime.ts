import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// If Supabase URL / Key are not configured in local mobile dev, it degrades gracefully
const SUPABASE_URL = 'https://dummy-project.supabase.co';
const SUPABASE_ANON_KEY = 'dummy-anon-key';

export class RealtimeService {
  private static client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to customer booking status updates
   */
  static subscribeToBooking(
    bookingId: string,
    onStatusChange: (payload: any) => void,
    onConnectionChange?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => void
  ) {
    const channelName = `booking_${bookingId}`;

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.client.channel(channelName);

    channel
      .on('broadcast', { event: 'STATUS_UPDATED' }, (res) => {
        onStatusChange(res.payload);
      })
      .subscribe((status) => {
        if (onConnectionChange) {
          onConnectionChange(status as any);
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to salon owner queue updates
   */
  static subscribeToSalonQueue(
    salonId: string,
    onQueueUpdate: (payload: any) => void,
    onConnectionChange?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => void
  ) {
    const channelName = `salon_${salonId}`;

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.client.channel(channelName);

    channel
      .on('broadcast', { event: 'QUEUE_UPDATED' }, (res) => {
        onQueueUpdate(res.payload);
      })
      .on('broadcast', { event: 'NEW_BOOKING' }, (res) => {
        onQueueUpdate(res.payload);
      })
      .subscribe((status) => {
        if (onConnectionChange) {
          onConnectionChange(status as any);
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }
}
