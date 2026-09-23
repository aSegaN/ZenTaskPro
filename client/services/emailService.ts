
import { Task, User, EmailLog, Status } from '../types';

export const emailService = {
  generateTaskCreatedEmail: (task: Task): Omit<EmailLog, 'id' | 'sentAt' | 'status'> => {
    return {
      to: task.assignee.email,
      subject: `[ZenTask] Nouvelle tâche assignée : ${task.title}`,
      body: `Bonjour ${task.assignee.firstName},\n\nUne nouvelle tâche vous a été assignée dans le projet.\n\nTitre : ${task.title}\nÉchéance : ${task.dueDate}\nPriorité : ${task.priority}\n\nConnectez-vous pour voir les détails.\nL'équipe ZenTask Pro.`
    };
  },

  generateStatusChangeEmail: (task: Task, oldStatus: Status): Omit<EmailLog, 'id' | 'sentAt' | 'status'> => {
    return {
      to: task.assignee.email,
      subject: `[ZenTask] Changement de statut : ${task.title}`,
      body: `Le statut de votre tâche "${task.title}" est passé de ${oldStatus} à ${task.status}.\n\nCeci est une notification automatique.\nL'équipe ZenTask Pro.`
    };
  },

  generateUrgentAlertEmail: (task: Task, manager: User): Omit<EmailLog, 'id' | 'sentAt' | 'status'> => {
    return {
      to: manager.email,
      subject: `[ZenTask] ALERTE CRITIQUE : ${task.title}`,
      body: `Attention ${manager.firstName},\n\nLa tâche "${task.title}" assignée à ${task.assignee.name} a été marquée comme URGENTE.\n\nStatut actuel : ${task.status}\n\nMerci de superviser l'avancement.\nL'équipe ZenTask Pro.`
    };
  }
};
