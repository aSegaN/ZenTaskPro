import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Nettoyer la base existante (Ordre important pour éviter les erreurs de clés étrangères)
    // On supprime d'abord les enfants, puis les parents
    try {
        await prisma.comment.deleteMany();
        await prisma.attachment.deleteMany();
        await prisma.subTask.deleteMany();
        await prisma.task.deleteMany();
        await prisma.project.deleteMany();
        await prisma.user.deleteMany();
        console.log('🗑️ Base de données nettoyée');
    } catch (error) {
        console.log('⚠️ La base était peut-être déjà vide ou erreur de nettoyage:', error);
    }

    // 2. Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 3. Création de ton utilisateur Admin
    const adminUser = await prisma.user.create({
        data: {
            id: 'u1', // On force l'ID pour pouvoir le lier facilement aux projets
            firstName: 'Abdoulaye Séga',
            lastName: 'NDIAYE',
            username: 'asega', // Ton login
            email: 'asega.ndiaye@cometafrique.com', // Ton login alternatif
            password: hashedPassword,
            role: 'ADMIN',
            avatar: 'https://i.pravatar.cc/150?u=asega', // Avatar généré
            department: 'Direction MS',
            phone: '+221 76 529 97 59'
        }
    });

    console.log(`👤 Utilisateur créé: ${adminUser.firstName} ${adminUser.lastName}`);

    // 4. CRUCIAL : Créer un Projet (Workspace) pour cet utilisateur
    // Sans ça, le sidebar et le dashboard seront vides
    const project = await prisma.project.create({
        data: {
            id: 'p1',
            name: 'Déploiement Sénégal',
            color: '#10b981', // Vert émeraude
            ownerId: adminUser.id // Lien avec ton utilisateur
        }
    });

    console.log(`🚀 Projet créé: ${project.name}`);

    // 5. Créer une Tâche de démo
    await prisma.task.create({
        data: {
            title: 'Initialisation ZenTaskPro',
            description: 'Vérifier la connexion entre le Frontend React et le Backend SQLite.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: new Date().toISOString().split('T')[0], // Aujourd'hui
            projectId: project.id,
            assigneeId: adminUser.id,
            subtasks: {
                create: [
                    { title: 'Lancer le serveur Node', completed: true },
                    { title: 'Lancer le client Vite', completed: true },
                    { title: 'Tester la connexion Login', completed: false }
                ]
            }
        }
    });

    console.log('✅ Tâche de démo créée');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });