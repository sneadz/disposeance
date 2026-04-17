import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import DayVoting from "@/components/movies/DayVoting";
import TimeVoting from "@/components/movies/TimeVoting";
import FinalSummary from "@/components/summary/FinalSummary";
import { logout } from "@/app/auth/logout/actions";
import { deleteMovieAction } from "@/app/actions/movie";
import { LogOut, Film, ChevronLeft } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb/api";

const STATUS = {
  picking_days:  { label: "Vote des jours",   pill: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30" },
  picking_times: { label: "Vote des horaires", pill: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" },
  closed:        { label: "Séance confirmée",  pill: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" },
} as const;

export default async function MoviePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, pseudo")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;
  const pseudo = profile?.pseudo ?? "?";

  const { data: movie } = await supabase
    .from("movies")
    .select("id, title, poster_url, status, final_showtime_id")
    .eq("id", params.id)
    .single();

  if (!movie) notFound();

  let finalDatetime: string | null = null;
  let participants: string[] = [];
  if (movie.status === "closed" && movie.final_showtime_id) {
    const { data: showtime } = await supabase
      .from("showtimes")
      .select("datetime")
      .eq("id", movie.final_showtime_id)
      .single();
    finalDatetime = showtime?.datetime ?? null;

    const { data: votes } = await supabase
      .from("time_votes")
      .select("profiles(pseudo)")
      .eq("showtime_id", movie.final_showtime_id)
      .eq("available", true);
    participants = (votes ?? [])
      .map((v: { profiles: { pseudo: string }[] | null }) => Array.isArray(v.profiles) ? v.profiles[0]?.pseudo : undefined)
      .filter(Boolean) as string[];
  }

  const resetMovie = deleteMovieAction.bind(null, params.id);
  const s = STATUS[movie.status as keyof typeof STATUS] ?? STATUS.picking_days;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-zinc-400 active:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1.5 rounded-xl">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">DispoSéance</span>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                {pseudo[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-zinc-400 hidden sm:inline">{pseudo}</span>
            </div>
            <form action={logout}>
              <button className="p-1.5 text-zinc-500 active:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="relative h-52 rounded-2xl overflow-hidden bg-zinc-900">
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
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="w-16 h-16 text-zinc-700" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 p-5 flex items-end gap-4 w-full">
            {movie.poster_url && (
              <div className="relative w-16 h-24 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 hidden sm:block">
                <Image src={getPosterUrl(movie.poster_url, 'w200')!} alt={movie.title} fill sizes="64px" className="object-cover" />
              </div>
            )}
            <div className="space-y-1.5 min-w-0">
              <span className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${s.pill}`}>
                {s.label}
              </span>
              <h2 className="text-2xl font-bold leading-tight line-clamp-2">{movie.title}</h2>
            </div>
          </div>
        </div>

        {/* Voting / Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          {movie.status === "picking_days" && (
            <DayVoting movieId={movie.id} userId={user.id} isAdmin={isAdmin} />
          )}
          {movie.status === "picking_times" && (
            <TimeVoting movieId={movie.id} userId={user.id} isAdmin={isAdmin} />
          )}
          {movie.status === "closed" && finalDatetime && (
            <FinalSummary
              movieTitle={movie.title}
              posterUrl={getPosterUrl(movie.poster_url, 'w200')}
              finalDatetime={finalDatetime}
              participants={participants}
              isAdmin={isAdmin}
              onReset={resetMovie}
            />
          )}
        </div>
      </div>
    </main>
  );
}
