
import { GoogleGenAI, Type } from "@google/genai";
import { DailySale, Product } from "../types";
import { calculateProductMetrics } from "../utils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeSalesImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: `Analiza esta foto de un cuaderno de ventas o ticket. Extrae cada venta individual en un formato JSON estructurado.

              Campos a extraer:
              - "date": "YYYY-MM-DD". Si no hay año, asume el actual. Si no hay fecha, usa la fecha de hoy.
              - "productName": El nombre del producto vendido.
              - "channel": Si la venta parece de mostrador, usa "Física". Si no, "Online".
              - "paymentMethod": Uno de ['Efectivo', 'Transferencia', 'Tarjeta Crédito', 'Débito', 'Bancor', 'Carta Personal', 'Canje/Servicio'].
              - "totalAmount": El monto total de la venta.
              - "amountPaid": El monto que se pagó. Si no se especifica y no es una seña, debe ser igual a totalAmount. Si es una seña, extrae el monto abonado. Si es 'Canje/Servicio', este valor debe ser 0.

              Reglas:
              - Si una venta tiene un pago parcial o seña, asegúrate de que 'amountPaid' refleje solo lo pagado.
              - Si dice 'Canje', 'Flete', o 'Limpieza' como pago, usa 'Canje/Servicio' y pon amountPaid en 0.
              - Extrae solo datos numéricos válidos.`,
            },
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
    console.error("Gemini Vision Error:", error);
    return null;
  }
};

export const getBusinessInsights = async (products: Product[]) => {
  if (products.length === 0)
    return "Agregá productos para recibir consejos estratégicos.";

  const productSummary = products
    .map((p) => {
      const metrics = calculateProductMetrics(p);
      return `Producto: ${p.name}, Costo Real: ${metrics.realCost}, Ganancia: ${metrics.netProfit}, Stock: ${p.currentStock}/${p.minStock}, Status: ${metrics.status}`;
    })
    .join("\n");

  const prompt = `
    Eres un consultor experto en negocios de suplementos deportivos y e-commerce para DXY Suplementos.
    Analiza la siguiente lista de inventario y precios y brinda 3 consejos accionables (máximo 150 palabras) para mejorar la rentabilidad.
    Datos:
    ${productSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Análisis no disponible.";
  } catch (error) {
    console.error("Insights Error:", error);
    return "Análisis no disponible.";
  }
};

export const getSalesInsights = async (sales: DailySale[], query: string): Promise<string> => {
    if (sales.length === 0) {
        return "No hay datos de ventas para analizar. Registre algunas ventas primero.";
    }

    const prompt = `
        Eres "DXY Intelligence", un analista de operaciones y estratega de ventas para DXY Suplementos.
        Basado en el siguiente historial de ventas JSON, responde a la consulta del usuario de forma concisa y estratégica.

        Historial de Ventas:
        ${JSON.stringify(sales, null, 2)}

        Reglas de Análisis:
        1. Si la consulta es sobre totales (semanal, mensual, por canal, etc.), calcula el dato exacto del JSON y preséntalo claramente. Para saldos pendientes, suma (totalAmount - amountPaid) para todas las ventas donde totalAmount > amountPaid.
        2. Si la consulta pide un análisis estratégico (ej: "analiza mis ventas", "dame estrategias"), realiza lo siguiente:
            a. Identifica los días de la semana con más y menos ventas (0=Domingo, 6=Sábado).
            b. Analiza los medios de pago más utilizados.
            c. Propón 3 estrategias accionables y creativas para aumentar las ventas en los días de menor movimiento. Considera el contexto de Morteros, Córdoba (un pueblo donde las fechas de cobro suelen ser a principio y mitad de mes).
        3. Mantén las respuestas directas, profesionales, en formato MARKDOWN y en un tono proactivo. Usa listas y negritas para claridad.

        Consulta del Usuario:
        "${query}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
        });
        return response.text || "No se pudo generar un análisis en este momento.";
    } catch (error) {
        console.error("Sales Insights Error:", error);
        return "Error al contactar al servicio de análisis.";
    }
};


export const parsePurchaseInvoice = async (
  invoiceText: string,
  products: Product[]
) => {
  if (!invoiceText.trim()) return null;

  const productContext = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    flavors: p.flavors?.join(", ") || "",
  }));

  const prompt = `
    Eres un asistente de procesamiento de facturas de compra para DXY Suplementos. Tu tarea es analizar un texto y convertirlo en una estructura JSON precisa de ítems.

    **Contexto (Lista de Productos Disponibles en Inventario):**
    ${JSON.stringify(productContext, null, 2)}

    **Instrucciones:**
    1. Lee el siguiente texto de la factura. El formato esperado es "Cantidad Nombre del Producto @ Costo Unitario".
    2. Para cada línea, identifica la cantidad, el nombre del producto, y el costo unitario (providerCost).
    3. Utiliza la lista de productos disponibles para encontrar la coincidencia más cercana por nombre y marca.
    4. Devuelve un array de objetos JSON con "id" (del producto coincidente), "quantity" (numérico), y "providerCost" (numérico).
    5. Si una línea no tiene el formato correcto o no encuentras una coincidencia clara, omítela del resultado.
    6. Solo devuelve el array JSON, sin texto adicional ni explicaciones.

    **Texto de Factura:**
    "${invoiceText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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

    // FIX: Add explicit type casting for JSON.parse to resolve 'unknown' type errors in consuming components.
    return response.text ? JSON.parse(response.text) as { id: string; quantity: number; providerCost: number }[] : null;
  } catch (error) {
    console.error("Gemini Invoice Parsing Error:", error);
    alert(
      "La IA no pudo procesar la factura. Verifique el formato: 'Cantidad Producto @ Costo Unitario' por línea."
    );
    return null;
  }
};


export const transcribeAudio = async (base64Audio: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "audio/wav",
                data: base64Audio,
              },
            },
            {
              text: "Transcripción precisa del audio de voz. Si el audio menciona un producto de suplementación deportiva, escribilo correctamente. Devolvé solo el texto transcripto, sin introducciones.",
            },
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
