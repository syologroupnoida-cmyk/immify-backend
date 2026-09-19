CREATE TABLE "blogs" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "readTime" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "content" TEXT[] NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");
CREATE INDEX "blogs_category_idx" ON "blogs"("category");
CREATE INDEX "blogs_isActive_createdAt_idx" ON "blogs"("isActive", "createdAt");
CREATE INDEX "blogs_createdAt_idx" ON "blogs"("createdAt");
CREATE INDEX "blogs_deletedAt_idx" ON "blogs"("deletedAt");
