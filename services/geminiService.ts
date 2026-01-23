
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestSubtasks = async (taskTitle: string, taskDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es un expert en productivité senior. Pour la tâche "${taskTitle}" (${taskDescription || 'pas de description'}), génère une liste de 4 sous-tâches techniques, granulaires et immédiatement actionnables.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Action concrète à réaliser" }
            },
            required: ["title"]
          }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini failed:", error);
    return [];
  }
};

export const analyzeWorkload = async (tasks: any[]) => {
  try {
    if (tasks.length === 0) return "Votre planning est vide. C'est l'opportunité parfaite pour une session de brainstorming stratégique ou de formation continue.";
    
    const taskSummary = tasks.slice(0, 10).map(t => `- ${t.title} [Priorité: ${t.priority}, Statut: ${t.status}]`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `En tant qu'Executive Coach spécialisé en efficacité opérationnelle, analyse ce workload et donne 3 directives stratégiques concises. Focalise-toi sur le ROI et la gestion de l'énergie.
      
      Workload actuel :
      ${taskSummary}`,
    });
    return response.text;
  } catch (error) {
    return "Priorisez les tâches URGENT pour maintenir le momentum de vos projets critiques aujourd'hui.";
  }
};
