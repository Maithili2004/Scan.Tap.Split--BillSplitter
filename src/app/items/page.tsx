'use client'

import { v4 as uuidv4 } from 'uuid'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useSplitStore } from '@/store/useSplitStore'

export default function ItemsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const {
    items,
    setItems,
    tip,
    setTip,
    tax,
    setTax
  } = useSplitStore()

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      name: '',
      price: 0,
    }
    const updatedItems = [...items, newItem]
    setItems(updatedItems)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: 'name' | 'price', value: string) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item
      )
    )
  }

  const total = items.reduce((sum, item) => sum + item.price, 0) + tip + tax

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated dots - Only render on client */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`dot-${i}`}
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
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Receipt Items</h1>
            <p className="text-xl text-gray-600">Review and edit your receipt items</p>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Show message if no items */}
        {items.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-center">
              📋 No items found. Add items manually or go back to scan a receipt.
            </p>
          </div>
        )}

        {/* Item List */}
        <div className="space-y-3 mb-6">
          {items.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.name}
                  placeholder="Item name"
                  onChange={e => updateItem(item.id, 'name', e.target.value)}
                  className="font-semibold text-gray-800 bg-transparent border-none outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-800">₹</span>
                <input
                  type="number"
                  value={item.price || ''}
                  placeholder="0"
                  onChange={e => updateItem(item.id, 'price', e.target.value)}
                  className="text-lg font-semibold text-gray-800 bg-transparent border-none outline-none w-16 text-right"
                  min="0"
                  step="0.01"
                />
                <button 
                  onClick={() => removeItem(item.id)} 
                  className="text-red-500 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center gap-2 text-gray-600 border-2 border-dashed border-gray-300 hover:border-orange-300 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        {/* Tip and Tax Inputs */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-2">Tip:</label>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-800 mr-2">₹</span>
                <input
                  type="number"
                  value={tip || ''}
                  placeholder="0"
                  onChange={e => setTip(parseFloat(e.target.value) || 0)}
                  className="text-lg font-semibold text-gray-800 bg-white rounded px-3 py-2 w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-2">Tax:</label>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-800 mr-2">₹</span>
                <input
                  type="number"
                  value={tax || ''}
                  placeholder="0"
                  onChange={e => setTax(parseFloat(e.target.value) || 0)}
                  className="text-lg font-semibold text-gray-800 bg-white rounded px-3 py-2 w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-xl font-bold text-gray-800">Total: ₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => router.push('/people')}
          disabled={items.length === 0}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continue to Add People
        </button>
      </div>
    </div>
  )
}