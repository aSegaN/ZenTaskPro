import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Démarrage du seed ZenTask Pro...');
    console.log('');

    // 1. Nettoyer la base existante
    console.log('🗑️  Nettoyage de la base de données...');
    try {
        await prisma.comment.deleteMany();
        await prisma.attachment.deleteMany();
        await prisma.subTask.deleteMany();
        await prisma.task.deleteMany();
        await prisma.project.deleteMany();
        await prisma.user.deleteMany();
        console.log('   ✓ Base nettoyée');
    } catch (error) {
        console.log('   ⚠️ La base était peut-être déjà vide');
    }

    // 2. Créer le mot de passe hashé
    const plainPassword = 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // DEBUG: Vérifier que le hash fonctionne
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('');
    console.log('🔐 Vérification du hash bcrypt:');
    console.log(`   Mot de passe: ${plainPassword}`);
    console.log(`   Hash: ${hashedPassword.substring(0, 30)}...`);
    console.log(`   Vérification: ${isValid ? '✓ OK' : '✗ ERREUR'}`);
    console.log('');

    // 3. Création de l'utilisateur Admin
    console.log('👤 Création de l\'utilisateur Admin...');
    const adminUser = await prisma.user.create({
        data: {
            id: 'u1',
            firstName: 'Abdoulaye Séga',
            lastName: 'NDIAYE',
            username: 'asega',
            email: 'asega.ndiaye@cometafrique.com',
            password: hashedPassword,
            role: 'ADMIN',
            avatar: 'https://i.pravatar.cc/150?u=asega',
            department: 'Direction MS',
            phone: '+221 76 529 97 59'
        }
    });
    console.log(`   ✓ ${adminUser.firstName} ${adminUser.lastName} créé`);
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   👤 Username: ${adminUser.username}`);

    // 4. Créer un projet
    console.log('');
    console.log('📁 Création du projet de démo...');
    const project = await prisma.project.create({
        data: {
            id: 'p1',
            name: 'Déploiement Sénégal',
            color: '#10b981',
            ownerId: adminUser.id
        }
    });
    console.log(`   ✓ Projet "${project.name}" créé`);

    // 5. Créer une tâche de démo
    console.log('');
    console.log('📝 Création de la tâche de démo...');
    const task = await prisma.task.create({
        data: {
            title: 'Initialisation ZenTaskPro',
            description: 'Vérifier la connexion entre le Frontend React et le Backend SQLite.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: new Date().toISOString().split('T')[0],
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
    console.log(`   ✓ Tâche "${task.title}" créée avec 3 sous-tâches`);

    // Résumé final
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SEED TERMINÉ                         ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  Compte de démo:                                           ║');
    console.log('║  ├─ Username: asega                                        ║');
    console.log('║  ├─ Email: asega.ndiaye@cometafrique.com                   ║');
    console.log('║  ├─ Password: password123                                  ║');
    console.log('║  └─ Role: ADMIN                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });