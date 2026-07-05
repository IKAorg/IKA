"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  FileBadge,
  Globe2,
  Loader2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
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
  joined_date: string | null;
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
    totalMembers: number;
    activeMembers: number;
    activeAdults: number;
    activeChildren: number;
  }>;
  membersByCountry: Array<{
    countryId: string;
    countryName: string;
    totalMembers: number;
    activeMembers: number;
    activeAdults: number;
    activeChildren: number;
  }>;
  members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    current_grade: string | null;
    joined_date: string | null;
  }>;
};

type PortalCopy = {
  secureAccess: string;
  enterPortal: string;
  loginHelp: string;
  passwordPlaceholder: string;
  enter: string;
  magicLinkSent: string;
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
  roleLabels: Record<RoleKey, string>;
};

const portalCopies: Record<Locale, PortalCopy> = {
  en: {
    secureAccess: "Secure access",
    enterPortal: "Enter the portal",
    loginHelp:
      "Use the email linked to your IKA record. If you do not have a password, leave it empty and you will receive a magic link.",
    passwordPlaceholder: "Optional password",
    enter: "Enter",
    magicLinkSent: "Check your email to enter the portal.",
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
    joinedIka: "Joined IKA",
    consent: "Consent",
    consentAccepted: "Accepted",
    pending: "Pending",
    gradeHistoryTitle: "Grade history",
    noGrades: "No grades have been registered yet.",
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
      "Usa el email asociado a tu ficha IKA. Si no tienes contrasena, deja el campo vacio y recibiras un enlace magico.",
    passwordPlaceholder: "Contrasena opcional",
    enter: "Entrar",
    magicLinkSent: "Revisa tu email para entrar al portal.",
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
    joinedIka: "Entrada IKA",
    consent: "Consentimiento",
    consentAccepted: "Aceptado",
    pending: "Pendiente",
    gradeHistoryTitle: "Historial de grados",
    noGrades: "Todavia no hay grados registrados.",
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
    joinedIka: "Ingresso IKA",
    consent: "Consenso",
    consentAccepted: "Accettato",
    pending: "In sospeso",
    gradeHistoryTitle: "Storico gradi",
    noGrades: "Non ci sono ancora gradi registrati.",
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
    joinedIka: "Entree IKA",
    consent: "Consentement",
    consentAccepted: "Accepte",
    pending: "En attente",
    gradeHistoryTitle: "Historique des grades",
    noGrades: "Aucun grade n'a encore ete enregistre.",
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
    joinedIka: "IKA加入日",
    consent: "同意",
    consentAccepted: "同意済み",
    pending: "未完了",
    gradeHistoryTitle: "級段履歴",
    noGrades: "登録された級段はまだありません。",
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
    joinedIka: "加入 IKA",
    consent: "同意",
    consentAccepted: "已接受",
    pending: "待处理",
    gradeHistoryTitle: "等级历史",
    noGrades: "尚未登记任何等级。",
    dojoAdminTitle: "道场管理",
    dojoAdminText:
      "管理会员、道场资料和基础跟进。高级操作将在私人模块中完成。",
    countryAdminTitle: "国家管理",
    countryAdminText:
      "管理本国道场、会员、活动和报告。范围仅限于分配的国家。",
    globalAdminTitle: "全局管理",
    globalAdminText: "全局访问 CMS、国家、道场、活动、用户和配置。",
    activeScopeTitle: "当前权限范围",
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
    joinedIka: "Vstup do IKA",
    consent: "Souhlas",
    consentAccepted: "Prijato",
    pending: "Ceka",
    gradeHistoryTitle: "Historie stupnu",
    noGrades: "Zatim nejsou registrovany zadne stupne.",
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
    roleLabels: {
      super_admin: "Super admin",
      global_admin: "Global admin",
      country_admin: "Admin zeme",
      dojo_admin: "Admin dojo",
      kenshi: "Kenshi",
    },
  },
};

