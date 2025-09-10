-- Backfill existing free events without tiers (one-time)
-- Run this in your Supabase SQL Editor

insert into public.ticket_tiers(event_id, name, price, quota)
select e.id, 'General Admission (Free)', 0, e.capacity
from public.events e
left join public.ticket_tiers tt on tt.event_id = e.id
where e.min_price = 0 and e.max_price = 0
  and tt.id is null;
