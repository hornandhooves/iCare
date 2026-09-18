import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase.from("staff").select("id").eq("user_id", user.id).maybeSingle();
  if (staffRow) redirect("/agenda");

  // No staff row yet either means "patient" or "owner mid-onboarding" —
  // intended_role (set at signup) is what tells the two apart, since an
  // owner who hasn't finished onboarding has no org/staff row either.
  const intendedRole = user.user_metadata?.intended_role;
  redirect(intendedRole === "owner" ? "/onboarding" : "/portal");
}
