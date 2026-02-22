import { GoogleGenAI, Type } from "@google/genai";
import { DailySale, Product } from "../types";
import { calculateProductMetrics } from "../utils";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const getAI = () => {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY no configurada en .env");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const getBusinessInsights = async (products: Product[]) => {
  if (products.length === 0)
    return "Agrega productos para recibir consejos.";

  const productSummary = products
    .map((p) => {
      const metrics = calculateProductMetrics(p);
      return `Producto: ${p.name}, Stock: ${p.currentStock}, Status: ${metrics.status}`;
    })
    .join("\n");

  const prompt = 'Eres un consultor de suplementos deportivos. Analiza este inventario y da 3 consejos (max 150 palabras):\n${productSummary}';

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    return response.text || "Analisis no disponible.";
  } catch (error) {
    console.error("Insights Error:", error);
    return "Analisis no disponible.";
  }
};

export const getSalesInsights = async (
  sales: DailySale[],
  query: string
): Promise<string> => {
  if (sales.length === 0) {
    return "No hay datos de ventas para analizar.";
  }
  const prompt = 'Eres DXY Intelligence. Analiza estas ventas y responde: "${query}"\n\nVentas: ${JSON.stringify(sales, null, 2)}';
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
    });
    return response.text || "No se pudo generar analisis.";
  } catch (error) {
    console.error("Sales Insights Error:", error);
    return "Error al contactar el servicio.";
  }
};

export const analyzeSalesImage = async (base64Image: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Analiza esta foto de ventas. Extrae cada venta en JSON con: date, productName, channel, paymentMethod, totalAmount, amountPaid." },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              productName: { type: Type.STRING },
              channel: { type: Type.STRING },
              paymentMethod: { type: Type.STRING },
              totalAmount: { type: Type.NUMBER },
              amountPaid: { type: Type.NUMBER },
            },
            required: ["date", "productName", "channel", "paymentMethod", "totalAmount", "amountPaid"],
          },
        },
      },
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Vision Error:", error);
    return null;
  }
};

export const parsePurchaseInvoice = async (invoiceText: string, products: Product[]) => {
  if (!invoiceText.trim()) return null;
  const productContext = products.map((p) => ({ id: p.id, name: p.name, brand: p.brand }));
  const prompt = `Procesa esta factura: "${invoiceText}". Productos disponibles: ${JSON.stringify(productContext)}. Devuelve array JSON con id, quantity, providerCost.`;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              providerCost: { type: Type.NUMBER },
            },
            required: ["id", "quantity", "providerCost"],
          },
        },
      },
    });
    return response.text
      ? (JSON.parse(response.text) as { id: string; quantity: number; providerCost: number }[])
      : null;
  } catch (error) {
    console.error("Invoice Error:", error);
    return null;
  }
};

export const transcribeAudio = async (base64Audio: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "audio/wav", data: base64Audio } },
            { text: "Transcribe este audio. Solo devuelve el texto." },
          ],
        },
      ],
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    return "";
  }
};