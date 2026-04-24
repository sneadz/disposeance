import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/logout/actions";
import DeleteMovieButton from "@/components/movies/DeleteMovieButton";
import { Plus, LogOut, Film } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb/api";

const STATUS = {
  picking_days:  { label: "Vote des jours",     pill: "bg-[#FFC426]/15 text-[#FFC426] ring-1 ring-[#FFC426]/30" },
  picking_times: { label: "Vote des horaires",   pill: "bg-[#FFC426]/15 text-[#FFC426] ring-1 ring-[#FFC426]/30" },
  closed:        { label: "Séance confirmée",    pill: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" },
} as const;

export default async function Home() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, pseudo")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;
  const pseudo = profile?.pseudo ?? "?";

  const { data: movies } = await supabase
    .from("movies")
    .select("id, title, poster_url, status")
    .order("created_at", { ascending: false });

  const movieList = movies ?? [];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#FFC426] p-1.5 rounded-xl">
              <Film className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <span className="text-base font-bold tracking-tight">DispoSéance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FFC426] flex items-center justify-center text-xs font-bold text-[#0A0A0A]">
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Séances</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {movieList.length === 0 ? "Aucune en cours" : `${movieList.length} en cours`}
            </p>
          </div>
          {isAdmin && (
            <a
              href="/movies/new"
              className="flex items-center gap-1.5 bg-[#FFC426] text-[#0A0A0A] px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#FFC426]/20 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Nouvelle
            </a>
          )}
        </div>

        {/* Empty state */}
        {movieList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Film className="w-9 h-9 text-zinc-600" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-semibold">Rien à l&apos;affiche</p>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">Lance une organisation pour votre prochaine sortie ciné !</p>
            </div>
            {isAdmin && (
              <a
                href="/movies/new"
                className="bg-[#FFC426] text-[#0A0A0A] px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#FFC426]/20 active:scale-95 transition-transform"
              >
                Organiser une séance
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {movieList.map((movie) => {
              const s = STATUS[movie.status as keyof typeof STATUS] ?? STATUS.picking_days;
              return (
                <div key={movie.id} className="relative group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform">
                  <a href={`/movies/${movie.id}`} className="flex items-stretch">
                    {/* Poster */}
                    <div className="relative w-20 h-28 flex-shrink-0 bg-zinc-800">
                      {movie.poster_url ? (
                        <Image
                          src={getPosterUrl(movie.poster_url, 'w200')!}
                          alt={movie.title}
                          fill
                          sizes="80px"
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-7 h-7 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col justify-center px-4 py-3 flex-grow min-w-0 gap-1.5">
                      <span className={`self-start text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${s.pill}`}>
                        {s.label}
                      </span>
                      <h3 className="font-bold text-base leading-snug line-clamp-2 pr-6">{movie.title}</h3>
                      <p className="text-xs text-zinc-500">Voir les votes →</p>
                    </div>
                  </a>
                  {/* Delete (always visible on mobile) */}
                  {isAdmin && (
                    <div className="absolute top-2.5 right-2.5">
                      <DeleteMovieButton movieId={movie.id} movieTitle={movie.title} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
