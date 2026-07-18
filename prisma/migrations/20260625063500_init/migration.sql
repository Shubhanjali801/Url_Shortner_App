-- CreateTable
CREATE TABLE "urls" (
    "short_code" VARCHAR(10) NOT NULL,
    "long_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "click_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("short_code")
);
