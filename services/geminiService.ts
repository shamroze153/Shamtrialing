
import { GoogleGenAI, Type } from "@google/genai";

// Comment: suggestAssignment utilizes Gemini to analyze facility faults and recommend technicians.
export async function suggestAssignment(faultDescription: string, activeTechs: string[]): Promise<{
    suggestedTech: string;
    priority: 'Low' | 'Medium' | 'High';
    explanation: string;
}> {
    // Comment: Initializing GoogleGenAI directly using process.env.API_KEY as per the library guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this facility fault description: "${faultDescription}". 
            Given the available technicians: ${activeTechs.join(', ')}. 
            Suggest the best technician, assign a priority level, and provide a short one-sentence explanation.`,
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

        // Comment: Accessing the .text property directly from the GenerateContentResponse.
        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini suggestion error:", error);
        return {
            suggestedTech: activeTechs[0] || 'Admin',
            priority: 'Medium',
            explanation: 'Auto-assignment failed, defaulting to available tech.'
        };
    }
}
