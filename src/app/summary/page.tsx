'use client'

import { ArrowLeft, Home, Share } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSplitStore } from '@/store/useSplitStore'
import { useBillHistoryStore } from '@/store/useBillHistoryStore'
import { useState, useEffect } from 'react'

export default function SummaryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { items, tip, tax, people, itemAssignments, resetAll } = useSplitStore()
  const { saveBill } = useBillHistoryStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const perPersonSubtotal: Record<string, number> = {}

  // Step 1: Distribute item prices
  for (const item of items) {
    const assigned = itemAssignments[item.id] || []
    if (assigned.length === 0) continue
    const share = item.price / assigned.length
    for (const person of assigned) {
      perPersonSubtotal[person] = (perPersonSubtotal[person] || 0) + share
    }
  }

  // Step 2: Distribute tip and tax proportionally
  const subtotalSum = Object.values(perPersonSubtotal).reduce((a, b) => a + b, 0)
  const result: Record<string, number> = {}
  for (const person of people) {
    const base = perPersonSubtotal[person] || 0
    const tipShare = subtotalSum ? (base / subtotalSum) * tip : 0
    const taxShare = subtotalSum ? (base / subtotalSum) * tax : 0
    result[person] = base + tipShare + taxShare
  }

  const total = subtotalSum + tip + tax

  const shareResults = async () => {
    if (navigator.share) {
      const shareText = `Bill Split Results:\n\n${people.map(person => 
        `${person}: ₹${result[person]?.toFixed(2) || '0.00'}`
      ).join('\n')}\n\nTotal: ₹${total.toFixed(2)}`
      
      try {
        await navigator.share({
          title: 'Bill Split Results',
          text: shareText
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Bill Split Results:\n\n${people.map(person => 
        `${person}: ₹${result[person]?.toFixed(2) || '0.00'}`
      ).join('\n')}\n\nTotal: ₹${total.toFixed(2)}`
      
      navigator.clipboard.writeText(shareText)
      alert('Results copied to clipboard!')
    }
  }

  const saveAndGoHome = () => {
    const billName = `Bill - ${new Date().toLocaleDateString()}`
    saveBill({
      name: billName,
      items: items,
      people,
      tip,
      tax,
      itemAssignments,
      total,
      results: result
    })
    resetAll()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated dots */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`summary-dot-${i}`}
              className="absolute w-2 h-2 bg-orange-200 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Compact Container */}
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[800px] mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/people')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Split Summary</h1>
            <p className="text-xl text-gray-600">How to split this bill</p>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Total Summary */}
        <div className="bg-orange-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-orange-800 text-sm mb-1">Total Bill Amount</p>
          <p className="text-3xl font-bold text-orange-600">₹{total.toFixed(2)}</p>
        </div>

        {/* Results */}
        <div className="space-y-3 mb-6">
          {Object.entries(result).map(([person, amount]) => (
            <div key={person} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <span className="font-semibold text-gray-800 text-lg">{person}</span>
              <span className="text-xl font-bold text-orange-600">₹{amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Breakdown Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2 text-center">Bill Breakdown</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div className="flex justify-between">
              <span>Items Total:</span>
              <span>₹{subtotalSum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip:</span>
              <span>₹{tip.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <hr className="border-blue-200 my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button 
            onClick={shareResults}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
          >
            <Share size={18} />
            Share Summary
          </button>

          <button
            onClick={saveAndGoHome}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <Home size={18} />
            Save & New Bill
          </button>
        </div>
      </div>
    </div>
  )
}