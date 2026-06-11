// Shared Netlify Database (Postgres) accessor for the storefront's functions.
// Uses the native @netlify/database driver — the connection is configured
// automatically from the platform, no connection string required.
import { getDatabase } from "@netlify/database";

export const db = getDatabase();
