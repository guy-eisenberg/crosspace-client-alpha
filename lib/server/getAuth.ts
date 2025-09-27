import { createSupabase } from "@/clients/server/supabase";
import { unauthorized } from "next/navigation";

export async function getAuth() {
  const supabase = await createSupabase();

  const {
    data: { user: auth },
  } = await supabase.auth.getUser();

  if (!auth) unauthorized();

  return auth;
}
