import { createClient } from "@/lib/supabase/server";
import { listMembers, type Member } from "@/features/directory/api/members";

export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  return listMembers(supabase);
}
