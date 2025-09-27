import { createClient } from "@supabase/supabase-js";

export function createService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
  );
}
