import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import type {
  AuditJustification,
  Database,
  PermissionCategory,
  PrivilegeGrantState,
  PrivilegeKey,
} from "@/types/database";

// §24: role privileges are seeded per org (owner-editable UI is a later
// pass). Every role always gets 'view_own_agenda' — that floor is enforced
// here in code, not left to whatever the seed happens to contain.
const ALWAYS_GRANTED: PrivilegeKey[] = ["view_own_agenda"];

// §04/§02: 'mental' and 'sexual' are sealed — invisible even as a locked
// placeholder, unlike an ordinary un-granted category.
export const SEALED_CATEGORIES: PermissionCategory[] = ["mental", "sexual"];

export interface StaffContext {
  staffId: string;
  orgId: string;
  name: string;
  roleKey: string;
  privileges: Record<string, { grantState: PrivilegeGrantState; limitNote: string | null }>;
}

export async function getStaffContext(
  supabase: SupabaseClient<Database>,
): Promise<StaffContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, org_id, name")
    .eq("user_id", user.id)
    .single();
  if (!staffRow) return null;

  const { data: roleLinks } = (await supabase
    .from("staff_roles")
    .select("role_id, roles(key)")
    .eq("staff_id", staffRow.id)) as unknown as {
    data: { role_id: string; roles: { key: string } | null }[] | null;
  };

  const roleIds = (roleLinks ?? []).map((r) => r.role_id);
  const roleKey = roleLinks?.[0]?.roles?.key ?? "";

  const { data: privilegeRows } = await supabase
    .from("role_privileges")
    .select("privilege_key, grant_state, limit_note")
    .in("role_id", roleIds.length > 0 ? roleIds : ["00000000-0000-0000-0000-000000000000"]);

  const privileges: StaffContext["privileges"] = {};
  for (const row of privilegeRows ?? []) {
    privileges[row.privilege_key] = { grantState: row.grant_state, limitNote: row.limit_note };
  }
  for (const key of ALWAYS_GRANTED) {
    privileges[key] = { grantState: "granted", limitNote: privileges[key]?.limitNote ?? null };
  }

  return {
    staffId: staffRow.id,
    orgId: staffRow.org_id,
    name: staffRow.name,
    roleKey,
    privileges,
  };
}

// "Granted" and "limited" both mean the actor has *some* access — callers
// that need to distinguish (e.g. booking only your own agenda) should read
// `getGrantState` directly instead of this boolean shortcut.
export function hasPrivilege(ctx: StaffContext, key: PrivilegeKey): boolean {
  const state = ctx.privileges[key]?.grantState;
  return state === "granted" || state === "limited";
}

export function getGrantState(ctx: StaffContext, key: PrivilegeKey): PrivilegeGrantState {
  return ctx.privileges[key]?.grantState ?? "denied";
}

// §04 distinguishes two different kinds of absence, and §02 decision #2 adds
// a third:
// - 'locked': no grant row exists yet — this branch has never requested the
//   category. Shown with a "Solicitar acceso" placeholder; the category's
//   existence is not a secret.
// - 'hidden': a grant row exists with granted=false — the patient was asked
//   and said no (or revoked a prior grant). Must render identically to an
//   empty category: no placeholder, no count, no lock icon. A visible gap
//   is itself a leak (decision #2).
// - 'sealed': mental/sexual — invisible unconditionally, same rendering as
//   'hidden', regardless of whether a grant row exists.
// - 'granted': render normally.
export type CategoryVisibility = "granted" | "locked" | "hidden" | "sealed";

export function getCategoryVisibility(
  category: PermissionCategory,
  grants: Partial<Record<PermissionCategory, boolean>>,
): CategoryVisibility {
  if (SEALED_CATEGORIES.includes(category)) return "sealed";
  if (!(category in grants)) return "locked";
  return grants[category] ? "granted" : "hidden";
}

export async function getPatientGrants(
  supabase: SupabaseClient<Database>,
  patientId: string,
  branchId: string,
): Promise<Partial<Record<PermissionCategory, boolean>>> {
  const { data } = await supabase
    .from("patient_grants")
    .select("category_key, granted")
    .eq("patient_id", patientId)
    .eq("branch_id", branchId);

  const grants: Partial<Record<PermissionCategory, boolean>> = {};
  for (const row of data ?? []) {
    grants[row.category_key] = row.granted;
  }
  return grants;
}

// §24: "Every clinical record opened is logged with a name, whatever the
// role. There is no privilege that hides you from the audit log." Written
// via the service-role client only, so the person being audited can't
// suppress or edit their own entry.
export async function writeAuditLog(entry: {
  orgId: string;
  actorStaffId: string | null;
  actorRole: string;
  patientId: string;
  what: string;
  justification: AuditJustification;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    org_id: entry.orgId,
    actor_staff_id: entry.actorStaffId,
    actor_role: entry.actorRole,
    patient_id: entry.patientId,
    what: entry.what,
    justification: entry.justification,
  });
}

// Convenience for Server Components: current staff context or redirect
// target null, using the request-scoped session client.
export async function getCurrentStaffContext(): Promise<StaffContext | null> {
  const supabase = await createServerSupabase();
  return getStaffContext(supabase);
}
