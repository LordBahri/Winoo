import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Zap, AlertTriangle, MapPin, Phone, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ContactForm } from './contact-form';
import { format } from 'date-fns';

interface RecoveryData {
  publicId: string;
  cmacStatus: 'valid' | 'invalid' | 'not_required';
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    color: string | null;
    profileImageUrl: string | null;
    isLost: boolean;
    lostAt: string | null;
    ownerFirstName: string;
  } | null;
  message?: string;
}

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕', CAT: '🐈', BIRD: '🐦', RABBIT: '🐰',
  HAMSTER: '🐹', FISH: '🐠', REPTILE: '🦎', OTHER: '🐾',
};

const API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://api:3000/api/v1';

async function fetchRecovery(
  publicId: string,
  searchParams: Record<string, string | undefined>,
): Promise<RecoveryData | null> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && ['picc_data', 'cmac', 'latitude', 'longitude'].includes(k)) qs.set(k, v);
  }
  const url = `${API_URL}/tags/recover/${encodeURIComponent(publicId)}?${qs}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Recovery fetch failed: ${res.status}`);
    const json = await res.json();
    return json.data ?? json;
  } catch (err) {
    console.error('[recovery] fetch error', err);
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecoveryPage({
  params,
  searchParams,
}: {
  params: { publicId: string };
  searchParams: { picc_data?: string; cmac?: string; latitude?: string; longitude?: string };
}) {
  const data = await fetchRecovery(params.publicId, searchParams);
  if (!data) notFound();

  const { pet, cmacStatus, message } = data;
  const showCmacBadge = cmacStatus !== 'not_required';
  const cmacInvalid = cmacStatus === 'invalid';
  const isLost = pet?.isLost;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/40 dark:to-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-semibold">PetID</span>
      </header>

      <main className="mx-auto max-w-md px-5 pb-12">
        {/* Tampered / Invalid tag */}
        {cmacInvalid && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Tag verification failed
                </p>
                <p className="mt-1 text-[13px] text-amber-800/80 dark:text-amber-200/80">
                  This tag could not be verified as genuine. It may be damaged, cloned, or
                  the link may be incomplete. If you found a pet, you can still report the
                  finding to our team.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No linked pet */}
        {!pet && !cmacInvalid && (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <p className="text-3xl">🏷️</p>
            <h1 className="mt-3 text-lg font-semibold">Unregistered tag</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {message ?? 'This tag has not been linked to a pet yet.'}
            </p>
            <a
              href="https://petid.app"
              className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground"
            >
              Learn about PetID
            </a>
          </div>
        )}

        {/* Pet found */}
        {pet && (
          <div className="space-y-4">
            {isLost && (
              <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-destructive">This pet is reported lost</p>
                  {pet.lostAt && (
                    <p className="text-[12px] text-destructive/80">
                      Lost since {format(new Date(pet.lostAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pet card */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="relative aspect-square w-full bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-950/50 dark:to-violet-900/30">
                {pet.profileImageUrl ? (
                  <Image
                    src={pet.profileImageUrl}
                    alt={pet.name}
                    fill
                    sizes="(max-width: 480px) 100vw, 480px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl">
                    {SPECIES_EMOJI[pet.species] ?? '🐾'}
                  </div>
                )}
                {showCmacBadge && !cmacInvalid && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
                  Hi, my name is
                </p>
                <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{pet.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                  <span className="capitalize">{pet.species.toLowerCase()}</span>
                  {pet.breed && <><span>·</span><span>{pet.breed}</span></>}
                  {pet.color && <><span>·</span><span>{pet.color}</span></>}
                </div>

                <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                  I belong to <span className="font-medium text-foreground">{pet.ownerFirstName}</span>.
                  If you found me, please use the form below to let them know I&apos;m safe.
                </p>
              </div>
            </div>

            {/* Contact form */}
            <ContactForm publicId={data.publicId} petName={pet.name} />

            {/* Disclaimer */}
            <p className="px-2 text-center text-[11px] text-muted-foreground">
              Your contact info is shared only with the pet&apos;s owner. PetID never publishes finder data publicly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
