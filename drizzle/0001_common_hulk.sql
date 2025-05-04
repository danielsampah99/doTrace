CREATE INDEX "users_id_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");