"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  FileBadge,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  Upload,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { createPortalClient } from "@/lib/supabase/portal-browser";
import { saveAdminSessionBridge } from "@/lib/supabase/admin-session-bridge";
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
    members: number;
    activeMembers: number;
    activeAdults: number;
    activeChildren: number;
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
};

type PortalCopy = {
  secureAccess: string;
  enterPortal: string;
  loginHelp: string;
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
};

type AdminDashboardCopy = {
  metrics: {
    countries: string;
    dojos: string;
    activeMembers: string;
    totalMembers: string;
    activeAdults: string;
    activeChildren: string;
  };
  managementTitle: string;
  editInfo: string;
  noCountries: string;
  activeKenshi: string;
  adults: string;
  children: string;
  noDojos: string;
  dojoKenshi: string;
  noKenshi: string;
  total: string;
  records: string;
  name: string;
  group: string;
  grade: string;
  status: string;
  childSingular: string;
  adultSingular: string;
};

const adminDashboardCopies: Record<Locale, AdminDashboardCopy> = {
  en: {
    metrics: {
      countries: "Countries",
      dojos: "Dojos",
      activeMembers: "Active Kenshi",
      totalMembers: "Total Kenshi",
      activeAdults: "Active adults",
      activeChildren: "Active children",
    },
    managementTitle: "Management by country and dojo",
    editInfo: "Edit information",
    noCountries: "There are no countries in this scope.",
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
    metrics: {
      countries: "Paises",
      dojos: "Dojos",
      activeMembers: "Kenshi activos",
      totalMembers: "Kenshi total",
      activeAdults: "Adultos activos",
      activeChildren: "Ninos activos",
    },
    managementTitle: "Gestion por pais y dojo",
    editInfo: "Editar informacion",
    noCountries: "No hay paises en este alcance.",
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
    metrics: {
      countries: "Paesi",
      dojos: "Dojo",
      activeMembers: "Kenshi attivi",
      totalMembers: "Kenshi totali",
      activeAdults: "Adulti attivi",
      activeChildren: "Bambini attivi",
    },
    managementTitle: "Gestione per paese e dojo",
    editInfo: "Modifica informazioni",
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
    metrics: {
      countries: "Pays",
      dojos: "Dojos",
      activeMembers: "Kenshi actifs",
      totalMembers: "Total Kenshi",
      activeAdults: "Adultes actifs",
      activeChildren: "Enfants actifs",
    },
    managementTitle: "Gestion par pays et dojo",
    editInfo: "Modifier les informations",
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
    metrics: {
      countries: "国",
      dojos: "道場",
      activeMembers: "在籍拳士",
      totalMembers: "拳士合計",
      activeAdults: "在籍大人",
      activeChildren: "在籍子ども",
    },
    managementTitle: "国・道場別管理",
    editInfo: "情報を編集",
    noCountries: "この範囲に国はありません。",
    activeKenshi: "在籍拳士",
    adults: "大人",
    children: "子ども",
    noDojos: "この国に道場はありません。",
    dojoKenshi: "道場の拳士",
    noKenshi: "この道場に拳士はいません。",
    total: "合計",
    records: "件",
    name: "氏名",
    group: "区分",
    grade: "級段",
    status: "状態",
    childSingular: "子ども",
    adultSingular: "大人",
  },
  zh: {
    metrics: {
      countries: "国家",
      dojos: "道场",
      activeMembers: "在籍拳士",
      totalMembers: "拳士总数",
      activeAdults: "在籍成人",
      activeChildren: "在籍儿童",
    },
    managementTitle: "按国家和道场管理",
    editInfo: "编辑信息",
    noCountries: "此范围内没有国家。",
    activeKenshi: "在籍拳士",
    adults: "成人",
    children: "儿童",
    noDojos: "此国家没有道场。",
    dojoKenshi: "道场拳士",
    noKenshi: "此道场没有拳士。",
    total: "总计",
    records: "条记录",
    name: "姓名",
    group: "组别",
    grade: "级别",
    status: "状态",
    childSingular: "儿童",
    adultSingular: "成人",
  },
  cs: {
    metrics: {
      countries: "Zeme",
      dojos: "Dojo",
      activeMembers: "Aktivni Kenshi",
      totalMembers: "Kenshi celkem",
      activeAdults: "Aktivni dospeli",
      activeChildren: "Aktivni deti",
    },
    managementTitle: "Sprava podle zeme a dojo",
    editInfo: "Upravit informace",
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

const portalCopies: Record<Locale, PortalCopy> = {
  en: {
    secureAccess: "Secure access",
    enterPortal: "Enter the portal",
    loginHelp:
      "Use the email and password linked to your IKA record. For first access or password recovery, request new credentials.",
    passwordPlaceholder: "Password",
    enter: "Enter",
    magicLinkSent: "Check your email to create or recover your portal password.",
    requestAccess: "Create or recover credentials",
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
    emailCredentialsRequired: "Enter your email to receive credentials.",
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
  },
  es: {
    secureAccess: "Acceso seguro",
    enterPortal: "Entrar al portal",
    loginHelp:
      "Usa el email y la contrasena asociados a tu ficha IKA. Para primer acceso o recuperar contrasena, solicita nuevas credenciales.",
    passwordPlaceholder: "Contrasena",
    enter: "Entrar",
    magicLinkSent: "Revisa tu email para crear o recuperar tu contrasena del portal.",
    requestAccess: "Crear o recuperar credenciales",
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
    emailCredentialsRequired: "Introduce tu email para recibir credenciales.",
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
  },
  it: {
    secureAccess: "Accesso sicuro",
    enterPortal: "Entra nel portale",
    loginHelp:
      "Usa l'email collegata alla tua scheda IKA. Se non hai una password, lascia il campo vuoto e riceverai un link magico.",
    passwordPlaceholder: "Password opzionale",
    enter: "Entra",
    magicLinkSent: "Controlla la tua email per entrare nel portale.",
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
    emailCredentialsRequired: "Inserisci la tua email per ricevere le credenziali.",
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
  },
  fr: {
    secureAccess: "Acces securise",
    enterPortal: "Entrer dans le portail",
    loginHelp:
      "Utilisez l'email associe a votre fiche IKA. Si vous n'avez pas de mot de passe, laissez le champ vide et vous recevrez un lien magique.",
    passwordPlaceholder: "Mot de passe optionnel",
    enter: "Entrer",
    magicLinkSent: "Consultez votre email pour entrer dans le portail.",
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
    emailCredentialsRequired: "Saisissez votre email pour recevoir vos identifiants.",
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
  },
  ja: {
    secureAccess: "安全なアクセス",
    enterPortal: "ポータルに入る",
    loginHelp:
      "IKAの登録情報に紐づいたメールアドレスを使用してください。パスワードがない場合は空欄のままにすると、マジックリンクが届きます。",
    passwordPlaceholder: "任意のパスワード",
    enter: "入る",
    magicLinkSent: "ポータルに入るためのメールを確認してください。",
    loadError: "ポータルを読み込めませんでした。",
    privatePortal: "プライベートポータル",
    signOut: "ログアウト",
    loadingPortal: "ポータルを読み込み中...",
    noRoleTitle: "ロール未割り当て",
    noRoleText: "ユーザーは存在しますが、まだIKA権限がありません。",
    generalAccess: "一般アクセス",
    roleFallback: "ロール",
    memberPendingTitle: "拳士記録は未連携",
    memberPendingText: "このユーザーはまだ会員記録に連携されていません。",
    memberProfileTitle: "拳士記録",
    ikaPassport: "IKA Passport",
    name: "氏名",
    status: "状態",
    currentGrade: "現在の級段",
    country: "国",
    dojo: "道場",
    joinedIka: "修行歴",
    consent: "同意",
    consentAccepted: "同意済み",
    pending: "未完了",
    gradeHistoryTitle: "IKA講習履歴",
    noGrades: "登録されたIKA講習はまだありません。",
    dojoAdminTitle: "道場管理",
    dojoAdminText:
      "会員、道場情報、基本的な確認を管理します。高度な操作はプライベートモジュールで完了します。",
    countryAdminTitle: "国別管理",
    countryAdminText:
      "国内の道場、会員、イベント、レポートを管理します。範囲は割り当てられた国に限定されます。",
    globalAdminTitle: "グローバル管理",
    globalAdminText:
      "CMS、国、道場、イベント、ユーザー、設定へのグローバルアクセス。",
    activeScopeTitle: "有効な範囲",
    seniority: "修行歴",
    birthDate: "生年月日",
    group: "区分",
    child: "子ども",
    adult: "大人",
    editableData: "編集可能な情報",
    photo: "プロフィール写真",
    changePhoto: "写真を変更",
    selectImage: "画像を選択してください。",
    phone: "電話",
    newPassword: "新しいパスワード",
    saveFicha: "IKA記録を保存",
    fichaUpdated: "IKA記録を更新しました。",
    fichaCredentialsUpdated: "IKA記録と認証情報を更新しました。",
    oldPkceLink:
      "この古いリンクのPKCEコードは利用できません。新しい復旧メールをリクエストし、新しいリンクを開いてください。",
    emailPasswordRequired: "メールアドレスとパスワードを入力してください。",
    emailCredentialsRequired: "認証情報を受け取るメールアドレスを入力してください。",
    kenshiEmailRequired: "拳士のメールアドレスを入力してください。",
    passwordMinLength: "パスワードは6文字以上で入力してください。",
    invalidRecoverySession:
      "復旧リンクで有効なセッションを開けませんでした。新しいメールをリクエストし、プライベートウィンドウで開いてください。",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `このリンクは${activeEmail}用で、${expectedEmail}用ではありません。現在のアカウントからログアウトするか、メールをプライベートウィンドウで開いてください。`,
    passwordUpdated: "パスワードを更新しました。",
    recoveryEyebrow: "IKA記録",
    recoveryTitle: "新しいパスワードを作成",
    recoveryText:
      "ポータルアクセスを有効にするため、メールアドレスと新しいパスワードを入力してください。",
    kenshiEmailPlaceholder: "拳士のメール",
    showPassword: "パスワードを表示",
    hidePassword: "パスワードを隠す",
    savePassword: "パスワードを保存",
    roleLabels: {
      super_admin: "スーパー管理者",
      global_admin: "グローバル管理者",
      country_admin: "国別管理者",
      dojo_admin: "道場管理者",
      kenshi: "拳士",
    },
  },
  zh: {
    secureAccess: "安全访问",
    enterPortal: "进入门户",
    loginHelp:
      "请使用与你的 IKA 档案关联的邮箱。如果没有密码，请留空，你将收到一个登录链接。",
    passwordPlaceholder: "可选密码",
    enter: "进入",
    magicLinkSent: "请检查邮箱以进入门户。",
    loadError: "无法加载门户。",
    privatePortal: "私人门户",
    signOut: "退出",
    loadingPortal: "正在加载门户...",
    noRoleTitle: "尚未分配角色",
    noRoleText: "用户已存在，但还没有 IKA 权限。",
    generalAccess: "通用访问",
    roleFallback: "角色",
    memberPendingTitle: "拳士档案待关联",
    memberPendingText: "该用户尚未关联会员档案。",
    memberProfileTitle: "拳士档案",
    ikaPassport: "IKA Passport",
    name: "姓名",
    status: "状态",
    currentGrade: "当前等级",
    country: "国家",
    dojo: "道场",
    joinedIka: "练习年限",
    consent: "同意",
    consentAccepted: "已接受",
    pending: "待处理",
    gradeHistoryTitle: "IKA课程历史",
    noGrades: "尚未登记任何IKA课程。",
    dojoAdminTitle: "道场管理",
    dojoAdminText:
      "管理会员、道场资料和基础跟进。高级操作将在私人模块中完成。",
    countryAdminTitle: "国家管理",
    countryAdminText:
      "管理本国道场、会员、活动和报告。范围仅限于分配的国家。",
    globalAdminTitle: "全局管理",
    globalAdminText: "全局访问 CMS、国家、道场、活动、用户和配置。",
    activeScopeTitle: "当前权限范围",
    seniority: "练习年限",
    birthDate: "出生日期",
    group: "组别",
    child: "儿童",
    adult: "成人",
    editableData: "可编辑资料",
    photo: "头像",
    changePhoto: "更换照片",
    selectImage: "请选择图片。",
    phone: "电话",
    newPassword: "新密码",
    saveFicha: "保存IKA档案",
    fichaUpdated: "IKA档案已更新。",
    fichaCredentialsUpdated: "IKA档案和登录凭据已更新。",
    oldPkceLink:
      "此旧链接使用的PKCE代码已不可用。请重新请求恢复邮件并打开新的链接。",
    emailPasswordRequired: "请输入邮箱和密码。",
    emailCredentialsRequired: "请输入邮箱以接收登录凭据。",
    kenshiEmailRequired: "请输入拳士邮箱。",
    passwordMinLength: "密码至少需要6个字符。",
    invalidRecoverySession:
      "恢复链接未打开有效会话。请重新请求邮件，并在隐私窗口中打开。",
    recoveryLinkMismatch: (activeEmail, expectedEmail) =>
      `此链接适用于${activeEmail}，不适用于${expectedEmail}。请退出当前账号，或在隐私窗口中打开邮件。`,
    passwordUpdated: "密码已更新。",
    recoveryEyebrow: "IKA档案",
    recoveryTitle: "创建新密码",
    recoveryText: "请输入邮箱和新密码以启用门户访问。",
    kenshiEmailPlaceholder: "拳士邮箱",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    savePassword: "保存密码",
    roleLabels: {
      super_admin: "超级管理员",
      global_admin: "全局管理员",
      country_admin: "国家管理员",
      dojo_admin: "道场管理员",
      kenshi: "拳士",
    },
  },
  cs: {
    secureAccess: "Bezpecny pristup",
    enterPortal: "Vstoupit do portalu",
    loginHelp:
      "Pouzijte email propojeny s vasim zaznamem IKA. Pokud nemate heslo, nechte pole prazdne a obdrzite kouzelny odkaz.",
    passwordPlaceholder: "Volitelne heslo",
    enter: "Vstoupit",
    magicLinkSent: "Zkontrolujte email pro vstup do portalu.",
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
    emailCredentialsRequired: "Zadejte email pro prijeti prihlasovacich udaju.",
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
  const copy = portalCopies[locale] ?? portalCopies[defaultLocale];
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
  const [portal, setPortal] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [supabase]);

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/portal/me", {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.loadError);
      setPortal(null);
    } else {
      setPortal(data as PortalPayload);
    }

    setLoading(false);
  }, [copy.loadError, getAuthHeaders]);

  useEffect(() => {
    let active = true;

    async function initializePortalSession() {
      const redirectParams = getAuthRedirectParams();
      const hasRecoveryHint =
        redirectParams?.type === "recovery" || Boolean(redirectParams?.code);

      if (redirectParams?.code && hasRecoveryHint) {
        const exchangedSession = await supabase.auth.exchangeCodeForSession(
          redirectParams.code,
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
        const nextSession = await supabase.auth.setSession({
          access_token: redirectParams.accessToken,
          refresh_token: redirectParams.refreshToken,
        });

        if (!active) {
          return;
        }

        if (nextSession.error) {
          setMessage(nextSession.error.message);
          setLoading(false);
          return;
        }

        setSession(nextSession.data.session);

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

        await loadPortal();
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setSession(data.session);
      setLoading(false);
      if (data.session && hasRecoveryHint) {
        setRecoveryEmail(data.session.user.email ?? "");
        setRecoveryMode(true);
        setPortal(null);
        return;
      }
      if (data.session && !hasRecoveryHint) {
        void loadPortal();
      }
    }

    void initializePortalSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryEmail(nextSession?.user.email ?? "");
        setRecoveryMode(true);
        setPortal(null);
        setMessage("");
        setLoading(false);
        return;
      }

      if (nextSession) {
        if (!recoveryMode) {
          void loadPortal();
        }
      } else {
        setPortal(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [copy.oldPkceLink, loadPortal, recoveryMode, supabase]);

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

    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/${locale}/portal?type=recovery`,
    });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(copy.magicLinkSent);
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setPortal(null);
    setRecoveryMode(false);
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
      <section className="mt-10 grid gap-6 border border-[var(--line)] bg-white p-6 lg:grid-cols-[0.9fr_1.1fr]">
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
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:opacity-50"
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
      <section className="mt-10 grid gap-6 border border-[var(--line)] bg-white p-6 lg:grid-cols-[0.9fr_1.1fr]">
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
            placeholder="Email"
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
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {copy.enter}
          </button>
          <button
            type="button"
            onClick={() => void requestCredentials()}
            disabled={loading || !email}
            className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-5 py-3 font-semibold disabled:opacity-50"
          >
            {copy.requestAccess ?? "Create or recover credentials"}
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

      {loading ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
          {copy.loadingPortal}
        </div>
      ) : null}

      {message ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm font-semibold text-[var(--accent)]">
          {message}
        </div>
      ) : null}

      {portal && !loading ? (
        <div className="grid gap-5">
          {portal.dashboard ? (
            <AdminDashboard
              dashboard={portal.dashboard}
              locale={locale}
              session={session}
            />
          ) : (
            <>
              <MemberPanel
                key={portal.member?.id ?? "pending-member"}
                member={portal.member}
                grades={portal.gradeHistory}
                locale={locale}
                copy={copy}
                supabase={supabase}
                getAuthHeaders={getAuthHeaders}
                onMemberUpdated={updatePortalMember}
              />
            </>
          )}
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

  const copy = adminDashboardCopies[locale] ?? adminDashboardCopies.en;

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={copy.metrics.countries} value={dashboard.totals.countries} />
        <MetricCard label={copy.metrics.dojos} value={dashboard.totals.dojos} />
        <MetricCard label={copy.metrics.activeMembers} value={dashboard.totals.activeMembers} />
        <MetricCard label={copy.metrics.totalMembers} value={dashboard.totals.members} />
        <MetricCard label={copy.metrics.activeAdults} value={dashboard.totals.activeAdults} />
        <MetricCard label={copy.metrics.activeChildren} value={dashboard.totals.activeChildren} />
      </div>

      <section className="border border-[var(--line)] bg-white p-5">
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
                        {country.countryName} · {country.dojoCount}{" "}
                        {copy.metrics.dojos} · {country.activeMembers}{" "}
                        {copy.activeKenshi} · {copy.adults}{" "}
                        {country.activeAdults} / {copy.children}{" "}
                        {country.activeChildren}
                      </span>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-3">
                    {countryDojos.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        {copy.noDojos}
                      </p>
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
                                  {dojo.dojoName} · {dojo.activeMembers}{" "}
                                  {copy.activeKenshi} / {dojo.totalMembers}{" "}
                                  {copy.total} · {copy.adults} {dojo.activeAdults} /{" "}
                                  {copy.children} {dojo.activeChildren}
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
                              <div
                                className="overflow-auto"
                                style={{ maxHeight: "28rem" }}
                              >
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                  <thead className="sticky top-0 z-10 bg-white">
                                    <tr className="border-b border-[var(--line)]">
                                      <th className="py-2 pl-3 pr-4">IKA</th>
                                      <th className="py-2 pr-4">{copy.name}</th>
                                      <th className="py-2 pr-4">{copy.group}</th>
                                      <th className="py-2 pr-4">Email</th>
                                      <th className="py-2 pr-4">{copy.grade}</th>
                                      <th className="py-2 pr-4">{copy.status}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dojoMembers.length === 0 ? (
                                      <tr>
                                        <td
                                          className="py-3 pl-3 text-[var(--muted)]"
                                          colSpan={6}
                                        >
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
                                          <td className="py-2 pr-4">
                                            {member.email ?? "-"}
                                          </td>
                                          <td className="py-2 pr-4">
                                            {member.current_grade ?? "-"}
                                          </td>
                                          <td className="py-2 pr-4">
                                            {member.status}
                                          </td>
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
  locale,
  copy,
  supabase,
  getAuthHeaders,
  onMemberUpdated,
}: {
  member: PortalMember | null;
  grades: GradeHistory[];
  locale: Locale;
  copy: PortalCopy;
  supabase: ReturnType<typeof createPortalClient>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onMemberUpdated: (member: PortalMember) => void;
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

  async function uploadProfileImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setPanelMessage(copy.selectImage);
      return;
    }

    setUploading(true);
    setPanelMessage("");

    try {
      const imageDataUrl = await fileToDataUrl(file);
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
            name: file.name,
            type: file.type,
            dataUrl: imageDataUrl,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPanelMessage(data.error ?? "No se pudo subir la foto.");
        return;
      }

      onMemberUpdated(data.member as PortalMember);
      setProfileImageUrl((data.member as PortalMember).profile_image_url ?? "");
      setPanelMessage(copy.fichaUpdated);
    } catch {
      setPanelMessage("No se pudo leer la imagen seleccionada.");
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
      setPanelMessage(data.error ?? "No se pudo guardar la ficha IKA.");
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

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden border border-[var(--line)] bg-white">
        <div className="grid gap-6 bg-[var(--ink)] p-6 text-white md:grid-cols-[auto_1fr_auto] md:items-center">
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
              {member.ika_number || "Sin numero IKA"} ·{" "}
              {member.current_grade || "Sin grado"} · {member.status}
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

        <div className="grid gap-6 p-5 lg:grid-cols-[1.05fr_0.95fr]">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
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
                <Mail size={15} /> Email
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
                <h4 className="font-semibold">{grade.grade}</h4>
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

  const unitLabels: Record<
    Locale,
    {
      year: string;
      years: string;
      month: string;
      months: string;
      day: string;
      days: string;
    }
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
      year: "年",
      years: "年",
      month: "か月",
      months: "か月",
      day: "日",
      days: "日",
    },
    zh: {
      year: "年",
      years: "年",
      month: "个月",
      months: "个月",
      day: "天",
      days: "天",
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
  const labels = unitLabels[locale] ?? unitLabels.en;
  const parts = [
    [years, years === 1 ? labels.year : labels.years],
    [months, months === 1 ? labels.month : labels.months],
    [days, days === 1 ? labels.day : labels.days],
  ]
    .filter(([amount]) => Number(amount) > 0)
    .map(([amount, label]) => `${amount} ${label}`);

  return parts.length > 0 ? parts.join(" · ") : `0 ${labels.days}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
