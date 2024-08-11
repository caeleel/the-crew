CREATE TABLE mission_logs (
  id serial primary key,
  seed1 bigint NOT NULL,
  seed2 bigint NOT NULL,
  seed3 bigint NOT NULL,
  seed4 bigint NOT NULL,
  meta json,
  moves text[],
  undo_used boolean,
  success boolean,
  completed boolean,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

CREATE UNIQUE INDEX seed_index ON mission_logs (seed1, seed2, seed3, seed4);

CREATE TABLE players (
  mission_id bigint REFERENCES mission_logs(id) NOT NULL,
  player_id text NOT NULL,
  seat text NOT NULL,
  name text
);

CREATE UNIQUE INDEX player_index ON players (player_id);
CREATE INDEX player_mission ON players (mission_id);