import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DeleteMovieButton from "@/components/movies/DeleteMovieButton";
import SeancesToggle from "@/components/movies/SeancesToggle";
import Header from "@/components/ui/Header";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Plus, Film, Megaphone } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb/api";

const STATUS = {
  picking_days:  { label: "Vote des jours",    status: "pending" as const },
  picking_times: { label: "Vote des horaires", status: "pending" as const },
  closed:        { label: "Séance confirmée",  status: "closed" as const },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>
}) {
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

  const { all } = await searchParams;
  const showAll = all === "true";

  const query = supabase
    .from("movies")
    .select("id, title, poster_url, status")
    .order("created_at", { ascending: false });

  const { data: movies } = showAll
    ? await query
    : await query.contains("participant_ids", [user.id]);

  const movieList = movies ?? [];

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header pseudo={pseudo} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] uppercase leading-none tracking-wide">
              {showAll ? "Toutes les séances" : "Mes séances"}
            </h1>
            <div className="mt-2.5">
              <SeancesToggle showAll={showAll} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="/propose">
              <Button variant="ghost">
                <Megaphone className="w-4 h-4" />
                Proposer
              </Button>
            </a>
            {isAdmin && (
              <a href="/movies/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4" />
                  Nouvelle
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Empty state */}
        {movieList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center">
              <Film className="w-9 h-9 text-ink-faint" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-semibold">
                {showAll ? "Rien à l'affiche" : "Pas de séances pour toi"}
              </p>
              <p className="text-ink-muted text-sm max-w-xs mx-auto">
                {showAll
                  ? "Lance une organisation pour votre prochaine sortie ciné !"
                  : "Tu n'as pas encore été invité à une séance."}
              </p>
            </div>
            {isAdmin && showAll && (
              <a href="/movies/new">
                <Button variant="primary" size="lg" className="w-auto px-6">
                  Organiser une séance
                </Button>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {movieList.map((movie) => {
              const s = STATUS[movie.status as keyof typeof STATUS] ?? STATUS.picking_days;
              return (
                <div key={movie.id} className="relative group h-[104px] rounded-2xl2 bg-surface overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] active:scale-[0.99] transition-transform">
                  <a href={`/movies/${movie.id}`} className="absolute inset-0 flex items-stretch text-ink">
                    {/* Poster */}
                    <div className="relative w-[76px] flex-shrink-0 m-2.5 rounded-xl overflow-hidden bg-surface-raised shadow-lg">
                      {movie.poster_url ? (
                        <Image
                          src={getPosterUrl(movie.poster_url, 'w200')!}
                          alt={movie.title}
                          fill
                          sizes="76px"
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-6 h-6 text-ink-faint" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="relative flex flex-col justify-center gap-1.5 px-3.5 py-3 flex-grow min-w-0">
                      <Badge status={s.status}>{s.label}</Badge>
                      <h3 className="font-bold text-base text-ink leading-snug line-clamp-2 pr-6">{movie.title}</h3>
                      <p className="text-xs text-ink-faint">Voir les votes →</p>
                    </div>
                  </a>
                  {/* Delete (always visible on mobile) */}
                  {isAdmin && (
                    <div className="absolute top-2.5 right-2.5 z-10">
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
