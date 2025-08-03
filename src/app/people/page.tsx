'use client'

import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSplitStore } from '@/store/useSplitStore'
import { useState, useEffect } from 'react'

export default function PeoplePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const {
    people,
    setPeople,
    items,
    itemAssignments,
    updateAssignment,
    setItemAssignments
  } = useSplitStore()

  const [newPerson, setNewPerson] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [people, items, itemAssignments])

  const toggleAssignment = (itemId: string, person: string) => {
    updateAssignment(itemId, person)
  }

  const addPerson = () => {
    if (newPerson.trim() !== '') {
      setPeople([...people, newPerson.trim()])
      setNewPerson('')
    }
  }

  const removePerson = (index: number) => {
    const updated = [...people]
    const removedPerson = updated[index]
    updated.splice(index, 1)
    setPeople(updated)
    
    const updatedAssignments = { ...itemAssignments }
    Object.keys(updatedAssignments).forEach(itemId => {
      updatedAssignments[itemId] = updatedAssignments[itemId].filter(p => p !== removedPerson)
    })
    setItemAssignments(updatedAssignments)
  }

  const splitEvenly = () => {
    const newAssignments: Record<string, string[]> = {}
    items.forEach(item => {
      newAssignments[item.id] = [...people]
    })
    setItemAssignments(newAssignments)
  }

  const clearAllAssignments = () => {
    const clearedAssignments: Record<string, string[]> = {}
    items.forEach(item => {
      clearedAssignments[item.id] = []
    })
    setItemAssignments(clearedAssignments)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated dots */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`people-dot-${i}`}
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
            <h1 className="text-2xl font-bold text-gray-800">Add People</h1>
            <p className="text-xl text-gray-600">Assign who ate what</p>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* People List */}
        <div className="space-y-2 mb-6">
          {people.map((person, index) => (
            <div key={`person-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={person}
                onChange={(e) =>
                  setPeople(people.map((p, i) => (i === index ? e.target.value : p)))
                }
                className="flex-1 bg-transparent border-none outline-none font-semibold text-gray-800"
              />
              <button onClick={() => removePerson(index)} className="text-red-500 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-300 transition-colors">
            <Plus size={16} className="text-gray-600" />
            <input
              type="text"
              placeholder="Add Person"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPerson()}
              className="flex-1 bg-transparent border-none outline-none text-gray-600"
            />
          </div>
        </div>

        {/* No items message */}
        {items.length === 0 && (
          <div className="text-center py-6 text-gray-600">
            📋 No items found. Add items first.
          </div>
        )}

        {/* Items Assignment */}
{items.length > 0 && (
  <>
    {/* Action Buttons - moved to right corner and made smaller */}
    <div className="flex justify-end gap-2 mb-4">
      <button
        className="bg-green-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
        onClick={splitEvenly}
        disabled={people.length === 0}
      >
        Split Evenly
      </button>
      <button
        className="bg-red-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
        onClick={clearAllAssignments}
      >
        Clear All
      </button>
    </div>

            {/* Items */}
    <div className="space-y-4 mb-6">
      {items.map((item) => {
        const assignedPeople = itemAssignments[item.id] || []
        return (
          <div key={item.id} className="border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">{item.name || 'Unnamed'}</h3>
              <span className="font-bold text-orange-600">₹{item.price.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-2 flex-wrap mb-3 text-sm">
              {people.map((person) => {
                const isAssigned = assignedPeople.includes(person)
                return (
                  <button
                    key={`${item.id}-${person}`}
                    onClick={() => toggleAssignment(item.id, person)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isAssigned
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
                    }`}
                  >
                    {person} {isAssigned ? '✓' : ''}
                  </button>
                )
              })}
            </div>
                    
                    <div className="text-xs text-center p-2 bg-gray-50 rounded">
              {assignedPeople.length > 0 ? (
                <span className="text-gray-700">
                  {assignedPeople.join(', ')} • ₹{(item.price / assignedPeople.length).toFixed(2)} each
                </span>
              ) : (
                <span className="text-red-600">No one assigned</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </>
)}

        {/* Continue Button */}
        <button
          onClick={() => router.push('/summary')}
          disabled={people.length === 0 || items.length === 0}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400"
        >
          Calculate Split 💰
        </button>
      </div>
    </div>
  )
}