"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Eye,
  EyeOff,
  ExternalLink,
  FileBadge,
  CalendarCheck2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Medal,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Trophy,
  Upload,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { fileToDataUrl, optimizeImageForUpload } from "@/lib/media/optimize-image";
import { createPortalClient } from "@/lib/supabase/portal-browser";
import { signOutAndRedirect } from "@/lib/supabase/sign-out";
import {
  getAdminSessionBridgeHeaders,
  saveAdminSessionBridge,
} from "@/lib/supabase/admin-session-bridge";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type RoleKey =
  | "super_admin"
  | "global_admin"
  | "country_admin"
  | "dojo_admin"
  | "kenshi";

type Translation = {
  language_code: string;
  name: string;
};

type ScopeCountry = {
  code: string;
  country_translations?: Translation[];
};

type ScopeDojo = {
  city: string;
  dojo_translations?: Translation[];
};

type PortalRole = {
  id: string;
  roles: { key: RoleKey; name: string } | Array<{ key: RoleKey; name: string }>;
  countries: ScopeCountry | null;
  dojos: ScopeDojo | null;
};

type PortalMember = {
  id: string;
  ika_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  current_grade: string | null;
  last_exam_date: string | null;
  birth_date: string | null;
  joined_date: string | null;
  member_group: string | null;
  profile_image_url: string | null;
  consent_accepted: boolean;
  countries: ScopeCountry | null;
  dojos: ScopeDojo | null;
};

type GradeHistory = {
  id: string;
  grade: string;
  exam_date: string;
  exam_place: string | null;
  examiner: string | null;
  course_type?: string | null;
  course_reference_id?: string | null;
};

type AchievementMedalType =
  | "gold"
  | "silver"
  | "bronze"
  | "finalist"
  | "participant";

type AchievementHistory = {
  id: string;
  course_id: string | null;
  title: string;
  modality?: string | null;
  category: string | null;
  result: string | null;
  award?: string | null;
  medal_type?: AchievementMedalType | null;
  podium_position?: number | null;
  achieved_on: string;
  achieved_place: string | null;
  notes: string | null;
};

type EventRegistrationHistory = {
  id: string;
  status: string;
  payment_status?: string | null;
  wants_tshirt?: boolean | null;
  tshirt_size?: string | null;
  created_at: string;
  events: {
    id: string;
    event_type?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    registration_open?: boolean | null;
    tshirt_enabled?: boolean | null;
    event_translations?: Array<{
      language_code: string;
      title: string;
      slug: string | null;
      location_label?: string | null;
    }>;
  } | null;
};

type PortalPayload = {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  } | null;
  roles: PortalRole[];
  member: PortalMember | null;
  gradeHistory: GradeHistory[];
  achievements?: AchievementHistory[];
  eventRegistrations?: EventRegistrationHistory[];
  dashboard: PortalDashboard | null;
};

type PortalDashboard = {
  error?: string;
  scope: {
    roleKeys: string[];
    isGlobal: boolean;
    countryIds: string[];
    dojoIds: string[];
  };
  totals: {
    countries: number;
    dojos: number;
    activeDojos: number;
    members: number;
    activeMembers: number;
    activeAdults: number;
    activeChildren: number;
    coursesRegistered: number;
  };
  membersByDojo: Array<{
    dojoId: string;
    dojoName: string;
    countryId: string;
    logoUrl: string;
    totalMembers: number;
    activeMembers: number;
    activeAdults: number;
    activeChildren: number;
  }>;
  membersByCountry: Array<{
    countryId: string;
    countryName: string;
    logoUrl: string;
    dojoCount: number;
    totalMembers: number;
    activeMembers: number;
    activeAdults: number;
    activeChildren: number;
  }>;
  members: Array<{
    id: string;
    ika_number: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    current_grade: string | null;
    joined_date: string | null;
    country_id: string | null;
    dojo_id: string | null;
    member_group: string | null;
  }>;
  createdCourses?: Array<{
    courseKey: string;
    title: string;
    type: string;
    date: string | null;
    place: string | null;
    instructor: string | null;
    memberCount: number;
  }>;
};

const portalCacheKey = "ika-portal-cache";

type CachedPortalPayload = {
  sessionEmail: string;
  sessionUserId: string;
  payload: PortalPayload;
  savedAt: number;
};

