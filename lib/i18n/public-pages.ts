import { defaultLocale, type Locale } from "./config";
import {
  extendedAboutQuotes,
  extendedAboutSections,
  extendedPublicPageContent,
} from "./extended-public-locales";

export type TextBlock = {
  title: string;
  text: string;
  image?: string;
  alt?: string;
  items?: string[];
  note?: string;
};

export type StepBlock = {
  number: string;
  title: string;
  text: string;
};

export type AboutSection = {
  title: string;
  image: string;
  body: string[];
  bullets?: string[];
  note?: string;
};

export type PublicPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  quote?: string;
  blocks?: TextBlock[];
  steps?: StepBlock[];
  countries?: string[];
  emailLabel?: string;
  hasCmsBlocks?: boolean;
};

export type PublicPageKey =
  | "about"
  | "philosophy"
  | "countries"
  | "dojos"
  | "news"
  | "events"
  | "join"
  | "contact"
  | "portal";

const memberCountriesByLocale: Partial<Record<Locale, string[]>> = {
  en: [
    "Costa Rica",
    "Czech Republic",
    "Indonesia and Malaysia",
    "Ireland",
    "Italy",
    "Hong Kong",
    "Japan",
    "Spain",
    "Switzerland",
    "United Kingdom",
  ],
  es: [
    "Costa Rica",
    "República Checa",
    "Indonesia y Malasia",
    "Irlanda",
    "Italia",
    "Hong Kong",
    "Japón",
    "España",
    "Suiza",
    "Reino Unido",
  ],
  it: [
    "Costa Rica",
    "Repubblica Ceca",
    "Indonesia e Malesia",
    "Irlanda",
    "Italia",
    "Hong Kong",
    "Giappone",
    "Spagna",
    "Svizzera",
    "Regno Unito",
  ],
  fr: [
    "Costa Rica",
    "République tchèque",
    "Indonésie et Malaisie",
    "Irlande",
    "Italie",
    "Hong Kong",
    "Japon",
    "Espagne",
    "Suisse",
    "Royaume-Uni",
  ],
  ja: [
    "コスタリカ",
    "チェコ共和国",
    "インドネシアとマレーシア",
    "アイルランド",
    "イタリア",
    "香港",
    "日本",
    "スペイン",
    "スイス",
    "英国",
  ],
  zh: [
    "哥斯达黎加",
    "捷克共和国",
    "印度尼西亚和马来西亚",
    "爱尔兰",
    "意大利",
    "香港",
    "日本",
    "西班牙",
    "瑞士",
    "英国",
  ],
  cs: [
    "Kostarika",
    "Česká republika",
    "Indonésie a Malajsie",
    "Irsko",
    "Itálie",
    "Hongkong",
    "Japonsko",
    "Španělsko",
    "Švýcarsko",
    "Spojené království",
  ],
};

