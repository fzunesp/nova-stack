-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IntakeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "source" TEXT NOT NULL DEFAULT 'external',
    "status" TEXT NOT NULL DEFAULT 'new',
    "data" JSONB,
    "decisionNote" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "IntakeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_IntakeSubmission" ("createdAt", "email", "id", "message", "name", "source", "status", "userId") SELECT "createdAt", "email", "id", "message", "name", "source", "status", "userId" FROM "IntakeSubmission";
DROP TABLE "IntakeSubmission";
ALTER TABLE "new_IntakeSubmission" RENAME TO "IntakeSubmission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
