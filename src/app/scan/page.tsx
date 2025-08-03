'use client'
import { v4 as uuidv4 } from 'uuid'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Upload, Image as ImageIcon } from 'lucide-react'
import { useSplitStore } from '@/store/useSplitStore'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default function ScanPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const { setItems, setTax, setTip } = useSplitStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageSelect(files[0])
    }
  }

  const handleImageSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const takePhoto = () => {
    cameraInputRef.current?.click()
  }

  const chooseFile = () => {
    fileInputRef.current?.click()
  }

  // Convert base64 to file for Gemini
  const base64ToFile = async (base64: string): Promise<File> => {
    const response = await fetch(base64)
    const blob = await response.blob()
    return new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
  }

  // Google Gemini Vision API - MUCH better than OCR!
  const processImage = async () => {
    if (!selectedImage) return

    setLoading(true)
    setOcrProgress(0)
    
    try {
      console.log('🤖 Starting Google Gemini Vision processing...')
      setOcrProgress(25)
      
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY')
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      setOcrProgress(50)
      
      // Convert image to the right format
      const file = await base64ToFile(selectedImage)
      const imageData = await file.arrayBuffer()
      
      setOcrProgress(70)
      
      const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      
      {
        "items": [
          {"name": "Item Name", "price": 12.99},
          {"name": "Another Item", "price": 8.50}
        ],
        "tax": 2.15,
        "tip": 3.00,
        "total": 26.64
      }
      
      Rules:
      - Extract ALL food/drink items with their exact prices
      - Include tax amount (look for "tax", "GST", "HST", "sales tax")
      - Include tip/gratuity if present
      - Prices should be numbers, not strings
      - Item names should be clean (no prices, quantities, or symbols)
      - If no tax/tip found, set to 0
      - Return ONLY the JSON object, no other text
      `
      
      const imagePart = {
        inlineData: {
          data: Buffer.from(imageData).toString('base64'),
          mimeType: file.type
        }
      }
      
      setOcrProgress(90)
      
      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      console.log('🤖 Gemini raw response:', text)
      
      // Parse the JSON response
      let parsedData
      try {
        // Clean up the response (remove markdown formatting if present)
        const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsedData = JSON.parse(cleanJson)
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError)
        throw new Error('Failed to parse receipt data. Please try again.')
      }
      
      setOcrProgress(100)
      
      console.log('✅ Parsed receipt data:', parsedData)
      
      // Validate the response
      if (!parsedData.items || !Array.isArray(parsedData.items)) {
        throw new Error('No items found in the receipt')
      }
      
      if (parsedData.items.length === 0) {
        const shouldContinue = confirm(
          `❌ No items found automatically.\n\nWould you like to continue and add items manually?`
        )
        if (!shouldContinue) return
      }
      
      // ✅ Ensure each item has a unique ID
      const itemsWithIds = parsedData.items.map((item: any) => ({
        id: uuidv4(),
        name: item.name || 'Unnamed item',
        price: parseFloat(item.price) || 0
      }))
      
      console.log('✅ Items with unique IDs:', itemsWithIds)
      
      // Store in Zustand store
      setItems(itemsWithIds)
      setTax(parseFloat(parsedData.tax) || 0)
      setTip(parseFloat(parsedData.tip) || 0)
      
      console.log('✅ Data stored successfully:', {
        items: itemsWithIds,
        tax: parseFloat(parsedData.tax) || 0,
        tip: parseFloat(parsedData.tip) || 0
      })
      
      // Redirect to items page
      router.push('/items')
      
    } catch (error) {
      console.error('❌ Gemini Vision processing failed:', error)
      alert(`Receipt processing failed: ${error}. Please try again with a clearer photo.`)
    } finally {
      setLoading(false)
      setOcrProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Animated dots */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`scan-dot-${i}`}
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

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button onClick={() => router.back()} className="absolute left-0 top-0">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Scan Receipt</h1>
          <p className="text-gray-600 text-lg">Take a photo or upload an image of your receipt</p>
        </div>

        {/* Camera/Upload Area */}
        <div className="mb-8">
          {!selectedImage ? (
            <div
              className={`border-3 border-dashed rounded-xl p-10 text-center transition-all duration-300 w-full h-[500px] flex flex-col justify-center shadow-lg ${
                isDragging
                  ? 'border-orange-500 bg-orange-100 shadow-orange-200 scale-105'
                  : 'border-gray-400 bg-white hover:border-orange-400 hover:shadow-xl hover:scale-102'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-orange-100 rounded-xl flex items-center justify-center mb-8 shadow-sm">
                  <Camera size={40} className="text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Take Photo or Upload
                </h3>
                <p className="text-gray-600 mb-10 text-center px-6 text-lg">
                  Drag and drop your receipt here or use the buttons below
                </p>
                
                <div className="space-y-5 w-full px-8">
                  <button
                    onClick={takePhoto}
                    className="w-full bg-orange-600 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <Camera size={24} />
                    📷 Take Photo
                  </button>
                  
                  <button
                    onClick={chooseFile}
                    className="w-full bg-white text-gray-700 py-5 rounded-xl font-bold text-lg border-2 border-gray-300 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <Upload size={24} />
                    📁 Choose File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Image Preview */
            <div className="bg-white rounded-xl p-8 shadow-xl w-full relative border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon size={24} className="text-orange-600" />
                <span className="font-bold text-gray-800 text-lg">Receipt Image</span>
              </div>
              
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Receipt"
                  className="w-full h-96 object-contain rounded-xl border-2 border-gray-300 shadow-md"
                />
                
                {/* Loading Overlay with Progress */}
                {loading && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-orange-700 font-bold text-lg mb-2">Looking at receipt...</p>
                    {ocrProgress > 0 && (
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        ></div>
                      </div>
                    )}
                    <p className="text-orange-600 text-sm mt-2">{ocrProgress}% complete</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 bg-gray-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-md"
                  disabled={loading}
                >
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Process Button */}
        {selectedImage && (
          <button
            onClick={processImage}
            className="w-full bg-orange-600 text-white py-5 rounded-xl font-bold text-xl hover:bg-orange-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 mb-8 shadow-lg"
            disabled={loading}
          >
            {loading ? `⏳ Processing... ${ocrProgress}%` : '🧾 Scrap the Bill'}
          </button>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Tips Section */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-md">
          <h3 className="font-bold text-orange-800 mb-4 text-center text-lg">📸 Tips for best results</h3>
          <ul className="text-orange-700 space-y-2">
            <li className="flex items-center"><span className="mr-2">💡</span> Well-lit and readable receipt</li>
            <li className="flex items-center"><span className="mr-2">🚫</span> Avoid shadows and glare</li>
            <li className="flex items-center"><span className="mr-2">📏</span> Keep receipt flat and straight</li>
            <li className="flex items-center"><span className="mr-2">🖼️</span> Include entire receipt in frame</li>
          </ul>
        </div>
      </div>
    </div>
  )
}