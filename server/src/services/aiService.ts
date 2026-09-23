import { GoogleGenAI, Type } from '@google/genai';

// ============================================
// SERVICE IA (Gemini) — exécuté côté serveur
// La clé API reste sur le serveur, jamais exposée au client.
// ============================================

const MODEL = 'gemini-3-flash-preview';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!client) client = new GoogleGenAI({ apiKey });
    return client;
}

/**
 * Suggère des sous-tâches pour une tâche donnée.
 * Renvoie toujours un tableau (vide en cas d'échec).
 */
export async function suggestSubtasks(taskTitle: string, taskDescription?: string): Promise<{ title: string }[]> {
    const ai = getClient();
    if (!ai) return [];
    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: `Tu es un expert en productivité senior. Pour la tâche "${taskTitle}" (${taskDescription || 'pas de description'}), génère une liste de 4 sous-tâches techniques, granulaires et immédiatement actionnables.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: 'Action concrète à réaliser' },
                        },
                        required: ['title'],
                    },
                },
            },
        });
        return JSON.parse((response.text || '[]').trim());
    } catch (error) {
        console.error('Gemini suggestSubtasks failed:', error);
        return [];
    }
}

/**
 * Analyse une charge de travail et renvoie des directives stratégiques.
 */
export async function analyzeWorkload(tasks: any[]): Promise<string> {
    if (!tasks || tasks.length === 0) {
        return "Votre planning est vide. C'est l'opportunité parfaite pour une session de brainstorming stratégique ou de formation continue.";
    }
    const ai = getClient();
    if (!ai) {
        return 'Priorisez les tâches URGENT pour maintenir le momentum de vos projets critiques aujourd\'hui.';
    }
    try {
        const taskSummary = tasks.slice(0, 10)
            .map(t => `- ${t.title} [Priorité: ${t.priority}, Statut: ${t.status}]`)
            .join('\n');
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: `En tant qu'Executive Coach spécialisé en efficacité opérationnelle, analyse ce workload et donne 3 directives stratégiques concises. Focalise-toi sur le ROI et la gestion de l'énergie.\n\n      Workload actuel :\n      ${taskSummary}`,
        });
        return response.text || 'Analyse indisponible pour le moment.';
    } catch (error) {
        console.error('Gemini analyzeWorkload failed:', error);
        return 'Priorisez les tâches URGENT pour maintenir le momentum de vos projets critiques aujourd\'hui.';
    }
}
