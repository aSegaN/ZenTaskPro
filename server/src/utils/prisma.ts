import { PrismaClient } from '@prisma/client';

// ============================================
// PRISMA CLIENT SINGLETON
// ============================================

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
        ? ['error', 'warn'] 
        : ['error'],
});

export default prisma;
