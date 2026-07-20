"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LogIn, LogOut, Ticket, UserCheck } from "lucide-react";
import { createPortalClient } from "@/lib/supabase/portal-browser";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  registrationOpen: boolean;
  allowMemberRegistration: boolean;
  tshirtEnabled: boolean;
};

type RegistrationState = {
  authenticated?: boolean;
  active?: boolean;
  registered?: boolean;
  status?: string | null;
  wantsTshirt?: boolean;
  tshirtSize?: string | null;
};

export function EventRegistrationCard({
  locale,
  eventId,
  eventTitle,
  registrationOpen,
  allowMemberRegistration,
  tshirtEnabled,
}: Props) {
  const copy = registrationCopy[locale] ?? registrationCopy.en;
  const supabase = useMemo(() => createPortalClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<RegistrationState>({});
  const [wantsTshirt, setWantsTshirt] = useState(false);
  const [tshirtSize, setTshirtSize] = useState("");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    void refreshRegistration();
  }, [session, eventId]);

  async function refreshRegistration() {
    setLoading(true);

    const headers: Record<string, string> = {};
    const nextSession = await supabase.auth.getSession();
    const token = nextSession.data.session?.access_token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/events/register?eventId=${encodeURIComponent(eventId)}`, {
      cache: "no-store",
      headers,
    });
    const payload = (await response.json().catch(() => ({}))) as RegistrationState & {
      error?: string;
    };

    if (payload.error) {
      setMessage(payload.error);
    }

    setState(payload);
    setWantsTshirt(Boolean(payload.wantsTshirt));
    setTshirtSize(payload.tshirtSize ?? "");
    setLoading(false);
  }

  async function signInAndContinue() {
    if (!email || !password) {
      setMessage(copy.loginRequired);
      return;
    }

    if (tshirtEnabled && wantsTshirt && !tshirtSize) {
      setMessage(copy.sizeRequired);
      return;
    }

    setSubmitting(true);
    setMessage("");

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setSubmitting(false);
      return;
    }

    setSession(result.data.session);
    setSubmitting(false);
    await register("register");
  }

  async function register(action: "register" | "cancel") {
    if (action === "register" && tshirtEnabled && wantsTshirt && !tshirtSize) {
      setMessage(copy.sizeRequired);
      return;
    }

    setSubmitting(true);
    setMessage("");

    const nextSession = await supabase.auth.getSession();
    const token = nextSession.data.session?.access_token;
    const response = await fetch("/api/events/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventId,
        action,
        wantsTshirt,
        tshirtSize: wantsTshirt ? tshirtSize : "",
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      status?: string;
    };

    if (!response.ok || payload.error) {
      setMessage(payload.error ?? copy.genericError);
      setSubmitting(false);
      return;
    }

    setMessage(action === "register" ? copy.registered : copy.cancelled);
    await refreshRegistration();
    setSubmitting(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setState({});
    setMessage("");
  }

  const closed = !allowMemberRegistration || !registrationOpen;

  return (
    <aside className="border border-[var(--line)] bg-white p-5">
      <div className="flex items-center gap-3">
        <Ticket size={20} className="text-[var(--accent)]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.eyebrow}
          </p>
          <h3 className="mt-1 text-2xl font-semibold">{copy.title}</h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        {copy.intro.replace("{event}", eventTitle)}
      </p>

      {closed ? (
        <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
          {copy.closed}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" />
          {copy.loading}
        </p>
      ) : null}

      {!loading && session && tshirtEnabled ? (
        <div className="mt-5 grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
          <label className="grid gap-2 text-sm font-semibold">
            {copy.tshirtQuestion}
            <select
              value={wantsTshirt ? "yes" : "no"}
              onChange={(event) => {
                const next = event.target.value === "yes";
                setWantsTshirt(next);
                if (!next) {
                  setTshirtSize("");
                }
              }}
              className="border border-[var(--line)] bg-white px-3 py-3 font-normal"
            >
              <option value="no">{copy.no}</option>
              <option value="yes">{copy.yes}</option>
            </select>
          </label>

          {wantsTshirt ? (
            <label className="grid gap-2 text-sm font-semibold">
              {copy.tshirtSize}
              <select
                value={tshirtSize}
                onChange={(event) => setTshirtSize(event.target.value)}
                className="border border-[var(--line)] bg-white px-3 py-3 font-normal"
              >
                <option value="">{copy.selectSize}</option>
                {TSHIRT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {!loading && !session ? (
        <div className="mt-5 grid gap-3">
          <input
            type="email"
            placeholder={copy.email}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border border-[var(--line)] px-3 py-3"
          />
          <input
            type="password"
            placeholder={copy.password}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-[var(--line)] px-3 py-3"
          />
          <button
            type="button"
            onClick={() => void signInAndContinue()}
            disabled={submitting || closed}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {copy.loginAndRegister}
          </button>
          <p className="text-sm leading-6 text-[var(--muted)]">{copy.onlyMembers}</p>
        </div>
      ) : null}

      {!loading && session ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm">
            <p className="font-semibold">{session.user.email}</p>
            <p className="mt-1 text-[var(--muted)]">
              {state.registered ? copy.alreadyRegistered : copy.loggedReady}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!state.registered ? (
              <button
                type="button"
                onClick={() => void register("register")}
                disabled={submitting || closed}
                className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                {copy.register}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void register("cancel")}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                {copy.cancel}
              </button>
            )}

            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-3 font-semibold"
            >
              <LogOut size={16} />
              {copy.signOut}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm font-semibold text-[var(--accent)]">{message}</p>
      ) : null}
    </aside>
  );
}

const registrationCopy: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    closed: string;
    loading: string;
    email: string;
    password: string;
    yes: string;
    no: string;
    tshirtQuestion: string;
    tshirtSize: string;
    selectSize: string;
    sizeRequired: string;
    loginAndRegister: string;
    onlyMembers: string;
    loginRequired: string;
    genericError: string;
    loggedReady: string;
    alreadyRegistered: string;
    register: string;
    cancel: string;
    registered: string;
    cancelled: string;
    signOut: string;
  }
> = {
  es: {
    eyebrow: "Inscripcion",
    title: "Registrate en este evento",
    intro: "Accede con tus credenciales IKA para inscribirte automaticamente en {event}.",
    closed: "La inscripcion online a este evento no esta abierta en este momento.",
    loading: "Comprobando tu estado de inscripcion...",
    email: "Email",
    password: "Contrasena",
    yes: "Si",
    no: "No",
    tshirtQuestion: "Quieres camiseta del evento",
    tshirtSize: "Talla de camiseta",
    selectSize: "Selecciona talla",
    sizeRequired: "Selecciona una talla para la camiseta.",
    loginAndRegister: "Entrar e inscribirme",
    onlyMembers: "Solo los Kenshi activos ya registrados en IKA pueden inscribirse desde la web.",
    loginRequired: "Introduce email y contrasena.",
    genericError: "No se pudo completar la inscripcion.",
    loggedReady: "Tu acceso esta listo para este evento.",
    alreadyRegistered: "Ya figuras como inscrito en este evento.",
    register: "Confirmar inscripcion",
    cancel: "Cancelar inscripcion",
    registered: "Inscripcion completada.",
    cancelled: "Inscripcion cancelada.",
    signOut: "Salir",
  },
  en: {
    eyebrow: "Registration",
    title: "Register for this event",
    intro: "Sign in with your IKA credentials to register automatically for {event}.",
    closed: "Online registration for this event is not open right now.",
    loading: "Checking your registration status...",
    email: "Email",
    password: "Password",
    yes: "Yes",
    no: "No",
    tshirtQuestion: "Do you want the event T-shirt",
    tshirtSize: "T-shirt size",
    selectSize: "Select size",
    sizeRequired: "Select a T-shirt size.",
    loginAndRegister: "Sign in and register",
    onlyMembers: "Only active Kenshi already registered in IKA can sign up from the public site.",
    loginRequired: "Enter your email and password.",
    genericError: "The registration could not be completed.",
    loggedReady: "Your access is ready for this event.",
    alreadyRegistered: "You are already registered for this event.",
    register: "Confirm registration",
    cancel: "Cancel registration",
    registered: "Registration completed.",
    cancelled: "Registration cancelled.",
    signOut: "Sign out",
  },
  it: {
    eyebrow: "Iscrizione",
    title: "Registrati a questo evento",
    intro: "Accedi con le tue credenziali IKA per registrarti automaticamente a {event}.",
    closed: "La registrazione online per questo evento non \u00e8 aperta in questo momento.",
    loading: "Controllo dello stato della registrazione...",
    email: "Email",
    password: "Password",
    yes: "Si",
    no: "No",
    tshirtQuestion: "Vuoi la maglietta dell'evento",
    tshirtSize: "Taglia maglietta",
    selectSize: "Seleziona taglia",
    sizeRequired: "Seleziona una taglia per la maglietta.",
    loginAndRegister: "Accedi e registrami",
    onlyMembers: "Solo i Kenshi attivi gi\u00e0 registrati in IKA possono iscriversi dal sito pubblico.",
    loginRequired: "Inserisci email e password.",
    genericError: "Impossibile completare l'iscrizione.",
    loggedReady: "Il tuo accesso \u00e8 pronto per questo evento.",
    alreadyRegistered: "Risulti gi\u00e0 iscritto a questo evento.",
    register: "Conferma iscrizione",
    cancel: "Annulla iscrizione",
    registered: "Iscrizione completata.",
    cancelled: "Iscrizione annullata.",
    signOut: "Esci",
  },
  fr: {
    eyebrow: "Inscription",
    title: "Inscrivez-vous \u00e0 cet \u00e9v\u00e9nement",
    intro: "Connectez-vous avec vos identifiants IKA pour vous inscrire automatiquement \u00e0 {event}.",
    closed: "L'inscription en ligne \u00e0 cet \u00e9v\u00e9nement n'est pas ouverte pour le moment.",
    loading: "V\u00e9rification de votre statut d'inscription...",
    email: "Email",
    password: "Mot de passe",
    yes: "Oui",
    no: "Non",
    tshirtQuestion: "Voulez-vous le t-shirt de l'\u00e9v\u00e9nement",
    tshirtSize: "Taille du t-shirt",
    selectSize: "S\u00e9lectionnez la taille",
    sizeRequired: "S\u00e9lectionnez une taille de t-shirt.",
    loginAndRegister: "Se connecter et m'inscrire",
    onlyMembers: "Seuls les Kenshi actifs d\u00e9j\u00e0 enregistr\u00e9s dans IKA peuvent s'inscrire depuis le site public.",
    loginRequired: "Saisissez votre email et votre mot de passe.",
    genericError: "L'inscription n'a pas pu \u00eatre termin\u00e9e.",
    loggedReady: "Votre acc\u00e8s est pr\u00eat pour cet \u00e9v\u00e9nement.",
    alreadyRegistered: "Vous \u00eates d\u00e9j\u00e0 inscrit \u00e0 cet \u00e9v\u00e9nement.",
    register: "Confirmer l'inscription",
    cancel: "Annuler l'inscription",
    registered: "Inscription termin\u00e9e.",
    cancelled: "Inscription annul\u00e9e.",
    signOut: "Se d\u00e9connecter",
  },
  ja: {
    eyebrow: "\u767b\u9332",
    title: "\u3053\u306e\u30a4\u30d9\u30f3\u30c8\u306b\u767b\u9332",
    intro: "IKA\u306e\u8cc7\u683c\u60c5\u5831\u3067\u30ed\u30b0\u30a4\u30f3\u3059\u308b\u3068\u3001{event}\u306b\u81ea\u52d5\u3067\u767b\u9332\u3067\u304d\u307e\u3059\u3002",
    closed: "\u73fe\u5728\u3001\u3053\u306e\u30a4\u30d9\u30f3\u30c8\u306e\u30aa\u30f3\u30e9\u30a4\u30f3\u767b\u9332\u306f\u53d7\u3051\u4ed8\u3051\u3066\u3044\u307e\u305b\u3093\u3002",
    loading: "\u767b\u9332\u72b6\u6cc1\u3092\u78ba\u8a8d\u4e2d...",
    email: "\u30e1\u30fc\u30eb",
    password: "\u30d1\u30b9\u30ef\u30fc\u30c9",
    yes: "\u306f\u3044",
    no: "\u3044\u3044\u3048",
    tshirtQuestion: "\u30a4\u30d9\u30f3\u30c8T\u30b7\u30e3\u30c4\u3092\u5e0c\u671b\u3057\u307e\u3059\u304b",
    tshirtSize: "T\u30b7\u30e3\u30c4\u30b5\u30a4\u30ba",
    selectSize: "\u30b5\u30a4\u30ba\u3092\u9078\u629e",
    sizeRequired: "T\u30b7\u30e3\u30c4\u306e\u30b5\u30a4\u30ba\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    loginAndRegister: "\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u767b\u9332",
    onlyMembers: "\u516c\u958b\u30b5\u30a4\u30c8\u304b\u3089\u767b\u9332\u3067\u304d\u308b\u306e\u306f\u3001IKA\u306b\u767b\u9332\u6e08\u307f\u306e\u30a2\u30af\u30c6\u30a3\u30d6\u306aKenshi\u306e\u307f\u3067\u3059\u3002",
    loginRequired: "\u30e1\u30fc\u30eb\u3068\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    genericError: "\u767b\u9332\u3092\u5b8c\u4e86\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
    loggedReady: "\u3053\u306e\u30a4\u30d9\u30f3\u30c8\u3078\u306e\u30a2\u30af\u30bb\u30b9\u304c\u6e96\u5099\u3067\u304d\u3066\u3044\u307e\u3059\u3002",
    alreadyRegistered: "\u3059\u3067\u306b\u3053\u306e\u30a4\u30d9\u30f3\u30c8\u306b\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u3059\u3002",
    register: "\u767b\u9332\u3092\u78ba\u5b9a",
    cancel: "\u767b\u9332\u3092\u30ad\u30e3\u30f3\u30bb\u30eb",
    registered: "\u767b\u9332\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f\u3002",
    cancelled: "\u767b\u9332\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f\u3002",
    signOut: "\u30ed\u30b0\u30a2\u30a6\u30c8",
  },
  zh: {
    eyebrow: "\u62a5\u540d",
    title: "\u6ce8\u518c\u6b64\u6d3b\u52a8",
    intro: "\u4f7f\u7528\u60a8\u7684IKA\u8d26\u53f7\u767b\u5f55\u540e\uff0c\u5373\u53ef\u81ea\u52a8\u62a5\u540d {event}\u3002",
    closed: "\u76ee\u524d\u6b64\u6d3b\u52a8\u7684\u7f51\u4e0a\u62a5\u540d\u5c1a\u672a\u5f00\u653e\u3002",
    loading: "\u6b63\u5728\u68c0\u67e5\u60a8\u7684\u62a5\u540d\u72b6\u6001...",
    email: "\u7535\u5b50\u90ae\u7bb1",
    password: "\u5bc6\u7801",
    yes: "\u662f",
    no: "\u5426",
    tshirtQuestion: "\u60a8\u9700\u8981\u6d3b\u52a8T\u6064\u5417",
    tshirtSize: "T\u6064\u5c3a\u7801",
    selectSize: "\u9009\u62e9\u5c3a\u7801",
    sizeRequired: "\u8bf7\u9009\u62e9 T \u6064\u5c3a\u7801\u3002",
    loginAndRegister: "\u767b\u5f55\u5e76\u62a5\u540d",
    onlyMembers: "\u53ea\u6709\u5df2\u5728IKA\u6ce8\u518c\u7684\u5728\u7c4dKenshi\u624d\u80fd\u901a\u8fc7\u516c\u5f00\u7f51\u7ad9\u62a5\u540d\u3002",
    loginRequired: "\u8bf7\u8f93\u5165\u7535\u5b50\u90ae\u7bb1\u548c\u5bc6\u7801\u3002",
    genericError: "\u65e0\u6cd5\u5b8c\u6210\u62a5\u540d\u3002",
    loggedReady: "\u60a8\u5df2\u53ef\u53c2\u52a0\u6b64\u6d3b\u52a8\u3002",
    alreadyRegistered: "\u60a8\u5df2\u7ecf\u62a5\u540d\u6b64\u6d3b\u52a8\u3002",
    register: "\u786e\u8ba4\u62a5\u540d",
    cancel: "\u53d6\u6d88\u62a5\u540d",
    registered: "\u62a5\u540d\u5b8c\u6210\u3002",
    cancelled: "\u62a5\u540d\u5df2\u53d6\u6d88\u3002",
    signOut: "\u9000\u51fa",
  },
  cs: {
    eyebrow: "Registrace",
    title: "Zaregistrujte se na tuto akci",
    intro: "Prihlaste se svymi udaji IKA a automaticky se zaregistrujete na {event}.",
    closed: "Online registrace na tuto akci neni momentalne otevrena.",
    loading: "Kontroluji stav registrace...",
    email: "Email",
    password: "Heslo",
    yes: "Ano",
    no: "Ne",
    tshirtQuestion: "Chcete tricko k akci",
    tshirtSize: "Velikost tricka",
    selectSize: "Vyberte velikost",
    sizeRequired: "Vyberte velikost tricka.",
    loginAndRegister: "Prihlasit a registrovat",
    onlyMembers: "Z verejneho webu se mohou prihlasit jen aktivni Kenshi jiz registrovani v IKA.",
    loginRequired: "Zadejte email a heslo.",
    genericError: "Registraci se nepodarilo dokoncit.",
    loggedReady: "Vas pristup je pro tuto akci pripraven.",
    alreadyRegistered: "Na tuto akci jste jiz registrovani.",
    register: "Potvrdit registraci",
    cancel: "Zrusit registraci",
    registered: "Registrace dokoncena.",
    cancelled: "Registrace zrusena.",
    signOut: "Odhlasit",
  },
  id: {
    eyebrow: "Pendaftaran",
    title: "Daftar ke acara ini",
    intro: "Masuk dengan kredensial IKA Anda untuk mendaftar otomatis ke {event}.",
    closed: "Pendaftaran online untuk acara ini sedang tidak dibuka.",
    loading: "Memeriksa status pendaftaran Anda...",
    email: "Email",
    password: "Kata sandi",
    yes: "Ya",
    no: "Tidak",
    tshirtQuestion: "Apakah Anda ingin kaos acara",
    tshirtSize: "Ukuran kaos",
    selectSize: "Pilih ukuran",
    sizeRequired: "Pilih ukuran kaos.",
    loginAndRegister: "Masuk dan daftar",
    onlyMembers: "Hanya Kenshi aktif yang sudah terdaftar di IKA yang dapat mendaftar dari situs publik.",
    loginRequired: "Masukkan email dan kata sandi.",
    genericError: "Pendaftaran tidak dapat diselesaikan.",
    loggedReady: "Akses Anda sudah siap untuk acara ini.",
    alreadyRegistered: "Anda sudah terdaftar pada acara ini.",
    register: "Konfirmasi pendaftaran",
    cancel: "Batalkan pendaftaran",
    registered: "Pendaftaran selesai.",
    cancelled: "Pendaftaran dibatalkan.",
    signOut: "Keluar",
  },
  ms: {
    eyebrow: "Pendaftaran",
    title: "Daftar untuk acara ini",
    intro: "Log masuk dengan kelayakan IKA anda untuk mendaftar secara automatik ke {event}.",
    closed: "Pendaftaran dalam talian untuk acara ini tidak dibuka pada masa ini.",
    loading: "Menyemak status pendaftaran anda...",
    email: "Email",
    password: "Kata laluan",
    yes: "Ya",
    no: "Tidak",
    tshirtQuestion: "Adakah anda mahu baju acara",
    tshirtSize: "Saiz baju",
    selectSize: "Pilih saiz",
    sizeRequired: "Pilih saiz baju.",
    loginAndRegister: "Log masuk dan daftar",
    onlyMembers: "Hanya Kenshi aktif yang sudah berdaftar dalam IKA boleh mendaftar dari laman awam.",
    loginRequired: "Masukkan email dan kata laluan.",
    genericError: "Pendaftaran tidak dapat diselesaikan.",
    loggedReady: "Akses anda sudah sedia untuk acara ini.",
    alreadyRegistered: "Anda sudah berdaftar untuk acara ini.",
    register: "Sahkan pendaftaran",
    cancel: "Batalkan pendaftaran",
    registered: "Pendaftaran selesai.",
    cancelled: "Pendaftaran dibatalkan.",
    signOut: "Keluar",
  },
  eu: {
    eyebrow: "Izen-ematea",
    title: "Eman izena ekitaldi honetan",
    intro: "Sartu zure IKA kredentzialekin {event} ekitaldian automatikoki izena emateko.",
    closed: "Ekitaldi honetarako online izen-ematea ez dago une honetan irekita.",
    loading: "Zure izen-emate egoera egiaztatzen...",
    email: "Emaila",
    password: "Pasahitza",
    yes: "Bai",
    no: "Ez",
    tshirtQuestion: "Ekitaldiko kamiseta nahi duzu",
    tshirtSize: "Kamisetaren neurria",
    selectSize: "Aukeratu neurria",
    sizeRequired: "Aukeratu kamisetaren neurria.",
    loginAndRegister: "Sartu eta eman izena",
    onlyMembers: "IKA-n erregistratutako Kenshi aktiboek bakarrik eman dezakete izena web publikoaren bidez.",
    loginRequired: "Sartu emaila eta pasahitza.",
    genericError: "Ezin izan da izen-ematea osatu.",
    loggedReady: "Zure sarbidea prest dago ekitaldi honetarako.",
    alreadyRegistered: "Dagoeneko izena emanda zaude ekitaldi honetan.",
    register: "Berretsi izen-ematea",
    cancel: "Utzi izen-ematea",
    registered: "Izen-ematea osatu da.",
    cancelled: "Izen-ematea ezeztatu da.",
    signOut: "Irten",
  },
  pt: {
    eyebrow: "Inscri\u00e7\u00e3o",
    title: "Inscreva-se neste evento",
    intro: "Entre com as suas credenciais IKA para se inscrever automaticamente em {event}.",
    closed: "A inscri\u00e7\u00e3o online para este evento n\u00e3o est\u00e1 aberta neste momento.",
    loading: "A verificar o estado da sua inscri\u00e7\u00e3o...",
    email: "Email",
    password: "Palavra-passe",
    yes: "Sim",
    no: "N\u00e3o",
    tshirtQuestion: "Quer a camisola do evento",
    tshirtSize: "Tamanho da camisola",
    selectSize: "Selecione o tamanho",
    sizeRequired: "Selecione um tamanho de camisola.",
    loginAndRegister: "Entrar e inscrever-me",
    onlyMembers: "Apenas Kenshi ativos j\u00e1 registados na IKA podem inscrever-se a partir do site p\u00fablico.",
    loginRequired: "Introduza o email e a palavra-passe.",
    genericError: "N\u00e3o foi poss\u00edvel concluir a inscri\u00e7\u00e3o.",
    loggedReady: "O seu acesso est\u00e1 pronto para este evento.",
    alreadyRegistered: "J\u00e1 est\u00e1 inscrito neste evento.",
    register: "Confirmar inscri\u00e7\u00e3o",
    cancel: "Cancelar inscri\u00e7\u00e3o",
    registered: "Inscri\u00e7\u00e3o conclu\u00edda.",
    cancelled: "Inscri\u00e7\u00e3o cancelada.",
    signOut: "Sair",
  },
  de: {
    eyebrow: "Anmeldung",
    title: "F\u00fcr diese Veranstaltung anmelden",
    intro: "Melden Sie sich mit Ihren IKA-Zugangsdaten an, um sich automatisch f\u00fcr {event} zu registrieren.",
    closed: "Die Online-Anmeldung f\u00fcr diese Veranstaltung ist derzeit nicht ge\u00f6ffnet.",
    loading: "Ihr Anmeldestatus wird gepr\u00fcft...",
    email: "Email",
    password: "Passwort",
    yes: "Ja",
    no: "Nein",
    tshirtQuestion: "M\u00f6chten Sie das Veranstaltungs-T-Shirt",
    tshirtSize: "T-Shirt-Gr\u00f6\u00dfe",
    selectSize: "Gr\u00f6\u00dfe ausw\u00e4hlen",
    sizeRequired: "Bitte w\u00e4hlen Sie eine T-Shirt-Gr\u00f6\u00dfe aus.",
    loginAndRegister: "Anmelden und registrieren",
    onlyMembers: "Nur aktive Kenshi, die bereits in IKA registriert sind, k\u00f6nnen sich \u00fcber die \u00f6ffentliche Website anmelden.",
    loginRequired: "Geben Sie Email und Passwort ein.",
    genericError: "Die Anmeldung konnte nicht abgeschlossen werden.",
    loggedReady: "Ihr Zugang ist f\u00fcr diese Veranstaltung bereit.",
    alreadyRegistered: "Sie sind bereits f\u00fcr diese Veranstaltung registriert.",
    register: "Anmeldung best\u00e4tigen",
    cancel: "Anmeldung stornieren",
    registered: "Anmeldung abgeschlossen.",
    cancelled: "Anmeldung storniert.",
    signOut: "Abmelden",
  }
};

const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "XS", "2XS", "3XS"] as const;

