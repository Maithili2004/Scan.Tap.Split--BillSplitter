import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a receipt parser. Return only valid JSON without any markdown, explanations, or formatting.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract items, prices, tax, and tip from this receipt image.

Return ONLY this JSON structure (no other text):
{"items": [{"name": "Item Name", "price": 12.99}], "tax": 0.00, "tip": 0.00}

Rules:
- Numbers only for prices (not strings)
- Use 0.00 if tax/tip not found
- Clean item names
- No markdown, no explanations, just JSON`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.0,
        top_p: 0.1,
        stop: ["\n\n", "**", "```", "Analysis", "Receipt"]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Together AI API error:', response.status, errorText)
      throw new Error(`Together AI API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in Together AI response')
    }

    console.log('Raw API response:', content)
    
    // More aggressive JSON extraction
    let jsonStr = content.trim()
    
    // Remove common markdown patterns
    jsonStr = jsonStr.replace(/\*\*.*?\*\*/g, '') // Remove **text**
    jsonStr = jsonStr.replace(/\*.*?\*/g, '') // Remove *text*
    jsonStr = jsonStr.replace(/```json/g, '')
    jsonStr = jsonStr.replace(/```/g, '')
    jsonStr = jsonStr.replace(/Receipt Analysis/g, '')
    jsonStr = jsonStr.replace(/Analysis:/g, '')
    
    // Remove any text before the first { and after the last }
    const jsonStart = jsonStr.indexOf('{')
    const jsonEnd = jsonStr.lastIndexOf('}')
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON object found in response:', jsonStr)
      return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 })
    }
    
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1).trim()
    
    console.log('Extracted JSON:', jsonStr)
    
    // Validate and parse JSON
    try {
      const parsedData = JSON.parse(jsonStr)
      
      // Ensure required structure
      if (!parsedData.items || !Array.isArray(parsedData.items)) {
        throw new Error('Invalid JSON structure - missing items array')
      }
      
      return NextResponse.json(parsedData)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Failed to parse:', jsonStr)
      
      // Fallback: Try to create a basic structure
      return NextResponse.json({
        error: 'AI response could not be parsed as JSON',
        rawResponse: content
      }, { status: 500 })
    }

  } catch (error) {
    console.error('OCR API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}