export function PortalClient({
  locale = defaultLocale,
}: {
  locale?: Locale;
}) {
  const copy = portalCopies[locale] ?? portalCopies[defaultLocale];
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        void loadPortal();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadPortal();
      } else {
        setPortal(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadPortal, supabase]);

  async function signIn() {
    setLoading(true);
    setMessage("");

    const result = password
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              typeof window === "undefined"
                ? undefined
                : `${window.location.origin}/${locale}/portal`,
          },
        });

    if (result.error) {
      setMessage(result.error.message);
    } else if (!password) {
      setMessage(copy.magicLinkSent);
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setPortal(null);
  }

  const displayName =
    portal?.profile?.display_name ||
    (portal?.member
      ? `${portal.member.first_name} ${portal.member.last_name}`.trim()
      : "") ||
    session?.user.email ||
    "";

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
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.passwordPlaceholder}
            type="password"
            className="border border-[var(--line)] px-3 py-3"
          />
          <button
            onClick={signIn}
            disabled={loading || !email}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {copy.enter}
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
          <RoleSummary roles={portal.roles} locale={locale} copy={copy} />
          <AdminDashboard dashboard={portal.dashboard} locale={locale} />
          <MemberPanel
            member={portal.member}
            grades={portal.gradeHistory}
            locale={locale}
            copy={copy}
          />
          <RoleDashboards roles={portal.roles} locale={locale} copy={copy} />
        </div>
      ) : null}
    </section>
  );
}

