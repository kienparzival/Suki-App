-- Test the tier_inventory RPC function for event: 740c096b-e17a-4549-a9f0-ee1c05bffd82

-- 1. Check if the event exists
SELECT id, title, creator_id FROM events WHERE id = '740c096b-e17a-4549-a9f0-ee1c05bffd82';

-- 2. Check if this event has any ticket_tiers
SELECT * FROM ticket_tiers WHERE event_id = '740c096b-e17a-4549-a9f0-ee1c05bffd82';

-- 3. Check if this event has any tickets
SELECT 
  t.id as ticket_id,
  t.tier_id,
  t.event_id,
  tt.name as tier_name,
  tt.price,
  tt.quota
FROM tickets t
LEFT JOIN ticket_tiers tt ON t.tier_id = tt.id
WHERE t.event_id = '740c096b-e17a-4549-a9f0-ee1c05bffd82';

-- 4. Test the tier_inventory function
SELECT * FROM tier_inventory('740c096b-e17a-4549-a9f0-ee1c05bffd82');

-- 5. Check all ticket_tiers in the database
SELECT event_id, COUNT(*) as tier_count FROM ticket_tiers GROUP BY event_id;

-- 6. Check all tickets in the database
SELECT event_id, COUNT(*) as ticket_count FROM tickets GROUP BY event_id;
