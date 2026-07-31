// ── Translation map for services and insurance tags ──────────────
// API always returns English strings — we translate at render time
// Medicaid, Medicare, VA Benefits, Tricare stay in English (proper program names)

const SERVICE_TRANSLATIONS: Record<string, string> = {
  // FQHC services
  "Primary Care":              "Atencion Primaria",
  "Preventive Care":           "Atencion Preventiva",
  "Immunizations":             "Vacunas",
  "Homeless Services":         "Servicios para Personas sin Hogar",
  "Migrant Health":            "Salud para Migrantes",
  "School-Based Care":         "Atencion Escolar",
  "Lab Tests":                 "Pruebas de Laboratorio",
  // Mental health services
  "Mental Health Counseling":  "Consejeria de Salud Mental",
  "Psychiatric Services":      "Servicios Psiquiatricos",
  "Substance Use Treatment":   "Tratamiento de Adicciones",
  "Crisis Support":            "Apoyo en Crisis",
  // Emergency services
  "Emergency Care":            "Atencion de Emergencia",
  "Urgent Care":               "Atencion Urgente",
  "Trauma":                    "Trauma",
  // Veterans services
  "Veterans Primary Care":     "Atencion Primaria para Veteranos",
  "Addiction and substance use care": "Tratamiento de Adicciones",
  "Audiology and speech":      "Audiologia y Lenguaje",
  "Cardiology":                "Cardiologia",
  "Dermatology":               "Dermatologia",
  "Laboratory and pathology":  "Laboratorio y Patologia",
  "Mental health care":        "Salud Mental",
  "Nutrition, food, and dietary care": "Nutricion y Dieta",
  "Physical therapy, occupational therapy and kinesiotherapy": "Terapia Fisica",
  "Rehabilitation and extended care": "Rehabilitacion",
  "Social work":               "Trabajo Social",
  "Suicide prevention":        "Prevencion del Suicidio",
  "CaregiverSupport":          "Apoyo al Cuidador",
  "Dental/oral surgery":       "Cirugia Dental",
  // Dental services
  "General Dentistry":         "Odontologia General",
  "Cleanings":                 "Limpiezas Dentales",
  "X-Rays":                    "Radiografias",
  "Emergency Dental":          "Emergencia Dental",
};

const INSURANCE_TRANSLATIONS: Record<string, string> = {
  // These stay in English — proper US program names:
  // "Medicaid", "Medicare", "VA Benefits", "Tricare"
  "Uninsured OK":              "Sin Seguro Aceptado",
  "Sliding Scale":             "Escala Movil",
  "Self Pay":                  "Pago Directo",
  "Most Insurance":            "La Mayoria de Seguros",
  "Emergency — all patients treated": "Emergencia — todos los pacientes atendidos",
};

export function translateService(term: string, lang: "en" | "es"): string {
  if (lang === "en") return term;
  return SERVICE_TRANSLATIONS[term] || term;
}

export function translateInsurance(term: string, lang: "en" | "es"): string {
  if (lang === "en") return term;
  return INSURANCE_TRANSLATIONS[term] || term;
}
