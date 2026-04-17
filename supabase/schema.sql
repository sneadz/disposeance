-- 1. Tables principales
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pseudo TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active le RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles are updatable by owners" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Movies
CREATE TYPE movie_status AS ENUM ('picking_days', 'picking_times', 'closed');

CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    tmdb_id TEXT,
    poster_url TEXT,
    release_date DATE,
    status movie_status DEFAULT 'picking_days',
    final_showtime_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Only admins can modify movies" ON movies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 3. Available Days
CREATE TABLE IF NOT EXISTS available_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    UNIQUE(movie_id, date)
);

ALTER TABLE available_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Available days are viewable by everyone" ON available_days FOR SELECT USING (true);
CREATE POLICY "Only admins can modify available days" ON available_days FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 4. Day Votes
CREATE TABLE IF NOT EXISTS day_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL,
    UNIQUE(user_id, movie_id, date)
);

ALTER TABLE day_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Day votes are viewable by everyone" ON day_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own day votes" ON day_votes FOR ALL USING (auth.uid() = user_id);

-- 5. Showtimes
CREATE TABLE IF NOT EXISTS showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    datetime TIMESTAMPTZ NOT NULL
);

ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Showtimes are viewable by everyone" ON showtimes FOR SELECT USING (true);
CREATE POLICY "Only admins can modify showtimes" ON showtimes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 6. Time Votes
CREATE TABLE IF NOT EXISTS time_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    showtime_id UUID REFERENCES showtimes(id) ON DELETE CASCADE,
    available BOOLEAN NOT NULL,
    UNIQUE(user_id, showtime_id)
);

ALTER TABLE time_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Time votes are viewable by everyone" ON time_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own time votes" ON time_votes FOR ALL USING (auth.uid() = user_id);

-- 7. Ajout de la clé étrangère pour le choix final
ALTER TABLE movies ADD CONSTRAINT fk_final_showtime FOREIGN KEY (final_showtime_id) REFERENCES showtimes(id);

-- Trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, pseudo, is_admin)
  VALUES (new.id, new.raw_user_meta_data->>'pseudo', (new.raw_user_meta_data->>'is_admin')::boolean);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
