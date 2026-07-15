import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import DayVoting from "@/components/movies/DayVoting";
import TimeVoting from "@/components/movies/TimeVoting";
import FinalSummary from "@/components/summary/FinalSummary";
import { deleteMovieAction } from "@/app/actions/movie";
import Header from "@/components/ui/Header";
import Badge from "@/components/ui/Badge";
import { Film } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb/api";

const STATUS = {
  picking_days:  { label: "Vote des jours",    status: "pending" as const },
  picking_times: { label: "Vote des horaires", status: "pending" as const },
  closed:        { label: "Séance confirmée",  status: "closed" as const },
};

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, pseudo, avatar_url")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;
  const pseudo = profile?.pseudo ?? "?";
  const avatarUrl = profile?.avatar_url ?? null;

  const { data: movie } = await supabase
    .from("movies")
    .select("id, title, poster_url, status, final_showtime_id, participant_ids, guests, token_owner_id")
    .eq("id", id)
    .single();

  if (!movie) notFound();

  const isRing = !!movie.token_owner_id;
  const participantCount = (movie.participant_ids ?? []).length;
  const isParticipant = (movie.participant_ids ?? []).includes(user.id);

  let finalDatetime: string | null = null;
  let finalShowtimeTag: string | null = null;
  let participants: string[] = [];
  const guests: string[] = movie.guests ?? [];
  if (movie.status === "closed" && movie.final_showtime_id) {
    const { data: showtime } = await supabase
      .from("showtimes")
      .select("datetime, tag")
      .eq("id", movie.final_showtime_id)
      .single();
    finalDatetime = showtime?.datetime ?? null;
    finalShowtimeTag = (showtime as { datetime: string; tag: string | null } | null)?.tag ?? null;

    const { data: votes } = await supabase
      .from("time_votes")
      .select("user_id")
      .eq("showtime_id", movie.final_showtime_id)
      .eq("available", true);

    const voterIds = (votes ?? []).map((v: any) => v.user_id).filter(Boolean);
    if (voterIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("pseudo")
        .in("id", voterIds);
      participants = (profileData ?? []).map((p: any) => p.pseudo).filter(Boolean) as string[];
    }
  }

  const resetMovie = deleteMovieAction.bind(null, id);
  const s = STATUS[movie.status as keyof typeof STATUS] ?? STATUS.picking_days;

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header pseudo={pseudo} avatarUrl={avatarUrl} backHref="/" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Hero — masqué sur la page de confirmation (doublon avec la ShareCard) */}
        {movie.status !== "closed" && (
          <div className="relative h-52 rounded-2xl2 overflow-hidden bg-surface">
            {movie.poster_url ? (
              <>
                <Image
                  src={getPosterUrl(movie.poster_url, 'original')!}
                  alt={movie.title}
                  fill
                  sizes="100vw"
                  priority
                  className="object-cover opacity-30 blur-sm scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/50 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-16 h-16 text-ink-faint" />
              </div>
            )}
            {isRing && (
              <div
                aria-hidden
                className="absolute top-3.5 left-3.5 w-[22px] h-[22px] rounded-full grid place-items-center"
                style={{ background: 'rgba(0,0,0,.35)', boxShadow: 'inset 0 0 0 1px rgba(255,196,38,.35)', opacity: 0.85 }}
              >
                <span style={{ fontSize: '12px', color: '#FFC426', lineHeight: 1 }}>⌾</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 p-5 flex items-end gap-4 w-full">
              {movie.poster_url && (
                <div className="relative w-16 h-24 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 hidden sm:block">
                  <Image src={getPosterUrl(movie.poster_url, 'w200')!} alt={movie.title} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div className="space-y-1.5 min-w-0">
                <Badge status={s.status}>{s.label}</Badge>
                <h2 className="font-display text-2xl uppercase leading-tight line-clamp-2">{movie.title}</h2>
              </div>
            </div>
          </div>
        )}

        {/* Voting / Summary */}
        {(movie.status === "picking_days" || movie.status === "picking_times") && (
          <div className="bg-surface-fill shadow-card rounded-2xl2 p-5">
            {movie.status === "picking_days" && (
              <DayVoting movieId={movie.id} userId={user.id} isAdmin={isAdmin} participantCount={participantCount} isParticipant={isParticipant} />
            )}
            {movie.status === "picking_times" && (
              <TimeVoting movieId={movie.id} userId={user.id} isAdmin={isAdmin} participantCount={participantCount} isParticipant={isParticipant} />
            )}
          </div>
        )}
        {movie.status === "closed" && finalDatetime && (
          <FinalSummary
            movieTitle={movie.title}
            posterUrl={getPosterUrl(movie.poster_url, 'original')}
            finalDatetime={finalDatetime}
            tag={finalShowtimeTag}
            participants={participants}
            guests={guests}
            isAdmin={isAdmin}
            movieId={movie.id}
            onReset={resetMovie}
            isRing={isRing}
          />
        )}
      </div>
    </main>
  );
}
