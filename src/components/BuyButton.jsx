import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function BuyButton({ event, defaultQty = 1, chosenTierId = null, priceOverride = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy() {
    if (!user) { alert('Please sign in first.'); return }
    
    // Clear any previous errors
    setError('')
    
    // Check if event has multiple tiers and no tier is selected
    const hasMultipleTiers = event.tiers && event.tiers.length > 1
    const isFreeEvent = event.min_price === 0 && event.max_price === 0
    
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

      // 2) Create N tickets for this event (one per quantity)
      // With the database trigger, free events will always have a "General Admission (Free)" tier
      const hasTiers = (event.tiers?.length ?? 0) > 0
      const selectedTier = hasTiers ? event.tiers.find(t => t.id === chosenTierId) : null
      
      console.log('BuyButton Debug - Event:', {
        id: event.id,
        min_price: event.min_price,
        max_price: event.max_price,
        chosenTierId: chosenTierId,
        hasTiers: hasTiers,
        selectedTier: selectedTier
      })
      
      // For free events without a selected tier, find the free tier
      let tierIdToUse = chosenTierId
      if (!chosenTierId && (event.min_price === 0 && event.max_price === 0)) {
        console.log('BuyButton Debug - Finding free tier for free event')
        
        // Find the free tier (should exist due to database trigger)
        const { data: freeTiers, error: tiersError } = await supabase
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', event.id)
          .eq('price', 0)
          .limit(1)
        
        console.log('BuyButton Debug - Free tiers check:', { freeTiers, tiersError })
        
        if (tiersError) {
          console.error('Error checking free tiers:', tiersError)
          throw tiersError
        }
        
        if (freeTiers && freeTiers.length > 0) {
          tierIdToUse = freeTiers[0].id
          console.log('BuyButton Debug - Using free tier:', tierIdToUse)
        } else {
          throw new Error('No free tier found for free event. Database trigger may not be working.')
        }
      }
      
      console.log('BuyButton Debug - Final tierIdToUse:', tierIdToUse)
      
      // Build ticket payload
      const payload = {
        order_id: order.id,
        event_id: event.id,
        qr_token: crypto.randomUUID()
      }
      
      // Only include tier_id when it's a real UUID
      if (tierIdToUse) {
        payload.tier_id = tierIdToUse
      }
      
      const rows = Array.from({ length: qty }, () => ({
        ...payload,
        qr_token: crypto.randomUUID() // Generate unique QR token for each ticket
      }))
      
      console.log('BuyButton Debug - Ticket rows to insert:', rows)

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
      alert('Could not complete purchase: ' + (e?.message || 'Unknown error'))
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
