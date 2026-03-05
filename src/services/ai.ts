import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı. Lütfen ayarlarınızı kontrol edin.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateTextResponse(prompt: string, history: Message[]) {
  try {
    const ai = getAI();
    // Geçmişi modelin beklediği formata dönüştür
    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    
    // Yeni mesajı ekle
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: `Sen AreaGPT'sin, dünyanın en gelişmiş ve zeki yapay zeka asistanısın. Şu anki tarih: ${new Date().toLocaleDateString('tr-TR')}. Google Arama (Google Search) aracına erişimin var, bu sayede 2025, 2026 ve tüm yıllardaki güncel olayları, haberleri ve bilgileri gerçek zamanlı olarak takip edebilirsin. Cevapların her zaman kapsamlı, detaylı, bilgilendirici ve profesyonel olmalıdır. Kısa veya yüzeysel cevaplardan kaçın. Bir konu hakkında soru sorulduğunda, konuyu derinlemesine analiz et, farklı perspektifler sun ve adım adım açıklamalar yap. Görsel istendiğinde yaratıcı ol. Her zaman Türkçe konuş ve yardımsever, vizyoner bir ton kullan.`,
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response.text) {
      throw new Error("API'den boş yanıt döndü.");
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter(s => s.title && s.uri);

    return {
      text: response.text,
      sources: sources || []
    };
  } catch (error: any) {
    console.error("generateTextResponse Hatası:", error);
    throw new Error(error.message || "Metin yanıtı oluşturulurken bir hata oluştu.");
  }
}

export async function generateImageResponse(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("Görsel oluşturulamadı (Aday bulunamadı).");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Yanıt içerisinde görsel verisi bulunamadı.");
  } catch (error: any) {
    console.error("generateImageResponse Hatası:", error);
    throw new Error(error.message || "Görsel oluşturulurken bir hata oluştu.");
  }
}
