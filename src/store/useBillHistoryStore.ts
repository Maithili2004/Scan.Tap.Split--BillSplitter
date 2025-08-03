import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SavedBill = {
  id: string
  name: string
  date: string
  items: Array<{ id: string; name: string; price: number }>
  people: string[]
  tip: number
  tax: number
  itemAssignments: Record<string, string[]>
  total: number
  results: Record<string, number>
}

interface BillHistoryState {
  savedBills: SavedBill[]
  saveBill: (bill: Omit<SavedBill, 'id' | 'date'>) => void
  deleteBill: (id: string) => void
  getBill: (id: string) => SavedBill | undefined
}

export const useBillHistoryStore = create<BillHistoryState>()(
  persist(
    (set, get) => ({
      savedBills: [],
      saveBill: (bill) =>
        set((state) => ({
          savedBills: [
            ...state.savedBills,
            {
              ...bill,
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
            },
          ],
        })),
      deleteBill: (id) =>
        set((state) => ({
          savedBills: state.savedBills.filter((bill) => bill.id !== id),
        })),
      getBill: (id) => get().savedBills.find((bill) => bill.id === id),
    }),
    {
      name: 'bill-history-storage',
    }
  )
)