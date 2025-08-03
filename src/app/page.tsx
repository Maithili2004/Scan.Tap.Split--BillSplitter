'use client'

import { useState } from 'react'
import { Camera, Calendar, Trash2, Edit3, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBillHistoryStore } from '@/store/useBillHistoryStore'
import { useSplitStore } from '@/store/useSplitStore'

export default function Home() {
  const router = useRouter()
  const { savedBills, deleteBill } = useBillHistoryStore()
  const { resetAll, setItems, setPeople, setTax, setTip, setItemAssignments } = useSplitStore()
  const [showHistory, setShowHistory] = useState(false)

  const startNewBill = () => {
    resetAll()
    router.push('/items')
  }

  const loadBill = (bill: any) => {
    resetAll()
    setItems(bill.items)
    setPeople(bill.people)
    setTax(bill.tax)
    setTip(bill.tip)
    setItemAssignments(bill.itemAssignments)
    router.push('/people')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 mb-8 bg-orange-600 rounded-lg flex items-center justify-center">
        <div className="w-10 h-8 bg-amber-800 rounded-sm relative">
          <div className="absolute inset-0 border-2 border-orange-400 border-dashed rounded-sm"></div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
        Scan. Tap. Split.
      </h1>

      <p className="text-gray-600 text-center mb-12 max-w-sm">
        Snap the receipt, tap your items, see who owes what. No sign-ups, no math, no drama.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => router.push('/scan')}
          className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
        >
          <Camera size={20} />
          Scan Receipt
        </button>

        <button
          onClick={startNewBill}
          className="w-full bg-white text-gray-700 py-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Enter Manually
        </button>

        {/* Bill History Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-gray-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
        >
          <Calendar size={20} />
          {showHistory ? 'Hide History' : `Bill History (${savedBills.length})`}
        </button>
      </div>

      {/* Bill History Section */}
      {showHistory && (
        <div className="w-full max-w-sm mt-6 space-y-3">
          <h2 className="text-xl font-bold text-gray-800 text-center">Previous Bills</h2>
          {savedBills.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center text-gray-500">
              <Clock size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No previous bills found</p>
            </div>
          ) : (
            savedBills
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((bill) => (
                <div key={bill.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{bill.name}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(bill.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      ₹{bill.total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    {bill.items.length} items • {bill.people.length} people
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadBill(bill)}
                      className="flex-1 bg-orange-600 text-white py-2 rounded text-xs hover:bg-orange-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this bill?')) {
                          deleteBill(bill.id)
                        }
                      }}
                      className="px-3 bg-red-600 text-white py-2 rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}