-- Create quests table
create table public.quests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  raw_content text not null,
  theme_config jsonb default '{
    "timerEnabled": false,
    "timerSeconds": 30,
    "livesEnabled": true,
    "maxLives": 3,
    "theme": "adventure"
  }'::jsonb,
  is_published boolean default false,
  play_count integer default 0
);

-- Create stages table
create table public.stages (
  id uuid default gen_random_uuid() primary key,
  quest_id uuid references public.quests(id) on delete cascade not null,
  title text not null,
  lesson_summary text not null,
  order_index integer not null
);

-- Create quizzes table
create table public.quizzes (
  id uuid default gen_random_uuid() primary key,
  stage_id uuid references public.stages(id) on delete cascade not null,
  question text not null,
  options jsonb not null,
  correct_answer integer not null,
  explanation text not null,
  order_index integer default 0
);

-- Create indexes for better query performance
create index quests_user_id_idx on public.quests(user_id);
create index quests_is_published_idx on public.quests(is_published);
create index stages_quest_id_idx on public.stages(quest_id);
create index stages_order_idx on public.stages(quest_id, order_index);
create index quizzes_stage_id_idx on public.quizzes(stage_id);

-- Enable RLS
alter table public.quests enable row level security;
alter table public.stages enable row level security;
alter table public.quizzes enable row level security;

-- Quests policies
-- Anyone can view published quests
create policy "Anyone can view published quests"
  on public.quests for select
  using (is_published = true);

-- Users can view their own quests
create policy "Users can view own quests"
  on public.quests for select
  using (auth.uid() = user_id);

-- Users can insert their own quests
create policy "Users can insert own quests"
  on public.quests for insert
  with check (auth.uid() = user_id);

-- Users can update their own quests
create policy "Users can update own quests"
  on public.quests for update
  using (auth.uid() = user_id);

-- Users can delete their own quests
create policy "Users can delete own quests"
  on public.quests for delete
  using (auth.uid() = user_id);

-- Stages policies
-- Anyone can view stages of published quests
create policy "Anyone can view stages of published quests"
  on public.stages for select
  using (
    exists (
      select 1 from public.quests
      where quests.id = stages.quest_id
      and (quests.is_published = true or quests.user_id = auth.uid())
    )
  );

-- Users can manage stages of their own quests
create policy "Users can insert stages for own quests"
  on public.stages for insert
  with check (
    exists (
      select 1 from public.quests
      where quests.id = stages.quest_id
      and quests.user_id = auth.uid()
    )
  );

create policy "Users can update stages for own quests"
  on public.stages for update
  using (
    exists (
      select 1 from public.quests
      where quests.id = stages.quest_id
      and quests.user_id = auth.uid()
    )
  );

create policy "Users can delete stages for own quests"
  on public.stages for delete
  using (
    exists (
      select 1 from public.quests
      where quests.id = stages.quest_id
      and quests.user_id = auth.uid()
    )
  );

-- Quizzes policies
-- Anyone can view quizzes of published quests
create policy "Anyone can view quizzes of published quests"
  on public.quizzes for select
  using (
    exists (
      select 1 from public.stages
      join public.quests on quests.id = stages.quest_id
      where stages.id = quizzes.stage_id
      and (quests.is_published = true or quests.user_id = auth.uid())
    )
  );

-- Users can manage quizzes of their own quests
create policy "Users can insert quizzes for own quests"
  on public.quizzes for insert
  with check (
    exists (
      select 1 from public.stages
      join public.quests on quests.id = stages.quest_id
      where stages.id = quizzes.stage_id
      and quests.user_id = auth.uid()
    )
  );

create policy "Users can update quizzes for own quests"
  on public.quizzes for update
  using (
    exists (
      select 1 from public.stages
      join public.quests on quests.id = stages.quest_id
      where stages.id = quizzes.stage_id
      and quests.user_id = auth.uid()
    )
  );

create policy "Users can delete quizzes for own quests"
  on public.quizzes for delete
  using (
    exists (
      select 1 from public.stages
      join public.quests on quests.id = stages.quest_id
      where stages.id = quizzes.stage_id
      and quests.user_id = auth.uid()
    )
  );

-- Function to increment play count
create or replace function public.increment_play_count(quest_id uuid)
returns void as $$
begin
  update public.quests
  set play_count = play_count + 1
  where id = quest_id;
end;
$$ language plpgsql security definer;
