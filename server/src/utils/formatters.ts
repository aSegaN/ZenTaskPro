// ============================================
// USER FORMATTERS
// ============================================

/**
 * Formater un utilisateur (sans mot de passe, avec name)
 */
export const formatUser = (user: any) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    department: user.department,
    phone: user.phone,
});

/**
 * Formater plusieurs utilisateurs
 */
export const formatUsers = (users: any[]) => users.map(formatUser);

// ============================================
// TASK FORMATTERS
// ============================================

/**
 * Formater une tâche complète avec ses relations
 */
export const formatTask = (task: any) => ({
    ...task,
    assignee: task.assignee ? {
        ...task.assignee,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`
    } : null,
    subtasks: task.subtasks?.map((st: any) => ({
        ...st,
        assignee: st.assignee ? {
            ...st.assignee,
            name: `${st.assignee.firstName} ${st.assignee.lastName}`
        } : null
    })) || [],
    comments: task.comments?.map((c: any) => ({
        ...c,
        user: c.user ? {
            ...c.user,
            name: `${c.user.firstName} ${c.user.lastName}`
        } : null
    })) || []
});

/**
 * Formater plusieurs tâches
 */
export const formatTasks = (tasks: any[]) => tasks.map(formatTask);

// ============================================
// PRISMA INCLUDES
// ============================================

/**
 * Include Prisma standard pour les tâches
 */
export const taskInclude = {
    assignee: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            username: true,
            phone: true
        }
    },
    subtasks: {
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            },
            attachments: true
        }
    },
    comments: {
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            }
        }
    },
    attachments: true
};

/**
 * Select Prisma standard pour les utilisateurs (sans password)
 */
export const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    email: true,
    avatar: true,
    role: true,
    department: true,
    phone: true
};

/**
 * Include Prisma pour les projets
 */
export const projectInclude = {
    owner: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
        }
    },
    _count: {
        select: { tasks: true }
    }
};