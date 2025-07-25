import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/db/admin-client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with ID: ${id} and type: ${eventType}`);
  console.log("Webhook body:", body);

  // Handle the webhook
  switch (eventType) {
    case "user.created":
      await handleUserCreated(evt.data);
      break;
    case "user.updated":
      await handleUserUpdated(evt.data);
      break;
    case "user.deleted":
      await handleUserDeleted(evt.data);
      break;
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return new Response("", { status: 200 });
}

async function handleUserCreated(userData: any) {
  try {
    console.log("Handling user.created:", userData);

    // Create user in Supabase DB using admin client
    const adminDb = createSupabaseAdminClient();

    await adminDb.rls((tx) =>
      tx.insert(users).values({
        id: userData.id,
        email: userData.email_addresses[0]?.email_address || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
      })
    );

    console.log("User created in Supabase DB:", userData.id);
  } catch (error) {
    console.error("Error creating user in Supabase:", error);
  }
}

async function handleUserUpdated(userData: any) {
  try {
    console.log("Handling user.updated:", userData);

    // Update user in Supabase DB using admin client
    const adminDb = createSupabaseAdminClient();

    await adminDb.rls((tx) =>
      tx
        .update(users)
        .set({
          email: userData.email_addresses[0]?.email_address || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          updated_at: new Date(),
        })
        .where(eq(users.id, userData.id))
    );

    console.log("User updated in Supabase DB:", userData.id);
  } catch (error) {
    console.error("Error updating user in Supabase:", error);
  }
}

async function handleUserDeleted(userData: any) {
  try {
    console.log("Handling user.deleted:", userData);

    // Delete user from Supabase DB using admin client
    const adminDb = createSupabaseAdminClient();

    await adminDb.rls((tx) =>
      tx.delete(users).where(eq(users.id, userData.id))
    );

    console.log("User deleted from Supabase DB:", userData.id);
  } catch (error) {
    console.error("Error deleting user from Supabase:", error);
  }
}
