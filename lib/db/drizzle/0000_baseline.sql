CREATE TABLE "donasi" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"laporan_id" integer,
	"jenis" text NOT NULL,
	"jumlah_dana" integer,
	"nama_barang" text,
	"jumlah_barang" integer,
	"nama_donatur" text NOT NULL,
	"kontak_donatur" text,
	"pesan" text,
	"bukti_transfer_url" text,
	"status" text DEFAULT 'menunggu' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laporan" (
	"id" serial PRIMARY KEY NOT NULL,
	"judul" text NOT NULL,
	"jenis_bencana" text NOT NULL,
	"lokasi" text NOT NULL,
	"koordinat_lat" real,
	"koordinat_lng" real,
	"deskripsi" text NOT NULL,
	"nama_pelapor" text NOT NULL,
	"kontak_pelapor" text NOT NULL,
	"jabatan_pelapor" text,
	"jumlah_terdampak" integer,
	"lokasi_pengungsian" text,
	"foto_urls" json DEFAULT '[]'::json,
	"foto_ktp_url" text,
	"kronologi" text,
	"target_dana" integer,
	"status" text DEFAULT 'menunggu' NOT NULL,
	"catatan_admin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kebutuhan" (
	"id" serial PRIMARY KEY NOT NULL,
	"laporan_id" integer NOT NULL,
	"kategori" text NOT NULL,
	"nama_item" text NOT NULL,
	"jumlah_dibutuhkan" integer NOT NULL,
	"jumlah_terpenuhi" integer DEFAULT 0 NOT NULL,
	"satuan" text NOT NULL,
	"keterangan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relawan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"nik" text NOT NULL,
	"no_hp" text NOT NULL,
	"email" text,
	"alamat" text NOT NULL,
	"keahlian" json DEFAULT '[]'::json,
	"foto_ktp_url" text,
	"status_verifikasi" text DEFAULT 'menunggu' NOT NULL,
	"catatan_verifikasi" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventaris" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_barang" text NOT NULL,
	"kategori" text NOT NULL,
	"satuan" text NOT NULL,
	"stok_masuk" integer DEFAULT 0 NOT NULL,
	"stok_keluar" integer DEFAULT 0 NOT NULL,
	"stok_sisa" integer DEFAULT 0 NOT NULL,
	"keterangan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "transaksi_inventaris" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventaris_id" integer NOT NULL,
	"jenis" text NOT NULL,
	"jumlah" integer NOT NULL,
	"keterangan" text NOT NULL,
	"laporan_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penugasan" (
	"id" serial PRIMARY KEY NOT NULL,
	"laporan_id" integer NOT NULL,
	"relawan_id" integer NOT NULL,
	"nama_relawan" text NOT NULL,
	"detail_tugas" text NOT NULL,
	"lokasi_tugas" text NOT NULL,
	"link_grup" text,
	"qr_code_url" text,
	"status" text DEFAULT 'aktif' NOT NULL,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'donatur' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
