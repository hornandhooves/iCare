import type { FieldSensitivity, FieldType, PermissionCategory } from "@/types/database";

export const VERTICALS = [
  "medicina",
  "nutricion",
  "psicologia",
  "odontologia",
  "cabello",
  "unas",
  "masaje",
  "facial",
] as const;
export type Vertical = (typeof VERTICALS)[number];

export const VERTICAL_GROUPS: { key: "salud" | "bienestar"; verticals: Vertical[] }[] = [
  { key: "salud", verticals: ["medicina", "nutricion", "psicologia", "odontologia"] },
  { key: "bienestar", verticals: ["cabello", "unas", "masaje", "facial"] },
];

interface FieldTemplate {
  key: string;
  label: string;
  type: FieldType;
  sensitivity: FieldSensitivity;
  categoryKey: PermissionCategory;
  vertical: Vertical | null; // null = universal, added regardless of vertical
}

// §11 sensitivity table + §04. Only 'medicina' has a fully specified field
// set in the source material — other verticals get just the universal
// contact field until their own field configuration is specified (deferred,
// see build plan: full §11 config screen is a later pass).
export const FIELD_TEMPLATES: FieldTemplate[] = [
  { key: "phone", label: "Teléfono de contacto", type: "texto", sensitivity: "contacto", categoryKey: "contacto", vertical: null },
  { key: "allergies", label: "Alergias", type: "texto", sensitivity: "critico", categoryKey: "medicamentos", vertical: "medicina" },
  { key: "contraindications", label: "Contraindicaciones", type: "texto", sensitivity: "critico", categoryKey: "medicamentos", vertical: "medicina" },
  { key: "consult_notes", label: "Notas de consulta", type: "texto_largo", sensitivity: "clinico", categoryKey: "notas", vertical: "medicina" },
  { key: "fasting_glucose", label: "Glucosa en ayunas", type: "numero", sensitivity: "clinico", categoryKey: "labs", vertical: "medicina" },
  { key: "medications", label: "Medicamentos actuales", type: "lista", sensitivity: "clinico", categoryKey: "medicamentos", vertical: "medicina" },
  { key: "mental_health", label: "Historial de salud mental", type: "texto_largo", sensitivity: "sellado", categoryKey: "mental", vertical: "medicina" },
  { key: "sexual_health", label: "Salud sexual y reproductiva", type: "texto_largo", sensitivity: "sellado", categoryKey: "sexual", vertical: "medicina" },
];

export function fieldTemplatesForVerticals(verticals: string[]): FieldTemplate[] {
  return FIELD_TEMPLATES.filter((f) => f.vertical === null || verticals.includes(f.vertical));
}