function readCachedPortalPayload(): PortalPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(portalCacheKey);
  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as CachedPortalPayload;
    return cached?.payload ?? null;
  } catch {
    window.sessionStorage.removeItem(portalCacheKey);
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";

function hasAdminPortalRole(
  roles: Array<{ roles?: { key?: string; name?: string } | Array<{ key?: string; name?: string }> | null }> | null | undefined,
) {
  return (roles ?? []).some((role) => {
    const roleValue = role?.roles;
    const roleKey = Array.isArray(roleValue) ? roleValue[0]?.key : roleValue?.key;
    return (
      roleKey === "super_admin" ||
      roleKey === "global_admin" ||
      roleKey === "country_admin" ||
      roleKey === "dojo_admin"
    );
  });
}

type PortalCopy = {
  secureAccess: string;
  enterPortal: string;
  loginHelp: string;
  newAccessHelp?: string;
  passwordPlaceholder: string;
  enter: string;
  magicLinkSent: string;
  requestAccess?: string;
  loadError: string;
  privatePortal: string;
  signOut: string;
  loadingPortal: string;
  noRoleTitle: string;
  noRoleText: string;
  generalAccess: string;
  roleFallback: string;
  memberPendingTitle: string;
  memberPendingText: string;
  memberProfileTitle: string;
  ikaPassport: string;
  name: string;
  status: string;
  currentGrade: string;
  country: string;
  dojo: string;
  joinedIka: string;
  consent: string;
  consentAccepted: string;
  pending: string;
  gradeHistoryTitle: string;
  noGrades: string;
  achievementsTitle?: string;
  noAchievements?: string;
  medalsSummary?: string;
  podiumLabel?: string;
  resultLabel?: string;
  categoryLabel?: string;
  placeLabel?: string;
  courseIdLabel?: string;
  medalLabels?: Record<AchievementMedalType, string>;
  dojoAdminTitle: string;
  dojoAdminText: string;
  countryAdminTitle: string;
  countryAdminText: string;
  globalAdminTitle: string;
  globalAdminText: string;
  activeScopeTitle: string;
  seniority: string;
  birthDate: string;
  group: string;
  child: string;
  adult: string;
  editableData: string;
  photo: string;
  changePhoto: string;
  selectImage: string;
  phone: string;
  newPassword: string;
  saveFicha: string;
  fichaUpdated: string;
  fichaCredentialsUpdated: string;
  myEventsTitle?: string;
  noEventsRegistered?: string;
  registeredOnLabel?: string;
  eventStatusRegistered?: string;
  eventStatusCancelled?: string;
  updateRegistration?: string;
  cancelRegistration?: string;
  reopenRegistration?: string;
  registrationUpdated?: string;
  registrationCancelled?: string;
  registrationRestored?: string;
  registrationClosedNote?: string;
  tshirtQuestion?: string;
  tshirtSize?: string;
  selectSize?: string;
  yes?: string;
  no?: string;
  openEventPage?: string;
  oldPkceLink: string;
  emailPasswordRequired: string;
  emailCredentialsRequired: string;
  kenshiEmailRequired: string;
  passwordMinLength: string;
  invalidRecoverySession: string;
  recoveryLinkMismatch: (activeEmail: string, expectedEmail: string) => string;
  passwordUpdated: string;
  recoveryEyebrow: string;
  recoveryTitle: string;
  recoveryText: string;
  kenshiEmailPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  savePassword: string;
  roleLabels: Record<RoleKey, string>;
  emailLabel?: string;
  uploadPhotoError?: string;
  readImageError?: string;
  saveFichaError?: string;
  saveRegistrationError?: string;
  untitledEvent?: string;
};

type AdminDashboardCopy = {
  dashboardEyebrow: string;
  dashboardIntro: string;
  metrics: {
    countries: string;
    dojos: string;
    activeMembers: string;
    membersWithEmail?: string;
    activeDojos?: string;
    coursesRegistered?: string;
    totalMembers: string;
    activeAdults: string;
    activeChildren: string;
  };
  managementTitle: string;
  coursesTitle?: string;
  editInfo: string;
  noCountries: string;
  noCourses?: string;
  activeKenshi: string;
  adults: string;
  children: string;
  noDojos: string;
  dojoKenshi: string;
  noKenshi: string;
  total: string;
  records: string;
  ikaId?: string;
  email?: string;
  name: string;
  group: string;
  grade: string;
  status: string;
  childSingular: string;
  adultSingular: string;
};

const adminDashboardCopies: Partial<Record<Locale, Partial<AdminDashboardCopy>>> = {
  en: {
    dashboardEyebrow: "Administration",
    dashboardIntro:
      "Review your operational summary and open the management area from here.",
    metrics: {
      countries: "Countries",
      dojos: "Dojos",
      activeMembers: "Active Kenshi",
      membersWithEmail: "Kenshi with email",
      activeDojos: "Active dojos",
      coursesRegistered: "IKA courses registered",
      totalMembers: "Total Kenshi",
      activeAdults: "Active adults",
      activeChildren: "Active children",
    },
    managementTitle: "Management by country and dojo",
    coursesTitle: "All created IKA courses",
    editInfo: "Control panel",
    noCountries: "There are no countries in this scope.",
    noCourses: "There are no created IKA courses yet.",
    activeKenshi: "active Kenshi",
    adults: "Adults",
    children: "Children",
    noDojos: "There are no dojos in this country.",
    dojoKenshi: "Dojo Kenshi",
    noKenshi: "There are no Kenshi in this dojo.",
    total: "total",
    records: "records",
    name: "Name",
    group: "Group",
    grade: "Grade",
    status: "Status",
    childSingular: "Child",
    adultSingular: "Adult",
  },
  es: {
    dashboardEyebrow: "Administracion",
    dashboardIntro:
      "Revisa aqui tu resumen operativo y abre directamente el area de gestion.",
    metrics: {
      countries: "Paises",
      dojos: "Dojos",
      activeMembers: "Kenshi activos",
      membersWithEmail: "Kenshi con email",
      activeDojos: "Dojos activos",
      coursesRegistered: "Cursos IKA registrados",
      totalMembers: "Kenshi total",
      activeAdults: "Adultos activos",
      activeChildren: "Ninos activos",
    },
    managementTitle: "Gestion por pais y dojo",
    coursesTitle: "Todos los cursos IKA creados",
    editInfo: "Panel de control",
    noCountries: "No hay paises en este alcance.",
    noCourses: "Todavia no hay cursos IKA creados.",
    activeKenshi: "Kenshi activos",
    adults: "Adultos",
    children: "Ninos",
    noDojos: "No hay dojos en este pais.",
    dojoKenshi: "Kenshi del dojo",
    noKenshi: "No hay Kenshi en este dojo.",
    total: "total",
    records: "registros",
    name: "Nombre",
    group: "Grupo",
    grade: "Grado",
    status: "Estado",
    childSingular: "Nino",
    adultSingular: "Adulto",
  },
  it: {
    dashboardEyebrow: "Amministrazione",
    dashboardIntro:
      "Controlla qui il riepilogo operativo e apri direttamente l'area di gestione.",
    metrics: {
      countries: "Paesi",
      dojos: "Dojo",
      activeMembers: "Kenshi attivi",
      activeDojos: "Dojo attivi",
      coursesRegistered: "Corsi IKA registrati",
      totalMembers: "Kenshi totali",
      activeAdults: "Adulti attivi",
      activeChildren: "Bambini attivi",
    },
    managementTitle: "Gestione per paese e dojo",
    editInfo: "Pannello di controllo",
    noCountries: "Non ci sono paesi in questo ambito.",
    activeKenshi: "Kenshi attivi",
    adults: "Adulti",
    children: "Bambini",
    noDojos: "Non ci sono dojo in questo paese.",
    dojoKenshi: "Kenshi del dojo",
    noKenshi: "Non ci sono Kenshi in questo dojo.",
    total: "totali",
    records: "record",
    name: "Nome",
    group: "Gruppo",
    grade: "Grado",
    status: "Stato",
    childSingular: "Bambino",
    adultSingular: "Adulto",
  },
  fr: {
    dashboardEyebrow: "Administration",
    dashboardIntro:
      "Consultez ici votre resume operationnel et ouvrez directement la zone de gestion.",
    metrics: {
      countries: "Pays",
      dojos: "Dojos",
      activeMembers: "Kenshi actifs",
      activeDojos: "Dojos actifs",
      coursesRegistered: "Cours IKA enregistres",
      totalMembers: "Total Kenshi",
      activeAdults: "Adultes actifs",
      activeChildren: "Enfants actifs",
    },
    managementTitle: "Gestion par pays et dojo",
    editInfo: "Panneau de controle",
    noCountries: "Aucun pays dans ce perimetre.",
    activeKenshi: "Kenshi actifs",
    adults: "Adultes",
    children: "Enfants",
    noDojos: "Aucun dojo dans ce pays.",
    dojoKenshi: "Kenshi du dojo",
    noKenshi: "Aucun Kenshi dans ce dojo.",
    total: "total",
    records: "fiches",
    name: "Nom",
    group: "Groupe",
    grade: "Grade",
    status: "Statut",
    childSingular: "Enfant",
    adultSingular: "Adulte",
  },
  ja: {
    dashboardEyebrow: "\u7ba1\u7406",
    dashboardIntro:
      "\u3053\u3053\u3067\u904b\u55b6\u30b5\u30de\u30ea\u30fc\u3092\u78ba\u8a8d\u3057\u3001\u7ba1\u7406\u30a8\u30ea\u30a2\u3092\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002",
    metrics: {
      countries: "\u56fd",
      dojos: "\u9053\u5834",
      activeMembers: "\u30a2\u30af\u30c6\u30a3\u30d6 Kenshi",
      activeDojos: "\u30a2\u30af\u30c6\u30a3\u30d6\u9053\u5834",
      coursesRegistered: "IKA \u767b\u9332\u8b1b\u7fd2",
      totalMembers: "Kenshi \u5408\u8a08",
      activeAdults: "\u30a2\u30af\u30c6\u30a3\u30d6\u6210\u4eba",
      activeChildren: "\u30a2\u30af\u30c6\u30a3\u30d6\u5b50\u3069\u3082",
    },
    managementTitle: "\u56fd\u3068\u9053\u5834\u5225\u7ba1\u7406",
    editInfo: "\u30b3\u30f3\u30c8\u30ed\u30fc\u30eb\u30d1\u30cd\u30eb",
    noCountries: "\u3053\u306e\u7bc4\u56f2\u306b\u56fd\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
    activeKenshi: "\u30a2\u30af\u30c6\u30a3\u30d6 Kenshi",
    adults: "\u6210\u4eba",
    children: "\u5b50\u3069\u3082",
    noDojos: "\u3053\u306e\u56fd\u306b\u9053\u5834\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
    dojoKenshi: "\u9053\u5834 Kenshi",
    noKenshi: "\u3053\u306e\u9053\u5834\u306b Kenshi \u306f\u3044\u307e\u305b\u3093\u3002",
    total: "\u5408\u8a08",
    records: "\u8a18\u9332",
    name: "\u6c0f\u540d",
    group: "\u533a\u5206",
    grade: "\u7d1a\u6bb5",
    status: "\u72b6\u614b",
    childSingular: "\u5b50\u3069\u3082",
    adultSingular: "\u6210\u4eba",
  },
  zh: {
    dashboardEyebrow: "\u7ba1\u7406",
    dashboardIntro:
      "\u5728\u6b64\u67e5\u770b\u60a8\u7684\u8fd0\u8425\u6982\u89c8\uff0c\u5e76\u76f4\u63a5\u6253\u5f00\u7ba1\u7406\u533a\u57df\u3002",
    metrics: {
      countries: "\u56fd\u5bb6",
      dojos: "\u9053\u573a",
      activeMembers: "\u6d3b\u8dc3 Kenshi",
      activeDojos: "\u6d3b\u8dc3\u9053\u573a",
      coursesRegistered: "IKA \u5df2\u767b\u8bb0\u8bfe\u7a0b",
      totalMembers: "Kenshi \u603b\u6570",
      activeAdults: "\u6d3b\u8dc3\u6210\u4eba",
      activeChildren: "\u6d3b\u8dc3\u513f\u7ae5",
    },
    managementTitle: "\u6309\u56fd\u5bb6\u548c\u9053\u573a\u7ba1\u7406",
    editInfo: "\u63a7\u5236\u9762\u677f",
    noCountries: "\u5f53\u524d\u8303\u56f4\u5185\u6ca1\u6709\u56fd\u5bb6\u3002",
    activeKenshi: "\u6d3b\u8dc3 Kenshi",
    adults: "\u6210\u4eba",
    children: "\u513f\u7ae5",
    noDojos: "\u8fd9\u4e2a\u56fd\u5bb6\u6ca1\u6709\u9053\u573a\u3002",
    dojoKenshi: "\u9053\u573a Kenshi",
    noKenshi: "\u8fd9\u4e2a\u9053\u573a\u6ca1\u6709 Kenshi\u3002",
    total: "\u603b\u8ba1",
    records: "\u8bb0\u5f55",
    name: "\u59d3\u540d",
    group: "\u7ec4\u522b",
    grade: "\u7b49\u7ea7",
    status: "\u72b6\u6001",
    childSingular: "\u513f\u7ae5",
    adultSingular: "\u6210\u4eba",
  },
  cs: {
    dashboardEyebrow: "Administrace",
    dashboardIntro:
      "Zde zkontrolujte provozni souhrn a otevrite primo spravni oblast.",
    metrics: {
      countries: "Zeme",
      dojos: "Dojo",
      activeMembers: "Aktivni Kenshi",
      totalMembers: "Kenshi celkem",
      activeAdults: "Aktivni dospeli",
      activeChildren: "Aktivni deti",
    },
    managementTitle: "Sprava podle zeme a dojo",
    editInfo: "Ovladaci panel",
    noCountries: "V tomto rozsahu nejsou zadne zeme.",
    activeKenshi: "aktivni Kenshi",
    adults: "Dospeli",
    children: "Deti",
    noDojos: "V teto zemi nejsou zadna dojo.",
    dojoKenshi: "Kenshi dojo",
    noKenshi: "V tomto dojo nejsou zadni Kenshi.",
    total: "celkem",
    records: "zaznamu",
    name: "Jmeno",
    group: "Skupina",
    grade: "Stupen",
    status: "Stav",
    childSingular: "Dite",
    adultSingular: "Dospely",
  },
};

const portalCopies: Partial<Record<Locale, Partial<PortalCopy>>> = {
  en: {
    secureAccess: "Secure access",
    enterPortal: "Enter the portal",
    loginHelp:
      "Use the email and password linked to your active IKA record. Public access is only available for members who are already registered.",
    newAccessHelp:
      "Need first access? Contact your sensei or country representative. Password recovery is only available for active members already registered in the system.",
    passwordPlaceholder: "Password",
    enter: "Enter",
    magicLinkSent: "If the email is active in IKA, you will receive a password recovery email shortly.",
    requestAccess: "Recover password",
    loadError: "The portal could not be loaded.",
    privatePortal: "Private portal",
    signOut: "Sign out",
    loadingPortal: "Loading portal...",
    noRoleTitle: "No role assigned",
    noRoleText: "Your user exists, but it does not have IKA permissions yet.",
    generalAccess: "General access",
    roleFallback: "Role",
    memberPendingTitle: "Kenshi record pending",
    memberPendingText: "Your user is not linked to a member record yet.",
    memberProfileTitle: "Kenshi record",
    ikaPassport: "IKA Passport",
    name: "Name",
    status: "Status",
    currentGrade: "Current grade",
    country: "Country",
    dojo: "Dojo",
    joinedIka: "Seniority",
    consent: "Consent",
    consentAccepted: "Accepted",
    pending: "Pending",
    gradeHistoryTitle: "IKA course history",
    noGrades: "No IKA courses have been registered yet.",
    achievementsTitle: "Competition achievements",
    noAchievements: "No achievements have been registered yet.",
    medalsSummary: "IKA medal table",
    podiumLabel: "Podium",
    resultLabel: "Result",
    categoryLabel: "Category",
    placeLabel: "Place",
    courseIdLabel: "Course ID",
    medalLabels: {
      gold: "Gold",
      silver: "Silver",
      bronze: "Bronze",
      finalist: "Finalist",
      participant: "Participant",
    },
    dojoAdminTitle: "Dojo administration",
    dojoAdminText:
      "Manage members, dojo data, and basic follow-up. Advanced actions will be completed in the private module.",
    countryAdminTitle: "Country administration",
    countryAdminText:
      "Manage national dojos, members, events, and reports. The scope is limited to your assigned country.",
    globalAdminTitle: "Global administration",
    globalAdminText:
      "Global access to CMS, countries, dojos, events, users, and configuration.",
    activeScopeTitle: "Active scope",
    seniority: "Seniority",
    birthDate: "Birth date",
    group: "Group",
    child: "Child",
    adult: "Adult",
    editableData: "Editable data",
    photo: "Profile photo",
    changePhoto: "Change photo",
    selectImage: "Select an image.",
    phone: "Phone",
    newPassword: "New password",
    saveFicha: "Save IKA record",
    fichaUpdated: "IKA record updated.",
    fichaCredentialsUpdated: "IKA record and credentials updated.",
    oldPkceLink:
      "This old link uses a PKCE code that is no longer available. Request a new recovery email and open the new link.",
    emailPasswordRequired: "Enter your email and password.",
    emailCredentialsRequired: "Enter your email to recover your password.",
    kenshiEmailRequired: "Enter the Kenshi email.",
    passwordMinLength: "The password must contain at least 6 characters.",
    invalidRecoverySession:
      "The recovery link did not open a valid session. Request a new email and open it in a private window.",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `This link is active for ${activeEmail}, not for ${expectedEmail}. Sign out of the current account or open the email in a private window.`,
    passwordUpdated: "Password updated.",
    recoveryEyebrow: "IKA record",
    recoveryTitle: "Create a new password",
    recoveryText:
      "Enter the email and a new password to activate portal access.",
    kenshiEmailPlaceholder: "Kenshi email",
    showPassword: "Show password",
    hidePassword: "Hide password",
    savePassword: "Save password",
    roleLabels: {
      super_admin: "Super admin",
      global_admin: "Global admin",
      country_admin: "Country admin",
      dojo_admin: "Dojo admin",
      kenshi: "Kenshi",
    },
    emailLabel: "Email",
    uploadPhotoError: "The photo could not be uploaded.",
    readImageError: "The selected image could not be read.",
    saveFichaError: "The IKA record could not be saved.",
    saveRegistrationError: "The registration could not be updated.",
    untitledEvent: "Untitled event",
  },
  es: {
    secureAccess: "Acceso seguro",
    enterPortal: "Entrar al portal",
    loginHelp:
      "Usa el email y la contrasena asociados a tu ficha IKA activa. El acceso publico solo esta disponible para miembros ya registrados.",
    newAccessHelp:
      "Para darte de alta consulta con tu sensei o responsable de pais. La recuperacion de contrasena solo funciona para miembros activos ya registrados en el sistema.",
    passwordPlaceholder: "Contrasena",
    enter: "Entrar",
    magicLinkSent: "Si el email esta activo en IKA, recibiras en breve un email para restablecer tu contrasena.",
    requestAccess: "Recuperar contrasena",
    loadError: "No se pudo cargar el portal.",
    privatePortal: "Portal privado",
    signOut: "Salir",
    loadingPortal: "Cargando portal...",
    noRoleTitle: "Sin rol asignado",
    noRoleText: "Tu usuario existe, pero todavia no tiene permisos en IKA.",
    generalAccess: "Acceso general",
    roleFallback: "Rol",
    memberPendingTitle: "Ficha Kenshi pendiente",
    memberPendingText: "Tu usuario no tiene todavia una ficha de miembro vinculada.",
    memberProfileTitle: "Ficha Kenshi",
    ikaPassport: "IKA Passport",
    name: "Nombre",
    status: "Estado",
    currentGrade: "Grado actual",
    country: "Pais",
    dojo: "Dojo",
    joinedIka: "Antiguedad",
    consent: "Consentimiento",
    consentAccepted: "Aceptado",
    pending: "Pendiente",
    gradeHistoryTitle: "Historial de cursos IKA",
    noGrades: "Todavia no hay cursos IKA registrados.",
    achievementsTitle: "Logros y medallero",
    noAchievements: "Todavia no hay logros registrados.",
    medalsSummary: "Medallero IKA",
    podiumLabel: "Podio",
    resultLabel: "Resultado",
    categoryLabel: "Categoria",
    placeLabel: "Lugar",
    courseIdLabel: "ID del curso",
    medalLabels: {
      gold: "Oro",
      silver: "Plata",
      bronze: "Bronce",
      finalist: "Finalista",
      participant: "Participante",
    },
    dojoAdminTitle: "Administracion de dojo",
    dojoAdminText:
      "Gestion de miembros, datos del dojo y seguimiento basico. Las acciones avanzadas se completaran en el modulo privado.",
    countryAdminTitle: "Administracion de pais",
    countryAdminText:
      "Gestion nacional de dojos, miembros, eventos y reportes. El alcance queda limitado a tu pais asignado.",
    globalAdminTitle: "Administracion global",
    globalAdminText:
      "Acceso global a CMS, paises, dojos, eventos, usuarios y configuracion.",
    activeScopeTitle: "Alcance activo",
    seniority: "Antiguedad",
    birthDate: "Fecha nacimiento",
    group: "Grupo",
    child: "Nino",
    adult: "Adulto",
    editableData: "Datos editables",
    photo: "Foto de perfil",
    changePhoto: "Cambiar foto",
    selectImage: "Selecciona una imagen.",
    phone: "Telefono",
    newPassword: "Nueva contrasena",
    saveFicha: "Guardar ficha IKA",
    fichaUpdated: "Ficha IKA actualizada.",
    fichaCredentialsUpdated: "Ficha IKA y credenciales actualizadas.",
    oldPkceLink:
      "Este enlace antiguo usa un codigo PKCE que ya no esta disponible. Solicita un nuevo email de recuperacion y abre el enlace nuevo.",
    emailPasswordRequired: "Introduce email y contrasena.",
    emailCredentialsRequired: "Introduce tu email para recuperar la contrasena.",
    kenshiEmailRequired: "Introduce el email del Kenshi.",
    passwordMinLength: "La contrasena debe tener al menos 6 caracteres.",
    invalidRecoverySession:
      "El enlace de recuperacion no ha abierto una sesion valida. Solicita un nuevo email y abrelo en una ventana privada.",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `Este enlace esta activo para ${activeEmail}, no para ${expectedEmail}. Sal de la cuenta actual o abre el email en una ventana privada.`,
    passwordUpdated: "Contrasena actualizada.",
    recoveryEyebrow: "Ficha IKA",
    recoveryTitle: "Crear nueva contrasena",
    recoveryText:
      "Introduce el email y una contrasena nueva para activar el acceso al portal.",
    kenshiEmailPlaceholder: "Email del Kenshi",
    showPassword: "Mostrar contrasena",
    hidePassword: "Ocultar contrasena",
    savePassword: "Guardar contrasena",
    roleLabels: {
      super_admin: "Super admin",
      global_admin: "Admin global",
      country_admin: "Admin de pais",
      dojo_admin: "Admin de dojo",
      kenshi: "Kenshi",
    },
    emailLabel: "Email",
    uploadPhotoError: "No se pudo subir la foto.",
    readImageError: "No se pudo leer la imagen seleccionada.",
    saveFichaError: "No se pudo guardar la ficha IKA.",
    saveRegistrationError: "No se pudo actualizar la inscripcion.",
    untitledEvent: "Evento sin titulo",
  },
  it: {
    secureAccess: "Accesso sicuro",
    enterPortal: "Entra nel portale",
    loginHelp:
      "Usa l'email e la password collegati alla tua scheda IKA attiva. L'accesso pubblico e disponibile solo per i membri gia registrati.",
    newAccessHelp:
      "Per il primo accesso contatta il tuo sensei o il referente nazionale. Il recupero password e disponibile solo per i membri attivi gia registrati nel sistema.",
    passwordPlaceholder: "Password",
    enter: "Entra",
    magicLinkSent: "Se l'email e attiva in IKA, riceverai a breve un'email per reimpostare la password.",
    requestAccess: "Recupera password",
    loadError: "Impossibile caricare il portale.",
    privatePortal: "Portale privato",
    signOut: "Esci",
    loadingPortal: "Caricamento portale...",
    noRoleTitle: "Nessun ruolo assegnato",
    noRoleText: "Il tuo utente esiste, ma non ha ancora permessi IKA.",
    generalAccess: "Accesso generale",
    roleFallback: "Ruolo",
    memberPendingTitle: "Scheda Kenshi in sospeso",
    memberPendingText: "Il tuo utente non e ancora collegato a una scheda membro.",
    memberProfileTitle: "Scheda Kenshi",
    ikaPassport: "IKA Passport",
    name: "Nome",
    status: "Stato",
    currentGrade: "Grado attuale",
    country: "Paese",
    dojo: "Dojo",
    joinedIka: "Anzianita",
    consent: "Consenso",
    consentAccepted: "Accettato",
    pending: "In sospeso",
    gradeHistoryTitle: "Storico corsi IKA",
    noGrades: "Non ci sono ancora corsi IKA registrati.",
    dojoAdminTitle: "Amministrazione dojo",
    dojoAdminText:
      "Gestione membri, dati del dojo e monitoraggio di base. Le azioni avanzate saranno completate nel modulo privato.",
    countryAdminTitle: "Amministrazione paese",
    countryAdminText:
      "Gestione nazionale di dojo, membri, eventi e report. L'ambito resta limitato al paese assegnato.",
    globalAdminTitle: "Amministrazione globale",
    globalAdminText:
      "Accesso globale a CMS, paesi, dojo, eventi, utenti e configurazione.",
    activeScopeTitle: "Ambito attivo",
    seniority: "Anzianita",
    birthDate: "Data di nascita",
    group: "Gruppo",
    child: "Bambino",
    adult: "Adulto",
    editableData: "Dati modificabili",
    photo: "Foto profilo",
    changePhoto: "Cambia foto",
    selectImage: "Seleziona un'immagine.",
    phone: "Telefono",
    newPassword: "Nuova password",
    saveFicha: "Salva scheda IKA",
    fichaUpdated: "Scheda IKA aggiornata.",
    fichaCredentialsUpdated: "Scheda IKA e credenziali aggiornate.",
    oldPkceLink:
      "Questo vecchio link usa un codice PKCE non piu disponibile. Richiedi una nuova email di recupero e apri il nuovo link.",
    emailPasswordRequired: "Inserisci email e password.",
    emailCredentialsRequired: "Inserisci la tua email per recuperare la password.",
    kenshiEmailRequired: "Inserisci l'email del Kenshi.",
    passwordMinLength: "La password deve contenere almeno 6 caratteri.",
    invalidRecoverySession:
      "Il link di recupero non ha aperto una sessione valida. Richiedi una nuova email e aprila in una finestra privata.",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `Questo link e attivo per ${activeEmail}, non per ${expectedEmail}. Esci dall'account attuale o apri l'email in una finestra privata.`,
    passwordUpdated: "Password aggiornata.",
    recoveryEyebrow: "Scheda IKA",
    recoveryTitle: "Crea una nuova password",
    recoveryText:
      "Inserisci l'email e una nuova password per attivare l'accesso al portale.",
    kenshiEmailPlaceholder: "Email del Kenshi",
    showPassword: "Mostra password",
    hidePassword: "Nascondi password",
    savePassword: "Salva password",
    roleLabels: {
      super_admin: "Super admin",
      global_admin: "Admin globale",
      country_admin: "Admin paese",
      dojo_admin: "Admin dojo",
      kenshi: "Kenshi",
    },
    emailLabel: "Email",
    uploadPhotoError: "La foto non puo essere caricata.",
    readImageError: "L'immagine selezionata non puo essere letta.",
    saveFichaError: "La scheda IKA non puo essere salvata.",
    saveRegistrationError: "L'iscrizione non puo essere aggiornata.",
    myEventsTitle: "Le mie iscrizioni agli eventi",
    noEventsRegistered: "Non hai ancora iscrizioni attive agli eventi.",
    registeredOnLabel: "Iscritto il",
    eventStatusRegistered: "Iscritto",
    eventStatusCancelled: "Annullato",
    cancelRegistration: "Annulla iscrizione",
    reopenRegistration: "Riattiva iscrizione",
    registrationUpdated: "Iscrizione aggiornata.",
    registrationCancelled: "Iscrizione annullata.",
    registrationRestored: "Iscrizione riattivata.",
    registrationClosedNote: "Le iscrizioni online sono gia chiuse per questo evento.",
    tshirtQuestion: "Ho bisogno di una maglietta",
    tshirtSize: "Taglia",
    selectSize: "Seleziona taglia",
    yes: "Si",
    no: "No",
    openEventPage: "Apri pagina evento",
    untitledEvent: "Evento senza titolo",
  },
  fr: {
    secureAccess: "Acces securise",
    enterPortal: "Entrer dans le portail",
    loginHelp:
      "Utilisez l'email et le mot de passe associes a votre fiche IKA active. L'acces public est reserve aux membres deja enregistres.",
    newAccessHelp:
      "Pour un premier acces, contactez votre sensei ou votre representant pays. La recuperation du mot de passe est reservee aux membres actifs deja enregistres dans le systeme.",
    passwordPlaceholder: "Mot de passe",
    enter: "Entrer",
    magicLinkSent: "Si l'email est actif dans IKA, vous recevrez bientot un email de reinitialisation du mot de passe.",
    requestAccess: "Recuperer le mot de passe",
    loadError: "Impossible de charger le portail.",
    privatePortal: "Portail prive",
    signOut: "Se deconnecter",
    loadingPortal: "Chargement du portail...",
    noRoleTitle: "Aucun role attribue",
    noRoleText: "Votre utilisateur existe, mais il n'a pas encore de permissions IKA.",
    generalAccess: "Acces general",
    roleFallback: "Role",
    memberPendingTitle: "Fiche Kenshi en attente",
    memberPendingText: "Votre utilisateur n'est pas encore lie a une fiche membre.",
    memberProfileTitle: "Fiche Kenshi",
    ikaPassport: "IKA Passport",
    name: "Nom",
    status: "Statut",
    currentGrade: "Grade actuel",
    country: "Pays",
    dojo: "Dojo",
    joinedIka: "Anciennete",
    consent: "Consentement",
    consentAccepted: "Accepte",
    pending: "En attente",
    gradeHistoryTitle: "Historique des cours IKA",
    noGrades: "Aucun cours IKA n'a encore ete enregistre.",
    dojoAdminTitle: "Administration dojo",
    dojoAdminText:
      "Gestion des membres, des donnees du dojo et du suivi de base. Les actions avancees seront completees dans le module prive.",
    countryAdminTitle: "Administration pays",
    countryAdminText:
      "Gestion nationale des dojos, membres, evenements et rapports. Le perimetre reste limite au pays attribue.",
    globalAdminTitle: "Administration globale",
    globalAdminText:
      "Acces global au CMS, pays, dojos, evenements, utilisateurs et configuration.",
    activeScopeTitle: "Perimetre actif",
    seniority: "Anciennete",
    birthDate: "Date de naissance",
    group: "Groupe",
    child: "Enfant",
    adult: "Adulte",
    editableData: "Donnees modifiables",
    photo: "Photo de profil",
    changePhoto: "Changer la photo",
    selectImage: "Selectionnez une image.",
    phone: "Telephone",
    newPassword: "Nouveau mot de passe",
    saveFicha: "Enregistrer la fiche IKA",
    fichaUpdated: "Fiche IKA mise a jour.",
    fichaCredentialsUpdated: "Fiche IKA et identifiants mis a jour.",
    oldPkceLink:
      "Cet ancien lien utilise un code PKCE qui n'est plus disponible. Demandez un nouvel email de recuperation et ouvrez le nouveau lien.",
    emailPasswordRequired: "Saisissez votre email et votre mot de passe.",
    emailCredentialsRequired: "Saisissez votre email pour recuperer votre mot de passe.",
    kenshiEmailRequired: "Saisissez l'email du Kenshi.",
    passwordMinLength: "Le mot de passe doit contenir au moins 6 caracteres.",
    invalidRecoverySession:
      "Le lien de recuperation n'a pas ouvert de session valide. Demandez un nouvel email et ouvrez-le dans une fenetre privee.",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `Ce lien est actif pour ${activeEmail}, pas pour ${expectedEmail}. Deconnectez-vous du compte actuel ou ouvrez l'email dans une fenetre privee.`,
    passwordUpdated: "Mot de passe mis a jour.",
    recoveryEyebrow: "Fiche IKA",
    recoveryTitle: "Creer un nouveau mot de passe",
    recoveryText:
      "Saisissez l'email et un nouveau mot de passe pour activer l'acces au portail.",
    kenshiEmailPlaceholder: "Email du Kenshi",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    savePassword: "Enregistrer le mot de passe",
    roleLabels: {
      super_admin: "Super admin",
      global_admin: "Admin global",
      country_admin: "Admin pays",
      dojo_admin: "Admin dojo",
      kenshi: "Kenshi",
    },
    emailLabel: "Email",
    uploadPhotoError: "La photo n'a pas pu etre telechargee.",
    readImageError: "L'image selectionnee n'a pas pu etre lue.",
    saveFichaError: "La fiche IKA n'a pas pu etre enregistree.",
    saveRegistrationError: "L'inscription n'a pas pu etre mise a jour.",
    myEventsTitle: "Mes inscriptions aux evenements",
    noEventsRegistered: "Vous n'avez pas encore d'inscriptions actives a des evenements.",
    registeredOnLabel: "Inscrit le",
    eventStatusRegistered: "Inscrit",
    eventStatusCancelled: "Annule",
    cancelRegistration: "Annuler l'inscription",
    reopenRegistration: "Reactiver l'inscription",
    registrationUpdated: "Inscription mise a jour.",
    registrationCancelled: "Inscription annulee.",
    registrationRestored: "Inscription reactivee.",
    registrationClosedNote: "Les inscriptions en ligne sont deja fermees pour cet evenement.",
    tshirtQuestion: "J'ai besoin d'un t-shirt",
    tshirtSize: "Taille",
    selectSize: "Selectionner la taille",
    yes: "Oui",
    no: "Non",
    openEventPage: "Ouvrir la page de l'evenement",
    untitledEvent: "Evenement sans titre",
  },
  ja: {
    secureAccess: "\u5b89\u5168\u306a\u30a2\u30af\u30bb\u30b9",
    enterPortal: "\u30dd\u30fc\u30bf\u30eb\u306b\u5165\u308b",
    loginHelp:
      "IKA\u306e\u30a2\u30af\u30c6\u30a3\u30d6\u306a\u8a18\u9332\u3068\u7d10\u3065\u3044\u305f\u30e1\u30fc\u30eb\u3068\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u4f7f\u7528\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u516c\u958b\u30a2\u30af\u30bb\u30b9\u306f\u3001\u3059\u3067\u306b\u767b\u9332\u3055\u308c\u305f\u4f1a\u54e1\u306e\u307f\u5229\u7528\u3067\u304d\u307e\u3059\u3002",
    newAccessHelp:
      "\u521d\u56de\u30a2\u30af\u30bb\u30b9\u306f\u3001sensei \u307e\u305f\u306f\u56fd\u306e\u4ee3\u8868\u306b\u3054\u76f8\u8ac7\u304f\u3060\u3055\u3044\u3002\u30d1\u30b9\u30ef\u30fc\u30c9\u5fa9\u65e7\u306f\u3001\u30b7\u30b9\u30c6\u30e0\u306b\u65e2\u306b\u767b\u9332\u3055\u308c\u3066\u3044\u308b\u30a2\u30af\u30c6\u30a3\u30d6\u4f1a\u54e1\u306e\u307f\u5229\u7528\u3067\u304d\u307e\u3059\u3002",
    passwordPlaceholder: "\u30d1\u30b9\u30ef\u30fc\u30c9",
    enter: "\u5165\u308b",
    magicLinkSent: "IKA \u3067\u305d\u306e\u30e1\u30fc\u30eb\u304c\u30a2\u30af\u30c6\u30a3\u30d6\u3067\u3042\u308c\u3070\u3001\u3059\u3050\u306b\u30d1\u30b9\u30ef\u30fc\u30c9\u5fa9\u65e7\u30e1\u30fc\u30eb\u304c\u5c4a\u304d\u307e\u3059\u3002",
    requestAccess: "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5fa9\u65e7",
    loadError: "\u30dd\u30fc\u30bf\u30eb\u3092\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
    privatePortal: "\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8\u30dd\u30fc\u30bf\u30eb",
    signOut: "\u30ed\u30b0\u30a2\u30a6\u30c8",
    loadingPortal: "\u30dd\u30fc\u30bf\u30eb\u3092\u8aad\u307f\u8fbc\u307f\u4e2d...",
    noRoleTitle: "\u30ed\u30fc\u30eb\u304c\u3042\u308a\u307e\u305b\u3093",
    noRoleText: "\u30e6\u30fc\u30b6\u30fc\u306f\u5b58\u5728\u3057\u307e\u3059\u304c\u3001\u307e\u3060 IKA \u6a29\u9650\u304c\u3042\u308a\u307e\u305b\u3093\u3002",
    generalAccess: "\u4e00\u822c\u30a2\u30af\u30bb\u30b9",
    roleFallback: "\u30ed\u30fc\u30eb",
    memberPendingTitle: "Kenshi \u8a18\u9332\u304c\u672a\u9023\u643a",
    memberPendingText: "\u3053\u306e\u30e6\u30fc\u30b6\u30fc\u306f\u307e\u3060\u4f1a\u54e1\u8a18\u9332\u306b\u9023\u643a\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002",
    memberProfileTitle: "Kenshi \u8a18\u9332",
    ikaPassport: "IKA Passport",
    name: "\u6c0f\u540d",
    status: "\u72b6\u614b",
    currentGrade: "\u73fe\u5728\u306e\u7d1a\u6bb5",
    country: "\u56fd",
    dojo: "\u9053\u5834",
    joinedIka: "\u4fee\u884c\u6b74",
    consent: "\u540c\u610f",
    consentAccepted: "\u540c\u610f\u6e08\u307f",
    pending: "\u4fdd\u7559\u4e2d",
    gradeHistoryTitle: "IKA \u8b1b\u7fd2\u5c65\u6b74",
    noGrades: "\u767b\u9332\u3055\u308c\u305f IKA \u8b1b\u7fd2\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002",
    dojoAdminTitle: "\u9053\u5834\u7ba1\u7406",
    dojoAdminText: "\u4f1a\u54e1\u3001\u9053\u5834\u60c5\u5831\u3001\u57fa\u672c\u7684\u306a\u30d5\u30a9\u30ed\u30fc\u3092\u7ba1\u7406\u3057\u307e\u3059\u3002\u9ad8\u5ea6\u306a\u64cd\u4f5c\u306f\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8\u30e2\u30b8\u30e5\u30fc\u30eb\u3067\u884c\u3044\u307e\u3059\u3002",
    countryAdminTitle: "\u56fd\u5225\u7ba1\u7406",
    countryAdminText: "\u56fd\u5185\u306e\u9053\u5834\u3001\u4f1a\u54e1\u3001\u30a4\u30d9\u30f3\u30c8\u3001\u30ec\u30dd\u30fc\u30c8\u3092\u7ba1\u7406\u3057\u307e\u3059\u3002\u7bc4\u56f2\u306f\u5272\u308a\u5f53\u3066\u3089\u308c\u305f\u56fd\u306b\u9650\u3089\u308c\u307e\u3059\u3002",
    globalAdminTitle: "\u30b0\u30ed\u30fc\u30d0\u30eb\u7ba1\u7406",
    globalAdminText: "CMS\u3001\u56fd\u3001\u9053\u5834\u3001\u30a4\u30d9\u30f3\u30c8\u3001\u30e6\u30fc\u30b6\u30fc\u3001\u8a2d\u5b9a\u3078\u306e\u30b0\u30ed\u30fc\u30d0\u30eb\u30a2\u30af\u30bb\u30b9\u3002",
    activeScopeTitle: "\u6709\u52b9\u306a\u7bc4\u56f2",
    seniority: "\u4fee\u884c\u6b74",
    birthDate: "\u751f\u5e74\u6708\u65e5",
    group: "\u533a\u5206",
    child: "\u5b50\u3069\u3082",
    adult: "\u5927\u4eba",
    editableData: "\u7de8\u96c6\u53ef\u80fd\u306a\u60c5\u5831",
    photo: "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u5199\u771f",
    changePhoto: "\u5199\u771f\u3092\u5909\u66f4",
    selectImage: "\u753b\u50cf\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    phone: "\u96fb\u8a71",
    newPassword: "\u65b0\u3057\u3044\u30d1\u30b9\u30ef\u30fc\u30c9",
    saveFicha: "IKA \u8a18\u9332\u3092\u4fdd\u5b58",
    fichaUpdated: "IKA \u8a18\u9332\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
    fichaCredentialsUpdated: "IKA \u8a18\u9332\u3068\u8a8d\u8a3c\u60c5\u5831\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
    oldPkceLink: "\u3053\u306e\u53e4\u3044\u30ea\u30f3\u30af\u306e PKCE \u30b3\u30fc\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093\u3002\u65b0\u3057\u3044\u5fa9\u65e7\u30e1\u30fc\u30eb\u3092\u30ea\u30af\u30a8\u30b9\u30c8\u3057\u3001\u65b0\u3057\u3044\u30ea\u30f3\u30af\u3092\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002",
    emailPasswordRequired: "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3068\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    emailCredentialsRequired: "\u30d1\u30b9\u30ef\u30fc\u30c9\u5fa9\u65e7\u306e\u305f\u3081\u306b\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    kenshiEmailRequired: "Kenshi \u306e\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    passwordMinLength: "\u30d1\u30b9\u30ef\u30fc\u30c9\u306f 6 \u6587\u5b57\u4ee5\u4e0a\u5fc5\u8981\u3067\u3059\u3002",
    invalidRecoverySession: "\u5fa9\u65e7\u30ea\u30f3\u30af\u3067\u6709\u52b9\u306a\u30bb\u30c3\u30b7\u30e7\u30f3\u3092\u958b\u3051\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u65b0\u3057\u3044\u30e1\u30fc\u30eb\u3092\u30ea\u30af\u30a8\u30b9\u30c8\u3057\u3001\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8\u30a6\u30a3\u30f3\u30c9\u30a6\u3067\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `\u3053\u306e\u30ea\u30f3\u30af\u306f ${activeEmail} \u7528\u3067\u3001${expectedEmail} \u7528\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u73fe\u5728\u306e\u30a2\u30ab\u30a6\u30f3\u30c8\u304b\u3089\u30ed\u30b0\u30a2\u30a6\u30c8\u3059\u308b\u304b\u3001\u30e1\u30fc\u30eb\u3092\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8\u30a6\u30a3\u30f3\u30c9\u30a6\u3067\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002`,
    passwordUpdated: "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
    recoveryEyebrow: "IKA \u8a18\u9332",
    recoveryTitle: "\u65b0\u3057\u3044\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u4f5c\u6210",
    recoveryText: "\u30dd\u30fc\u30bf\u30eb\u30a2\u30af\u30bb\u30b9\u3092\u6709\u52b9\u306b\u3059\u308b\u305f\u3081\u3001\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3068\u65b0\u3057\u3044\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    kenshiEmailPlaceholder: "Kenshi \u306e\u30e1\u30fc\u30eb",
    showPassword: "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u8868\u793a",
    hidePassword: "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u96a0\u3059",
    savePassword: "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u4fdd\u5b58",
    roleLabels: {
      super_admin: "\u30b9\u30fc\u30d1\u30fc\u7ba1\u7406\u8005",
      global_admin: "\u30b0\u30ed\u30fc\u30d0\u30eb\u7ba1\u7406\u8005",
      country_admin: "\u56fd\u5225\u7ba1\u7406\u8005",
      dojo_admin: "\u9053\u5834\u7ba1\u7406\u8005",
      kenshi: "Kenshi",
    },
    emailLabel: "\u30e1\u30fc\u30eb",
    uploadPhotoError: "\u5199\u771f\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3067\u304d\u307e\u305b\u3093\u3002",
    readImageError: "\u9078\u629e\u3057\u305f\u753b\u50cf\u3092\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3002",
    saveFichaError: "IKA \u8a18\u9332\u3092\u4fdd\u5b58\u3067\u304d\u307e\u305b\u3093\u3002",
    saveRegistrationError: "\u53c2\u52a0\u767b\u9332\u3092\u66f4\u65b0\u3067\u304d\u307e\u305b\u3093\u3002",
    myEventsTitle: "\u53c2\u52a0\u767b\u9332\u3057\u305f\u30a4\u30d9\u30f3\u30c8",
    noEventsRegistered: "\u307e\u3060\u6709\u52b9\u306a\u30a4\u30d9\u30f3\u30c8\u767b\u9332\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
    registeredOnLabel: "\u767b\u9332\u65e5",
    eventStatusRegistered: "\u767b\u9332\u6e08\u307f",
    eventStatusCancelled: "\u30ad\u30e3\u30f3\u30bb\u30eb",
    cancelRegistration: "\u767b\u9332\u3092\u30ad\u30e3\u30f3\u30bb\u30eb",
    reopenRegistration: "\u767b\u9332\u3092\u518d\u958b",
    registrationUpdated: "\u767b\u9332\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
    registrationCancelled: "\u767b\u9332\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f\u3002",
    registrationRestored: "\u767b\u9332\u3092\u518d\u958b\u3057\u307e\u3057\u305f\u3002",
    registrationClosedNote: "\u3053\u306e\u30a4\u30d9\u30f3\u30c8\u306e\u30aa\u30f3\u30e9\u30a4\u30f3\u767b\u9332\u306f\u7d42\u4e86\u3057\u3066\u3044\u307e\u3059\u3002",
    tshirtQuestion: "T\u30b7\u30e3\u30c4\u304c\u5fc5\u8981",
    tshirtSize: "\u30b5\u30a4\u30ba",
    selectSize: "\u30b5\u30a4\u30ba\u3092\u9078\u629e",
    yes: "\u306f\u3044",
    no: "\u3044\u3044\u3048",
    openEventPage: "\u30a4\u30d9\u30f3\u30c8\u30da\u30fc\u30b8\u3092\u958b\u304f",
    untitledEvent: "\u7121\u984c\u306e\u30a4\u30d9\u30f3\u30c8",
  },
  zh: {
    secureAccess: "\u5b89\u5168\u8bbf\u95ee",
    enterPortal: "\u8fdb\u5165\u95e8\u6237",
    loginHelp:
      "\u8bf7\u4f7f\u7528\u4e0e\u60a8\u7684 IKA \u6d3b\u8dc3\u6863\u6848\u5173\u8054\u7684\u7535\u5b50\u90ae\u7bb1\u548c\u5bc6\u7801\u3002\u516c\u5f00\u8bbf\u95ee\u4ec5\u5bf9\u5df2\u6ce8\u518c\u6210\u5458\u5f00\u653e\u3002",
    newAccessHelp:
      "\u9996\u6b21\u8bbf\u95ee\u8bf7\u8054\u7cfb\u60a8\u7684 sensei \u6216\u56fd\u5bb6\u4ee3\u8868\u3002\u5bc6\u7801\u6062\u590d\u4ec5\u9650\u7cfb\u7edf\u4e2d\u5df2\u6ce8\u518c\u7684\u6d3b\u8dc3\u6210\u5458\u3002",
    passwordPlaceholder: "\u5bc6\u7801",
    enter: "\u8fdb\u5165",
    magicLinkSent: "\u5982\u679c\u8be5\u90ae\u7bb1\u5728 IKA \u4e2d\u4e3a\u6d3b\u8dc3\u72b6\u6001\uff0c\u60a8\u5c06\u5f88\u5feb\u6536\u5230\u5bc6\u7801\u6062\u590d\u90ae\u4ef6\u3002",
    requestAccess: "\u6062\u590d\u5bc6\u7801",
    loadError: "\u65e0\u6cd5\u52a0\u8f7d\u95e8\u6237\u3002",
    privatePortal: "\u79c1\u4eba\u95e8\u6237",
    signOut: "\u9000\u51fa",
    loadingPortal: "\u6b63\u5728\u52a0\u8f7d\u95e8\u6237...",
    noRoleTitle: "\u5c1a\u672a\u5206\u914d\u89d2\u8272",
    noRoleText: "\u60a8\u7684\u7528\u6237\u5df2\u5b58\u5728\uff0c\u4f46\u8fd8\u6ca1\u6709 IKA \u6743\u9650\u3002",
    generalAccess: "\u901a\u7528\u8bbf\u95ee",
    roleFallback: "\u89d2\u8272",
    memberPendingTitle: "Kenshi \u6863\u6848\u5f85\u5173\u8054",
    memberPendingText: "\u60a8\u7684\u7528\u6237\u5c1a\u672a\u5173\u8054\u4f1a\u5458\u6863\u6848\u3002",
    memberProfileTitle: "Kenshi \u6863\u6848",
    ikaPassport: "IKA Passport",
    name: "\u59d3\u540d",
    status: "\u72b6\u6001",
    currentGrade: "\u5f53\u524d\u7b49\u7ea7",
    country: "\u56fd\u5bb6",
    dojo: "\u9053\u573a",
    joinedIka: "\u8bad\u7ec3\u5e74\u9650",
    consent: "\u540c\u610f",
    consentAccepted: "\u5df2\u63a5\u53d7",
    pending: "\u5f85\u5904\u7406",
    gradeHistoryTitle: "IKA \u8bfe\u7a0b\u5386\u53f2",
    noGrades: "\u5c1a\u672a\u767b\u8bb0\u4efb\u4f55 IKA \u8bfe\u7a0b\u3002",
    dojoAdminTitle: "\u9053\u573a\u7ba1\u7406",
    dojoAdminText: "\u7ba1\u7406\u4f1a\u5458\u3001\u9053\u573a\u8d44\u6599\u548c\u57fa\u672c\u8ddf\u8fdb\u3002\u9ad8\u7ea7\u64cd\u4f5c\u5c06\u5728\u79c1\u4eba\u6a21\u5757\u4e2d\u5b8c\u6210\u3002",
    countryAdminTitle: "\u56fd\u5bb6\u7ba1\u7406",
    countryAdminText: "\u7ba1\u7406\u672c\u56fd\u9053\u573a\u3001\u4f1a\u5458\u3001\u6d3b\u52a8\u548c\u62a5\u544a\u3002\u8303\u56f4\u4ec5\u9650\u4e8e\u5206\u914d\u7684\u56fd\u5bb6\u3002",
    globalAdminTitle: "\u5168\u5c40\u7ba1\u7406",
    globalAdminText: "\u5168\u5c40\u8bbf\u95ee CMS\u3001\u56fd\u5bb6\u3001\u9053\u573a\u3001\u6d3b\u52a8\u3001\u7528\u6237\u548c\u914d\u7f6e\u3002",
    activeScopeTitle: "\u5f53\u524d\u6743\u9650\u8303\u56f4",
    seniority: "\u8bad\u7ec3\u5e74\u9650",
    birthDate: "\u51fa\u751f\u65e5\u671f",
    group: "\u7ec4\u522b",
    child: "\u513f\u7ae5",
    adult: "\u6210\u4eba",
    editableData: "\u53ef\u7f16\u8f91\u8d44\u6599",
    photo: "\u5934\u50cf",
    changePhoto: "\u66f4\u6362\u7167\u7247",
    selectImage: "\u8bf7\u9009\u62e9\u56fe\u7247\u3002",
    phone: "\u7535\u8bdd",
    newPassword: "\u65b0\u5bc6\u7801",
    saveFicha: "\u4fdd\u5b58 IKA \u6863\u6848",
    fichaUpdated: "IKA \u6863\u6848\u5df2\u66f4\u65b0\u3002",
    fichaCredentialsUpdated: "IKA \u6863\u6848\u548c\u767b\u5f55\u51ed\u636e\u5df2\u66f4\u65b0\u3002",
    oldPkceLink: "\u6b64\u65e7\u94fe\u63a5\u4f7f\u7528\u7684 PKCE \u4ee3\u7801\u5df2\u4e0d\u53ef\u7528\u3002\u8bf7\u91cd\u65b0\u8bf7\u6c42\u6062\u590d\u90ae\u4ef6\u5e76\u6253\u5f00\u65b0\u94fe\u63a5\u3002",
    emailPasswordRequired: "\u8bf7\u8f93\u5165\u7535\u5b50\u90ae\u7bb1\u548c\u5bc6\u7801\u3002",
    emailCredentialsRequired: "\u8bf7\u8f93\u5165\u60a8\u7684\u7535\u5b50\u90ae\u7bb1\u4ee5\u6062\u590d\u5bc6\u7801\u3002",
    kenshiEmailRequired: "\u8bf7\u8f93\u5165 Kenshi \u90ae\u7bb1\u3002",
    passwordMinLength: "\u5bc6\u7801\u81f3\u5c11\u9700\u8981 6 \u4e2a\u5b57\u7b26\u3002",
    invalidRecoverySession: "\u6062\u590d\u94fe\u63a5\u672a\u6253\u5f00\u6709\u6548\u4f1a\u8bdd\u3002\u8bf7\u91cd\u65b0\u8bf7\u6c42\u90ae\u4ef6\uff0c\u5e76\u5728\u9690\u79c1\u7a97\u53e3\u4e2d\u6253\u5f00\u3002",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `\u6b64\u94fe\u63a5\u9002\u7528\u4e8e ${activeEmail}\uff0c\u4e0d\u9002\u7528\u4e8e ${expectedEmail}\u3002\u8bf7\u9000\u51fa\u5f53\u524d\u8d26\u53f7\uff0c\u6216\u5728\u9690\u79c1\u7a97\u53e3\u4e2d\u6253\u5f00\u90ae\u4ef6\u3002`,
    passwordUpdated: "\u5bc6\u7801\u5df2\u66f4\u65b0\u3002",
    recoveryEyebrow: "IKA \u6863\u6848",
    recoveryTitle: "\u521b\u5efa\u65b0\u5bc6\u7801",
    recoveryText: "\u8bf7\u8f93\u5165\u7535\u5b50\u90ae\u7bb1\u548c\u65b0\u5bc6\u7801\u4ee5\u542f\u7528\u95e8\u6237\u8bbf\u95ee\u3002",
    kenshiEmailPlaceholder: "Kenshi \u90ae\u7bb1",
    showPassword: "\u663e\u793a\u5bc6\u7801",
    hidePassword: "\u9690\u85cf\u5bc6\u7801",
    savePassword: "\u4fdd\u5b58\u5bc6\u7801",
    roleLabels: {
      super_admin: "\u8d85\u7ea7\u7ba1\u7406\u5458",
      global_admin: "\u5168\u5c40\u7ba1\u7406\u5458",
      country_admin: "\u56fd\u5bb6\u7ba1\u7406\u5458",
      dojo_admin: "\u9053\u573a\u7ba1\u7406\u5458",
      kenshi: "Kenshi",
    },
    emailLabel: "\u7535\u5b50\u90ae\u7bb1",
    uploadPhotoError: "\u65e0\u6cd5\u4e0a\u4f20\u7167\u7247\u3002",
    readImageError: "\u65e0\u6cd5\u8bfb\u53d6\u6240\u9009\u56fe\u7247\u3002",
    saveFichaError: "\u65e0\u6cd5\u4fdd\u5b58 IKA \u6863\u6848\u3002",
    saveRegistrationError: "\u65e0\u6cd5\u66f4\u65b0\u62a5\u540d\u3002",
    myEventsTitle: "\u6211\u7684\u6d3b\u52a8\u62a5\u540d",
    noEventsRegistered: "\u60a8\u8fd8\u6ca1\u6709\u4efb\u4f55\u6709\u6548\u7684\u6d3b\u52a8\u62a5\u540d\u3002",
    registeredOnLabel: "\u62a5\u540d\u65e5\u671f",
    eventStatusRegistered: "\u5df2\u62a5\u540d",
    eventStatusCancelled: "\u5df2\u53d6\u6d88",
    cancelRegistration: "\u53d6\u6d88\u62a5\u540d",
    reopenRegistration: "\u91cd\u65b0\u6fc0\u6d3b\u62a5\u540d",
    registrationUpdated: "\u62a5\u540d\u5df2\u66f4\u65b0\u3002",
    registrationCancelled: "\u62a5\u540d\u5df2\u53d6\u6d88\u3002",
    registrationRestored: "\u62a5\u540d\u5df2\u6062\u590d\u3002",
    registrationClosedNote: "\u6b64\u6d3b\u52a8\u7684\u7ebf\u4e0a\u62a5\u540d\u5df2\u5173\u95ed\u3002",
    tshirtQuestion: "\u6211\u9700\u8981 T \u6064",
    tshirtSize: "\u5c3a\u7801",
    selectSize: "\u9009\u62e9\u5c3a\u7801",
    yes: "\u662f",
    no: "\u5426",
    openEventPage: "\u6253\u5f00\u6d3b\u52a8\u9875\u9762",
    untitledEvent: "\u672a\u547d\u540d\u6d3b\u52a8",
  },
  cs: {
    secureAccess: "Bezpecny pristup",
    enterPortal: "Vstoupit do portalu",
    loginHelp:
      "Pouzijte email a heslo propojene s vasim aktivnim zaznamem IKA. Verejny pristup je dostupny jen pro jiz registrovane cleny.",
    newAccessHelp:
      "Pro prvni pristup kontaktujte sveho senseie nebo zastupce zeme. Obnova hesla je dostupna pouze pro aktivni cleny, kteri uz jsou v systemu registrovani.",
    passwordPlaceholder: "Heslo",
    enter: "Vstoupit",
    magicLinkSent: "Pokud je email v IKA aktivni, brzy obdrzite email pro obnovu hesla.",
    requestAccess: "Obnovit heslo",
    loadError: "Portal se nepodarilo nacist.",
    privatePortal: "Soukromy portal",
    signOut: "Odhlasit",
    loadingPortal: "Nacitam portal...",
    noRoleTitle: "Neni prirazena role",
    noRoleText: "Uzivatel existuje, ale zatim nema opravneni IKA.",
    generalAccess: "Obecny pristup",
    roleFallback: "Role",
    memberPendingTitle: "Zaznam Kenshi ceka",
    memberPendingText: "Uzivatel zatim neni propojen se zaznamem clena.",
    memberProfileTitle: "Zaznam Kenshi",
    ikaPassport: "IKA Passport",
    name: "Jmeno",
    status: "Stav",
    currentGrade: "Aktualni stupen",
    country: "Zeme",
    dojo: "Dojo",
    joinedIka: "Delka praxe",
    consent: "Souhlas",
    consentAccepted: "Prijato",
    pending: "Ceka",
    gradeHistoryTitle: "Historie kurzu IKA",
    noGrades: "Zatim nejsou registrovany zadne kurzy IKA.",
    dojoAdminTitle: "Sprava dojo",
    dojoAdminText:
      "Sprava clenu, udaju dojo a zakladni sledovani. Pokrocile akce budou dokonceny v soukromem modulu.",
    countryAdminTitle: "Sprava zeme",
    countryAdminText:
      "Narodni sprava dojo, clenu, udalosti a reportu. Rozsah je omezen na prirazenou zemi.",
    globalAdminTitle: "Globalni sprava",
    globalAdminText:
      "Globalni pristup k CMS, zemim, dojo, udalostem, uzivatelum a konfiguraci.",
    activeScopeTitle: "Aktivni rozsah",
    seniority: "Delka praxe",
    birthDate: "Datum narozeni",
    group: "Skupina",
    child: "Dite",
    adult: "Dospely",
    editableData: "Upravitelne udaje",
    photo: "Profilova fotografie",
    changePhoto: "Zmenit fotografii",
    selectImage: "Vyberte obrazek.",
    phone: "Telefon",
    newPassword: "Nove heslo",
    saveFicha: "Ulozit zaznam IKA",
    fichaUpdated: "Zaznam IKA byl aktualizovan.",
    fichaCredentialsUpdated: "Zaznam IKA a prihlasovaci udaje byly aktualizovany.",
    oldPkceLink:
      "Tento stary odkaz pouziva kod PKCE, ktery uz neni dostupny. Pozadejte o novy obnovovaci email a otevete novy odkaz.",
    emailPasswordRequired: "Zadejte email a heslo.",
    emailCredentialsRequired: "Zadejte email pro obnovu hesla.",
    kenshiEmailRequired: "Zadejte email Kenshi.",
    passwordMinLength: "Heslo musi mit alespon 6 znaku.",
    invalidRecoverySession:
      "Obnovovaci odkaz neotevrel platnou relaci. Pozadejte o novy email a otevete ho v soukromem okne.",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `Tento odkaz je aktivni pro ${activeEmail}, ne pro ${expectedEmail}. Odhlaste se z aktualniho uctu nebo otevete email v soukromem okne.`,
    passwordUpdated: "Heslo bylo aktualizovano.",
    recoveryEyebrow: "Zaznam IKA",
    recoveryTitle: "Vytvorit nove heslo",
    recoveryText:
      "Zadejte email a nove heslo pro aktivaci pristupu do portalu.",
    kenshiEmailPlaceholder: "Email Kenshi",
    showPassword: "Zobrazit heslo",
    hidePassword: "Skryt heslo",
    savePassword: "Ulozit heslo",
    roleLabels: {
      super_admin: "Super admin",
      global_admin: "Global admin",
      country_admin: "Admin zeme",
      dojo_admin: "Admin dojo",
      kenshi: "Kenshi",
    },
    emailLabel: "Email",
    uploadPhotoError: "Fotografii se nepodarilo nahrat.",
    readImageError: "Vybrany obrazek se nepodarilo nacist.",
    saveFichaError: "Zaznam IKA se nepodarilo ulozit.",
    saveRegistrationError: "Registraci se nepodarilo aktualizovat.",
    myEventsTitle: "Moje registrace na udalosti",
    noEventsRegistered: "Zatim nemate zadne aktivni registrace na udalosti.",
    registeredOnLabel: "Registrovano dne",
    eventStatusRegistered: "Registrovano",
    eventStatusCancelled: "Zruseno",
    cancelRegistration: "Zrusit registraci",
    reopenRegistration: "Obnovit registraci",
    registrationUpdated: "Registrace byla aktualizovana.",
    registrationCancelled: "Registrace byla zrusena.",
    registrationRestored: "Registrace byla obnovena.",
    registrationClosedNote: "Online registrace na tuto udalost je jiz uzavrena.",
    tshirtQuestion: "Potrebuji tricko",
    tshirtSize: "Velikost",
    selectSize: "Vyberte velikost",
    yes: "Ano",
    no: "Ne",
    openEventPage: "Otevrit stranku udalosti",
    untitledEvent: "Udalost bez nazvu",
  },
  id: {
    secureAccess: "Akses aman",
    enterPortal: "Masuk ke portal",
    loginHelp:
      "Gunakan email dan kata sandi yang terkait dengan data IKA aktif Anda. Akses publik hanya tersedia untuk anggota yang sudah terdaftar.",
    newAccessHelp:
      "Untuk akses pertama, hubungi sensei atau perwakilan negara Anda. Pemulihan kata sandi hanya tersedia bagi anggota aktif yang sudah terdaftar di sistem.",
    passwordPlaceholder: "Kata sandi",
    enter: "Masuk",
    magicLinkSent: "Jika email aktif di IKA, Anda akan segera menerima email pemulihan kata sandi.",
    requestAccess: "Pulihkan kata sandi",
    loadError: "Portal tidak dapat dimuat.",
    privatePortal: "Portal privat",
    signOut: "Keluar",
    loadingPortal: "Memuat portal...",
    noRoleTitle: "Belum ada peran",
    noRoleText: "Pengguna Anda ada, tetapi belum memiliki izin IKA.",
    generalAccess: "Akses umum",
    roleFallback: "Peran",
    memberPendingTitle: "Data Kenshi tertunda",
    memberPendingText: "Pengguna Anda belum terhubung ke data anggota.",
    memberProfileTitle: "Data Kenshi",
    name: "Nama",
    status: "Status",
    currentGrade: "Tingkat saat ini",
    country: "Negara",
    dojo: "Dojo",
    joinedIka: "Masa latihan",
    consent: "Persetujuan",
    consentAccepted: "Disetujui",
    pending: "Tertunda",
    gradeHistoryTitle: "Riwayat kursus IKA",
    noGrades: "Belum ada kursus IKA yang terdaftar.",
    achievementsTitle: "Prestasi kompetisi",
    noAchievements: "Belum ada prestasi yang terdaftar.",
    medalsSummary: "Perolehan medali IKA",
    podiumLabel: "Podium",
    resultLabel: "Hasil",
    categoryLabel: "Kategori",
    placeLabel: "Tempat",
    courseIdLabel: "ID kursus",
    seniority: "Masa latihan",
    birthDate: "Tanggal lahir",
    group: "Kelompok",
    child: "Anak",
    adult: "Dewasa",
    editableData: "Data yang dapat diubah",
    photo: "Foto profil",
    changePhoto: "Ganti foto",
    selectImage: "Pilih gambar.",
    phone: "Telepon",
    newPassword: "Kata sandi baru",
    saveFicha: "Simpan data IKA",
    fichaUpdated: "Data IKA diperbarui.",
    fichaCredentialsUpdated: "Data IKA dan kredensial diperbarui.",
    emailPasswordRequired: "Masukkan email dan kata sandi.",
    emailCredentialsRequired: "Masukkan email Anda untuk memulihkan kata sandi.",
    kenshiEmailRequired: "Masukkan email Kenshi.",
    passwordMinLength: "Kata sandi minimal 6 karakter.",
    passwordUpdated: "Kata sandi diperbarui.",
    recoveryEyebrow: "Data IKA",
    recoveryTitle: "Buat kata sandi baru",
    recoveryText: "Masukkan email dan kata sandi baru untuk mengaktifkan akses portal.",
    kenshiEmailPlaceholder: "Email Kenshi",
    showPassword: "Tampilkan kata sandi",
    hidePassword: "Sembunyikan kata sandi",
    savePassword: "Simpan kata sandi",
    emailLabel: "Email",
    uploadPhotoError: "Foto tidak dapat diunggah.",
    readImageError: "Gambar yang dipilih tidak dapat dibaca.",
    saveFichaError: "Data IKA tidak dapat disimpan.",
    saveRegistrationError: "Pendaftaran tidak dapat diperbarui.",
    myEventsTitle: "Pendaftaran acara saya",
    noEventsRegistered: "Anda belum memiliki pendaftaran acara aktif.",
    registeredOnLabel: "Terdaftar pada",
    eventStatusRegistered: "Terdaftar",
    eventStatusCancelled: "Dibatalkan",
    cancelRegistration: "Batalkan pendaftaran",
    reopenRegistration: "Aktifkan kembali pendaftaran",
    registrationUpdated: "Pendaftaran diperbarui.",
    registrationCancelled: "Pendaftaran dibatalkan.",
    registrationRestored: "Pendaftaran diaktifkan kembali.",
    registrationClosedNote: "Pendaftaran online untuk acara ini sudah ditutup.",
    tshirtQuestion: "Saya memerlukan kaos",
    tshirtSize: "Ukuran",
    selectSize: "Pilih ukuran",
    yes: "Ya",
    no: "Tidak",
    openEventPage: "Buka halaman acara",
    untitledEvent: "Acara tanpa judul",
  },
  ms: {
    secureAccess: "Akses selamat",
    enterPortal: "Masuk ke portal",
    loginHelp:
      "Gunakan e-mel dan kata laluan yang dipautkan dengan rekod IKA aktif anda. Akses awam hanya tersedia untuk ahli yang sudah berdaftar.",
    newAccessHelp:
      "Untuk akses pertama, hubungi sensei atau wakil negara anda. Pemulihan kata laluan hanya tersedia untuk ahli aktif yang sudah berdaftar dalam sistem.",
    passwordPlaceholder: "Kata laluan",
    enter: "Masuk",
    magicLinkSent: "Jika e-mel aktif dalam IKA, anda akan menerima e-mel pemulihan kata laluan tidak lama lagi.",
    requestAccess: "Pulihkan kata laluan",
    loadError: "Portal tidak dapat dimuatkan.",
    privatePortal: "Portal peribadi",
    signOut: "Keluar",
    loadingPortal: "Memuatkan portal...",
    noRoleTitle: "Tiada peranan diberikan",
    noRoleText: "Pengguna anda wujud, tetapi belum mempunyai kebenaran IKA.",
    generalAccess: "Akses umum",
    roleFallback: "Peranan",
    memberPendingTitle: "Rekod Kenshi belum dipautkan",
    memberPendingText: "Pengguna anda belum dipautkan kepada rekod ahli.",
    memberProfileTitle: "Rekod Kenshi",
    name: "Nama",
    status: "Status",
    currentGrade: "Gred semasa",
    country: "Negara",
    dojo: "Dojo",
    joinedIka: "Tempoh latihan",
    consent: "Persetujuan",
    consentAccepted: "Diterima",
    pending: "Tertunda",
    gradeHistoryTitle: "Sejarah kursus IKA",
    noGrades: "Belum ada kursus IKA yang direkodkan.",
    achievementsTitle: "Pencapaian pertandingan",
    noAchievements: "Belum ada pencapaian yang direkodkan.",
    medalsSummary: "Jadual pingat IKA",
    podiumLabel: "Podium",
    resultLabel: "Keputusan",
    categoryLabel: "Kategori",
    placeLabel: "Tempat",
    courseIdLabel: "ID kursus",
    seniority: "Tempoh latihan",
    birthDate: "Tarikh lahir",
    group: "Kumpulan",
    child: "Kanak-kanak",
    adult: "Dewasa",
    editableData: "Data yang boleh disunting",
    photo: "Foto profil",
    changePhoto: "Tukar foto",
    selectImage: "Pilih imej.",
    phone: "Telefon",
    newPassword: "Kata laluan baharu",
    saveFicha: "Simpan rekod IKA",
    fichaUpdated: "Rekod IKA dikemas kini.",
    fichaCredentialsUpdated: "Rekod IKA dan kelayakan dikemas kini.",
    emailPasswordRequired: "Masukkan e-mel dan kata laluan.",
    emailCredentialsRequired: "Masukkan e-mel anda untuk memulihkan kata laluan.",
    kenshiEmailRequired: "Masukkan e-mel Kenshi.",
    passwordMinLength: "Kata laluan mesti sekurang-kurangnya 6 aksara.",
    passwordUpdated: "Kata laluan dikemas kini.",
    recoveryEyebrow: "Rekod IKA",
    recoveryTitle: "Cipta kata laluan baharu",
    recoveryText: "Masukkan e-mel dan kata laluan baharu untuk mengaktifkan akses portal.",
    kenshiEmailPlaceholder: "E-mel Kenshi",
    showPassword: "Tunjukkan kata laluan",
    hidePassword: "Sembunyikan kata laluan",
    savePassword: "Simpan kata laluan",
    emailLabel: "E-mel",
    uploadPhotoError: "Foto tidak dapat dimuat naik.",
    readImageError: "Imej yang dipilih tidak dapat dibaca.",
    saveFichaError: "Rekod IKA tidak dapat disimpan.",
    saveRegistrationError: "Pendaftaran tidak dapat dikemas kini.",
    myEventsTitle: "Pendaftaran acara saya",
    noEventsRegistered: "Anda belum mempunyai pendaftaran acara yang aktif.",
    registeredOnLabel: "Didaftarkan pada",
    eventStatusRegistered: "Didaftarkan",
    eventStatusCancelled: "Dibatalkan",
    cancelRegistration: "Batalkan pendaftaran",
    reopenRegistration: "Aktifkan semula pendaftaran",
    registrationUpdated: "Pendaftaran dikemas kini.",
    registrationCancelled: "Pendaftaran dibatalkan.",
    registrationRestored: "Pendaftaran diaktifkan semula.",
    registrationClosedNote: "Pendaftaran dalam talian untuk acara ini sudah ditutup.",
    tshirtQuestion: "Saya perlukan t-shirt",
    tshirtSize: "Saiz",
    selectSize: "Pilih saiz",
    yes: "Ya",
    no: "Tidak",
    openEventPage: "Buka halaman acara",
    untitledEvent: "Acara tanpa tajuk",
  },
  eu: {
    secureAccess: "Sarbide segurua",
    enterPortal: "Atarian sartu",
    loginHelp:
      "Erabili zure IKA fitxa aktiboarekin lotutako e-posta eta pasahitza. Sarbide publikoa dagoeneko erregistratutako kideentzat bakarrik dago eskuragarri.",
    newAccessHelp:
      "Lehen sarbiderako, jarri harremanetan zure sensei edo herrialdeko ordezkariarekin. Pasahitza berreskuratzea sisteman aurrez erregistratutako kide aktiboentzat bakarrik dago.",
    passwordPlaceholder: "Pasahitza",
    enter: "Sartu",
    magicLinkSent: "E-posta IKA-n aktibo badago, laster pasahitza berreskuratzeko mezua jasoko duzu.",
    requestAccess: "Berreskuratu pasahitza",
    loadError: "Ezin izan da ataria kargatu.",
    privatePortal: "Atari pribatua",
    signOut: "Irten",
    loadingPortal: "Ataria kargatzen...",
    noRoleTitle: "Rolik gabe",
    noRoleText: "Zure erabiltzailea badago, baina oraindik ez du IKA baimenik.",
    generalAccess: "Sarbide orokorra",
    roleFallback: "Rola",
    memberPendingTitle: "Kenshi fitxa lotzeke",
    memberPendingText: "Zure erabiltzailea oraindik ez dago kide fitxa bati lotuta.",
    memberProfileTitle: "Kenshi fitxa",
    name: "Izena",
    status: "Egoera",
    currentGrade: "Uneko gradua",
    country: "Herrialdea",
    dojo: "Dojoa",
    joinedIka: "Antzinatasuna",
    consent: "Baimena",
    consentAccepted: "Onartua",
    pending: "Zain",
    gradeHistoryTitle: "IKA ikastaroen historia",
    noGrades: "Oraindik ez dago IKA ikastarorik erregistratuta.",
    achievementsTitle: "Lehiaketa lorpenak",
    noAchievements: "Oraindik ez dago lorpenei buruzko erregistrorik.",
    medalsSummary: "IKA domina-taula",
    podiumLabel: "Podiuma",
    resultLabel: "Emaitza",
    categoryLabel: "Kategoria",
    placeLabel: "Lekua",
    courseIdLabel: "Ikastaro IDa",
    seniority: "Antzinatasuna",
    birthDate: "Jaiotze data",
    group: "Taldea",
    child: "Haurra",
    adult: "Heldua",
    editableData: "Alda daitezkeen datuak",
    photo: "Profilaren argazkia",
    changePhoto: "Aldatu argazkia",
    selectImage: "Hautatu irudi bat.",
    phone: "Telefonoa",
    newPassword: "Pasahitz berria",
    saveFicha: "Gorde IKA fitxa",
    fichaUpdated: "IKA fitxa eguneratu da.",
    fichaCredentialsUpdated: "IKA fitxa eta kredentzialak eguneratu dira.",
    emailPasswordRequired: "Sartu e-posta eta pasahitza.",
    emailCredentialsRequired: "Sartu zure e-posta pasahitza berreskuratzeko.",
    kenshiEmailRequired: "Sartu Kenshi-ren e-posta.",
    passwordMinLength: "Pasahitzak gutxienez 6 karaktere izan behar ditu.",
    passwordUpdated: "Pasahitza eguneratu da.",
    recoveryEyebrow: "IKA fitxa",
    recoveryTitle: "Sortu pasahitz berria",
    recoveryText: "Sartu e-posta eta pasahitz berria atariko sarbidea aktibatzeko.",
    kenshiEmailPlaceholder: "Kenshi e-posta",
    showPassword: "Erakutsi pasahitza",
    hidePassword: "Ezkutatu pasahitza",
    savePassword: "Gorde pasahitza",
    emailLabel: "E-posta",
    uploadPhotoError: "Ezin izan da argazkia igo.",
    readImageError: "Ezin izan da hautatutako irudia irakurri.",
    saveFichaError: "Ezin izan da IKA fitxa gorde.",
    saveRegistrationError: "Ezin izan da izen-ematea eguneratu.",
    myEventsTitle: "Nire ekitaldi izen-emateak",
    noEventsRegistered: "Oraindik ez duzu ekitaldietarako izen-emate aktiborik.",
    registeredOnLabel: "Noiz erregistratua",
    eventStatusRegistered: "Erregistratua",
    eventStatusCancelled: "Bertan behera",
    cancelRegistration: "Utzi izen-ematea",
    reopenRegistration: "Berraktibatu izen-ematea",
    registrationUpdated: "Izen-ematea eguneratu da.",
    registrationCancelled: "Izen-ematea bertan behera utzi da.",
    registrationRestored: "Izen-ematea berraktibatu da.",
    registrationClosedNote: "Ekitaldi honetarako online izen-ematea itxita dago jada.",
    tshirtQuestion: "Kamiseta behar dut",
    tshirtSize: "Talla",
    selectSize: "Hautatu talla",
    yes: "Bai",
    no: "Ez",
    openEventPage: "Ireki ekitaldiaren orria",
    untitledEvent: "Izenbururik gabeko ekitaldia",
  },
  pt: {
    secureAccess: "Acesso seguro",
    enterPortal: "Entrar no portal",
    loginHelp:
      "Utilize o e-mail e a palavra-passe associados ao seu registo IKA ativo. O acesso pÃºblico sÃ³ estÃ¡ disponÃ­vel para membros jÃ¡ registados.",
    newAccessHelp:
      "Para o primeiro acesso, contacte o seu sensei ou representante do paÃ­s. A recuperaÃ§Ã£o da palavra-passe sÃ³ estÃ¡ disponÃ­vel para membros ativos jÃ¡ registados no sistema.",
    passwordPlaceholder: "Palavra-passe",
    enter: "Entrar",
    magicLinkSent: "Se o e-mail estiver ativo na IKA, receberÃ¡ em breve um e-mail para recuperar a palavra-passe.",
    requestAccess: "Recuperar palavra-passe",
    loadError: "NÃ£o foi possÃ­vel carregar o portal.",
    privatePortal: "Portal privado",
    signOut: "Sair",
    loadingPortal: "A carregar portal...",
    noRoleTitle: "Sem funÃ§Ã£o atribuÃ­da",
    noRoleText: "O seu utilizador existe, mas ainda nÃ£o tem permissÃµes IKA.",
    generalAccess: "Acesso geral",
    roleFallback: "FunÃ§Ã£o",
    memberPendingTitle: "Ficha Kenshi pendente",
    memberPendingText: "O seu utilizador ainda nÃ£o estÃ¡ ligado a uma ficha de membro.",
    memberProfileTitle: "Ficha Kenshi",
    name: "Nome",
    status: "Estado",
    currentGrade: "Grau atual",
    country: "PaÃ­s",
    dojo: "Dojo",
    joinedIka: "Antiguidade",
    consent: "Consentimento",
    consentAccepted: "Aceite",
    pending: "Pendente",
    gradeHistoryTitle: "HistÃ³rico de cursos IKA",
    noGrades: "Ainda nÃ£o existem cursos IKA registados.",
    achievementsTitle: "Conquistas de competiÃ§Ã£o",
    noAchievements: "Ainda nÃ£o existem conquistas registadas.",
    medalsSummary: "Quadro de medalhas IKA",
    podiumLabel: "PÃ³dio",
    resultLabel: "Resultado",
    categoryLabel: "Categoria",
    placeLabel: "Local",
    courseIdLabel: "ID do curso",
    seniority: "Antiguidade",
    birthDate: "Data de nascimento",
    group: "Grupo",
    child: "CrianÃ§a",
    adult: "Adulto",
    editableData: "Dados editÃ¡veis",
    photo: "Foto de perfil",
    changePhoto: "Alterar foto",
    selectImage: "Selecione uma imagem.",
    phone: "Telefone",
    newPassword: "Nova palavra-passe",
    saveFicha: "Guardar ficha IKA",
    fichaUpdated: "Ficha IKA atualizada.",
    fichaCredentialsUpdated: "Ficha IKA e credenciais atualizadas.",
    emailPasswordRequired: "Introduza e-mail e palavra-passe.",
    emailCredentialsRequired: "Introduza o seu e-mail para recuperar a palavra-passe.",
    kenshiEmailRequired: "Introduza o e-mail do Kenshi.",
    passwordMinLength: "A palavra-passe deve ter pelo menos 6 caracteres.",
    passwordUpdated: "Palavra-passe atualizada.",
    recoveryEyebrow: "Ficha IKA",
    recoveryTitle: "Criar nova palavra-passe",
    recoveryText: "Introduza o e-mail e uma nova palavra-passe para ativar o acesso ao portal.",
    kenshiEmailPlaceholder: "E-mail do Kenshi",
    showPassword: "Mostrar palavra-passe",
    hidePassword: "Ocultar palavra-passe",
    savePassword: "Guardar palavra-passe",
    emailLabel: "E-mail",
    uploadPhotoError: "Nao foi possivel carregar a foto.",
    readImageError: "Nao foi possivel ler a imagem selecionada.",
    saveFichaError: "Nao foi possivel guardar a ficha IKA.",
    saveRegistrationError: "Nao foi possivel atualizar a inscricao.",
    myEventsTitle: "As minhas inscricoes em eventos",
    noEventsRegistered: "Ainda nao tens inscricoes ativas em eventos.",
    registeredOnLabel: "Inscrito em",
    eventStatusRegistered: "Inscrito",
    eventStatusCancelled: "Cancelado",
    cancelRegistration: "Cancelar inscricao",
    reopenRegistration: "Reativar inscricao",
    registrationUpdated: "Inscricao atualizada.",
    registrationCancelled: "Inscricao cancelada.",
    registrationRestored: "Inscricao reativada.",
    registrationClosedNote: "A inscricao online para este evento ja esta fechada.",
    tshirtQuestion: "Preciso de t-shirt",
    tshirtSize: "Tamanho",
    selectSize: "Selecionar tamanho",
    yes: "Sim",
    no: "Nao",
    openEventPage: "Abrir pagina do evento",
    untitledEvent: "Evento sem titulo",
  },
  de: {
    secureAccess: "Sicherer Zugang",
    enterPortal: "Portal betreten",
    loginHelp:
      "Verwenden Sie die E-Mail-Adresse und das Passwort, die mit Ihrem aktiven IKA-Eintrag verknÃ¼pft sind. Der Ã¶ffentliche Zugang ist nur fÃ¼r bereits registrierte Mitglieder verfÃ¼gbar.",
    newAccessHelp:
      "FÃ¼r den ersten Zugang wenden Sie sich an Ihren Sensei oder den Landesvertreter. Die Passwortwiederherstellung ist nur fÃ¼r aktive Mitglieder verfÃ¼gbar, die bereits im System registriert sind.",
    passwordPlaceholder: "Passwort",
    enter: "Anmelden",
    magicLinkSent: "Wenn die E-Mail in IKA aktiv ist, erhalten Sie in KÃ¼rze eine E-Mail zur Passwortwiederherstellung.",
    requestAccess: "Passwort wiederherstellen",
    loadError: "Das Portal konnte nicht geladen werden.",
    privatePortal: "Privates Portal",
    signOut: "Abmelden",
    loadingPortal: "Portal wird geladen...",
    noRoleTitle: "Keine Rolle zugewiesen",
    noRoleText: "Ihr Benutzer existiert, hat aber noch keine IKA-Berechtigungen.",
    generalAccess: "Allgemeiner Zugang",
    roleFallback: "Rolle",
    memberPendingTitle: "Kenshi-Datensatz ausstehend",
    memberPendingText: "Ihr Benutzer ist noch nicht mit einem Mitgliedseintrag verknÃ¼pft.",
    memberProfileTitle: "Kenshi-Datensatz",
    name: "Name",
    status: "Status",
    currentGrade: "Aktueller Grad",
    country: "Land",
    dojo: "Dojo",
    joinedIka: "Trainingsdauer",
    consent: "Einwilligung",
    consentAccepted: "BestÃ¤tigt",
    pending: "Ausstehend",
    gradeHistoryTitle: "IKA-Kurshistorie",
    noGrades: "Es sind noch keine IKA-Kurse registriert.",
    achievementsTitle: "Wettbewerbserfolge",
    noAchievements: "Es sind noch keine Erfolge registriert.",
    medalsSummary: "IKA-Medaillenspiegel",
    podiumLabel: "Podium",
    resultLabel: "Ergebnis",
    categoryLabel: "Kategorie",
    placeLabel: "Ort",
    courseIdLabel: "Kurs-ID",
    seniority: "Trainingsdauer",
    birthDate: "Geburtsdatum",
    group: "Gruppe",
    child: "Kind",
    adult: "Erwachsener",
    editableData: "Bearbeitbare Daten",
    photo: "Profilfoto",
    changePhoto: "Foto Ã¤ndern",
    selectImage: "WÃ¤hlen Sie ein Bild aus.",
    phone: "Telefon",
    newPassword: "Neues Passwort",
    saveFicha: "IKA-Datensatz speichern",
    fichaUpdated: "IKA-Datensatz aktualisiert.",
    fichaCredentialsUpdated: "IKA-Datensatz und Zugangsdaten aktualisiert.",
    emailPasswordRequired: "Geben Sie E-Mail und Passwort ein.",
    emailCredentialsRequired: "Geben Sie Ihre E-Mail zur Passwortwiederherstellung ein.",
    kenshiEmailRequired: "Geben Sie die Kenshi-E-Mail ein.",
    passwordMinLength: "Das Passwort muss mindestens 6 Zeichen enthalten.",
    passwordUpdated: "Passwort aktualisiert.",
    recoveryEyebrow: "IKA-Datensatz",
    recoveryTitle: "Neues Passwort erstellen",
    recoveryText: "Geben Sie E-Mail und neues Passwort ein, um den Portalzugang zu aktivieren.",
    kenshiEmailPlaceholder: "Kenshi-E-Mail",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    savePassword: "Passwort speichern",
    emailLabel: "E-Mail",
    uploadPhotoError: "Das Foto konnte nicht hochgeladen werden.",
    readImageError: "Das ausgewÃ¤hlte Bild konnte nicht gelesen werden.",
    saveFichaError: "Der IKA-Datensatz konnte nicht gespeichert werden.",
    saveRegistrationError: "Die Anmeldung konnte nicht aktualisiert werden.",
    myEventsTitle: "Meine Event-Anmeldungen",
    noEventsRegistered: "Du hast noch keine aktiven Event-Anmeldungen.",
    registeredOnLabel: "Angemeldet am",
    eventStatusRegistered: "Angemeldet",
    eventStatusCancelled: "Storniert",
    cancelRegistration: "Anmeldung stornieren",
    reopenRegistration: "Anmeldung reaktivieren",
    registrationUpdated: "Anmeldung aktualisiert.",
    registrationCancelled: "Anmeldung storniert.",
    registrationRestored: "Anmeldung reaktiviert.",
    registrationClosedNote: "Die Online-Anmeldung fuer dieses Event ist bereits geschlossen.",
    tshirtQuestion: "Ich brauche ein T-Shirt",
    tshirtSize: "Groesse",
    selectSize: "Groesse waehlen",
    yes: "Ja",
    no: "Nein",
    openEventPage: "Eventseite oeffnen",
    untitledEvent: "Unbenannte Veranstaltung",
  },
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAuthRedirectParams() {
  if (typeof window === "undefined") {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const accessToken =
    hashParams.get("access_token") ?? searchParams.get("access_token") ?? "";
  const refreshToken =
    hashParams.get("refresh_token") ?? searchParams.get("refresh_token") ?? "";
  const type = hashParams.get("type") ?? searchParams.get("type") ?? "";
  const code = hashParams.get("code") ?? searchParams.get("code") ?? "";

  return { accessToken, refreshToken, type, code };
}

export function PortalClient({
  locale = defaultLocale,
}: {
  locale?: Locale;
}) {
  const copy = { ...portalCopies[defaultLocale]!, ...(portalCopies[locale] ?? {}) } as PortalCopy;
  const supabase = useMemo(() => createPortalClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.location.hash.includes("type=recovery") ||
        window.location.search.includes("type=recovery") ||
        window.location.hash.includes("code=") ||
        window.location.search.includes("code=")),
  );
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [portal, setPortal] = useState<PortalPayload | null>(() => readCachedPortalPayload());
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [message, setMessage] = useState("");
  const sessionRef = useRef<Session | null>(session);
  const portalRef = useRef<PortalPayload | null>(portal);
  const portalLoadInFlightRef = useRef(false);
  const portalDashboardInFlightRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    portalRef.current = portal;
  }, [portal]);

  const restoreCachedPortal = useCallback((nextSession: Session | null | undefined) => {
    if (typeof window === "undefined" || !nextSession?.user) {
      return false;
    }

    const raw = window.sessionStorage.getItem(portalCacheKey);
    if (!raw) {
      return false;
    }

    try {
      const cached = JSON.parse(raw) as CachedPortalPayload;
      const sameUser =
        cached.sessionUserId === (nextSession.user.id ?? "") &&
        cached.sessionEmail === normalizeEmail(nextSession.user.email);

      if (!sameUser || !cached.payload) {
        return false;
      }

      setPortal(cached.payload);
      return true;
    } catch {
      window.sessionStorage.removeItem(portalCacheKey);
      return false;
    }
  }, []);

  const saveCachedPortal = useCallback((nextSession: Session | null | undefined, payload: PortalPayload) => {
    if (typeof window === "undefined" || !nextSession?.user) {
      return;
    }

    const cachePayload: CachedPortalPayload = {
      sessionEmail: normalizeEmail(nextSession.user.email),
      sessionUserId: nextSession.user.id ?? "",
      payload,
      savedAt: Date.now(),
    };

    window.sessionStorage.setItem(portalCacheKey, JSON.stringify(cachePayload));
  }, []);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = sessionRef.current?.access_token;
    const bridgeHeaders = getAdminSessionBridgeHeaders();

    return {
      ...bridgeHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadPortalDashboard = useCallback(async () => {
    if (portalDashboardInFlightRef.current) {
      return;
    }

    portalDashboardInFlightRef.current = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("/api/portal/me", {
        cache: "no-store",
        headers: await getAuthHeaders(),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      const nextPortal = data as PortalPayload;
      setPortal((current) => {
        const mergedPortal = current
          ? {
              ...current,
              ...nextPortal,
              dashboard: nextPortal.dashboard ?? current.dashboard ?? null,
            }
          : nextPortal;

        const { user } = sessionRef.current ?? {};
        if (user) {
          void saveCachedPortal(sessionRef.current, mergedPortal);
        }

        return mergedPortal;
      });
    } catch {
      // Keep the portal visible; dashboard can retry on next navigation.
    } finally {
      window.clearTimeout(timeoutId);
      portalDashboardInFlightRef.current = false;
    }
  }, [getAuthHeaders, saveCachedPortal]);

  const loadAdminScope = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch("/api/admin/scope", {
        cache: "no-store",
        headers: await getAuthHeaders(),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return null;
      }

      return data?.scope ?? null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [getAuthHeaders]);

  const redirectToAdminIfNeeded = useCallback(
    async (nextSession?: Session | null) => {
      const sessionToCheck = nextSession ?? sessionRef.current;
      const normalizedEmail = normalizeEmail(sessionToCheck?.user.email ?? "");

      if (!sessionToCheck) {
        return false;
      }

      if (normalizedEmail === officialSuperAdminEmail) {
        window.location.replace(`/${locale}/admin`);
        return true;
      }

      const adminScope = await loadAdminScope();
      if (adminScope?.roleKeys?.length) {
        window.location.replace(`/${locale}/admin`);
        return true;
      }

      return false;
    },
    [loadAdminScope, locale],
  );

  const loadPortal = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    const keepExistingPortal = silent || Boolean(portalRef.current);

    if (portalLoadInFlightRef.current) {
      return;
    }

    portalLoadInFlightRef.current = true;

    if (!silent && !portalRef.current) {
      setLoading(true);
    }
    setMessage("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/portal/me?view=portal", {
        cache: "no-store",
        headers: await getAuthHeaders(),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error ?? copy.loadError);
        if (!keepExistingPortal) {
          setPortal(null);
        }
      } else {
        const nextPortal = data as PortalPayload;
        const mergedPortal =
          portalRef.current?.dashboard && !nextPortal.dashboard
            ? { ...nextPortal, dashboard: portalRef.current.dashboard }
            : nextPortal;
        setPortal(mergedPortal);
        saveCachedPortal(sessionRef.current, mergedPortal);
      }
    } catch {
      setMessage(copy.loadError);
      if (!keepExistingPortal) {
        setPortal(null);
      }
    } finally {
      portalLoadInFlightRef.current = false;
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [copy.loadError, getAuthHeaders, saveCachedPortal]);

  useEffect(() => {
    let active = true;

    async function initializePortalSession() {
      const redirectParams = getAuthRedirectParams();
      const hasRecoveryHint =
        redirectParams?.type === "recovery" || Boolean(redirectParams?.code);

      try {
        if (redirectParams?.code && hasRecoveryHint) {
          const exchangedSession = await withTimeout(
            supabase.auth.exchangeCodeForSession(redirectParams.code),
            15000,
            copy.loadError,
          );

          if (!active) {
            return;
          }

          if (exchangedSession.error) {
            setRecoveryMode(true);
            setMessage(
              exchangedSession.error.message.includes("code verifier")
                ? copy.oldPkceLink
                : exchangedSession.error.message,
            );
            setLoading(false);
            return;
          }

          setSession(exchangedSession.data.session);
          setRecoveryEmail(exchangedSession.data.session?.user.email ?? "");
          setRecoveryMode(true);
          setPortal(null);

          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }

          setLoading(false);
          return;
        }

        if (redirectParams?.accessToken && redirectParams.refreshToken) {
          const nextSession = await withTimeout(
            supabase.auth.setSession({
              access_token: redirectParams.accessToken,
              refresh_token: redirectParams.refreshToken,
            }),
            15000,
            copy.loadError,
          );

          if (!active) {
            return;
          }

          if (nextSession.error) {
            setMessage(nextSession.error.message);
            setLoading(false);
            return;
          }

          setSession(nextSession.data.session);
          if (
            !hasRecoveryHint &&
            (await redirectToAdminIfNeeded(nextSession.data.session))
          ) {
            return;
          }

          const restoredPortal = restoreCachedPortal(nextSession.data.session);

          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }

          if (hasRecoveryHint) {
            setRecoveryEmail(nextSession.data.session?.user.email ?? "");
            setRecoveryMode(true);
            setPortal(null);
            setLoading(false);
            return;
          }

          if (restoredPortal) {
            setLoading(false);
            return;
          }

          await loadPortal({ silent: true });
          return;
        }

        const { data } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          copy.loadError,
        );

        if (!active) {
          return;
        }

        setSession(data.session);
        if (data.session) {
          saveAdminSessionBridge(data.session);
          if (!hasRecoveryHint && (await redirectToAdminIfNeeded(data.session))) {
            return;
          }

          const restoredPortal = restoreCachedPortal(data.session);
          if (data.session && !hasRecoveryHint && restoredPortal) {
            setLoading(false);
            return;
          }
        }
        if (data.session && hasRecoveryHint) {
          setRecoveryEmail(data.session.user.email ?? "");
          setRecoveryMode(true);
          setPortal(null);
          setLoading(false);
          return;
        }
        if (data.session && !hasRecoveryHint) {
          await loadPortal({ silent: true });
          return;
        }
        setLoading(false);
      } catch {
        if (!active) {
          return;
        }
        setLoading(false);
        setMessage(copy.loadError);
      } finally {
        if (active) {
          setBootstrapping(false);
        }
      }
    }

    void initializePortalSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      const currentUserId = sessionRef.current?.user?.id ?? "";
      const nextUserId = nextSession?.user?.id ?? "";
      const sameUserSession =
        Boolean(nextUserId) && nextUserId === currentUserId;

      setSession(nextSession);
      if (nextSession) {
        saveAdminSessionBridge(nextSession);
        restoreCachedPortal(nextSession);
      }
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryEmail(nextSession?.user.email ?? "");
        setRecoveryMode(true);
        setPortal(null);
        setMessage("");
        setLoading(false);
        return;
      }

      if (nextSession) {
        if (recoveryMode || event === "TOKEN_REFRESHED") {
          return;
        }

        void redirectToAdminIfNeeded(nextSession).then((redirected) => {
          if (redirected) {
            return;
          }

          if (sameUserSession && portalRef.current) {
            return;
          }

          void loadPortal({ silent: true });
        });
      } else {
        setPortal(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [copy.oldPkceLink, loadPortal, recoveryMode, redirectToAdminIfNeeded, supabase]);

  async function signIn() {
    if (!email || !password) {
      setMessage(copy.emailPasswordRequired);
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    }

    setLoading(false);
  }

  async function requestCredentials() {
    if (!email) {
      setMessage(copy.emailCredentialsRequired);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/portal/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_recovery",
          email,
          locale,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setMessage(payload.error ?? copy.loadError);
      } else {
        setMessage(copy.magicLinkSent);
      }
    } catch {
      setMessage(copy.loadError);
    }

    setLoading(false);
  }

  async function signOut() {
    setSession(null);
    setPortal(null);
    setRecoveryMode(false);
    await signOutAndRedirect(supabase, locale);
  }

  async function saveRecoveryPassword() {
    const expectedEmail = normalizeEmail(recoveryEmail);
    const currentEmail = normalizeEmail(session?.user.email);

    if (!expectedEmail) {
      setMessage(copy.kenshiEmailRequired);
      return;
    }

    if (!recoveryPassword || recoveryPassword.length < 6) {
      setMessage(copy.passwordMinLength);
      return;
    }

    setLoading(true);
    setMessage("");

    const currentSession = await supabase.auth.getSession();
    const recoverySessionEmail = normalizeEmail(
      currentSession.data.session?.user.email,
    );

    if (!currentSession.data.session) {
      setMessage(copy.invalidRecoverySession);
      setLoading(false);
      return;
    }

    if (recoverySessionEmail !== expectedEmail) {
      setMessage(
        copy.recoveryLinkMismatch(
          recoverySessionEmail || currentEmail || session?.user.email || "-",
          expectedEmail,
        ),
      );
      setLoading(false);
      return;
    }

    const result = await supabase.auth.updateUser({
      password: recoveryPassword,
    });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    setRecoveryEmail("");
    setRecoveryPassword("");
    setRecoveryMode(false);
    setMessage(copy.passwordUpdated);
    await loadPortal();
  }

  function updatePortalMember(nextMember: PortalMember) {
    setPortal((current) =>
      current ? { ...current, member: nextMember } : current,
    );
  }

  const displayName =
    portal?.profile?.display_name ||
    (portal?.member
      ? `${portal.member.first_name} ${portal.member.last_name}`.trim()
      : "") ||
    session?.user.email ||
    "";

  if (recoveryMode) {
    return (
      <section className="mt-8 grid gap-6 border border-[var(--line)] bg-white p-4 sm:mt-10 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.recoveryEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold">{copy.recoveryTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {copy.recoveryText}
          </p>
        </div>

        <div className="grid gap-3">
          <input
            value={recoveryEmail}
            onChange={(event) => setRecoveryEmail(event.target.value)}
            placeholder={copy.kenshiEmailPlaceholder}
            type="email"
            className="border border-[var(--line)] px-3 py-3"
          />
          <div className="grid grid-cols-[1fr_auto] border border-[var(--line)]">
            <input
              value={recoveryPassword}
              onChange={(event) => setRecoveryPassword(event.target.value)}
              placeholder={copy.newPassword}
              type={showRecoveryPassword ? "text" : "password"}
              className="min-w-0 px-3 py-3 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowRecoveryPassword((current) => !current)}
              className="inline-flex w-12 items-center justify-center border-l border-[var(--line)]"
              aria-label={
                showRecoveryPassword ? copy.hidePassword : copy.showPassword
              }
              title={showRecoveryPassword ? copy.hidePassword : copy.showPassword}
            >
              {showRecoveryPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            onClick={() => void saveRecoveryPassword()}
            disabled={loading || !recoveryEmail || !recoveryPassword}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-50 sm:px-5"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {copy.savePassword}
          </button>
          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">
              {message}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mt-8 grid gap-6 border border-[var(--line)] bg-white p-4 sm:mt-10 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.secureAccess}
          </p>
          <h2 className="mt-3 text-3xl font-semibold">{copy.enterPortal}</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {copy.loginHelp}
          </p>
        </div>

        <div className="grid gap-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.emailLabel}
            type="email"
            className="border border-[var(--line)] px-3 py-3"
          />
          <div className="grid grid-cols-[1fr_auto] border border-[var(--line)]">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.passwordPlaceholder}
              type={showPassword ? "text" : "password"}
              className="min-w-0 px-3 py-3 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="inline-flex w-12 items-center justify-center border-l border-[var(--line)]"
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
              title={showPassword ? copy.hidePassword : copy.showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            onClick={signIn}
            disabled={loading || !email || !password}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-50 sm:px-5"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {copy.enter}
          </button>
          <button
            type="button"
            onClick={() => void requestCredentials()}
            disabled={loading || !email}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-50 sm:px-5"
          >
            {copy.requestAccess}
          </button>
          <p className="text-sm leading-6 text-[var(--muted)]">
            {copy.newAccessHelp}
          </p>
          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">
              {message}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-white p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.privatePortal}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{displayName}</h2>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold"
        >
          <LogOut size={16} />
          {copy.signOut}
        </button>
      </div>

      {bootstrapping ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
          {copy.loadingPortal}
        </div>
      ) : null}

      {loading && !portal ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
          {copy.loadingPortal}
        </div>
      ) : null}

      {message ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm font-semibold text-[var(--accent)]">
          {message}
        </div>
      ) : null}

      {portal ? (
        <div className="grid gap-5">
          {portal.dashboard ? (
            <AdminDashboard
              dashboard={portal.dashboard}
              locale={locale}
              session={session}
            />
          ) : hasAdminPortalRole(portal.roles) ? (
            <div className="grid gap-5">
              <div className="border border-[var(--line)] bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {copy.privatePortal}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  {copy.generalAccess}
                </h3>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {copy.generalAccess}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`/${locale}/admin`}
                    onClick={() => {
                      if (session) {
                        saveAdminSessionBridge(session);
                      }
                    }}
                    className="inline-flex min-h-11 items-center gap-2 bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <ExternalLink size={16} />
                    {copy.generalAccess}
                  </a>
                  <button
                    type="button"
                    onClick={() => void loadPortalDashboard()}
                    className="inline-flex min-h-11 items-center gap-2 border border-[var(--line)] px-4 py-3 text-sm font-semibold"
                  >
                    <Loader2 size={16} />
                    {copy.loadingPortal}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <MemberPanel
                key={portal.member?.id ?? "pending-member"}
                member={portal.member}
                grades={portal.gradeHistory}
                achievements={portal.achievements ?? []}
                eventRegistrations={portal.eventRegistrations ?? []}
                locale={locale}
                copy={copy}
                supabase={supabase}
                getAuthHeaders={getAuthHeaders}
                onMemberUpdated={updatePortalMember}
                onReloadPortal={loadPortal}
              />
            </>
          )}
        </div>
      ) : session && !bootstrapping ? (
        <div className="border border-[var(--line)] bg-white p-5">
          <p className="text-sm text-[var(--muted)]">{copy.loadError}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadPortal()}
              className="inline-flex min-h-11 items-center gap-2 bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              <Loader2 size={16} />
              {copy.loadingPortal}
            </button>
            <a
              href={`/${locale}/admin`}
              onClick={() => {
                if (session) {
                  saveAdminSessionBridge(session);
                }
              }}
              className="inline-flex min-h-11 items-center gap-2 border border-[var(--line)] px-4 py-3 text-sm font-semibold"
            >
              <ExternalLink size={16} />
              {copy.generalAccess}
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AdminDashboard({
  dashboard,
  locale,
  session,
}: {
  dashboard: PortalDashboard | null;
  locale: Locale;
  session: Session | null;
}) {
  if (!dashboard) {
    return null;
  }

  if (dashboard.error) {
    return (
      <section className="border border-[var(--line)] bg-white p-5 text-sm font-semibold text-[var(--accent)]">
        {dashboard.error}
      </section>
    );
  }

  const copy = { ...adminDashboardCopies.en!, ...(adminDashboardCopies[locale] ?? {}) } as AdminDashboardCopy;
  const isSuperAdmin = dashboard.scope.roleKeys.includes("super_admin");

  const managementBody = (
    <section className="border border-[var(--line)] bg-white p-5">
      {!isSuperAdmin ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold">{copy.managementTitle}</h3>
          <a
            href={`/${locale}/admin`}
            onClick={() => {
              if (session) {
                saveAdminSessionBridge(session);
              }
            }}
            className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
          >
            <ExternalLink size={15} />
            {copy.editInfo}
          </a>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {dashboard.membersByCountry.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{copy.noCountries}</p>
        ) : (
          dashboard.membersByCountry.map((country) => {
            const countryDojos = dashboard.membersByDojo.filter(
              (dojo) => dojo.countryId === country.countryId,
            );

            return (
              <details
                key={country.countryId}
                className="border border-[var(--line)] bg-[var(--paper)] p-3"
              >
                <summary className="cursor-pointer">
                  <span className="inline-flex flex-wrap items-center gap-3 text-lg font-semibold">
                    {country.logoUrl ? (
                      <img
                        src={country.logoUrl}
                        alt=""
                        className="size-12 border border-[var(--line)] bg-white object-contain p-1"
                      />
                    ) : null}
                    <span>
                      {country.countryName} · {country.dojoCount} {copy.metrics.dojos} ·{" "}
                      {country.activeMembers} {copy.activeKenshi} · {copy.adults}{" "}
                      {country.activeAdults} / {copy.children} {country.activeChildren}
                    </span>
                  </span>
                </summary>
                <div className="mt-3 grid gap-3">
                  {countryDojos.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">{copy.noDojos}</p>
                  ) : (
                    countryDojos.map((dojo) => {
                      const dojoMembers = dashboard.members.filter(
                        (member) => member.dojo_id === dojo.dojoId,
                      );

                      return (
                        <details
                          key={dojo.dojoId}
                          className="border border-[var(--line)] bg-white p-3"
                        >
                          <summary className="cursor-pointer">
                            <span className="inline-flex flex-wrap items-center gap-3 font-semibold">
                              {dojo.logoUrl ? (
                                <img
                                  src={dojo.logoUrl}
                                  alt=""
                                  className="size-10 border border-[var(--line)] bg-white object-contain p-1"
                                />
                              ) : null}
                              <span>
                                {dojo.dojoName} · {dojo.activeMembers} {copy.activeKenshi} /{" "}
                                {dojo.totalMembers} {copy.total} · {copy.adults}{" "}
                                {dojo.activeAdults} / {copy.children} {dojo.activeChildren}
                              </span>
                            </span>
                          </summary>
                          <div className="mt-3 border border-[var(--line)] bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold">
                              <span>{copy.dojoKenshi}</span>
                              <span className="text-[var(--muted)]">
                                {dojoMembers.length} {copy.records}
                              </span>
                            </div>
                            <div className="overflow-auto" style={{ maxHeight: "28rem" }}>
                              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 bg-white">
                                  <tr className="border-b border-[var(--line)]">
                                    <th className="py-2 pl-3 pr-4">{copy.ikaId}</th>
                                    <th className="py-2 pr-4">{copy.name}</th>
                                    <th className="py-2 pr-4">{copy.group}</th>
                                    <th className="py-2 pr-4">{copy.email}</th>
                                    <th className="py-2 pr-4">{copy.grade}</th>
                                    <th className="py-2 pr-4">{copy.status}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dojoMembers.length === 0 ? (
                                    <tr>
                                      <td className="py-3 pl-3 text-[var(--muted)]" colSpan={6}>
                                        {copy.noKenshi}
                                      </td>
                                    </tr>
                                  ) : (
                                    dojoMembers.map((member) => (
                                      <tr
                                        key={member.id}
                                        className="border-b border-[var(--line)]"
                                      >
                                        <td className="py-2 pl-3 pr-4">
                                          {member.ika_number ?? "-"}
                                        </td>
                                        <td className="py-2 pr-4">
                                          {member.first_name} {member.last_name}
                                        </td>
                                        <td className="py-2 pr-4">
                                          {member.member_group === "child"
                                            ? copy.childSingular
                                            : member.member_group === "adult"
                                              ? copy.adultSingular
                                              : "-"}
                                        </td>
                                        <td className="py-2 pr-4">{member.email ?? "-"}</td>
                                        <td className="py-2 pr-4">
                                          {member.current_grade ?? "-"}
                                        </td>
                                        <td className="py-2 pr-4">{member.status}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>
                      );
                    })
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>
    </section>
  );

  return (
    <section className="grid gap-5">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.dashboardEyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{copy.editInfo}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {copy.dashboardIntro}
            </p>
          </div>
          <a
            href={`/${locale}/admin`}
            onClick={() => {
              if (session) {
                saveAdminSessionBridge(session);
              }
            }}
            className="inline-flex min-h-12 items-center gap-2 bg-[var(--accent)] px-5 py-3 font-semibold text-white"
          >
            <ExternalLink size={17} />
            {copy.editInfo}
          </a>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={copy.metrics.countries} value={dashboard.totals.countries} />
        <MetricCard
          label={copy.metrics.activeDojos ?? copy.metrics.dojos}
          value={dashboard.totals.activeDojos ?? dashboard.totals.dojos}
        />
        <MetricCard
          label={copy.metrics.coursesRegistered ?? copy.metrics.activeMembers}
          value={dashboard.totals.coursesRegistered ?? dashboard.totals.activeMembers}
        />
        <MetricCard label={copy.metrics.totalMembers} value={dashboard.totals.members} />
        <MetricCard label={copy.metrics.activeAdults} value={dashboard.totals.activeAdults} />
        <MetricCard label={copy.metrics.activeChildren} value={dashboard.totals.activeChildren} />
      </div>

      {isSuperAdmin ? (
        <details className="border border-[var(--line)] bg-white p-5">
          <summary className="cursor-pointer text-2xl font-semibold">
            {copy.managementTitle}
          </summary>
          <div className="mt-4">{managementBody}</div>
        </details>
      ) : (
        managementBody
      )}

      {isSuperAdmin ? (
        <details className="border border-[var(--line)] bg-white p-5">
          <summary className="cursor-pointer text-2xl font-semibold">
            {copy.coursesTitle ?? "All created IKA courses"}
          </summary>
          <div className="mt-4 grid gap-3">
            {(dashboard.createdCourses ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                {copy.noCourses ?? "There are no created IKA courses yet."}
              </p>
            ) : (
              (dashboard.createdCourses ?? []).map((course) => (
                <article
                  key={course.courseKey}
                  className="border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {course.type || "course"}
                      </p>
                      <h4 className="mt-1 text-lg font-semibold">{course.title}</h4>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {[course.date, course.place, course.instructor].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {copy.records}
                      </p>
                      <p className="text-2xl font-semibold">{course.memberCount}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="border border-[var(--line)] bg-white p-5">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function MemberPanel({
  member,
  grades,
  achievements,
  eventRegistrations,
  locale,
  copy,
  supabase,
  getAuthHeaders,
  onMemberUpdated,
  onReloadPortal,
}: {
  member: PortalMember | null;
  grades: GradeHistory[];
  achievements: AchievementHistory[];
  eventRegistrations: EventRegistrationHistory[];
  locale: Locale;
  copy: PortalCopy;
  supabase: ReturnType<typeof createPortalClient>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onMemberUpdated: (member: PortalMember) => void;
  onReloadPortal: () => Promise<void>;
}) {
  const [contactEmail, setContactEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(
    member?.profile_image_url ?? "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [registrationSavingId, setRegistrationSavingId] = useState("");
  const [panelMessage, setPanelMessage] = useState("");

  if (!member) {
    return (
      <DashboardCard
        icon={<UserRound size={22} />}
        title={copy.memberPendingTitle}
        text={copy.memberPendingText}
      />
    );
  }

  const currentMember = member;
  const displayedProfileImageUrl =
    profileImageUrl || currentMember.profile_image_url || "";
  const myEventsTitle =
    copy.myEventsTitle ??
    (locale === "es" ? "Mis inscripciones a eventos" : "My event registrations");
  const noEventsRegistered =
    copy.noEventsRegistered ??
    (locale === "es"
      ? "Todavia no tienes inscripciones activas a eventos."
      : "You do not have any active event registrations yet.");
  const registeredOnLabel =
    copy.registeredOnLabel ??
    (locale === "es" ? "Inscrito el" : "Registered on");
  const eventStatusRegistered =
    copy.eventStatusRegistered ??
    (locale === "es" ? "Inscrito" : "Registered");
  const eventStatusCancelled =
    copy.eventStatusCancelled ??
    (locale === "es" ? "Cancelado" : "Cancelled");
  const registrationClosedNote =
    copy.registrationClosedNote ??
    (locale === "es"
      ? "La inscripcion online ya esta cerrada para este evento."
      : "Online registration is already closed for this event.");
  const tshirtQuestion =
    copy.tshirtQuestion ??
    (locale === "es" ? "Necesito camiseta" : "I need a T-shirt");
  const tshirtSizeLabel =
    copy.tshirtSize ?? (locale === "es" ? "Talla" : "Size");
  const selectSizeLabel =
    copy.selectSize ?? (locale === "es" ? "Selecciona talla" : "Select size");
  const yesLabel = copy.yes ?? (locale === "es" ? "Si" : "Yes");
  const noLabel = copy.no ?? (locale === "es" ? "No" : "No");
  const cancelRegistrationLabel =
    copy.cancelRegistration ??
    (locale === "es" ? "Cancelar inscripcion" : "Cancel registration");
  const reopenRegistrationLabel =
    copy.reopenRegistration ??
    (locale === "es" ? "Reactivar inscripcion" : "Reopen registration");
  const openEventPageLabel =
    copy.openEventPage ??
    (locale === "es" ? "Abrir pagina del evento" : "Open event page");
  const eventSectionHelp =
    (
      {
        en: "Here you can review and manage your event registrations. Completed courses appear in the IKA course history block.",
        es: "Aqui puedes revisar y modificar tus inscripciones a eventos. El historial de cursos completados aparece en el bloque de cursos IKA.",
        it: "Qui puoi rivedere e gestire le tue iscrizioni agli eventi. I corsi completati compaiono nel blocco della cronologia corsi IKA.",
        fr: "Vous pouvez ici consulter et gerer vos inscriptions aux evenements. Les cours completes apparaissent dans le bloc de l'historique des cours IKA.",
        ja: "ここでイベントへの参加登録を確認・管理できます。受講済みのコースは IKA 講習履歴ブロックに表示されます。",
        zh: "您可以在这里查看和管理您的活动报名。已完成的课程会显示在 IKA 课程历史区块中。",
        cs: "Zde muzete zkontrolovat a spravovat sve registrace na udalosti. Dokoncene kurzy se zobrazuji v bloku historie kurzu IKA.",
        id: "Di sini Anda dapat meninjau dan mengelola pendaftaran acara Anda. Kursus yang telah selesai akan muncul di blok riwayat kursus IKA.",
        ms: "Di sini anda boleh menyemak dan mengurus pendaftaran acara anda. Kursus yang telah selesai akan dipaparkan dalam blok sejarah kursus IKA.",
        eu: "Hemen zure ekitaldietako izen-emateak berrikusi eta kudeatu ditzakezu. Osatutako ikastaroak IKA ikastaroen historian agertuko dira.",
        pt: "Aqui podes rever e gerir as tuas inscricoes em eventos. Os cursos concluidos aparecem no bloco do historico de cursos IKA.",
        de: "Hier kannst du deine Event-Anmeldungen einsehen und verwalten. Abgeschlossene Kurse erscheinen im Block der IKA-Kurshistorie.",
      } as Partial<Record<Locale, string>>
    )[locale] ??
    "Here you can review and manage your event registrations. Completed courses appear in the IKA course history block.";

  async function uploadProfileImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setPanelMessage(copy.selectImage);
      return;
    }

    setUploading(true);
    setPanelMessage("");

    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 960,
        maxHeight: 960,
        quality: 0.76,
        maxBytes: 280 * 1024,
        outputType: "image/webp",
        fileNameBase: `${currentMember.ika_number || currentMember.id}-profile`,
      });
      const imageDataUrl = await fileToDataUrl(optimizedFile);
      const response = await fetch("/api/portal/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          email: contactEmail,
          phone,
          profileImageUpload: {
            name: optimizedFile.name,
            type: optimizedFile.type,
            dataUrl: imageDataUrl,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPanelMessage(data.error ?? copy.uploadPhotoError ?? "Upload error.");
        return;
      }

      onMemberUpdated(data.member as PortalMember);
      setProfileImageUrl((data.member as PortalMember).profile_image_url ?? "");
      setPanelMessage(copy.fichaUpdated);
    } catch {
      setPanelMessage(copy.readImageError ?? "Image read error.");
    } finally {
      setUploading(false);
    }
  }

  async function saveFicha() {
    setSaving(true);
    setPanelMessage("");

    const response = await fetch("/api/portal/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        email: contactEmail,
        phone,
        profileImageUrl: displayedProfileImageUrl,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setPanelMessage(data.error ?? copy.saveFichaError ?? "Save error.");
      setSaving(false);
      return;
    }

    if (contactEmail && contactEmail !== currentMember.email) {
      const emailUpdate = await supabase.auth.updateUser(
        { email: contactEmail },
        {
          emailRedirectTo:
            typeof window === "undefined"
              ? undefined
              : `${window.location.origin}/${locale}/portal`,
        },
      );

      if (emailUpdate.error) {
        setPanelMessage(emailUpdate.error.message);
        setSaving(false);
        return;
      }
    }

    if (newPassword) {
      const passwordUpdate = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordUpdate.error) {
        setPanelMessage(passwordUpdate.error.message);
        setSaving(false);
        return;
      }
    }

    onMemberUpdated(data.member as PortalMember);
    setNewPassword("");
    setPanelMessage(newPassword ? copy.fichaCredentialsUpdated : copy.fichaUpdated);
    setSaving(false);
  }

  async function updateEventRegistration(
    registration: EventRegistrationHistory,
    action: "register" | "cancel",
    options?: {
      wantsTshirt?: boolean;
      tshirtSize?: string;
      doneMessage?: string;
    },
  ) {
    if (!registration.events?.id) {
      return;
    }

    setRegistrationSavingId(registration.id);
    setPanelMessage("");

    const response = await fetch("/api/events/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        eventId: registration.events.id,
        action,
        wantsTshirt: options?.wantsTshirt ?? Boolean(registration.wants_tshirt),
        tshirtSize: options?.tshirtSize ?? registration.tshirt_size ?? "",
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setPanelMessage(data.error ?? copy.saveRegistrationError ?? "Registration error.");
      setRegistrationSavingId("");
      return;
    }

    await onReloadPortal();
    setPanelMessage(
      options?.doneMessage ??
        (action === "cancel"
          ? copy.registrationCancelled ?? copy.fichaUpdated
          : copy.registrationUpdated ?? copy.fichaUpdated),
    );
    setRegistrationSavingId("");
  }

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden border border-[var(--line)] bg-white">
        <div className="grid gap-5 bg-[var(--ink)] p-4 text-white sm:p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Image
            src="/images/ika-logo.webp"
            alt="IKA"
            width={72}
            height={72}
            className="bg-white object-contain p-2"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              Ficha IKA
            </p>
            <h3 className="mt-2 text-3xl font-semibold">
              {member.first_name} {member.last_name}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              {member.ika_number || getPortalMemberFallback(locale, "ika")} ·{" "}
              {member.current_grade || getPortalMemberFallback(locale, "grade")} · {member.status}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
              {copy.photo}
            </p>
            <div className="flex size-32 items-center justify-center overflow-hidden border border-white/30 bg-white/10">
              {displayedProfileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayedProfileImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-3 text-center text-white/70">
                  <UserRound size={42} />
                  <span className="text-xs">{copy.selectImage}</span>
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {copy.changePhoto}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadProfileImage(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1.05fr_0.95fr]">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label={copy.ikaPassport} value={member.ika_number} copy={copy} />
            <InfoRow
              label={copy.name}
              value={`${member.first_name} ${member.last_name}`}
              copy={copy}
            />
            <InfoRow label={copy.status} value={member.status} copy={copy} />
            <InfoRow
              label={copy.currentGrade}
              value={member.current_grade}
              copy={copy}
            />
            <InfoRow
              label={copy.country}
              value={labelCountry(member.countries, locale)}
              copy={copy}
            />
            <InfoRow
              label={copy.dojo}
              value={labelDojo(member.dojos, locale)}
              copy={copy}
            />
            <InfoRow
              label={copy.joinedIka}
              value={formatSeniority(member.joined_date, locale)}
              copy={copy}
            />
            <InfoRow
              label={copy.birthDate}
              value={formatDate(member.birth_date, locale)}
              copy={copy}
            />
            <InfoRow
              label={copy.group}
              value={
                member.member_group === "child"
                  ? copy.child
                  : member.member_group === "adult"
                    ? copy.adult
                    : ""
              }
              copy={copy}
            />
            <InfoRow
              label={copy.consent}
              value={member.consent_accepted ? copy.consentAccepted : copy.pending}
              copy={copy}
            />
          </dl>

          <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
            <h4 className="text-xl font-semibold">{copy.editableData}</h4>
            <label className="grid gap-1 text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <Mail size={15} /> {copy.emailLabel}
              </span>
              <input
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="border border-[var(--line)] bg-white px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <Phone size={15} /> {copy.phone}
              </span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="border border-[var(--line)] bg-white px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <KeyRound size={15} /> {copy.newPassword}
              </span>
              <div className="grid grid-cols-[1fr_auto] border border-[var(--line)] bg-white">
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type={showNewPassword ? "text" : "password"}
                  className="min-w-0 px-3 py-2 font-normal outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  className="inline-flex w-11 items-center justify-center border-l border-[var(--line)]"
                  aria-label={
                    showNewPassword ? copy.hidePassword : copy.showPassword
                  }
                  title={showNewPassword ? copy.hidePassword : copy.showPassword}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <button
              type="button"
              onClick={() => void saveFicha()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {copy.saveFicha}
            </button>
            {panelMessage ? (
              <p className="text-sm font-semibold text-[var(--accent)]">
                {panelMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <FileBadge size={22} className="text-[var(--accent)]" />
          <h3 className="text-2xl font-semibold">{copy.gradeHistoryTitle}</h3>
        </div>
        <div className="mt-5 grid gap-3">
          {grades.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.noGrades}</p>
          ) : (
            grades.map((grade) => (
              <article
                key={grade.id}
                className="border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-semibold">{grade.grade}</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {grade.course_reference_id ? (
                      <span className="border border-[var(--line)] bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                        {copy.courseIdLabel +
                          ": " +
                          grade.course_reference_id}
                      </span>
                    ) : null}
                    <span className="border border-[var(--line)] bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                      {labelCourseType(grade.course_type, locale)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatDate(grade.exam_date, locale)}
                  {grade.exam_place ? ` · ${grade.exam_place}` : ""}
                  {grade.examiner ? ` · ${grade.examiner}` : ""}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <CalendarCheck2 size={22} className="text-[var(--accent)]" />
          <h3 className="text-2xl font-semibold">
            {myEventsTitle}
          </h3>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{eventSectionHelp}</p>
        <div className="mt-5 grid gap-4">
          {eventRegistrations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {noEventsRegistered}
            </p>
          ) : (
            eventRegistrations.map((registration) => {
              const eventTranslation =
                registration.events?.event_translations?.find((item) => item.language_code === locale) ??
                registration.events?.event_translations?.[0];
              const eventTitle = eventTranslation?.title ?? copy.untitledEvent ?? "Untitled event";
              const eventSlug = eventTranslation?.slug ?? "";
              const eventUrl = eventSlug ? `/${locale}/events/${eventSlug}` : "";
              const registrationOpen = Boolean(registration.events?.registration_open);
              const tshirtEnabled = Boolean(registration.events?.tshirt_enabled);

              return (
                <article
                  key={registration.id}
                  className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4 lg:grid-cols-[1.2fr_0.9fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold">{eventTitle}</h4>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {formatDate(registration.events?.starts_at ?? registration.created_at, locale)}
                          {eventTranslation?.location_label ? ` - ${eventTranslation.location_label}` : ""}
                        </p>
                      </div>
                      <span className="border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                        {registration.status === "registered"
                          ? eventStatusRegistered
                          : eventStatusCancelled}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      {registeredOnLabel +
                        `: ${formatDate(registration.created_at, locale)}`}
                    </p>
                    {!registrationOpen ? (
                      <p className="mt-3 text-sm font-semibold text-[var(--accent)]">
                        {registrationClosedNote}
                      </p>
                    ) : null}
                    {eventUrl ? (
                      <a
                        href={eventUrl}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
                      >
                        <ExternalLink size={15} />
                        {openEventPageLabel}
                      </a>
                    ) : null}
                  </div>

                  <div className="grid gap-3 border border-[var(--line)] bg-white p-4">
                    {tshirtEnabled ? (
                      <>
                        <label className="grid gap-2 text-sm font-semibold">
                          {tshirtQuestion}
                          <select
                            value={registration.wants_tshirt ? "yes" : "no"}
                            onChange={(event) =>
                              void updateEventRegistration(registration, "register", {
                                wantsTshirt: event.target.value === "yes",
                                tshirtSize: event.target.value === "yes" ? registration.tshirt_size ?? "" : "",
                                doneMessage: copy.registrationUpdated ?? copy.fichaUpdated,
                              })
                            }
                            disabled={registrationSavingId === registration.id || !registrationOpen}
                            className="border border-[var(--line)] bg-white px-3 py-2 font-normal"
                          >
                            <option value="no">{noLabel}</option>
                            <option value="yes">{yesLabel}</option>
                          </select>
                        </label>
                        {registration.wants_tshirt ? (
                          <label className="grid gap-2 text-sm font-semibold">
                            {tshirtSizeLabel}
                            <select
                              value={registration.tshirt_size ?? ""}
                              onChange={(event) =>
                                void updateEventRegistration(registration, "register", {
                                  wantsTshirt: true,
                                  tshirtSize: event.target.value,
                                  doneMessage: copy.registrationUpdated,
                                })
                              }
                              disabled={registrationSavingId === registration.id || !registrationOpen}
                              className="border border-[var(--line)] bg-white px-3 py-2 font-normal"
                            >
                              <option value="">{selectSizeLabel}</option>
                              {TSHIRT_SIZES.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      {registration.status === "registered" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void updateEventRegistration(registration, "cancel", {
                              doneMessage: copy.registrationCancelled ?? copy.fichaUpdated,
                            })
                          }
                          disabled={registrationSavingId === registration.id}
                          className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                          {registrationSavingId === registration.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <CalendarCheck2 size={15} />
                          )}
                          {cancelRegistrationLabel}
                        </button>
                      ) : registrationOpen ? (
                        <button
                          type="button"
                          onClick={() =>
                            void updateEventRegistration(registration, "register", {
                              wantsTshirt: Boolean(registration.wants_tshirt),
                              tshirtSize: registration.tshirt_size ?? "",
                              doneMessage:
                                copy.registrationRestored ?? copy.fichaUpdated,
                            })
                          }
                          disabled={registrationSavingId === registration.id}
                          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {registrationSavingId === registration.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <CalendarCheck2 size={15} />
                          )}
                          {reopenRegistrationLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <Trophy size={22} className="text-[var(--accent)]" />
          <h3 className="text-2xl font-semibold">
            {copy.achievementsTitle}
          </h3>
        </div>
        <div className="mt-5 grid gap-3">
          {achievements.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {copy.noAchievements}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {achievementSummaryItems(achievements, copy).map((item) => (
                  <article
                    key={item.key}
                    className="border border-[var(--line)] bg-[var(--paper)] p-4"
                  >
                    <div className={`inline-flex size-10 items-center justify-center ${item.iconClass}`}>
                      <item.icon size={18} />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{item.count}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-4">
                {achievements.map((achievement) => {
                  const medalMeta = getAchievementMedalMeta(achievement.medal_type, copy);

                  return (
                    <article
                      key={achievement.id}
                      className="border border-[var(--line)] bg-[var(--paper)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold">{achievement.title}</h4>
                            {medalMeta ? (
                              <span className={`inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${medalMeta.badgeClass}`}>
                                <medalMeta.icon size={14} />
                                {medalMeta.label}
                              </span>
                            ) : null}
                            {achievement.podium_position ? (
                              <span className="inline-flex items-center gap-2 border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                                <Award size={14} className="text-[var(--accent)]" />
                                {copy.podiumLabel + " " + achievement.podium_position}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {formatDate(achievement.achieved_on, locale)}
                            {achievement.achieved_place ? ` - ${achievement.achieved_place}` : ""}
                          </p>
                        </div>
                        {medalMeta ? (
                          <div className={`flex size-14 items-center justify-center border text-white ${medalMeta.panelClass}`}>
                            <medalMeta.icon size={24} />
                          </div>
                        ) : null}
                      </div>

                      {(achievement.modality || achievement.category || achievement.result || achievement.award) ? (
                        <dl className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
                          {achievement.modality ? (
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                {locale === "es" ? "Modalidad" : "Modality"}
                              </dt>
                              <dd className="mt-1 font-medium">{achievement.modality}</dd>
                            </div>
                          ) : null}
                          {achievement.category ? (
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                {copy.categoryLabel}
                              </dt>
                              <dd className="mt-1 font-medium">{achievement.category}</dd>
                            </div>
                          ) : null}
                          {achievement.result ? (
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                {copy.resultLabel}
                              </dt>
                              <dd className="mt-1 font-medium">{achievement.result}</dd>
                            </div>
                          ) : null}
                          {achievement.award ? (
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                {locale === "es" ? "Premio" : "Award"}
                              </dt>
                              <dd className="mt-1 font-medium">{achievement.award}</dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : null}

                      {achievement.notes ? (
                        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                          {achievement.notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="border border-[var(--line)] bg-white p-5">
      <div className="mb-5 flex size-11 items-center justify-center bg-[var(--accent)] text-white">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </article>
  );
}

function InfoRow({
  label,
  value,
  copy,
}: {
  label: string;
  value?: string | null;
  copy: PortalCopy;
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--line)] pb-2">
      <dt className="font-semibold">{label}</dt>
      <dd className="text-[var(--muted)]">{value || copy.pending}</dd>
    </div>
  );
}

function labelCountry(country: ScopeCountry | null, locale: Locale) {
  return (
    country?.country_translations?.find((item) => item.language_code === locale)
      ?.name ??
    country?.country_translations?.[0]?.name ??
    country?.code ??
    ""
  );
}

function labelDojo(dojo: ScopeDojo | null, locale: Locale) {
  return (
    dojo?.dojo_translations?.find((item) => item.language_code === locale)
      ?.name ??
    dojo?.dojo_translations?.[0]?.name ??
    dojo?.city ??
    ""
  );
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function labelCourseType(value: string | null | undefined, locale: Locale) {
  const normalized = (value ?? "course").toLowerCase();
  const labels: Record<string, Partial<Record<Locale, string>>> = {
    course: { en: "Course", es: "Curso" },
    seminar: { en: "Seminar", es: "Seminario" },
    taikai: { en: "Taikai", es: "Taikai" },
    encounter: { en: "Encounter", es: "Encuentro" },
    busen: { en: "Busen", es: "Busen" },
  };

  return labels[normalized]?.[locale] ?? labels[normalized]?.en ?? "Course";
}

function getAchievementMedalMeta(
  medalType: AchievementHistory["medal_type"],
  copy: PortalCopy,
) {
  if (!medalType) {
    return null;
  }

  const normalizedMedalType = medalType as NonNullable<AchievementHistory["medal_type"]>;

  const label = copy.medalLabels?.[normalizedMedalType] ?? normalizedMedalType;
  const medalMap = {
    gold: {
      label,
      icon: Medal,
      badgeClass: "border-amber-300 bg-amber-100 text-amber-800",
      panelClass: "border-amber-300 bg-amber-500",
    },
    silver: {
      label,
      icon: Medal,
      badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
      panelClass: "border-slate-300 bg-slate-500",
    },
    bronze: {
      label,
      icon: Medal,
      badgeClass: "border-orange-300 bg-orange-100 text-orange-800",
      panelClass: "border-orange-300 bg-orange-500",
    },
    finalist: {
      label,
      icon: Award,
      badgeClass: "border-blue-300 bg-blue-100 text-blue-800",
      panelClass: "border-blue-300 bg-blue-600",
    },
    participant: {
      label,
      icon: ShieldCheck,
      badgeClass: "border-emerald-300 bg-emerald-100 text-emerald-800",
      panelClass: "border-emerald-300 bg-emerald-600",
    },
  } satisfies Record<
    NonNullable<AchievementHistory["medal_type"]>,
    {
      label: string;
      icon: typeof Medal;
      badgeClass: string;
      panelClass: string;
    }
  >;

  return medalMap[normalizedMedalType];
}

function achievementSummaryItems(
  achievements: AchievementHistory[],
  copy: PortalCopy,
) {
  const countByMedal = achievements.reduce<Record<string, number>>((acc, achievement) => {
    if (achievement.medal_type) {
      acc[achievement.medal_type] = (acc[achievement.medal_type] ?? 0) + 1;
    }
    return acc;
  }, {});

  return [
    {
      key: "gold",
      label: copy.medalLabels?.gold ?? "Gold",
      count: countByMedal.gold ?? 0,
      icon: Medal,
      iconClass: "border border-amber-300 bg-amber-100 text-amber-700",
    },
    {
      key: "silver",
      label: copy.medalLabels?.silver ?? "Silver",
      count: countByMedal.silver ?? 0,
      icon: Medal,
      iconClass: "border border-slate-300 bg-slate-100 text-slate-700",
    },
    {
      key: "bronze",
      label: copy.medalLabels?.bronze ?? "Bronze",
      count: countByMedal.bronze ?? 0,
      icon: Medal,
      iconClass: "border border-orange-300 bg-orange-100 text-orange-700",
    },
    {
      key: "finalist",
      label: copy.medalLabels?.finalist ?? "Finalist",
      count: countByMedal.finalist ?? 0,
      icon: Award,
      iconClass: "border border-blue-300 bg-blue-100 text-blue-700",
    },
    {
      key: "participant",
      label: copy.medalLabels?.participant ?? "Participant",
      count: countByMedal.participant ?? 0,
      icon: Star,
      iconClass: "border border-emerald-300 bg-emerald-100 text-emerald-700",
    },
  ];
}

function formatSeniority(value: string | null, locale: Locale) {
  if (!value) {
    return "";
  }

  const start = new Date(`${value}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(start.getTime()) || start > today) {
    return formatDate(value, locale);
  }

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const unitLabels: Partial<
    Record<
      Locale,
      {
        year: string;
        years: string;
        month: string;
        months: string;
        day: string;
        days: string;
      }
    >
  > = {
    en: {
      year: "year",
      years: "years",
      month: "month",
      months: "months",
      day: "day",
      days: "days",
    },
    es: {
      year: "ano",
      years: "anos",
      month: "mes",
      months: "meses",
      day: "dia",
      days: "dias",
    },
    it: {
      year: "anno",
      years: "anni",
      month: "mese",
      months: "mesi",
      day: "giorno",
      days: "giorni",
    },
    fr: {
      year: "an",
      years: "ans",
      month: "mois",
      months: "mois",
      day: "jour",
      days: "jours",
    },
    ja: {
      year: "\u5e74",
      years: "\u5e74",
      month: "\u304b\u6708",
      months: "\u304b\u6708",
      day: "\u65e5",
      days: "\u65e5",
    },
    zh: {
      year: "\u5e74",
      years: "\u5e74",
      month: "\u4e2a\u6708",
      months: "\u4e2a\u6708",
      day: "\u5929",
      days: "\u5929",
    },
    cs: {
      year: "rok",
      years: "let",
      month: "mesic",
      months: "mesicu",
      day: "den",
      days: "dni",
    },
  };
  const labels = unitLabels[locale] ?? unitLabels.en!;
  const parts = [
    [years, years === 1 ? labels.year : labels.years],
    [months, months === 1 ? labels.month : labels.months],
    [days, days === 1 ? labels.day : labels.days],
  ]
    .filter(([amount]) => Number(amount) > 0)
    .map(([amount, label]) => `${amount} ${label}`);

  return parts.length > 0 ? parts.join(" · ") : `0 ${labels.days}`;
}

function getPortalMemberFallback(locale: Locale, type: "ika" | "grade") {
  const fallback = {
    en: { ika: "No IKA number", grade: "No grade" },
    es: { ika: "Sin numero IKA", grade: "Sin grado" },
    it: { ika: "Nessun numero IKA", grade: "Nessun grado" },
    fr: { ika: "Aucun numero IKA", grade: "Aucun grade" },
    ja: { ika: "IKA\u756a\u53f7\u306a\u3057", grade: "\u7d1a\u6bb5\u306a\u3057" },
    zh: { ika: "\u65e0 IKA \u7f16\u53f7", grade: "\u65e0\u7b49\u7ea7" },
    cs: { ika: "Bez IKA cisla", grade: "Bez stupne" },
    id: { ika: "Tanpa nombor IKA", grade: "Tiada gred" },
    ms: { ika: "Tiada nombor IKA", grade: "Tiada gred" },
    eu: { ika: "IKA zenbakirik ez", grade: "Gradurik ez" },
    pt: { ika: "Sem numero IKA", grade: "Sem grau" },
    de: { ika: "Keine IKA-Nummer", grade: "Kein Grad" },
  } satisfies Record<Locale, Record<"ika" | "grade", string>>;

  return fallback[locale]?.[type] ?? fallback.en[type];
}

const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "XS", "2XS", "3XS"] as const;


