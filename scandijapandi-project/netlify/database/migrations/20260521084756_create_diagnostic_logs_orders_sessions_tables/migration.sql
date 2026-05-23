CREATE TABLE "diagnostic_logs" (
	"id" serial PRIMARY KEY,
	"function_name" text NOT NULL,
	"severity" text DEFAULT 'error' NOT NULL,
	"message" text NOT NULL,
	"error_stack" text,
	"request_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"stripe_session_id" text NOT NULL UNIQUE,
	"session_id" text,
	"curator" text,
	"source" text,
	"customer_email" text,
	"customer_name" text,
	"shipping_address" text,
	"delivery_notes" text,
	"items" jsonb,
	"amount_total" text,
	"currency" text,
	"routing_status" text DEFAULT 'pending' NOT NULL,
	"producer_endpoint" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"session_id" text NOT NULL UNIQUE,
	"curator" text,
	"source" text,
	"landing_url" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
