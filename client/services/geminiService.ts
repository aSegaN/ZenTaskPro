import api from './api';

// ============================================
// SERVICE IA (front) — délègue au backend.
// La clé Gemini n'est JAMAIS présente côté client :
// les appels passent par /api/ai/* qui l'utilise côté serveur.
// ============================================

/**
 * Suggère des sous-tâches via le backend. Renvoie un tableau (vide si échec).
 */
export const suggestSubtasks = async (
  taskTitle: string,
  taskDescription: string
): Promise<{ title: string }[]> => {
  try {
    const { data } = await api.post('/ai/subtasks', {
      title: taskTitle,
      description: taskDescription,
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('IA suggestSubtasks failed:', error);
    return [];
  }
};

/**
 * Analyse la charge de travail via le backend. Renvoie une chaîne.
 */
export const analyzeWorkload = async (tasks: any[]): Promise<string> => {
  try {
    const { data } = await api.post('/ai/analyze', { tasks });
    return data?.insight ?? '';
  } catch (error) {
    console.error('IA analyzeWorkload failed:', error);
    return 'Priorisez les tâches URGENT pour maintenir le momentum de vos projets critiques aujourd\'hui.';
  }
};
