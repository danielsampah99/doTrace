CREATE TABLE "business_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"tier" varchar(20) NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"payment_details" jsonb
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"contact_number" varchar(20),
	"opening_hours" jsonb,
	"rating" double precision,
	"is_premium" boolean DEFAULT false,
	"premium_tier" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"radius" double precision NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"business_id" integer,
	"interaction_type" varchar(50) NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"details" jsonb
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_phone_unique";--> statement-breakpoint
DROP INDEX "users_id_idx";--> statement-breakpoint
DROP INDEX "users_phone_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferences" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_tracking" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "default_long";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "default_lat";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "current_long";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "current_lat";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number");