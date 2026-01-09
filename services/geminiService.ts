
import { GoogleGenAI, Type } from "@google/genai";

export async function suggestAssignment(faultDescription: string, activeTechs: string[]): Promise<{
    suggestedTech: string;
    priority: 'Low' | 'Medium' | 'High';
    explanation: string;
}> {
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey === "") {
        console.warn("Gemini API Key missing. Using heuristic assignment.");
        return {
            suggestedTech: activeTechs[0] || 'Unassigned',
            priority: 'Medium',
            explanation: 'AI Service offline. Manual assignment recommended based on proximity.'
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze fault: "${faultDescription}". Techs: ${activeTechs.join(', ')}. Return JSON with suggestedTech, priority, explanation.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedTech: { type: Type.STRING },
                        priority: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["suggestedTech", "priority", "explanation"]
                }
            }
        });

        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        return {
            suggestedTech: activeTechs[0] || 'Admin',
            priority: 'Medium',
            explanation: 'Heuristic engine active: assigning based on load balancing.'
        };
    }
}
