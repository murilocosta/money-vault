-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "linkedFromId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_linkedFromId_key" ON "Transaction"("linkedFromId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_linkedFromId_fkey" FOREIGN KEY ("linkedFromId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
