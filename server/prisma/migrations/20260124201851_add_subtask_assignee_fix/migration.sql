-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TEXT,
    "taskId" TEXT NOT NULL,
    "assigneeId" TEXT,
    CONSTRAINT "SubTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SubTask" ("completed", "dueDate", "id", "taskId", "title") SELECT "completed", "dueDate", "id", "taskId", "title" FROM "SubTask";
DROP TABLE "SubTask";
ALTER TABLE "new_SubTask" RENAME TO "SubTask";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
