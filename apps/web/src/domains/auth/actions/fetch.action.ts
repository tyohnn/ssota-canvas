"use server";

import { createDrizzleSupabaseClient } from "@/db";
import { profiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

export async function getProfileAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const db = await createDrizzleSupabaseClient();
  const [profile] = await db.rls(async (tx) => {
    return tx
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, user.id))
      .limit(1);
  });

  return profile || null;
}
