import { GoogleGenAI, Type } from "@google/genai";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function analyzeProjectFailure(name: string, description: string, failureReason: string, resourceGap: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze the following abandoned environmental project and provide a professional failure diagnosis and a revival plan.
    
    Project Name: ${name}
    Description: ${description}
    Reported Failure Reason: ${failureReason}
    Current Resource Gap: ${resourceGap}
    
    Provide the response in JSON format with the following structure:
    {
      "diagnosis": "A detailed explanation of why the project likely failed based on the provided info.",
      "revivalPlan": ["Step 1...", "Step 2...", "Step 3..."],
      "revivalScore": 85, (a number between 0-100)
      "successProbability": 78, (a number between 0-100)
      "impactMetrics": {
        "wasteRemoved": 5.2, (estimated tons)
        "treesRestored": 300, (estimated count)
        "waterQualityImprovement": 40 (estimated % improvement)
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            revivalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            revivalScore: { type: Type.NUMBER },
            successProbability: { type: Type.NUMBER },
            impactMetrics: {
              type: Type.OBJECT,
              properties: {
                wasteRemoved: { type: Type.NUMBER },
                treesRestored: { type: Type.NUMBER },
                waterQualityImprovement: { type: Type.NUMBER }
              }
            }
          },
          required: ["diagnosis", "revivalPlan", "revivalScore", "successProbability", "impactMetrics"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
}
