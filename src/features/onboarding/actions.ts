"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStaffContext } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { DEFAULT_ROLES, DEFAULT_ROLE_PRIVILEGES } from "@/lib/role-privileges";
import { fieldTemplatesForVerticals } from "@/lib/field-templates";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

// Step 1: create the organization, its first branch, the default role set,
// and the owner's staff row. Runs via the admin client because the user has
// no staff row (and therefore no org membership) yet for RLS to key off of.
export async function createOrganization(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  if (!name) return;

  const admin = createAdminClient();

  const baseSlug = slugify(name) || "clinica";
  let slug = baseSlug;
  for (let i = 1; i < 50; i++) {
    const { data: existing } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug })
    .select("id")
    .single();
  if (orgError || !org) throw new Error(orgError?.message ?? "Could not create organization");

  const branchName = location.split(",")[0]?.trim() || name;
  await admin.from("branches").insert({ org_id: org.id, name: branchName, location });

  const { data: insertedRoles } = await admin
    .from("roles")
    .insert(DEFAULT_ROLES.map((r) => ({ org_id: org.id, key: r.key, name: r.name })))
    .select("id, key");

  const roleIdByKey = new Map((insertedRoles ?? []).map((r) => [r.key, r.id]));
  await admin.from("role_privileges").insert(
    DEFAULT_ROLE_PRIVILEGES.map((p) => ({
      role_id: roleIdByKey.get(p.roleKey)!,
      privilege_key: p.privilegeKey,
      grant_state: p.grantState,
      limit_note: p.limitNote,
    })),
  );

  const ownerRoleId = roleIdByKey.get("owner")!;
  const staffName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Propietario";

  const { data: staffRow } = await admin
    .from("staff")
    .insert({ org_id: org.id, user_id: user.id, name: staffName, status: "active" })
    .select("id")
    .single();

  if (staffRow) {
    const { data: branchRow } = await admin
      .from("branches")
      .select("id")
      .eq("org_id", org.id)
      .single();
    if (branchRow) {
      await admin.from("staff_branches").insert({ staff_id: staffRow.id, branch_id: branchRow.id });
    }
    await admin.from("staff_roles").insert({ staff_id: staffRow.id, role_id: ownerRoleId });
  }

  redirect("/onboarding");
}

// Step 2: vertical selection is strictly additive — chosen verticals decide
// which field_definitions exist for the org (§14 decision).
export async function setVerticals(formData: FormData) {
  const supabase = await createClient();
  const ctx = await getStaffContext(supabase);
  if (!ctx) redirect("/login");

  const verticals = formData.getAll("verticals").map(String);
  if (verticals.length === 0) return;

  const admin = createAdminClient();
  await admin.from("organizations").update({ verticals }).eq("id", ctx.orgId);

  const templates = fieldTemplatesForVerticals(verticals);
  await admin.from("field_definitions").insert(
    templates.map((f) => ({
      org_id: ctx.orgId,
      key: f.key,
      label: f.label,
      type: f.type,
      sensitivity: f.sensitivity,
      category_key: f.categoryKey,
      vertical: f.vertical,
    })),
  );

  redirect("/onboarding");
}

// Step 3: connecting WhatsApp is deferrable ("Hacerlo después") and never
// blocks finishing onboarding, per §14.
export async function finishWhatsapp(formData: FormData) {
  const supabase = await createClient();
  const ctx = await getStaffContext(supabase);
  if (!ctx) redirect("/login");

  const phone = String(formData.get("phone") ?? "").trim();

  const admin = createAdminClient();
  await admin
    .from("organizations")
    .update({ whatsapp_number: phone || null, onboarding_completed_at: new Date().toISOString() })
    .eq("id", ctx.orgId);

  redirect("/agenda");
}
