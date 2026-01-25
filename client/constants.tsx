
import React from 'react';
import { Priority, Status, UserRole, User } from './types';

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.URGENT]: 'bg-red-100 text-red-700 border-red-200',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700 border-orange-200',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Priority.LOW]: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const STATUS_LABELS: Record<Status, string> = {
  [Status.TODO]: 'À faire',
  [Status.IN_PROGRESS]: 'En cours',
  [Status.REVIEW]: 'En révision',
  [Status.DONE]: 'Terminé',
  [Status.CANCELLED]: 'Annulé',
};

export const STATUS_COLORS: Record<Status, string> = {
  [Status.TODO]: 'bg-gray-100 text-gray-600',
  [Status.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [Status.REVIEW]: 'bg-purple-100 text-purple-700',
  [Status.DONE]: 'bg-green-100 text-green-700',
  [Status.CANCELLED]: 'bg-red-100 text-red-700',
};

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    firstName: 'Alex',
    lastName: 'Rivera',
    name: 'Alex Rivera',
    username: 'arivera',
    email: 'alex@zentask.pro',
    phone: '0601020304',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=alex', 
    role: UserRole.ADMIN,
    department: 'Direction Produit'
  },
  { 
    id: 'u2', 
    firstName: 'Sophie',
    lastName: 'Martin',
    name: 'Sophie Martin',
    username: 'smartin',
    email: 'sophie@zentask.pro',
    phone: '0605060708',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=sophie', 
    role: UserRole.MANAGER,
    department: 'Marketing & Ops'
  },
  { 
    id: 'u3', 
    firstName: 'Julien',
    lastName: 'Dubois',
    name: 'Julien Dubois',
    username: 'jdubois',
    email: 'julien@zentask.pro',
    phone: '0611121314',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=julien', 
    role: UserRole.CONTRIBUTOR,
    department: 'Engineering'
  },
  { 
    id: 'u4', 
    firstName: 'Lucie',
    lastName: 'Chen',
    name: 'Lucie Chen',
    username: 'lchen',
    email: 'lucie@zentask.pro',
    phone: '0621222324',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=lucie', 
    role: UserRole.CONTRIBUTOR,
    department: 'Design UI/UX'
  },
];

export const MOCK_PROJECTS = [
  { id: 'p1', name: 'Lancement Produit', color: '#8b5cf6', ownerId: 'u1' },
  { id: 'p2', name: 'Marketing Q4', color: '#ec4899', ownerId: 'u2' },
  { id: 'p3', name: 'Site Web v2', color: '#3b82f6', ownerId: 'u3' },
];
