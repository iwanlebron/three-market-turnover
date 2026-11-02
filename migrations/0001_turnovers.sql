create table if not exists turnovers (
  market text not null,
  day date not null,
  amount numeric not null,
  close numeric,
  primary key (market, day)
);