function AdminDashboard({
  dashboard,
  locale,
}: {
  dashboard: PortalDashboard | null;
  locale: Locale;
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

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Paises" value={dashboard.totals.countries} />
        <MetricCard label="Dojos" value={dashboard.totals.dojos} />
        <MetricCard label="Kenshi activos" value={dashboard.totals.activeMembers} />
        <MetricCard label="Kenshi total" value={dashboard.totals.members} />
        <MetricCard label="Adultos activos" value={dashboard.totals.activeAdults} />
        <MetricCard label="Ninos activos" value={dashboard.totals.activeChildren} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="border border-[var(--line)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold">Gestion IKA</h3>
            <a
              href={`/${locale}/admin`}
              className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
            >
              <ExternalLink size={15} />
              Abrir herramientas
            </a>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            {dashboard.membersByDojo.length === 0 ? (
              <p className="text-[var(--muted)]">No hay dojos en este alcance.</p>
            ) : (
              dashboard.membersByDojo.map((dojo) => (
                <div
                  key={dojo.dojoId}
                  className="grid gap-1 border border-[var(--line)] bg-[var(--paper)] p-3"
                >
                  <strong>{dojo.dojoName}</strong>
                  <span className="text-[var(--muted)]">
                    {dojo.activeMembers} activos / {dojo.totalMembers} total
                  </span>
                  <span className="text-[var(--muted)]">
                    Adultos {dojo.activeAdults} / Ninos {dojo.activeChildren}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-5">
          <h3 className="text-2xl font-semibold">Resumen por pais</h3>
          <div className="mt-4 grid gap-2 text-sm">
            {dashboard.membersByCountry.length === 0 ? (
              <p className="text-[var(--muted)]">No hay paises en este alcance.</p>
            ) : (
              dashboard.membersByCountry.map((country) => (
                <div
                  key={country.countryId}
                  className="grid gap-1 border border-[var(--line)] bg-[var(--paper)] p-3"
                >
                  <strong>{country.countryName}</strong>
                  <span className="text-[var(--muted)]">
                    {country.activeMembers} activos / {country.totalMembers} total
                  </span>
                  <span className="text-[var(--muted)]">
                    Adultos {country.activeAdults} / Ninos {country.activeChildren}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-5">
          <h3 className="text-2xl font-semibold">Kenshi visibles</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Telefono</th>
                  <th className="py-2 pr-4">Grado</th>
                  <th className="py-2 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.members.length === 0 ? (
                  <tr>
                    <td className="py-3 text-[var(--muted)]" colSpan={5}>
                      No hay Kenshi en este alcance.
                    </td>
                  </tr>
                ) : (
                  dashboard.members.map((member) => (
                    <tr key={member.id} className="border-b border-[var(--line)]">
                      <td className="py-2 pr-4">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="py-2 pr-4">{member.email ?? "-"}</td>
                      <td className="py-2 pr-4">{member.phone ?? "-"}</td>
                      <td className="py-2 pr-4">{member.current_grade ?? "-"}</td>
                      <td className="py-2 pr-4">{member.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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

function RoleSummary({
  roles,
  locale,
  copy,
}: {
  roles: PortalRole[];
  locale: Locale;
  copy: PortalCopy;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roles.length === 0 ? (
        <DashboardCard
          icon={<ShieldCheck size={22} />}
          title={copy.noRoleTitle}
          text={copy.noRoleText}
        />
      ) : (
        roles.map((assignment) => {
          const role = getRole(assignment.roles);
          const scope =
            labelCountry(assignment.countries, locale) ||
            labelDojo(assignment.dojos, locale) ||
            copy.generalAccess;

          return (
            <DashboardCard
              key={assignment.id}
              icon={getRoleIcon(role?.key)}
              title={role ? copy.roleLabels[role.key] : copy.roleFallback}
              text={scope}
            />
          );
        })
      )}
    </div>
  );
}

function MemberPanel({
  member,
  grades,
  locale,
  copy,
}: {
  member: PortalMember | null;
  grades: GradeHistory[];
  locale: Locale;
  copy: PortalCopy;
}) {
  if (!member) {
    return (
      <DashboardCard
        icon={<UserRound size={22} />}
        title={copy.memberPendingTitle}
        text={copy.memberPendingText}
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <UserRound size={22} className="text-[var(--accent)]" />
          <h3 className="text-2xl font-semibold">{copy.memberProfileTitle}</h3>
        </div>
        <dl className="mt-5 grid gap-3 text-sm">
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
            value={formatDate(member.joined_date, locale)}
            copy={copy}
          />
          <InfoRow
            label={copy.consent}
            value={member.consent_accepted ? copy.consentAccepted : copy.pending}
            copy={copy}
          />
        </dl>
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

function RoleDashboards({
  roles,
  locale,
  copy,
}: {
  roles: PortalRole[];
  locale: Locale;
  copy: PortalCopy;
}) {
  const keys = roles.map((assignment) => getRole(assignment.roles)?.key);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {keys.includes("dojo_admin") ? (
        <DashboardCard
          icon={<Building2 size={22} />}
          title={copy.dojoAdminTitle}
          text={copy.dojoAdminText}
        />
      ) : null}
      {keys.includes("country_admin") ? (
        <DashboardCard
          icon={<Globe2 size={22} />}
          title={copy.countryAdminTitle}
          text={copy.countryAdminText}
        />
      ) : null}
      {keys.includes("global_admin") || keys.includes("super_admin") ? (
        <DashboardCard
          icon={<ShieldCheck size={22} />}
          title={copy.globalAdminTitle}
          text={copy.globalAdminText}
        />
      ) : null}
      {roles.length > 0 ? (
        <DashboardCard
          icon={<BadgeCheck size={22} />}
          title={copy.activeScopeTitle}
          text={roles
            .map((assignment) => {
              const role = getRole(assignment.roles);
              return [
                role ? copy.roleLabels[role.key] : copy.roleFallback,
                labelCountry(assignment.countries, locale),
                labelDojo(assignment.dojos, locale),
              ]
                .filter(Boolean)
                .join(" · ");
            })
            .join(" / ")}
        />
      ) : null}
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

function getRole(role: PortalRole["roles"]) {
  return Array.isArray(role) ? role[0] : role;
}

function getRoleIcon(role?: RoleKey) {
  if (role === "country_admin") {
    return <Globe2 size={22} />;
  }

  if (role === "dojo_admin") {
    return <Building2 size={22} />;
  }

  if (role === "global_admin" || role === "super_admin") {
    return <ShieldCheck size={22} />;
  }

  return <UserRound size={22} />;
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
