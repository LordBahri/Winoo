'use client';

import { useState } from 'react';
import { Send, Check, Loader2, MapPin } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface Props {
  publicId: string;
  petName: string;
}

export function ContactForm({ publicId, petName }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordStatus, setCoordStatus] = useState<'idle' | 'fetching' | 'denied' | 'shared'>('idle');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const shareLocation = () => {
    if (!('geolocation' in navigator)) {
      setCoordStatus('denied');
      return;
    }
    setCoordStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCoordStatus('shared');
      },
      () => setCoordStatus('denied'),
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone && !email) {
      setError('Please enter a phone number or email so the owner can reach you.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/tags/recover/${publicId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finderName: name || undefined,
          finderPhone: phone || undefined,
          finderEmail: email || undefined,
          message: message || undefined,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error('Too many requests. Please wait a moment.');
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to send. Please try again.');
      }
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600">
          <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <p className="mt-3 text-base font-semibold">Owner notified</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {petName}&apos;s owner will reach out to you shortly. Thank you for helping reunite them!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
      <div>
        <h2 className="text-base font-semibold">I found this pet</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Leave your contact info — the owner will be alerted immediately.
        </p>
      </div>

      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex h-10 w-full rounded-md border bg-background px-3 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <input
        type="tel"
        inputMode="tel"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        className="flex h-10 w-full rounded-md border bg-background px-3 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <input
        type="email"
        inputMode="email"
        placeholder="or Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        className="flex h-10 w-full rounded-md border bg-background px-3 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <textarea
        placeholder="Where did you find them? Any details? (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
        className="flex w-full rounded-md border bg-background px-3 py-2 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />

      <button
        type="button"
        onClick={shareLocation}
        disabled={coordStatus === 'shared' || coordStatus === 'fetching'}
        className="flex w-full items-center justify-center gap-2 rounded-md border bg-background px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-60"
      >
        {coordStatus === 'fetching' && <Loader2 className="h-4 w-4 animate-spin" />}
        {coordStatus === 'shared' && <Check className="h-4 w-4 text-emerald-600" />}
        {(coordStatus === 'idle' || coordStatus === 'denied') && <MapPin className="h-4 w-4" />}
        {coordStatus === 'shared' ? 'Location shared' :
         coordStatus === 'fetching' ? 'Getting location…' :
         coordStatus === 'denied' ? 'Location unavailable' :
         'Share my location (helps owner find pet)'}
      </button>

      {error && <p className="text-[12px] text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Notify {petName}&apos;s owner
          </>
        )}
      </button>
    </form>
  );
}
