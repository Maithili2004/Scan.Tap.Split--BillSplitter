import { create } from 'zustand'

interface ReceiptStore {
  image: string | null
  setImage: (img: string) => void
  parsedData: any
  setParsedData: (data: any) => void
}

export const useReceiptStore = create<ReceiptStore>((set) => ({
  image: null,
  setImage: (img) => set({ image: img }),
  parsedData: null,
  setParsedData: (data) => set({ parsedData: data }),
}))
