ALTER TABLE "laporan" ADD COLUMN "terdampak_pria" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "laporan" ADD COLUMN "terdampak_wanita" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "laporan" ADD COLUMN "terdampak_anak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "laporan" ADD COLUMN "terdampak_balita" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "laporan" ADD COLUMN "terdampak_lansia" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "laporan" ADD COLUMN "foto_ktp_path" text;--> statement-breakpoint
ALTER TABLE "laporan" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "relawan" ADD COLUMN "foto_ktp_path" text;