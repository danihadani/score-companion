-- CreateTable
CREATE TABLE "TempTrack" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "link" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cueId" INTEGER NOT NULL,

    CONSTRAINT "TempTrack_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TempTrack" ADD CONSTRAINT "TempTrack_cueId_fkey" FOREIGN KEY ("cueId") REFERENCES "Cue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
