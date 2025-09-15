import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function isUuid(v) {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

async function resolveTierId({ event, chosenTierId }) {
  // 1) If a tier was chosen, ensure it's a real UUID and exists for this event
  if (chosenTierId && isUuid(chosenTierId)) {
    const { data, error } = await supabase
      .from('ticket_tiers')
      .select('id')
      .eq('id', chosenTierId)
      .eq('event_id', event.id)
      .maybeSingle()
    if (!error && data?.id) return data.id
  }

  // 2) If event has exactly one tier coming from the server, prefer that
  const tiers = Array.isArray(event.tiers) ? event.tiers : []
  if (tiers.length === 1 && isUuid(tiers[0].id)) {
    // sanity-check it exists in DB
    const { data, error } = await supabase
      .from('ticket_tiers')
      .select('id')
      .eq('id', tiers[0].id)
      .eq('event_id', event.id)
      .maybeSingle()
    if (!error && data?.id) return data.id
  }

  // 3) Free event fallback: look up a free tier (price = 0) in DB
  if ((event.min_price === 0) && (event.max_price === 0)) {
    const { data: freeTier, error: tErr } = await supabase
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', event.id)
      .eq('price', 0)
      .limit(1)
      .maybeSingle()
    if (!tErr && freeTier?.id) return freeTier.id
  }

  // 4) Nothing valid found
  return null
}

export function BuyButton({ event, defaultQty = 1, chosenTierId = null, priceOverride = null }) {
  if (event?.admission === 'open') {
    return null; // Open events don't sell tickets
  }

  const { user } = useAuth()
  const navigate = useNavigate()
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy() {
    if (event?.admission === 'open') {
      alert('This event is open — no tickets required.');
      return;
    }
    if (!user) { alert('Please sign in first.'); return }
    
    // Clear any previous errors
    setError('')
    
    // Validate tier selection early for multi-tier events
    const hasMultipleTiers = Array.isArray(event.tiers) && event.tiers.length > 1
    if (hasMultipleTiers && !chosenTierId) {
      setError('Please select a ticket tier')
      return
    }
    
    setBuying(true)

    try {
      const qty = defaultQty
      // Determine price: use override, or event.min_price as a fallback, or 0 for free tickets
      const unitPrice = priceOverride ?? (event?.min_price ?? 0)
      const total = unitPrice * qty

      // 1) Create an order for the current user (status 'paid' so it appears immediately)
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ user_id: user.id, total_amount: total, status: 'paid' })
        .select('id')
        .single()
      if (orderErr) throw orderErr

      // 2) Resolve a REAL tier id (UUID) that exists in DB
      const tierIdToUse = await resolveTierId({ event, chosenTierId })
      if (!tierIdToUse) {
        // For multi-tier: they must choose a tier; for 1-tier / free: we failed resolving a real id.
        throw new Error('Unable to resolve a valid ticket tier. Please select a tier or refresh the page.')
      }
      
      // Build ticket payload
      const payload = {
        order_id: order.id,
        event_id: event.id,
        qr_token: crypto.randomUUID()
      }
      payload.tier_id = tierIdToUse // always set; DB FK requires a real tier
      
      const rows = Array.from({ length: qty }, () => ({
        ...payload,
        qr_token: crypto.randomUUID() // Generate unique QR token for each ticket
      }))

      const { error: ticketsErr } = await supabase
        .from('tickets')
        .insert(rows)
      
      if (ticketsErr) {
        console.error('Error inserting tickets:', ticketsErr)
        throw ticketsErr
      }

      // Note: sold count update removed since 'sold' column doesn't exist in ticket_tiers table
      // You may need to add this column to your Supabase schema or implement a different tracking method

      // 4) Go to My Tickets
      console.log('Purchase successful! Order:', order.id, 'Tickets created:', rows.length)
      
      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('suki:events_updated'))
      
      navigate('/tickets')
    } catch (e) {
      console.error(e)
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('unable to resolve a valid ticket tier')) {
        alert('Please select a ticket tier (or refresh the page). If the issue persists, the organizer needs to add a tier.')
      } else {
        alert('Could not complete purchase: ' + (e?.message || 'Unknown error'))
      }
    } finally {
      setBuying(false)
    }
  }

  // Check if button should be disabled
  const hasMultipleTiers = event.tiers && event.tiers.length > 1
  const shouldDisable = buying || (hasMultipleTiers && !chosenTierId)

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-red-600 text-sm font-medium text-center">{error}</p>
      )}
      <button 
        className="btn btn-primary w-full" 
        onClick={handleBuy} 
        disabled={shouldDisable}
      >
        {buying ? 'Processing…' : 'Get Ticket'}
      </button>
    </div>
  )
}
