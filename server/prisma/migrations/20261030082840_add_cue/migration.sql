-- CreateTable
CREATE TABLE "Cue" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "timecodeIn" TEXT NOT NULL,
    "timecodeOut" TEXT NOT NULL,
    "scene" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sketch',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Cue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cue" ADD CONSTRAINT "Cue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
