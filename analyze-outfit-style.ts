import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeOutfitStyleFromBase64(base64Image: string, mimeType = 'image/jpeg', prompt?: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
        generationConfig: {
    temperature: 0,
    topP: 1,
    topK: 1,
    maxOutputTokens: 3000
  }
    });

    const finalPrompt = prompt || "Analyze the outfit in detail. [Outerwear, Base Layer, Bottom, Footwear, Accessories, Overall Style, Color Palette, Suggestions]";
    
    const result = await model.generateContent([
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ]);

    const text = result.response.text();
    return {
      success: true,
      analysis: text
    };

  } catch (error) {
    console.error('Detailed analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}
