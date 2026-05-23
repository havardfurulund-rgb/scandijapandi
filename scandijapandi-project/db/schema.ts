import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: serial().primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  curator: text("curator"),
  source: text("source"),
  landingUrl: text("landing_url"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  sessionId: text("session_id"),
  curator: text("curator"),
  source: text("source"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  shippingAddress: text("shipping_address"),
  deliveryNotes: text("delivery_notes"),
  items: jsonb("items"),
  amountTotal: text("amount_total"),
  currency: text("currency"),
  routingStatus: text("routing_status").notNull().default("pending"),
  producerEndpoint: text("producer_endpoint"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const diagnosticLogs = pgTable("diagnostic_logs", {
  id: serial().primaryKey(),
  functionName: text("function_name").notNull(),
  severity: text("severity").notNull().default("error"),
  message: text("message").notNull(),
  errorStack: text("error_stack"),
  requestId: text("request_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});
