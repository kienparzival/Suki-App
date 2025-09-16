import React, { useState, useEffect } from 'react'
import { Plus, X, DollarSign, Users } from 'lucide-react'
import { PAYMENTS_ENABLED } from '../config/payments'

const SUGGESTED_TIERS = [
  { name: 'Early Bird', price: 0, quota: 50 },
  { name: 'General Admission', price: 100000, quota: 100 },
  { name: 'VIP', price: 250000, quota: 30 },
  { name: 'VVIP', price: 500000, quota: 20 }
]

export default function TicketTierManager({ tiers = [], onChange, eventId = null, originalEvent = null, isEditing = false }) {
  const [localTiers, setLocalTiers] = useState(tiers)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTier, setNewTier] = useState({
    name: '',
    price: '',
    quota: ''
  })

  // Removed refs since we're no longer using useEffect

  useEffect(() => {
    // Ensure all numeric fields are properly converted to numbers when loading tiers
    const processedTiers = tiers.map(tier => ({
      ...tier,
      price: Number(tier.price) || 0,
      quota: Number(tier.quota) || 0,
      sold: Number(tier.sold) || 0
    }))
    setLocalTiers(processedTiers)
  }, [tiers])



  const addTier = () => {
    if (!newTier.name.trim() || !newTier.quota) return

    const tier = {
      id: `temp-${Date.now()}`,
      name: newTier.name.trim(),
      price: Number(newTier.price) || 0,
      quota: Number(newTier.quota),
      sold: 0
    }

    const newTiers = [...localTiers, tier]
    setLocalTiers(newTiers)
    setNewTier({ name: '', price: '', quota: '', description: '' })
    setShowAddForm(false)
    
    // Call onChange directly to update parent
    if (validationWarnings.length === 0) {
      onChange(newTiers)
    } else {
      onChange(null)
    }
  }

  const removeTier = (tierId) => {
    const tierToRemove = localTiers.find(t => t.id === tierId)
    
    // Check if this tier has sold tickets (only when editing existing events)
    if (isEditing && originalEvent && tierToRemove) {
      const originalTier = originalEvent.ticket_tiers?.find(t => t.name === tierToRemove.name)
      
      if (originalTier && (originalTier.sold || 0) > 0) {
        alert(`Cannot delete "${tierToRemove.name}" tier - ${originalTier.sold} tickets already sold. Please keep this tier or contact support.`)
        return
      }
    }
    
    const newTiers = localTiers.filter(t => t.id !== tierId)
    setLocalTiers(newTiers)
    
    // Call onChange directly to update parent
    if (validationWarnings.length === 0) {
      onChange(newTiers)
    } else {
      onChange(null)
    }
  }

  const updateTier = (tierId, field, value) => {
    // Convert numeric fields to proper numbers
    let processedValue = value
    if (field === 'price' || field === 'quota') {
      processedValue = Number(value) || 0
    }
    
    const newTiers = localTiers.map(t => 
      t.id === tierId ? { ...t, [field]: (field === 'price' ? (PAYMENTS_ENABLED ? processedValue : 0) : processedValue) } : t
    )
    setLocalTiers(newTiers)
    
    // Call onChange directly to update parent
    if (validationWarnings.length === 0) {
      onChange(newTiers)
    } else {
      onChange(null)
    }
  }

  const addSuggestedTier = (suggestedTier) => {
    const tier = {
      name: suggestedTier.name,
      price: suggestedTier.price,
      quota: suggestedTier.quota,
      id: `temp-${Date.now()}`,
      sold: 0
    }
    const newTiers = [...localTiers, tier]
    setLocalTiers(newTiers)
    
    // Call onChange directly to update parent
    if (validationWarnings.length === 0) {
      onChange(newTiers)
    } else {
      onChange(null)
    }
  }

  const totalQuota = localTiers.reduce((sum, tier) => sum + (Number(tier.quota) || 0), 0)
  // Calculate sold count from tiers data
  const totalSold = localTiers.reduce((sum, tier) => sum + (Number(tier.sold) || 0), 0)

  // Validation for editing: check if quota reduction would cause issues
  const getValidationWarnings = () => {
    if (!isEditing || !originalEvent?.ticket_tiers) return []
    
    const warnings = []
    
    for (const newTier of localTiers) {
      const originalTier = originalEvent.ticket_tiers.find(t => t.name === newTier.name)
      
      if (originalTier && newTier.quota < originalTier.quota) {
        // Check if this would cause quota to be less than sold tickets
        const ticketsSold = originalTier.sold || 0
        
        if (newTier.quota < ticketsSold) {
          warnings.push({
            tierName: newTier.name,
            newQuota: newTier.quota,
            ticketsSold: ticketsSold,
            message: `Cannot reduce "${newTier.name}" quota to ${newTier.quota} - ${ticketsSold} tickets already sold`
          })
        }
      }
    }
    
    return warnings
  }

  const validationWarnings = getValidationWarnings()

  // Compute tier deletion warning data
  const tierDeletionWarning = (() => {
    if (!isEditing || !originalEvent?.ticket_tiers) return null
    
    const tiersWithSoldTickets = originalEvent.ticket_tiers.filter(t => (t.sold || 0) > 0)
    
    if (tiersWithSoldTickets.length === 0) return null
    
    return {
      tiers: tiersWithSoldTickets,
      hasWarnings: true
    }
  })()

  // Remove the problematic useEffect that causes infinite loops
  // Instead, we'll call onChange directly in the functions that modify tiers

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Ticket Tiers</h3>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="size-4 mr-1" />
          Add Tier
        </button>
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="card p-4 bg-red-50 border-red-200">
          <h4 className="font-medium text-red-900 mb-3">⚠️ Validation Warnings</h4>
          <div className="space-y-2">
            {validationWarnings.map((warning, idx) => (
              <div key={idx} className="text-sm text-red-700 p-2 bg-red-100 rounded">
                {warning.message}
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-2">
            Please fix these issues before saving. You cannot reduce quota below tickets already sold.
          </p>
        </div>
      )}

      {/* Tier Deletion Warning */}
      {tierDeletionWarning && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <h4 className="font-medium text-amber-900 mb-3">ℹ️ Tier Management Notice</h4>
          <div className="space-y-2">
            {tierDeletionWarning.tiers.map((tier, idx) => (
              <div key={idx} className="text-sm text-amber-700 p-2 bg-amber-100 rounded">
                <strong>{tier.name}</strong>: {tier.sold} tickets sold - This tier cannot be deleted
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Tiers with sold tickets are protected from deletion to maintain data integrity.
          </p>
        </div>
      )}

      {/* Suggested Tiers - Only show when creating new events, not when editing */}
      {!isEditing && localTiers.length === 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">Quick Start - Suggested Tiers</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SUGGESTED_TIERS.map((tier, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-sm btn-outline btn-blue text-xs p-2 h-auto"
                onClick={() => addSuggestedTier(tier)}
              >
                <div className="font-medium">{tier.name}</div>
                <div className="text-blue-600">{tier.price === 0 ? 'Free' : `${tier.price.toLocaleString()} VND`}</div>
                <div className="text-blue-500">{tier.quota} tickets</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Tiers */}
      {localTiers.length > 0 && (
        <div className="space-y-3">
          {localTiers.map((tier) => (
            <div key={tier.id} className="card p-4 border border-neutral-200">
              <div className="grid md:grid-cols-4 gap-3 items-center">
                <div>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    placeholder="Tier name"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                  />
                </div>
                <div>
                  {PAYMENTS_ENABLED ? (
                    <input
                      type="number"
                      className="input w-full text-sm"
                      placeholder="Price (VND)"
                      value={tier.price}
                      onChange={(e) => updateTier(tier.id, 'price', e.target.value)}
                    />
                  ) : (
                    <span className="text-green-700 font-medium">Free</span>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    className={`input w-full text-sm ${
                      validationWarnings.some(w => w.tierName === tier.name) 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                    }`}
                    placeholder="Quota"
                    value={tier.quota}
                    onChange={(e) => updateTier(tier.id, 'quota', e.target.value)}
                  />
                  {tier.sold > 0 && (
                    <div className="text-xs text-neutral-500 mt-1">
                      {tier.sold} sold • {tier.remaining || tier.quota} remaining
                    </div>
                  )}
                  {validationWarnings.some(w => w.tierName === tier.name) && (
                    <div className="text-xs text-red-600 mt-1">
                      ⚠️ Quota too low for tickets sold
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && originalEvent && (() => {
                    const originalTier = originalEvent.ticket_tiers?.find(t => t.name === tier.name)
                    const hasSoldTickets = originalTier && (originalTier.sold || 0) > 0
                    
                    if (hasSoldTickets) {
                      return (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <span>⚠️</span>
                          <span>{originalTier.sold} sold</span>
                        </div>
                      )
                    }
                    
                    return (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-red-500 hover:text-red-700"
                        onClick={() => removeTier(tier.id)}
                        title="Delete tier"
                      >
                        <X className="size-4" />
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          ))}
          
          {/* Summary */}
          <div className="card p-3 bg-neutral-50">
            <div className="flex justify-between text-sm">
              <span>Total Capacity: <strong>{totalQuota}</strong></span>
              {totalSold > 0 && (
                <span>Total Sold: <strong>{totalSold}</strong></span>
              )}
              <span>Available: <strong>{totalQuota - totalSold}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Add New Tier Form */}
      {showAddForm && (
        <div className="card p-4 border-2 border-dashed border-neutral-300">
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Tier Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Early Bird"
                value={newTier.name}
                onChange={(e) => setNewTier(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Price (VND)</label>
              <input
                type="number"
                className="input w-full"
                placeholder="0 for free"
                value={newTier.price}
                onChange={(e) => setNewTier(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Quota</label>
              <input
                type="number"
                className="input w-full"
                placeholder="Number of tickets"
                value={newTier.quota}
                onChange={(e) => setNewTier(prev => ({ ...prev, quota: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary flex-1"
                onClick={addTier}
              >
                Add Tier
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
