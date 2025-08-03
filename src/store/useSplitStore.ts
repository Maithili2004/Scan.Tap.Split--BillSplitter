import { create } from 'zustand'

type Person = string
type Item = { id: string, name: string, price: number }

interface SplitState {
  items: Item[];
  tip: number;
  tax: number;
  people: Person[];
  itemAssignments: Record<string, Person[]>;
  setItems: (items: Item[]) => void
  setPeople: (people: Person[]) => void
  updateAssignment: (itemId: string, person: Person) => void
  setTax: (value: number) => void
  setTip: (value: number) => void
  resetAll: () => void
  setItemAssignments: (assignments: Record<string, Person[]>) => void
}

export const useSplitStore = create<SplitState>((set, get) => ({
  items: [],
  people: [],
  tax: 0,
  tip: 0,
  itemAssignments: {},
  
  setItems: (items) => set({ items }),
  setPeople: (people) => set({ people }),
  setTax: (tax) => set({ tax }),
  setTip: (tip) => set({ tip }),
  setItemAssignments: (assignments) => set({ itemAssignments: assignments }),
  
  // Fixed updateAssignment - only toggles for ONE specific item
  updateAssignment: (itemId, person) => {
    const state = get()
    const current = state.itemAssignments[itemId] || []
    const isCurrentlyAssigned = current.includes(person)
    
    let updated: string[]
    if (isCurrentlyAssigned) {
      // Remove person from THIS item only
      updated = current.filter((p) => p !== person)
    } else {
      // Add person to THIS item only
      updated = [...current, person]
    }
    
    console.log(`🔄 Item "${itemId}": ${person} is now ${isCurrentlyAssigned ? 'REMOVED' : 'ADDED'}`)
    console.log(`📋 Item "${itemId}" assignments:`, updated)
    
    set({
      itemAssignments: {
        ...state.itemAssignments,
        [itemId]: updated,
      },
    })
  },
    
  resetAll: () => set({
    items: [],
    people: [],
    tax: 0,
    tip: 0,
    itemAssignments: {}
  })
}))