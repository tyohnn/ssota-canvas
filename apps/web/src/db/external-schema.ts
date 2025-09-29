import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Define minimal auth schema for relationships
export const authSchema = pgSchema("auth");

// Define minimal auth.users table structure (only what we need for relations)
export const users = authSchema.table("users", {
    id: uuid("id").primaryKey(),
    // We don't need to define other fields from auth.users
    // since we're only using this for the foreign key relationship
});
