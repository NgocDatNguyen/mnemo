CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'annual', 'lifetime', 'free', 'beta');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('basic', 'cloze');--> statement-breakpoint
CREATE TYPE "public"."cohort_member_status" AS ENUM('invited', 'active', 'paused', 'completed', 'left');--> statement-breakpoint
CREATE TYPE "public"."deck_source" AS ENUM('manual', 'mock_test', 'pdf_upload', 'imported_apkg');--> statement-breakpoint
CREATE TYPE "public"."deck_type" AS ENUM('system', 'personal', 'cohort');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature_request', 'general', 'praise', 'complaint');--> statement-breakpoint
CREATE TYPE "public"."language_ui" AS ENUM('vi', 'en');--> statement-breakpoint
CREATE TYPE "public"."mock_input_source" AS ENUM('photo', 'pdf', 'manual_text');--> statement-breakpoint
CREATE TYPE "public"."mock_test_type" AS ENUM('reading', 'writing');--> statement-breakpoint
CREATE TYPE "public"."quality_score" AS ENUM('A', 'B', 'C', 'needs_work');--> statement-breakpoint
CREATE TYPE "public"."review_rating" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."review_state" AS ENUM('new', 'learning', 'review', 'relearning');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'past_due', 'beta');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'power', 'tutor_lite', 'tutor_pro', 'beta');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'tutor', 'admin');--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"deck_id" uuid NOT NULL,
	"type" "card_type" NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"context" text,
	"source_reference" text,
	"quality_score" "quality_score",
	"quality_warnings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohort_members" (
	"cohort_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "cohort_member_status" DEFAULT 'invited' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_members_cohort_id_user_id_pk" PRIMARY KEY("cohort_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tutor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_band" numeric(2, 1),
	"exam_date" date,
	"invite_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "cohorts_inviteToken_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"cohort_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" "deck_type" NOT NULL,
	"source" "deck_source" NOT NULL,
	"source_mock_test_id" uuid,
	"card_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_captures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_captures_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"type" "feedback_type" NOT NULL,
	"message" text NOT NULL,
	"page_url" text,
	"device_info" jsonb,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_tests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"test_type" "mock_test_type" NOT NULL,
	"input_source" "mock_input_source" NOT NULL,
	"raw_input_url" text,
	"extracted_text" text,
	"analyzed_at" timestamp with time zone,
	"weakness_clusters" jsonb,
	"generated_deck_id" uuid,
	"total_questions" integer,
	"correct_count" integer,
	"band_estimate" numeric(2, 1),
	"ai_provider" text,
	"ai_cost_estimate_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"review_id" uuid NOT NULL,
	"rating" "review_rating" NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"elapsed_days" numeric NOT NULL,
	"scheduled_days" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"stability" numeric NOT NULL,
	"difficulty" numeric NOT NULL,
	"retrievability" numeric NOT NULL,
	"state" "review_state" DEFAULT 'new' NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"last_review" timestamp with time zone,
	"lapses" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_reviews_user_card" UNIQUE("user_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "usage_credits" (
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"mock_tests_used" integer DEFAULT 0 NOT NULL,
	"cards_generated" integer DEFAULT 0 NOT NULL,
	"ai_cost_estimate_cents" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_credits_user_id_period_start_pk" PRIMARY KEY("user_id","period_start")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"current_band" numeric(2, 1),
	"target_band" numeric(2, 1),
	"exam_date" date,
	"language_ui" "language_ui" DEFAULT 'vi' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"beta_tester" boolean DEFAULT false NOT NULL,
	"beta_joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_credits" ADD CONSTRAINT "usage_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cards_deck_id" ON "cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "idx_cohort_members_user_id" ON "cohort_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cohorts_tutor_id" ON "cohorts" USING btree ("tutor_id");--> statement-breakpoint
CREATE INDEX "idx_decks_owner_id" ON "decks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_decks_cohort_id" ON "decks" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "idx_decks_source_mock_test_id" ON "decks" USING btree ("source_mock_test_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_user_id" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_resolved" ON "feedback" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_mock_tests_user_id_created_at" ON "mock_tests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_review_logs_review_id_reviewed_at" ON "review_logs" USING btree ("review_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_user_id_due" ON "reviews" USING btree ("user_id","due");--> statement-breakpoint
CREATE INDEX "idx_users_beta_tester" ON "users" USING btree ("beta_tester");