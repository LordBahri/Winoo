'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Wifi } from 'lucide-react';

interface ScanEvent {
  id: string;
  tagUid: string;
  petId: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  deviceType: string | null;
  createdAt: string;
}

export function ScanEventFeed() {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000', {
      auth: { room: 'admin' },
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('scan_event', (event: ScanEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="font-semibold">Live Scan Events</h2>
        <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-600' : 'text-muted-foreground'}`}>
          <Wifi className="h-3 w-3" />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      <div className="divide-y max-h-80 overflow-y-auto">
        {events.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Waiting for scan events…
          </p>
        )}
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-4 px-5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono truncate">{event.tagUid}</p>
              <p className="text-xs text-muted-foreground">
                {event.city ? `${event.city}, ${event.country}` : 'Location unknown'} ·{' '}
                {event.deviceType ?? 'Unknown device'}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
