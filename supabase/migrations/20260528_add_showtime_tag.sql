ALTER TABLE showtimes
  ADD COLUMN tag TEXT CHECK (tag IN ('IMAX', '4DX', '+'));
