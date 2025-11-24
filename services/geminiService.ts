import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg",
            },
          },
          {
            text: "Analyze this fuel receipt. Extract the total cost, fuel volume (liters), price per unit, date, and gas station name. If a value is missing or unclear, return null.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCost: { type: Type.NUMBER, description: "The total amount paid." },
            volume: { type: Type.NUMBER, description: "The amount of fuel in liters." },
            pricePerUnit: { type: Type.NUMBER, description: "The price per single unit of fuel." },
            stationName: { type: Type.STRING, description: "The name of the gas station vendor." },
            date: { type: Type.STRING, description: "The date of the transaction in YYYY-MM-DD format." },
          },
          required: ["totalCost", "volume", "pricePerUnit", "stationName", "date"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as ReceiptData;
    return data;

  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};