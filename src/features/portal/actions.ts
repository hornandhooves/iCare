"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { PermissionCategory } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

// Resolves a brand-new patient signup to whatever existing patient rows
// (across any organization) already carry the same phone number — this is
// the whole identity-resolution step, since each business creates its own
// local patient row with no shared account until now. Only ever claims rows
// that aren't already linked, so a phone number can't be used to hijack
// someone else's already-connected record.
export async function linkPatientByPhone(formData: FormData) {
  const user = await requireUser();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return;

  const admin = createAdminClient();
  await admin
    .from("patients")
    .update({ user_id: user.id })
    .eq("phone", phone)
    .is("user_id", null);

  revalidatePath("/portal");
  redirect("/portal");
}

// Toggling a category is the patient's own action on their own row, so this
// runs on the session-scoped client — RLS (see migration 0002) is what
// actually enforces they can only ever touch their own grants, not a
// server-side check here.
export async function updateGrant(formData: FormData) {
  const supabase = await createClient();

  const patientId = String(formData.get("patientId"));
  const orgId = String(formData.get("orgId"));
  const branchId = String(formData.get("branchId"));
  const category = String(formData.get("category")) as PermissionCategory;
  const granted = formData.get("granted") === "true";

  await supabase.from("patient_grants").upsert(
    {
      patient_id: patientId,
      org_id: orgId,
      branch_id: branchId,
      category_key: category,
      granted,
      granted_at: granted ? new Date().toISOString() : null,
    },
    { onConflict: "patient_id,branch_id,category_key" },
  );

  revalidatePath(`/portal/${patientId}`);
}
