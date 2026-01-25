import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = 4000;
const SECRET_KEY = "zentask_secret_key_change_me"; // À mettre dans .env en prod

app.use(cors());
app.use(express.json());

// --- ROUTES AUTH ---

app.post('/api/auth/login', async (req, res): Promise<any> => {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] }
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Identifiants invalides" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        token,
        user: { ...userWithoutPassword, name: `${user.firstName} ${user.lastName}` },
        expiresAt: Date.now() + 7200000
    });
});

app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, username, email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        const user = await prisma.user.create({
            data: { firstName, lastName, username, email, password: hashedPassword, role }
        });
        res.json(user);
    } catch (e) {
        res.status(400).json({ error: "Utilisateur existe déjà" });
    }
});

// --- ROUTES DATA ---

// Users
app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany({
        select: { id: true, firstName: true, lastName: true, username: true, email: true, avatar: true, role: true, department: true, phone: true }
    });
    const formatted = users.map(u => ({ ...u, name: `${u.firstName} ${u.lastName}` }));
    res.json(formatted);
});

// Projects
app.get('/api/projects', async (req, res) => {
    const projects = await prisma.project.findMany();
    res.json(projects);
});

app.post('/api/projects', async (req, res) => {
    const { name, color, ownerId } = req.body;
    try {
        const project = await prisma.project.create({
            data: { name, color, ownerId }
        });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: "Impossible de créer le projet" });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.project.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
    const tasks = await prisma.task.findMany({
        include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, username: true, phone: true } },
            subtasks: {
                include: { // On inclut maintenant l'assignee de la sous-tâche
                    assignee: { select: { id: true, firstName: true, lastName: true, name: true, avatar: true } } // name n'est pas dans la DB mais calculé, ici on prend juste ce qu'il faut
                }
            },
            comments: true,
            attachments: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const formattedTasks = tasks.map(t => ({
        ...t,
        assignee: { ...t.assignee, name: `${t.assignee.firstName} ${t.assignee.lastName}` }
    }));

    res.json(formattedTasks);
});

app.post('/api/tasks', async (req, res) => {
    const { title, description, status, priority, dueDate, projectId, assigneeId, subtasks } = req.body;

    const task = await prisma.task.create({
        data: {
            title, description, status, priority, dueDate, projectId, assigneeId,
            subtasks: { create: subtasks }
        },
        include: { assignee: true, subtasks: true, comments: true, attachments: true }
    });
    res.json(task);
});

// --- NOUVEAU : DELETE TASK ---
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.task.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erreur suppression tâche" });
    }
});

// --- NOUVEAU : UPDATE TASK (ET SOUS-TACHES) ---
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId, projectId, subtasks } = req.body;

    try {
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title, description, status, priority, dueDate, assigneeId, projectId,
                // Stratégie pour les sous-tâches : On remplace tout pour garantir la synchro
                subtasks: {
                    deleteMany: {},
                    create: subtasks.map((st: any) => ({
                        title: st.title,
                        completed: st.completed,
                        dueDate: st.dueDate,
                        assigneeId: st.assignee?.id || st.assigneeId // On sauvegarde l'ID de l'assigné
                    }))
                }
            },
            include: { assignee: true, subtasks: true, comments: true, attachments: true }
        });

        // Reformatage pour le front
        const formatted = {
            ...updatedTask,
            assignee: { ...updatedTask.assignee, name: `${updatedTask.assignee.firstName} ${updatedTask.assignee.lastName}` }
        };

        res.json(formatted);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur update tâche" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});