const content: Partial<Record<Locale, Record<PublicPageKey, PublicPageContent>>> = {
  en: {
    about: {
      eyebrow: "About IKA",
      title: "About the International Kempo Association",
      intro:
        "The International Kempo Association brings together practitioners and organisations from around the world who share a common heritage, physical style, and philosophy.",
    },
    philosophy: {
      eyebrow: "Philosophy",
      title: "Strength, compassion, and self-reliance.",
      intro:
        "IKA training develops people technically, mentally, and socially through paired practice, meditation, and philosophy.",
      quote:
        "Live half for the happiness of oneself, and half for the happiness of others.",
      blocks: [
        {
          title: "Mutual development",
          text: "Practitioners train with each other to grow together.",
        },
        {
          title: "Defence before attack",
          text: "Techniques emphasise control, balance, weak points, and minimum necessary force.",
        },
        {
          title: "Mind and body",
          text: "Practice combines hard and soft techniques with meditation and reflection.",
        },
        {
          title: "Positive society",
          text: "Training should build people who contribute confidently and compassionately.",
        },
      ],
    },
    countries: {
      eyebrow: "Member countries",
      title: "IKA around the world",
      intro:
        "IKA brings together member organisations across countries and continents. Explore the countries connected through the International Kempo Association.",
      countries: memberCountriesByLocale.en,
    },
    dojos: {
      eyebrow: "Dojos",
      title: "Find an IKA dojo",
      intro:
        "Explore official IKA dojos by country and city.",
    },
    news: {
      eyebrow: "News",
      title: "Latest IKA news",
      intro:
        "Read the latest news, reports, and updates from the International Kempo Association.",
    },
    events: {
      eyebrow: "Events",
      title: "Seminars, courses, and gatherings",
      intro:
        "Find public IKA seminars, courses, taikais, and international gatherings.",
    },
    join: {
      eyebrow: "Join IKA",
      title: "Connect your organisation with the international IKA family.",
      intro:
        "IKA welcomes organisations that share the association's technical roots, philosophy, and commitment to training together across borders.",
      steps: [
        {
          number: "01",
          title: "Contact IKA",
          text: "Introduce your organisation and country.",
        },
        {
          number: "02",
          title: "Let us get to know you",
          text: "Share your technical, historical, and organisational background with us.",
        },
        {
          number: "03",
          title: "Share training",
          text: "If the previous conditions are met, we will invite you to join us at an event so we can get to know your practice and get to know one another.",
        },
        {
          number: "04",
          title: "Membership proposal and acceptance",
          text: "Your membership proposal will be presented to the board for review and resolution.",
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Get in touch with the International Kempo Association.",
      intro: "Use the form below to contact the IKA.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Private access",
      title: "One login, the right portal for each role.",
      intro:
        "After login, each user will enter the correct portal according to their role: Kenshi, dojo admin, country admin, global admin, or super admin.",
      blocks: [
        {
          title: "Kenshi",
          text: "Personal profile, grade history, courses, taikais, certificates, and IKA Passport.",
        },
        {
          title: "Dojo Admin",
          text: "Dojo page, Kenshi in the dojo, basic updates, and dojo statistics.",
        },
        {
          title: "Country Admin",
          text: "Country page, dojos, Kenshi, courses, taikais, and country reports.",
        },
      ],
    },
  },
  es: {
    about: {
      eyebrow: "Sobre IKA",
      title: "Sobre la International Kempo Association",
      intro:
        "La International Kempo Association reúne a practicantes y organizaciones de todo el mundo que comparten herencia, estilo físico y filosofía.",
    },
    philosophy: {
      eyebrow: "Filosofía",
      title: "Fuerza, compasión y autosuficiencia.",
      intro:
        "El entrenamiento IKA desarrolla a las personas técnica, mental y socialmente mediante práctica por parejas, meditación y filosofía.",
      quote:
        "Vivir la mitad para la felicidad de uno mismo y la mitad para la felicidad de los demás.",
      blocks: [
        {
          title: "Desarrollo mutuo",
          text: "Los practicantes entrenan unos con otros para crecer juntos.",
        },
        {
          title: "Defensa antes que ataque",
          text: "Las técnicas priorizan control, equilibrio, puntos débiles y la mínima fuerza necesaria.",
        },
        {
          title: "Mente y cuerpo",
          text: "La práctica combina técnicas duras y suaves con meditación y reflexión.",
        },
        {
          title: "Sociedad positiva",
          text: "El entrenamiento debe formar personas capaces de contribuir con confianza y compasión.",
        },
      ],
    },
    countries: {
      eyebrow: "Países miembros",
      title: "IKA alrededor del mundo",
      intro:
        "IKA reune organizaciones miembro en distintos paises y continentes. Explora los paises conectados a traves de la International Kempo Association.",
      countries: memberCountriesByLocale.es,
    },
    dojos: {
      eyebrow: "Dojos",
      title: "Encuentra un dojo IKA",
      intro:
        "Explora los dojos oficiales de IKA por pais y ciudad.",
    },
    news: {
      eyebrow: "Noticias",
      title: "Últimas noticias de IKA",
      intro:
        "Lee las ultimas noticias, informes y novedades de la International Kempo Association.",
    },
    events: {
      eyebrow: "Eventos",
      title: "Seminarios, cursos y encuentros",
      intro:
        "Consulta seminarios, cursos, taikais y encuentros internacionales de IKA.",
    },
    join: {
      eyebrow: "Unirse a IKA",
      title: "Conecta tu organización con la familia internacional IKA.",
      intro:
        "IKA da la bienvenida a organizaciones que comparten sus raíces técnicas, filosofía y compromiso de entrenar juntas a través de fronteras.",
      steps: [
        {
          number: "01",
          title: "Contactar con IKA",
          text: "Presenta tu organización y país.",
        },
        {
          number: "02",
          title: "Dejanos conocerte",
          text: "Comparte con nosotros vuestra trayectoria tecnica, historica y organizativa.",
        },
        {
          number: "03",
          title: "Compartir entrenamiento",
          text: "Si cumples con las condiciones anteriores te invitaremos a participar junto a nosotros en algun evento para conocer vuestra practica y que nos podamos conocer unos a otros.",
        },
        {
          number: "04",
          title: "Propuesta y aceptacion de membresia",
          text: "La propuesta de membresia se presentara a la junta para su valoracion y resolucion.",
        },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      title: "Contacta con la International Kempo Association.",
      intro: "Usa el formulario inferior para contactar con IKA.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Acceso privado",
      title: "Un solo login, el portal correcto para cada rol.",
      intro:
        "Después de iniciar sesión, cada usuario entrará en el portal correspondiente a su rol: Kenshi, administrador de dojo, administrador de país, administrador global o super admin.",
      blocks: [
        {
          title: "Kenshi",
          text: "Perfil personal, historial de grados, cursos, taikais, certificados e IKA Passport.",
        },
        {
          title: "Admin de dojo",
          text: "Página del dojo, Kenshi del dojo, actualizaciones básicas y estadísticas.",
        },
        {
          title: "Admin de país",
          text: "Página del país, dojos, Kenshi, cursos, taikais e informes nacionales.",
        },
      ],
    },
  },
  it: {
    about: {
      eyebrow: "IKA",
      title: "Informazioni sulla International Kempo Association",
      intro:
        "La International Kempo Association riunisce praticanti e organizzazioni di tutto il mondo che condividono patrimonio, stile fisico e filosofia.",
    },
    philosophy: {
      eyebrow: "Filosofia",
      title: "Forza, compassione e autonomia.",
      intro:
        "L'allenamento IKA sviluppa le persone tecnicamente, mentalmente e socialmente attraverso pratica in coppia, meditazione e filosofia.",
      quote:
        "Vivere metà per la felicità di sé stessi e metà per la felicità degli altri.",
      blocks: [
        {
          title: "Sviluppo reciproco",
          text: "I praticanti si allenano insieme per crescere insieme.",
        },
        {
          title: "Difesa prima dell'attacco",
          text: "Le tecniche privilegiano controllo, equilibrio, punti deboli e forza minima necessaria.",
        },
        {
          title: "Mente e corpo",
          text: "La pratica combina tecniche dure e morbide con meditazione e riflessione.",
        },
        {
          title: "Società positiva",
          text: "L'allenamento deve formare persone capaci di contribuire con fiducia e compassione.",
        },
      ],
    },
    countries: {
      eyebrow: "Paesi membri",
      title: "IKA nel mondo",
      intro:
        "IKA riunisce organizzazioni membro in paesi e continenti diversi. Esplora i paesi collegati attraverso la International Kempo Association.",
      countries: memberCountriesByLocale.it,
    },
    dojos: {
      eyebrow: "Dojo",
      title: "Trova un dojo IKA",
      intro:
        "Esplora i dojo ufficiali IKA per paese e citta.",
    },
    news: {
      eyebrow: "Notizie",
      title: "Ultime notizie IKA",
      intro:
        "Leggi le ultime notizie, i report e gli aggiornamenti della International Kempo Association.",
    },
    events: {
      eyebrow: "Eventi",
      title: "Seminari, corsi e incontri",
      intro:
        "Consulta seminari, corsi, taikai e incontri internazionali IKA.",
    },
    join: {
      eyebrow: "Unisciti a IKA",
      title: "Collega la tua organizzazione alla famiglia internazionale IKA.",
      intro:
        "IKA accoglie organizzazioni che condividono radici tecniche, filosofia e l'impegno ad allenarsi insieme oltre i confini.",
      steps: [
        {
          number: "01",
          title: "Contatta IKA",
          text: "Presenta la tua organizzazione e il paese.",
        },
        {
          number: "02",
          title: "Lasciaci conoscerti",
          text: "Condividi con noi il tuo contesto tecnico, storico e organizzativo.",
        },
        {
          number: "03",
          title: "Condividere l'allenamento",
          text: "Se le condizioni precedenti sono soddisfatte, vi inviteremo a partecipare con noi a un evento per conoscere la vostra pratica e conoscerci meglio reciprocamente.",
        },
        {
          number: "04",
          title: "Proposta e accettazione della membership",
          text: "La proposta di adesione sara presentata al consiglio per la valutazione e la decisione finale.",
        },
      ],
    },
    contact: {
      eyebrow: "Contatti",
      title: "Contatta la International Kempo Association.",
      intro: "Usa il modulo qui sotto per contattare IKA.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Accesso privato",
      title: "Un login, il portale giusto per ogni ruolo.",
      intro:
        "Dopo il login ogni utente entra nel portale corretto: Kenshi, admin dojo, admin paese, admin globale o super admin.",
      blocks: [
        {
          title: "Kenshi",
          text: "Profilo personale, storia dei gradi, corsi, taikai, certificati e IKA Passport.",
        },
        {
          title: "Admin dojo",
          text: "Pagina dojo, Kenshi del dojo, aggiornamenti di base e statistiche.",
        },
        {
          title: "Admin paese",
          text: "Pagina paese, dojo, Kenshi, corsi, taikai e report nazionali.",
        },
      ],
    },
  },
  fr: {
    about: {
      eyebrow: "À propos",
      title: "À propos de l'International Kempo Association",
      intro:
        "L'International Kempo Association réunit des pratiquants et organisations du monde entier partageant un héritage, un style physique et une philosophie communs.",
    },
    philosophy: {
      eyebrow: "Philosophie",
      title: "Force, compassion et autonomie.",
      intro:
        "L'entraînement IKA développe les personnes techniquement, mentalement et socialement par la pratique en binôme, la méditation et la philosophie.",
      quote:
        "Vivre moitié pour son propre bonheur, moitié pour le bonheur des autres.",
      blocks: [
        {
          title: "Développement mutuel",
          text: "Les pratiquants s'entraînent ensemble pour progresser ensemble.",
        },
        {
          title: "Défense avant attaque",
          text: "Les techniques privilégient contrôle, équilibre, points faibles et force minimale nécessaire.",
        },
        {
          title: "Esprit et corps",
          text: "La pratique combine techniques dures et souples avec méditation et réflexion.",
        },
        {
          title: "Société positive",
          text: "L'entraînement doit former des personnes capables de contribuer avec confiance et compassion.",
        },
      ],
    },
    countries: {
      eyebrow: "Pays membres",
      title: "IKA dans le monde",
      intro:
        "IKA reunit des organisations membres a travers pays et continents. Explorez les pays relies par la International Kempo Association.",
      countries: memberCountriesByLocale.fr,
    },
    dojos: {
      eyebrow: "Dojos",
      title: "Trouver un dojo IKA",
      intro:
        "Explorez les dojos officiels IKA par pays et par ville.",
    },
    news: {
      eyebrow: "Actualités",
      title: "Dernières actualités IKA",
      intro:
        "Lisez les dernieres actualites, rapports et mises a jour de la International Kempo Association.",
    },
    events: {
      eyebrow: "Événements",
      title: "Séminaires, cours et rencontres",
      intro:
        "Consultez les seminaires, cours, taikais et rencontres internationales IKA.",
    },
    join: {
      eyebrow: "Rejoindre IKA",
      title: "Reliez votre organisation à la famille internationale IKA.",
      intro:
        "IKA accueille les organisations qui partagent ses racines techniques, sa philosophie et l'engagement de s'entraîner ensemble au-delà des frontières.",
      steps: [
        {
          number: "01",
          title: "Contacter IKA",
          text: "Présentez votre organisation et votre pays.",
        },
        {
          number: "02",
          title: "Faites-nous vous connaitre",
          text: "Partagez avec nous votre parcours technique, historique et organisationnel.",
        },
        {
          number: "03",
          title: "Partager l'entrainement",
          text: "Si les conditions precedentes sont remplies, nous vous inviterons a participer avec nous a un evenement afin de connaitre votre pratique et de faire connaissance les uns avec les autres.",
        },
        {
          number: "04",
          title: "Proposition et acceptation d'adhesion",
          text: "La proposition d'adhesion sera presentee au conseil pour evaluation et decision.",
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Contactez l'International Kempo Association.",
      intro: "Utilisez le formulaire ci-dessous pour contacter IKA.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Accès privé",
      title: "Un login, le bon portail pour chaque rôle.",
      intro:
        "Après connexion, chaque utilisateur accède au portail correspondant: Kenshi, admin dojo, admin pays, admin global ou super admin.",
      blocks: [
        {
          title: "Kenshi",
          text: "Profil personnel, historique des grades, cours, taikais, certificats et IKA Passport.",
        },
        {
          title: "Admin dojo",
          text: "Page dojo, Kenshi du dojo, mises à jour de base et statistiques.",
        },
        {
          title: "Admin pays",
          text: "Page pays, dojos, Kenshi, cours, taikais et rapports nationaux.",
        },
      ],
    },
  },
  ja: {
    about: {
      eyebrow: "IKAについて",
      title: "国際拳法協会について",
      intro:
        "国際拳法協会は、共通の伝統、身体技法、哲学を共有する世界中の実践者と団体を結びます。",
    },
    philosophy: {
      eyebrow: "理念",
      title: "強さ、慈悲、自立。",
      intro:
        "IKAの稽古は、相対演練、瞑想、哲学を通じて、技術的・精神的・社会的に人を育てます。",
      quote: "自己の幸せの半分を、他者の幸せの半分を。",
      blocks: [
        {
          title: "相互の成長",
          text: "実践者は互いに稽古し、ともに成長します。",
        },
        {
          title: "攻撃より防御",
          text: "技法は制御、崩し、急所、必要最小限の力を重視します。",
        },
        {
          title: "心と身体",
          text: "稽古は剛法と柔法に瞑想と内省を組み合わせます。",
        },
        {
          title: "より良い社会",
          text: "稽古は自信と慈悲を持って社会に貢献できる人を育てます。",
        },
      ],
    },
    countries: {
      eyebrow: "加盟国",
      title: "世界のIKA",
      intro:
        "IKA connects member organisations across countries and continents.",
      countries: memberCountriesByLocale.ja,
    },
    dojos: {
      eyebrow: "道場",
      title: "IKA道場を探す",
      intro:
        "Explore official IKA dojos by country and city.",
    },
    news: {
      eyebrow: "ニュース",
      title: "IKA最新ニュース",
      intro:
        "Read the latest news, reports, and updates from IKA.",
    },
    events: {
      eyebrow: "イベント",
      title: "セミナー、講習、集まり",
      intro:
        "Find IKA seminars, courses, taikais, and international gatherings.",
    },
    join: {
      eyebrow: "IKAに参加",
      title: "あなたの団体を国際IKAファミリーへつなげます。",
      intro:
        "IKAは、技術的な根、哲学、国境を越えて共に稽古する姿勢を共有する団体を歓迎します。",
      steps: [
        {
          number: "01",
          title: "IKAへ連絡",
          text: "団体と国を紹介してください。",
        },
        {
          number: "02",
          title: "\u79c1\u305f\u3061\u306b\u3042\u306a\u305f\u65b9\u3092\u77e5\u3063\u3066\u3082\u3089\u3046",
          text: "\u6280\u8853\u7684\u3001\u6b74\u53f2\u7684\u3001\u7d44\u7e54\u7684\u80cc\u666f\u3092\u79c1\u305f\u3061\u3068\u5171\u6709\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
        },
        {
          number: "03",
          title: "\u7a3d\u53e4\u3092\u5206\u304b\u3061\u5408\u3046",
          text: "\u524d\u63d0\u6761\u4ef6\u3092\u6e80\u305f\u3057\u305f\u5834\u5408\u3001\u3042\u306a\u305f\u65b9\u306e\u7a3d\u53e4\u3092\u77e5\u308a\u3001\u304a\u4e92\u3044\u3092\u3088\u308a\u7406\u89e3\u3059\u308b\u305f\u3081\u306b\u3001\u79c1\u305f\u3061\u3068\u4e00\u7dd2\u306b\u30a4\u30d9\u30f3\u30c8\u306b\u53c2\u52a0\u3057\u3066\u3044\u305f\u3060\u304f\u3088\u3046\u304a\u8a98\u3044\u3057\u307e\u3059\u3002",
        },
        {
          number: "04",
          title: "\u52a0\u76df\u63d0\u6848\u3068\u627f\u8a8d",
          text: "\u52a0\u76df\u306e\u63d0\u6848\u306f\u7406\u4e8b\u4f1a\u306b\u63d0\u51fa\u3055\u308c\u3001\u691c\u8a0e\u3068\u6c7a\u5b9a\u304c\u884c\u308f\u308c\u307e\u3059\u3002",
        },
      ],
    },
    contact: {
      eyebrow: "連絡先",
      title: "国際拳法協会へお問い合わせください。",
      intro: "下のフォームからIKAへご連絡ください。",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "専用アクセス",
      title: "一つのログインで、役割に応じたポータルへ。",
      intro:
        "ログイン後、拳士、道場管理者、国管理者、グローバル管理者、スーパー管理者の役割に応じて適切なポータルへ入ります。",
      blocks: [
        {
          title: "拳士",
          text: "個人プロフィール、段位履歴、講習、大会、証明書、IKA Passport。",
        },
        {
          title: "道場管理者",
          text: "道場ページ、所属拳士、基本更新、道場統計。",
        },
        {
          title: "国管理者",
          text: "国ページ、道場、拳士、講習、大会、国別レポート。",
        },
      ],
    },
  },
  zh: {
    about: {
      eyebrow: "关于 IKA",
      title: "关于国际拳法协会",
      intro:
        "国际拳法协会连接世界各地拥有共同传承、身体技法和哲学的练习者与组织。",
    },
    philosophy: {
      eyebrow: "理念",
      title: "力量、慈悲与自立。",
      intro:
        "IKA 训练通过双人练习、冥想和哲学，在技术、心智和社会层面发展人。",
      quote: "一半为自己的幸福而活，一半为他人的幸福而活。",
      blocks: [
        {
          title: "共同成长",
          text: "练习者相互训练，共同成长。",
        },
        {
          title: "防御优先",
          text: "技术强调控制、平衡、弱点和必要的最小力量。",
        },
        {
          title: "身心合一",
          text: "练习结合刚法、柔法、冥想和反思。",
        },
        {
          title: "积极社会",
          text: "训练旨在培养能以自信和慈悲贡献社会的人。",
        },
      ],
    },
    countries: {
      eyebrow: "成员国家",
      title: "世界各地的 IKA",
      intro:
        "IKA connects member organisations across countries and continents.",
      countries: memberCountriesByLocale.zh,
    },
    dojos: {
      eyebrow: "道场",
      title: "寻找 IKA 道场",
      intro:
        "Explore official IKA dojos by country and city.",
    },
    news: {
      eyebrow: "新闻",
      title: "IKA 最新新闻",
      intro:
        "Read the latest news, reports, and updates from IKA.",
    },
    events: {
      eyebrow: "活动",
      title: "研讨会、课程与聚会",
      intro:
        "Find IKA seminars, courses, taikais, and international gatherings.",
    },
    join: {
      eyebrow: "加入 IKA",
      title: "将你的组织连接到国际 IKA 大家庭。",
      intro:
        "IKA 欢迎共享技术根基、哲学以及跨国共同训练承诺的组织。",
      steps: [
        {
          number: "01",
          title: "联系 IKA",
          text: "介绍你的组织和国家。",
        },
        {
          number: "02",
          title: "\u8ba9\u6211\u4eec\u4e86\u89e3\u4f60\u4eec",
          text: "\u8bf7\u4e0e\u6211\u4eec\u5206\u4eab\u4f60\u4eec\u7684\u6280\u672f\u3001\u5386\u53f2\u548c\u7ec4\u7ec7\u80cc\u666f\u3002",
        },
        {
          number: "03",
          title: "\u5171\u4eab\u8bad\u7ec3",
          text: "\u5982\u679c\u7b26\u5408\u4e0a\u8ff0\u6761\u4ef6\uff0c\u6211\u4eec\u5c06\u9080\u8bf7\u4f60\u4eec\u4e0e\u6211\u4eec\u4e00\u8d77\u53c2\u52a0\u6d3b\u52a8\uff0c\u4ee5\u4fbf\u4e86\u89e3\u4f60\u4eec\u7684\u8bad\u7ec3\u5b9e\u8df5\uff0c\u4e5f\u8ba9\u53cc\u65b9\u66f4\u597d\u5730\u76f8\u4e92\u4e86\u89e3\u3002",
        },
        {
          number: "04",
          title: "\u4f1a\u5458\u63d0\u6848\u4e0e\u63a5\u7eb3",
          text: "\u4f1a\u5458\u63d0\u6848\u5c06\u63d0\u4ea4\u7406\u4e8b\u4f1a\u8fdb\u884c\u5ba1\u8bae\u548c\u51b3\u8bae\u3002",
        },
      ],
    },
    contact: {
      eyebrow: "联系",
      title: "联系国际拳法协会。",
      intro: "请使用下方表单联系 IKA。",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "私人访问",
      title: "一个登录入口，根据角色进入正确门户。",
      intro:
        "登录后，用户将根据角色进入拳士、道场管理员、国家管理员、全球管理员或超级管理员门户。",
      blocks: [
        {
          title: "拳士",
          text: "个人资料、段位历史、课程、大会、证书和 IKA Passport。",
        },
        {
          title: "道场管理员",
          text: "道场页面、道场拳士、基础更新和统计。",
        },
        {
          title: "国家管理员",
          text: "国家页面、道场、拳士、课程、大会和国家报告。",
        },
      ],
    },
  },
  cs: {
    about: {
      eyebrow: "O IKA",
      title: "O International Kempo Association",
      intro:
        "International Kempo Association spojuje praktikující a organizace z celého světa, které sdílejí společné dědictví, fyzický styl a filozofii.",
    },
    philosophy: {
      eyebrow: "Filozofie",
      title: "Síla, soucit a soběstačnost.",
      intro:
        "Trénink IKA rozvíjí člověka technicky, mentálně i sociálně prostřednictvím párové praxe, meditace a filozofie.",
      quote: "Žít polovinu pro vlastní štěstí a polovinu pro štěstí druhých.",
      blocks: [
        {
          title: "Vzájemný rozvoj",
          text: "Praktikující trénují spolu, aby rostli společně.",
        },
        {
          title: "Obrana před útokem",
          text: "Techniky zdůrazňují kontrolu, rovnováhu, slabá místa a minimální nutnou sílu.",
        },
        {
          title: "Mysl a tělo",
          text: "Praxe kombinuje tvrdé a měkké techniky s meditací a reflexí.",
        },
        {
          title: "Pozitivní společnost",
          text: "Trénink má formovat lidi schopné přispívat s jistotou a soucitem.",
        },
      ],
    },
    countries: {
      eyebrow: "Členské země",
      title: "IKA ve světě",
      intro:
        "IKA spojuje clenske organizace napric zememi a kontinenty. Prohlednete si zeme propojene International Kempo Association.",
      countries: memberCountriesByLocale.cs,
    },
    dojos: {
      eyebrow: "Dódžó",
      title: "Najít IKA dódžó",
      intro:
        "Prohlednete si oficialni IKA dodzo podle zeme a mesta.",
    },
    news: {
      eyebrow: "Novinky",
      title: "Nejnovější zprávy IKA",
      intro:
        "Prectete si nejnovejsi novinky, zpravy a aktuality International Kempo Association.",
    },
    events: {
      eyebrow: "Události",
      title: "Semináře, kurzy a setkání",
      intro:
        "Najdete verejne seminare, kurzy, taikai a mezinarodni setkani IKA.",
    },
    join: {
      eyebrow: "Připojit se k IKA",
      title: "Propojte svou organizaci s mezinárodní rodinou IKA.",
      intro:
        "IKA vítá organizace sdílející technické kořeny, filozofii a závazek společně trénovat přes hranice.",
      steps: [
        {
          number: "01",
          title: "Kontaktovat IKA",
          text: "Představte svou organizaci a zemi.",
        },
        {
          number: "02",
          title: "Nechte nas vas poznat",
          text: "Sdelte nam vice o svem technickem, historickem a organizacnim zazemi.",
        },
        {
          number: "03",
          title: "Sdilet trening",
          text: "Pokud splnite predchozi podminky, pozveme vas na nekterou z nasich akci, abychom poznali vasi praxi a navzajem se lepe poznali.",
        },
        {
          number: "04",
          title: "Navrh a prijeti clenstvi",
          text: "Navrh clenstvi bude predlozen rade k posouzeni a rozhodnuti.",
        },
      ],
    },
    contact: {
      eyebrow: "Kontakt",
      title: "Kontaktujte International Kempo Association.",
      intro: "Použijte níže uvedený formulář pro kontaktování IKA.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Soukromý přístup",
      title: "Jedno přihlášení, správný portál pro každou roli.",
      intro:
        "Po přihlášení uživatel vstoupí do správného portálu podle své role: Kenshi, admin dódžó, admin země, globální admin nebo super admin.",
      blocks: [
        {
          title: "Kenshi",
          text: "Osobní profil, historie stupňů, kurzy, taikai, certifikáty a IKA Passport.",
        },
        {
          title: "Admin dódžó",
          text: "Stránka dódžó, Kenshi v dódžó, základní aktualizace a statistiky.",
        },
        {
          title: "Admin země",
          text: "Stránka země, dódžó, Kenshi, kurzy, taikai a národní zprávy.",
        },
      ],
    },
  },
};

const aboutSections: Partial<Record<Locale, AboutSection[]>> = {
  en: [
    {
      title: "About the IKA",
      image: "/images/about/about-intro.webp",
      body: [
        "The International Kempo Association was established in order to bring together practitioners of a particular family of martial arts from all over the world.",
        "Although member organisations use different names to describe their martial art, all of them share a common heritage, physical style, and most importantly of all: philosophy.",
        "The International Kempo Association brings all these organisations together, so that they can train together for mutual self-development, fun, and good company.",
      ],
    },
    {
      title: "What unites the IKA Kempo family?",
      image: "/images/about/kobe-2015.webp",
      body: [
        "The Kempo family of martial arts which make up the International Kempo Association are traditional Japanese martial arts, but can trace their heritage back to the Shaolin Temple in China.",
        "They are qualitatively different from both Chinese martial arts and Japanese karate styles.",
      ],
      bullets: [
        "They train in both hard techniques, such as kicks, punches and blocks, and soft techniques, such as throws, grappling and nerve point attacks.",
        "They train to develop both the mind and the body through physical training combined with meditation and philosophy.",
        "They emphasise compassion together with the strength of self-reliance.",
        "They practice in pairs to increase the speed of learning as well as building relationships.",
        "Their style comprises techniques that incapacitate with the minimum strength required by the defender and the minimum damage inflicted on the opponent.",
        "They place a strong emphasis on defence rather than attack.",
      ],
      note: "Kempo, or kenpo, is a term for several Japanese styles of martial arts and is shared by many members of the IKA. It is the Japanese reading of the Chinese quan fa, made up of ken, meaning fist, and ho, meaning method or system.",
    },
    {
      title: "History",
      image: "/images/about/history.webp",
      body: [
        "The founding members of the IKA originally met at the British Shorinji Kempo Federation's 40th anniversary celebrations in London, 2014.",
        "At a meeting after this event they pledged to cooperate to share teaching expertise and facilitate training across national borders and continental divides.",
        "The word Shorinji is the Japanese reading of the Chinese Shaolinsi, meaning Shaolin temple.",
      ],
    },
    {
      title: "Philosophy",
      image: "/images/about/philosophy.webp",
      body: [
        "All of the members of the IKA are united in the desire to develop individuals so that they can be confident and self-reliant enough to make a positive difference within their societies.",
        "This was best summarised by So Doshin, the founder of Shorinji Kempo, as living half for yourselves, and half for others.",
        "During training, students practice with each other for mutual development, not personal competition.",
      ],
    },
    {
      title: "Techniques",
      image: "/images/about/techniques.webp",
      body: [
        "The techniques practiced match the philosophy taught in classes. All of the techniques use principles that allow a less powerful defender to overcome a more powerful attacker.",
      ],
      bullets: [
        "By focusing on the natural weak points of the attacker's body, such as striking or applying pressure to nerve junctions.",
        "By using the attacker's instinctive reactions to influence and control their movements, for instance by interfering with their balance strategy.",
        "By understanding the mechanical principles that the human body is built upon, such as using joint reversals to throw.",
        "By using and redirecting the momentum of the attacker.",
      ],
      note: "The techniques form the defence to an attack and allow the defender to incapacitate the attacker with the minimum amount of damage.",
    },
  ],
  es: [
    {
      title: "Sobre IKA",
      image: "/images/about/about-intro.webp",
      body: [
        "La International Kempo Association fue creada para reunir a practicantes de una familia concreta de artes marciales de todo el mundo.",
        "Aunque las organizaciones miembro usan nombres distintos para describir su arte marcial, todas comparten una herencia común, un estilo físico y, por encima de todo, una filosofía.",
        "IKA une a estas organizaciones para que puedan entrenar juntas en desarrollo mutuo, amistad y buena compañía.",
      ],
    },
    {
      title: "¿Qué une a la familia Kempo de IKA?",
      image: "/images/about/kobe-2015.webp",
      body: [
        "La familia de artes marciales Kempo que forma la International Kempo Association pertenece a las artes marciales tradicionales japonesas, pero puede rastrear su herencia hasta el templo Shaolin en China.",
        "Son cualitativamente diferentes tanto de las artes marciales chinas como de los estilos japoneses de karate.",
      ],
      bullets: [
        "Entrenan técnicas duras, como patadas, golpes y bloqueos, y técnicas suaves, como proyecciones, agarres y ataques a puntos nerviosos.",
        "Desarrollan mente y cuerpo mediante entrenamiento físico combinado con meditación y filosofía.",
        "Ponen énfasis en la compasión junto con la fuerza de la autosuficiencia.",
        "Practican por parejas para acelerar el aprendizaje y construir relaciones.",
        "Su estilo incluye técnicas que incapacitan con la mínima fuerza necesaria del defensor y el mínimo daño al oponente.",
        "Dan una gran importancia a la defensa antes que al ataque.",
      ],
      note: "Kempo, o kenpo, es un término usado para varios estilos japoneses de artes marciales y compartido por muchos miembros de IKA. Es la lectura japonesa del chino quan fa: ken significa puño y ho significa método o sistema.",
    },
    {
      title: "Historia",
      image: "/images/about/history.webp",
      body: [
        "Los miembros fundadores de IKA se conocieron originalmente en las celebraciones del 40 aniversario de la British Shorinji Kempo Federation en Londres, en 2014.",
        "En una reunión posterior se comprometieron a cooperar, compartir experiencia docente y facilitar el entrenamiento entre países y continentes.",
        "La palabra Shorinji es la lectura japonesa del chino Shaolinsi, que significa templo Shaolin.",
      ],
    },
    {
      title: "Filosofía",
      image: "/images/about/philosophy.webp",
      body: [
        "Todos los miembros de IKA comparten el deseo de desarrollar personas seguras y autosuficientes, capaces de marcar una diferencia positiva en sus sociedades.",
        "So Doshin, fundador de Shorinji Kempo, lo resumió como vivir la mitad para uno mismo y la mitad para los demás.",
        "Durante el entrenamiento, los estudiantes practican entre sí para el desarrollo mutuo, no para la competición personal.",
      ],
    },
    {
      title: "Técnicas",
      image: "/images/about/techniques.webp",
      body: [
        "Las técnicas practicadas reflejan la filosofía enseñada en clase. Todas usan principios que permiten a un defensor menos fuerte superar a un atacante más poderoso.",
      ],
      bullets: [
        "Centrarse en los puntos débiles naturales del cuerpo del atacante, como golpear o presionar uniones nerviosas.",
        "Usar las reacciones instintivas del atacante para influir y controlar sus movimientos, por ejemplo alterando su equilibrio.",
        "Comprender los principios mecánicos del cuerpo humano, como el uso de inversiones articulares para proyectar.",
        "Usar y redirigir el impulso del atacante.",
      ],
      note: "Las técnicas son la defensa ante un ataque y permiten incapacitar al atacante con el mínimo daño posible.",
    },
  ],
  it: [],
  fr: [],
  ja: [],
  zh: [],
  cs: [],
};

const aboutQuote: Partial<Record<Locale, string[]>> = {
  en: [
    "Avoid rather than fight,",
    "Fight rather than hurt,",
    "Hurt rather than maim,",
    "Maim rather than kill,",
    "For all life is precious and cannot be replaced.",
  ],
  es: [
    "Evita antes que luchar,",
    "Lucha antes que herir,",
    "Hiere antes que mutilar,",
    "Mutila antes que matar,",
    "Porque toda vida es preciosa y no puede ser reemplazada.",
  ],
  it: [
    "Evita piuttosto che combattere,",
    "Combatti piuttosto che ferire,",
    "Ferire piuttosto che menomare,",
    "Menomare piuttosto che uccidere,",
    "Perché ogni vita è preziosa e non può essere sostituita.",
  ],
  fr: [
    "Éviter plutôt que combattre,",
    "Combattre plutôt que blesser,",
    "Blesser plutôt que mutiler,",
    "Mutiler plutôt que tuer,",
    "Car toute vie est précieuse et ne peut être remplacée.",
  ],
  ja: [
    "戦うより避ける、",
    "傷つけるより戦う、",
    "不具にするより傷つける、",
    "殺すより不具にする、",
    "すべての命は尊く、代えることができないから。",
  ],
  zh: [
    "能避则不战，",
    "能战则不伤，",
    "能伤则不残，",
    "能残则不杀，",
    "因为一切生命都珍贵且不可替代。",
  ],
  cs: [
    "Raději se vyhnout než bojovat,",
    "raději bojovat než zranit,",
    "raději zranit než zmrzačit,",
    "raději zmrzačit než zabít,",
    "protože každý život je vzácný a nelze jej nahradit.",
  ],
};

function localizeAboutFromSpanish(locale: Locale): AboutSection[] {
  if (locale === "en" || locale === "es") {
    return aboutSections[locale] ?? aboutSections[defaultLocale] ?? [];
  }

  const translations: Partial<Record<Locale, string[][]>> = {
    en: [],
    es: [],
    it: [
      [
        "Informazioni su IKA",
        "La International Kempo Association è stata creata per riunire praticanti di una particolare famiglia di arti marziali da tutto il mondo.",
        "Sebbene le organizzazioni membro usino nomi diversi per descrivere la loro arte marziale, tutte condividono un patrimonio comune, uno stile fisico e soprattutto una filosofia.",
        "IKA unisce queste organizzazioni affinché possano allenarsi insieme per lo sviluppo reciproco, l'amicizia e la buona compagnia.",
      ],
      [
        "Cosa unisce la famiglia Kempo di IKA?",
        "La famiglia di arti marziali Kempo che forma la International Kempo Association appartiene alle arti marziali tradizionali giapponesi, ma può far risalire il proprio patrimonio al tempio Shaolin in Cina.",
        "È qualitativamente diversa sia dalle arti marziali cinesi sia dagli stili giapponesi di karate.",
        "Allenano tecniche dure, come calci, pugni e parate, e tecniche morbide, come proiezioni, leve e attacchi ai punti nervosi.",
        "Sviluppano mente e corpo attraverso allenamento fisico combinato con meditazione e filosofia.",
        "Sottolineano la compassione insieme alla forza dell'autonomia.",
        "Praticano in coppia per aumentare la velocità di apprendimento e costruire relazioni.",
        "Il loro stile comprende tecniche che neutralizzano con la minima forza richiesta al difensore e il minimo danno inflitto all'avversario.",
        "Danno grande importanza alla difesa più che all'attacco.",
        "Kempo, o kenpo, è un termine per diversi stili giapponesi di arti marziali ed è condiviso da molti membri IKA. È la lettura giapponese del cinese quan fa: ken significa pugno e ho significa metodo o sistema.",
      ],
      [
        "Storia",
        "I membri fondatori di IKA si incontrarono originariamente alle celebrazioni del 40º anniversario della British Shorinji Kempo Federation a Londra, nel 2014.",
        "In una riunione successiva si impegnarono a cooperare, condividere competenze didattiche e facilitare l'allenamento oltre i confini nazionali e continentali.",
        "La parola Shorinji è la lettura giapponese del cinese Shaolinsi, che significa tempio Shaolin.",
      ],
      [
        "Filosofia",
        "Tutti i membri IKA sono uniti dal desiderio di sviluppare individui sicuri e autonomi, capaci di fare una differenza positiva nelle loro società.",
        "So Doshin, fondatore dello Shorinji Kempo, lo riassunse come vivere metà per sé stessi e metà per gli altri.",
        "Durante l'allenamento gli studenti praticano insieme per lo sviluppo reciproco, non per la competizione personale.",
      ],
      [
        "Tecniche",
        "Le tecniche praticate rispecchiano la filosofia insegnata nelle lezioni. Tutte usano principi che permettono a un difensore meno potente di superare un aggressore più forte.",
        "Concentrandosi sui punti deboli naturali del corpo dell'aggressore, come colpire o premere le giunzioni nervose.",
        "Usando le reazioni istintive dell'aggressore per influenzare e controllare i suoi movimenti, per esempio interferendo con l'equilibrio.",
        "Comprendendo i principi meccanici del corpo umano, come l'uso delle leve articolari per proiettare.",
        "Usando e reindirizzando lo slancio dell'aggressore.",
        "Le tecniche costituiscono la difesa da un attacco e permettono al difensore di neutralizzare l'aggressore con il minimo danno.",
      ],
    ],
    fr: [
      [
        "À propos d'IKA",
        "L'International Kempo Association a été créée afin de réunir des pratiquants d'une famille particulière d'arts martiaux du monde entier.",
        "Même si les organisations membres utilisent des noms différents pour décrire leur art martial, elles partagent toutes un héritage commun, un style physique et surtout une philosophie.",
        "IKA réunit ces organisations afin qu'elles puissent s'entraîner ensemble pour le développement mutuel, l'amitié et la bonne compagnie.",
      ],
      [
        "Qu'est-ce qui unit la famille Kempo d'IKA?",
        "La famille d'arts martiaux Kempo qui compose l'International Kempo Association appartient aux arts martiaux traditionnels japonais, mais peut retracer son héritage jusqu'au temple Shaolin en Chine.",
        "Elle est qualitativement différente des arts martiaux chinois comme des styles japonais de karaté.",
        "Elles pratiquent des techniques dures, comme les coups de pied, coups de poing et blocages, et des techniques souples, comme projections, saisies et attaques de points nerveux.",
        "Elles développent l'esprit et le corps par un entraînement physique associé à la méditation et à la philosophie.",
        "Elles soulignent la compassion avec la force de l'autonomie.",
        "Elles pratiquent en binôme pour accélérer l'apprentissage et construire des relations.",
        "Leur style comprend des techniques qui neutralisent avec la force minimale nécessaire au défenseur et le minimum de dommages infligés à l'adversaire.",
        "Elles mettent fortement l'accent sur la défense plutôt que l'attaque.",
        "Kempo, ou kenpo, est un terme désignant plusieurs styles japonais d'arts martiaux et partagé par de nombreux membres d'IKA. C'est la lecture japonaise du chinois quan fa: ken signifie poing et ho signifie méthode ou système.",
      ],
      [
        "Histoire",
        "Les membres fondateurs d'IKA se sont rencontrés à l'origine lors des célébrations du 40e anniversaire de la British Shorinji Kempo Federation à Londres, en 2014.",
        "Lors d'une réunion après cet événement, ils se sont engagés à coopérer, partager leur expertise pédagogique et faciliter l'entraînement au-delà des frontières nationales et continentales.",
        "Le mot Shorinji est la lecture japonaise du chinois Shaolinsi, qui signifie temple Shaolin.",
      ],
      [
        "Philosophie",
        "Tous les membres d'IKA sont unis par le désir de développer des individus confiants et autonomes, capables d'apporter une différence positive dans leurs sociétés.",
        "So Doshin, fondateur du Shorinji Kempo, l'a résumé par vivre moitié pour soi-même et moitié pour les autres.",
        "Pendant l'entraînement, les élèves pratiquent ensemble pour le développement mutuel, non pour la compétition personnelle.",
      ],
      [
        "Techniques",
        "Les techniques pratiquées correspondent à la philosophie enseignée en cours. Elles utilisent des principes permettant à un défenseur moins puissant de vaincre un attaquant plus fort.",
        "En se concentrant sur les points faibles naturels du corps de l'attaquant, par exemple en frappant ou en exerçant une pression sur les jonctions nerveuses.",
        "En utilisant les réactions instinctives de l'attaquant pour influencer et contrôler ses mouvements, par exemple en perturbant son équilibre.",
        "En comprenant les principes mécaniques du corps humain, comme l'utilisation des inversions articulaires pour projeter.",
        "En utilisant et en redirigeant l'élan de l'attaquant.",
        "Les techniques constituent la défense contre une attaque et permettent au défenseur de neutraliser l'attaquant avec un minimum de dommages.",
      ],
    ],
    ja: [
      [
        "IKAについて",
        "国際拳法協会は、世界中にある特定の武道ファミリーの実践者を結びつけるために設立されました。",
        "加盟団体は自らの武道を説明するために異なる名称を使うことがありますが、すべてが共通の伝統、身体技法、そして何より哲学を共有しています。",
        "IKAはこれらの団体を結び、相互の自己成長、楽しさ、良い仲間づくりのために共に稽古できるようにします。",
      ],
      [
        "IKAのKempoファミリーを結ぶもの",
        "国際拳法協会を構成するKempoの武道ファミリーは日本の伝統武道ですが、その伝統は中国の少林寺にまで遡ることができます。",
        "それらは中国武術とも日本の空手流派とも質的に異なります。",
        "蹴り、突き、受けなどの剛法と、投げ、組み技、急所攻撃などの柔法を稽古します。",
        "身体的稽古に瞑想と哲学を組み合わせ、心と身体の両方を育てます。",
        "慈悲と自立の強さを重視します。",
        "学習速度を高め、関係を築くために相対で稽古します。",
        "防御者に必要な最小限の力と、相手への最小限の損傷で制圧する技法で構成されています。",
        "攻撃よりも防御を強く重視します。",
        "Kempo、またはkenpoは、複数の日本武道の名称であり、多くのIKAメンバーに共有されています。中国語のquan faの日本語読みで、kenは拳、hoは方法または体系を意味します。",
      ],
      [
        "歴史",
        "IKAの創設メンバーは、2014年ロンドンで行われたBritish Shorinji Kempo Federationの40周年記念行事で初めて出会いました。",
        "その後の会合で、指導経験を共有し、国境や大陸を越えた稽古を促進するために協力することを誓いました。",
        "Shorinjiという言葉は、中国語のShaolinsi、すなわち少林寺の日本語読みです。",
      ],
      [
        "哲学",
        "IKAのすべてのメンバーは、自信と自立を持ち、社会に前向きな違いを生み出せる個人を育てたいという願いで結ばれています。",
        "これは少林寺拳法の創始者である宗道臣が、半ばは自己のため、半ばは他人のために生きる、と最もよく表現しました。",
        "稽古中、学生は個人的な競争ではなく相互の発展のために互いに練習します。",
      ],
      [
        "技法",
        "稽古される技法は、授業で教えられる哲学に一致しています。すべての技法は、力の弱い防御者がより強い攻撃者を制するための原理を用います。",
        "神経の接合部を打つ、または圧迫するなど、攻撃者の身体の自然な弱点に焦点を当てます。",
        "攻撃者の本能的反応を利用して動きを誘導・制御します。たとえばバランス戦略を崩します。",
        "関節の反転を用いて投げるなど、人体の機械的原理を理解します。",
        "攻撃者の勢いを利用し、方向を変えます。",
        "技法は攻撃に対する防御であり、防御者が最小限の損傷で攻撃者を制圧できるようにします。",
      ],
    ],
    zh: [
      [
        "关于 IKA",
        "国际拳法协会的成立，是为了汇聚来自世界各地、属于同一武道大家庭的练习者。",
        "虽然成员组织使用不同名称描述自己的武道，但它们都共享共同传承、身体风格，最重要的是共同哲学。",
        "IKA 将这些组织连接在一起，使它们能够为了相互自我成长、友谊和良好伙伴关系而共同训练。",
      ],
      [
        "是什么连接 IKA 的 Kempo 大家庭？",
        "组成国际拳法协会的 Kempo 武道家族属于日本传统武道，但其传承可追溯至中国少林寺。",
        "它们在性质上不同于中国武术，也不同于日本空手道流派。",
        "它们训练刚性技术，如踢、打和格挡，也训练柔性技术，如投技、擒拿和神经点攻击。",
        "它们通过身体训练结合冥想和哲学，同时发展心灵与身体。",
        "它们强调慈悲以及自立的力量。",
        "它们通过双人练习提高学习速度并建立关系。",
        "其风格包含以防御者所需的最小力量和对对手造成的最小伤害进行制伏的技术。",
        "它们强调整体上防御重于攻击。",
        "Kempo 或 kenpo 是若干日本武道流派的术语，也被许多 IKA 成员共同使用。它是中文“拳法”的日语读法，其中 ken 指拳，ho 指方法或体系。",
      ],
      [
        "历史",
        "IKA 的创始成员最初在 2014 年伦敦 British Shorinji Kempo Federation 成立 40 周年庆典上相遇。",
        "在该活动之后的一次会议上，他们承诺合作、分享教学经验，并促进跨越国界和大陆的训练。",
        "Shorinji 一词是中文 Shaolinsi，即少林寺的日语读法。",
      ],
      [
        "哲学",
        "IKA 的所有成员都希望培养自信、自立，并能够在社会中产生积极影响的人。",
        "少林寺拳法创始人宗道臣将其概括为：一半为自己而活，一半为他人而活。",
        "训练中，学生彼此练习是为了共同发展，而不是个人竞争。",
      ],
      [
        "技术",
        "所练习的技术与课堂上教授的哲学相一致。所有技术都运用原则，使力量较弱的防御者能够战胜更强的攻击者。",
        "关注攻击者身体的自然弱点，例如打击或按压神经交汇处。",
        "利用攻击者的本能反应影响并控制其动作，例如干扰其平衡策略。",
        "理解人体构造的机械原理，例如利用关节反转进行投技。",
        "利用并重新引导攻击者的动量。",
        "这些技术构成对攻击的防御，使防御者能够以最小伤害制伏攻击者。",
      ],
    ],
    cs: [
      [
        "O IKA",
        "International Kempo Association byla založena, aby spojila praktikující určité rodiny bojových umění z celého světa.",
        "Ačkoli členské organizace používají různé názvy pro své bojové umění, všechny sdílejí společné dědictví, fyzický styl a především filozofii.",
        "IKA tyto organizace spojuje, aby mohly trénovat společně pro vzájemný seberozvoj, radost a dobrou společnost.",
      ],
      [
        "Co spojuje rodinu Kempo IKA?",
        "Rodina bojových umění Kempo tvořící International Kempo Association patří k tradičním japonským bojovým uměním, ale její dědictví lze vysledovat až k chrámu Shaolin v Číně.",
        "Je kvalitativně odlišná od čínských bojových umění i japonských stylů karate.",
        "Trénují tvrdé techniky, jako kopy, údery a bloky, i měkké techniky, jako hody, páky a útoky na nervové body.",
        "Rozvíjejí mysl i tělo prostřednictvím fyzického tréninku kombinovaného s meditací a filozofií.",
        "Zdůrazňují soucit spolu se silou soběstačnosti.",
        "Cvičí ve dvojicích, aby zrychlili učení a budovali vztahy.",
        "Jejich styl zahrnuje techniky, které zneškodní protivníka s minimální silou obránce a minimálním poškozením protivníka.",
        "Silně zdůrazňují obranu před útokem.",
        "Kempo, nebo kenpo, je termín pro několik japonských stylů bojových umění a sdílí jej mnoho členů IKA. Je to japonské čtení čínského quan fa: ken znamená pěst a ho znamená metoda nebo systém.",
      ],
      [
        "Historie",
        "Zakládající členové IKA se původně setkali na oslavách 40. výročí British Shorinji Kempo Federation v Londýně v roce 2014.",
        "Na následné schůzce se zavázali spolupracovat, sdílet pedagogické zkušenosti a usnadňovat trénink přes národní hranice a kontinenty.",
        "Slovo Shorinji je japonské čtení čínského Shaolinsi, což znamená chrám Shaolin.",
      ],
      [
        "Filozofie",
        "Všechny členy IKA spojuje přání rozvíjet jednotlivce tak, aby byli sebevědomí a soběstační a dokázali pozitivně působit ve své společnosti.",
        "So Doshin, zakladatel Shorinji Kempo, to nejlépe shrnul jako žít polovinu pro sebe a polovinu pro druhé.",
        "Během tréninku studenti cvičí spolu pro vzájemný rozvoj, nikoli pro osobní soutěžení.",
      ],
      [
        "Techniky",
        "Procvičované techniky odpovídají filozofii vyučované v hodinách. Všechny používají principy, které umožňují méně silnému obránci překonat silnějšího útočníka.",
        "Zaměřením na přirozená slabá místa těla útočníka, například úderem nebo tlakem na nervové spoje.",
        "Využitím instinktivních reakcí útočníka k ovlivnění a kontrole jeho pohybů, například narušením rovnováhy.",
        "Pochopením mechanických principů lidského těla, například použitím kloubních zvratů k hodu.",
        "Využitím a přesměrováním hybnosti útočníka.",
        "Techniky tvoří obranu proti útoku a umožňují obránci zneškodnit útočníka s minimálním poškozením.",
      ],
    ],
  };

  const localizedSections = translations[locale] ?? translations.es ?? translations.en;

  if (!localizedSections) {
    return aboutSections[defaultLocale] ?? [];
  }

  return localizedSections.map((section, index) => {
    const base =
      aboutSections.en?.[index] ??
      aboutSections[defaultLocale]?.[index] ?? {
        title: section[0],
        image: "/images/about/about-1.webp",
        body: section.slice(1),
      };
    if (index === 0 || index === 2 || index === 3) {
      return {
        title: section[0],
        image: base.image,
        body: section.slice(1),
      };
    }

    if (index === 1) {
      return {
        title: section[0],
        image: base.image,
        body: section.slice(1, 3),
        bullets: section.slice(3, 9),
        note: section[9],
      };
    }

    return {
      title: section[0],
      image: base.image,
      body: section.slice(1, 2),
      bullets: section.slice(2, 6),
      note: section[6],
    };
  });
}

export function getPublicPageContent(locale: Locale, page: PublicPageKey) {
  return (
    (extendedPublicPageContent[locale]?.[page] as PublicPageContent | undefined) ??
    content[locale]?.[page] ??
    (extendedPublicPageContent[defaultLocale]?.[page] as PublicPageContent | undefined) ??
    content[defaultLocale]![page]
  );
}

export function getAboutSections(locale: Locale) {
  const extendedSections = extendedAboutSections[locale];
  if (extendedSections?.length) {
    return extendedSections as AboutSection[];
  }

  if (locale === "en" || locale === "es") {
    return aboutSections[locale] ?? aboutSections[defaultLocale] ?? [];
  }

  return localizeAboutFromSpanish(locale);
}

export function getAboutQuote(locale: Locale) {
  return (
    extendedAboutQuotes[locale] ??
    aboutQuote[locale] ??
    extendedAboutQuotes[defaultLocale] ??
    aboutQuote[defaultLocale] ??
    []
  );
}
