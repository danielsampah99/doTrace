CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"full_name" varchar,
	"default_long" numeric(9, 6),
	"default_lat" numeric(9, 6),
	"current_long" numeric(9, 6),
	"current_lat" numeric(9, 6),
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
