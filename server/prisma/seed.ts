import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ========================================
    // UTILISATEURS
    // ========================================
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@zentask.com' },
        update: {},
        create: {
            firstName: 'Admin',
            lastName: 'ZenTask',
            username: 'admin',
            email: 'admin@zentask.com',
            password: hashedPassword,
            role: 'ADMIN',
            department: 'Direction',
            phone: '+221 77 000 0001',
        },
    });
    console.log(`✅ Admin créé: ${admin.email}`);

    const manager = await prisma.user.upsert({
        where: { email: 'manager@zentask.com' },
        update: {},
        create: {
            firstName: 'Marie',
            lastName: 'Dupont',
            username: 'marie.dupont',
            email: 'manager@zentask.com',
            password: hashedPassword,
            role: 'MANAGER',
            department: 'Développement',
            phone: '+221 77 000 0002',
        },
    });
    console.log(`✅ Manager créé: ${manager.email}`);

    const dev1 = await prisma.user.upsert({
        where: { email: 'dev@zentask.com' },
        update: {},
        create: {
            firstName: 'Jean',
            lastName: 'Martin',
            username: 'jean.martin',
            email: 'dev@zentask.com',
            password: hashedPassword,
            role: 'CONTRIBUTOR',
            department: 'Développement',
            phone: '+221 77 000 0003',
        },
    });
    console.log(`✅ Dev créé: ${dev1.email}`);

    const dev2 = await prisma.user.upsert({
        where: { email: 'sophie@zentask.com' },
        update: {},
        create: {
            firstName: 'Sophie',
            lastName: 'Bernard',
            username: 'sophie.bernard',
            email: 'sophie@zentask.com',
            password: hashedPassword,
            role: 'CONTRIBUTOR',
            department: 'Design',
            phone: '+221 77 000 0004',
        },
    });
    console.log(`✅ Dev créé: ${dev2.email}`);

    // ========================================
    // PROJETS
    // ========================================

    const projectWeb = await prisma.project.upsert({
        where: { id: 'proj-web-001' },
        update: {},
        create: {
            id: 'proj-web-001',
            name: 'ZenTask Pro - Frontend',
            color: '#6366f1',
            ownerId: manager.id,
        },
    });
    console.log(`✅ Projet créé: ${projectWeb.name}`);

    const projectApi = await prisma.project.upsert({
        where: { id: 'proj-api-001' },
        update: {},
        create: {
            id: 'proj-api-001',
            name: 'ZenTask Pro - API',
            color: '#10b981',
            ownerId: manager.id,
        },
    });
    console.log(`✅ Projet créé: ${projectApi.name}`);

    const projectDesign = await prisma.project.upsert({
        where: { id: 'proj-design-001' },
        update: {},
        create: {
            id: 'proj-design-001',
            name: 'Design System',
            color: '#f59e0b',
            ownerId: dev2.id,
        },
    });
    console.log(`✅ Projet créé: ${projectDesign.name}`);

    // ========================================
    // TÂCHES - Projet Frontend
    // ========================================

    const task1 = await prisma.task.upsert({
        where: { id: 'task-001' },
        update: {},
        create: {
            id: 'task-001',
            title: 'Implémenter le système d\'authentification',
            description: 'Créer les pages login/register avec validation et gestion JWT',
            status: 'DONE',
            priority: 'HIGH',
            dueDate: '2025-01-20',
            projectId: projectWeb.id,
            assigneeId: dev1.id,
        },
    });

    const task2 = await prisma.task.upsert({
        where: { id: 'task-002' },
        update: {},
        create: {
            id: 'task-002',
            title: 'Dashboard principal',
            description: 'Créer le dashboard avec statistiques et graphiques',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: '2025-01-30',
            projectId: projectWeb.id,
            assigneeId: dev1.id,
        },
    });

    const task3 = await prisma.task.upsert({
        where: { id: 'task-003' },
        update: {},
        create: {
            id: 'task-003',
            title: 'Système de gestion des tâches',
            description: 'CRUD complet avec drag & drop et workflow automatique',
            status: 'REVIEW',
            priority: 'URGENT',
            dueDate: '2025-02-05',
            projectId: projectWeb.id,
            assigneeId: dev1.id,
        },
    });

    const task4 = await prisma.task.upsert({
        where: { id: 'task-004' },
        update: {},
        create: {
            id: 'task-004',
            title: 'Notifications en temps réel',
            description: 'Implémenter WebSocket pour les notifications push',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: '2025-02-15',
            projectId: projectWeb.id,
            assigneeId: manager.id,
        },
    });

    console.log(`✅ 4 tâches créées pour ${projectWeb.name}`);

    // ========================================
    // TÂCHES - Projet API
    // ========================================

    const task5 = await prisma.task.upsert({
        where: { id: 'task-005' },
        update: {},
        create: {
            id: 'task-005',
            title: 'Refactoring architecture en couches',
            description: 'Séparer controllers, services, routes, middlewares',
            status: 'DONE',
            priority: 'HIGH',
            dueDate: '2025-01-25',
            projectId: projectApi.id,
            assigneeId: dev1.id,
        },
    });

    const task6 = await prisma.task.upsert({
        where: { id: 'task-006' },
        update: {},
        create: {
            id: 'task-006',
            title: 'Système de workflow automatique',
            description: 'Implémenter les transitions automatiques TODO→IN_PROGRESS→REVIEW→DONE',
            status: 'DONE',
            priority: 'URGENT',
            dueDate: '2025-01-28',
            projectId: projectApi.id,
            assigneeId: dev1.id,
        },
    });

    const task7 = await prisma.task.upsert({
        where: { id: 'task-007' },
        update: {},
        create: {
            id: 'task-007',
            title: 'Tests unitaires et intégration',
            description: 'Écrire les tests avec Jest pour les services et controllers',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: '2025-02-10',
            projectId: projectApi.id,
            assigneeId: manager.id,
        },
    });

    console.log(`✅ 3 tâches créées pour ${projectApi.name}`);

    // ========================================
    // TÂCHES - Projet Design
    // ========================================

    const task8 = await prisma.task.upsert({
        where: { id: 'task-008' },
        update: {},
        create: {
            id: 'task-008',
            title: 'Créer la palette de couleurs',
            description: 'Définir les couleurs primaires, secondaires et sémantiques',
            status: 'DONE',
            priority: 'HIGH',
            dueDate: '2025-01-15',
            projectId: projectDesign.id,
            assigneeId: dev2.id,
        },
    });

    const task9 = await prisma.task.upsert({
        where: { id: 'task-009' },
        update: {},
        create: {
            id: 'task-009',
            title: 'Composants UI de base',
            description: 'Buttons, inputs, cards, modals, etc.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: '2025-02-01',
            projectId: projectDesign.id,
            assigneeId: dev2.id,
        },
    });

    console.log(`✅ 2 tâches créées pour ${projectDesign.name}`);

    // ========================================
    // SOUS-TÂCHES
    // ========================================

    // Sous-tâches pour task2 (Dashboard)
    await prisma.subTask.createMany({
        data: [
            { id: 'st-001', title: 'Layout principal', completed: true, taskId: task2.id, assigneeId: dev1.id },
            { id: 'st-002', title: 'Widget statistiques', completed: true, taskId: task2.id, assigneeId: dev1.id },
            { id: 'st-003', title: 'Graphiques Recharts', completed: false, taskId: task2.id, assigneeId: dev1.id },
            { id: 'st-004', title: 'Liste tâches récentes', completed: false, taskId: task2.id, assigneeId: dev1.id },
        ],
        // skipDuplicates: true  <-- SUPPRIMÉ POUR SQLITE
    });

    // Sous-tâches pour task3 (Gestion tâches)
    await prisma.subTask.createMany({
        data: [
            { id: 'st-005', title: 'CRUD tâches', completed: true, taskId: task3.id, assigneeId: dev1.id },
            { id: 'st-006', title: 'CRUD sous-tâches', completed: true, taskId: task3.id, assigneeId: dev1.id },
            { id: 'st-007', title: 'Workflow automatique', completed: true, taskId: task3.id, assigneeId: dev1.id },
            { id: 'st-008', title: 'Upload fichiers', completed: true, taskId: task3.id, assigneeId: dev1.id },
        ],
        // skipDuplicates: true  <-- SUPPRIMÉ POUR SQLITE
    });

    // Sous-tâches pour task9 (Composants UI)
    await prisma.subTask.createMany({
        data: [
            { id: 'st-009', title: 'Buttons', completed: true, taskId: task9.id, assigneeId: dev2.id },
            { id: 'st-010', title: 'Inputs & Forms', completed: true, taskId: task9.id, assigneeId: dev2.id },
            { id: 'st-011', title: 'Cards', completed: false, taskId: task9.id, assigneeId: dev2.id },
            { id: 'st-012', title: 'Modals', completed: false, taskId: task9.id, assigneeId: dev2.id },
            { id: 'st-013', title: 'Notifications', completed: false, taskId: task9.id, assigneeId: dev2.id },
        ],
        // skipDuplicates: true  <-- SUPPRIMÉ POUR SQLITE
    });

    console.log('✅ 13 sous-tâches créées');

    // ========================================
    // COMMENTAIRES
    // ========================================

    await prisma.comment.createMany({
        data: [
            {
                id: 'com-001',
                content: 'Super travail sur l\'authentification ! Le système JWT fonctionne parfaitement.',
                taskId: task1.id,
                userId: manager.id,
            },
            {
                id: 'com-002',
                content: 'J\'ai ajouté les graphiques Recharts, il reste à intégrer les vraies données.',
                taskId: task2.id,
                userId: dev1.id,
            },
            {
                id: 'com-003',
                content: 'Le workflow automatique est prêt pour review. Testez bien les transitions.',
                taskId: task3.id,
                userId: dev1.id,
            },
            {
                id: 'com-004',
                content: 'J\'ai validé le code, c\'est propre. On peut merger.',
                taskId: task3.id,
                userId: manager.id,
            },
        ],
        // skipDuplicates: true  <-- SUPPRIMÉ POUR SQLITE
    });

    console.log('✅ 4 commentaires créés');

    // ========================================
    // RÉSUMÉ
    // ========================================

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           🌱 SEED TERMINÉ AVEC SUCCÈS                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  👥 Utilisateurs: 4                                      ║');
    console.log('║  📁 Projets: 3                                           ║');
    console.log('║  📝 Tâches: 9                                            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
}

main()
    .catch((e) => {
        console.error('❌ Erreur seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });