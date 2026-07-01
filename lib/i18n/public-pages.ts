import { defaultLocale, type Locale } from "./config";

type TextBlock = {
  title: string;
  text: string;
};

type StepBlock = {
  number: string;
  title: string;
  text: string;
};

type PublicPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  quote?: string;
  blocks?: TextBlock[];
  steps?: StepBlock[];
  countries?: string[];
  emailLabel?: string;
};

type PublicPageKey =
  | "about"
  | "philosophy"
  | "countries"
  | "dojos"
  | "news"
  | "events"
  | "join"
  | "contact"
  | "portal";

const memberCountries = [
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
];

const content: Record<Locale, Record<PublicPageKey, PublicPageContent>> = {
  en: {
    about: {
      eyebrow: "About IKA",
      title: "An international association for a shared Kempo family.",
      intro:
        "The International Kempo Association brings together practitioners and organisations from around the world who share a common heritage, physical style, and philosophy.",
      blocks: [
        {
          title: "Founded in Kobe",
          text: "IKA was officially launched in October 2015 at the inaugural IKA seminar in Kobe, Japan.",
        },
        {
          title: "Common roots",
          text: "Member organisations may use different names, but they are united by teachings connected to Doshin So and the spirit of Shorinji Kempo.",
        },
      ],
    },
    philosophy: {
      eyebrow: "Philosophy",
      title: "Strength, compassion, and self-reliance.",
      intro:
        "IKA training develops people technically, mentally, and socially through paired practice, meditation, and philosophy.",
      quote:
        "Live half for the happiness of oneself, and half for the happiness of others.",
      blocks: [
        { title: "Mutual development", text: "Practitioners train with each other to grow together." },
        { title: "Defence before attack", text: "Techniques emphasise control, balance, weak points, and minimum necessary force." },
        { title: "Mind and body", text: "Practice combines hard and soft techniques with meditation and reflection." },
        { title: "Positive society", text: "Training should build people who contribute confidently and compassionately." },
      ],
    },
    countries: {
      eyebrow: "Member countries",
      title: "IKA around the world",
      intro:
        "IKA brings together member organisations across countries and continents. This directory will become fully editable from the CMS.",
      countries: memberCountries,
    },
    dojos: {
      eyebrow: "Dojos",
      title: "Find an IKA dojo",
      intro:
        "The public dojo directory will list official dojos by country and city once the CMS and country administration tools are connected.",
    },
    news: {
      eyebrow: "News",
      title: "Latest IKA news",
      intro:
        "Published multilingual news will appear here once the CMS module is connected.",
    },
    events: {
      eyebrow: "Events",
      title: "Seminars, courses, and gatherings",
      intro:
        "Public events will be listed here. Courses and taikais will remain separate modules in the private administration system.",
    },
    join: {
      eyebrow: "Join IKA",
      title: "Connect your organisation with the international IKA family.",
      intro:
        "IKA welcomes organisations that share the association's technical roots, philosophy, and commitment to training together across borders.",
      steps: [
        { number: "01", title: "Contact IKA", text: "Introduce your organisation and country." },
        { number: "02", title: "Review alignment", text: "Share technical, historical, and organisational background." },
        { number: "03", title: "Train together", text: "Join seminars, events, and association activities." },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Get in touch with the International Kempo Association.",
      intro: "Use the official contact email for association enquiries.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Private access",
      title: "One login, the right portal for each role.",
      intro:
        "After login, each user will enter the correct portal according to their role: Kenshi, dojo admin, country admin, global admin, or super admin.",
      blocks: [
        { title: "Kenshi", text: "Personal profile, grade history, courses, taikais, certificates, and IKA Passport." },
        { title: "Dojo Admin", text: "Dojo page, Kenshi in the dojo, basic updates, and dojo statistics." },
        { title: "Country Admin", text: "Country page, dojos, Kenshi, courses, taikais, and country reports." },
      ],
    },
  },
  es: {
    about: {
      eyebrow: "Sobre IKA",
      title: "Una asociación internacional para una familia Kempo común.",
      intro:
        "La International Kempo Association reúne a practicantes y organizaciones de todo el mundo que comparten herencia, estilo físico y filosofía.",
      blocks: [
        { title: "Fundada en Kobe", text: "IKA se lanzó oficialmente en octubre de 2015 durante el primer seminario IKA en Kobe, Japón." },
        { title: "Raíces comunes", text: "Las organizaciones miembro pueden usar nombres distintos, pero están unidas por las enseñanzas de Doshin So y el espíritu de Shorinji Kempo." },
      ],
    },
    philosophy: {
      eyebrow: "Filosofía",
      title: "Fuerza, compasión y autosuficiencia.",
      intro:
        "El entrenamiento IKA desarrolla a las personas técnica, mental y socialmente mediante práctica por parejas, meditación y filosofía.",
      quote:
        "Vivir la mitad para la felicidad de uno mismo y la mitad para la felicidad de los demás.",
      blocks: [
        { title: "Desarrollo mutuo", text: "Los practicantes entrenan juntos para crecer juntos." },
        { title: "Defensa antes que ataque", text: "Las técnicas priorizan control, equilibrio, puntos débiles y fuerza mínima necesaria." },
        { title: "Mente y cuerpo", text: "La práctica combina técnicas duras y suaves con meditación y reflexión." },
        { title: "Sociedad positiva", text: "El entrenamiento debe formar personas capaces de aportar con confianza y compasión." },
      ],
    },
    countries: {
      eyebrow: "Países miembros",
      title: "IKA alrededor del mundo",
      intro:
        "IKA reúne organizaciones miembro en distintos países y continentes. Este directorio será editable desde el CMS.",
      countries: memberCountries,
    },
    dojos: {
      eyebrow: "Dojos",
      title: "Encuentra un dojo IKA",
      intro:
        "El directorio público de dojos mostrará dojos oficiales por país y ciudad cuando el CMS y las herramientas de administración estén conectadas.",
    },
    news: {
      eyebrow: "Noticias",
      title: "Últimas noticias de IKA",
      intro: "Las noticias multilingües publicadas aparecerán aquí cuando se conecte el módulo CMS.",
    },
    events: {
      eyebrow: "Eventos",
      title: "Seminarios, cursos y encuentros",
      intro:
        "Los eventos públicos aparecerán aquí. Los cursos y taikais seguirán siendo módulos separados en la administración privada.",
    },
    join: {
      eyebrow: "Unirse a IKA",
      title: "Conecta tu organización con la familia internacional IKA.",
      intro:
        "IKA da la bienvenida a organizaciones que comparten sus raíces técnicas, filosofía y compromiso de entrenar juntas a través de fronteras.",
      steps: [
        { number: "01", title: "Contactar con IKA", text: "Presenta tu organización y país." },
        { number: "02", title: "Revisar alineación", text: "Comparte información técnica, histórica y organizativa." },
        { number: "03", title: "Entrenar juntos", text: "Participa en seminarios, eventos y actividades de la asociación." },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      title: "Contacta con la International Kempo Association.",
      intro: "Usa el email oficial para consultas sobre la asociación.",
      emailLabel: "Email",
    },
    portal: {
      eyebrow: "Acceso privado",
      title: "Un solo login, el portal correcto para cada rol.",
      intro:
        "Después de iniciar sesión, cada usuario entrará en el portal correspondiente: Kenshi, admin de dojo, admin de país, admin global o super admin.",
      blocks: [
        { title: "Kenshi", text: "Perfil personal, grados, cursos, taikais, certificados e IKA Passport." },
        { title: "Admin de dojo", text: "Página del dojo, Kenshi del dojo, actualizaciones básicas y estadísticas." },
        { title: "Admin de país", text: "Página del país, dojos, Kenshi, cursos, taikais e informes." },
      ],
    },
  },
  it: {
    about: {
      eyebrow: "IKA",
      title: "Un'associazione internazionale per una famiglia Kempo comune.",
      intro:
        "La International Kempo Association riunisce praticanti e organizzazioni che condividono patrimonio, stile e filosofia.",
      blocks: [
        { title: "Fondata a Kobe", text: "IKA è stata lanciata ufficialmente nell'ottobre 2015 al primo seminario IKA a Kobe, Giappone." },
        { title: "Radici comuni", text: "Le organizzazioni membro sono unite dagli insegnamenti di Doshin So e dallo spirito dello Shorinji Kempo." },
      ],
    },
    philosophy: {
      eyebrow: "Filosofia",
      title: "Forza, compassione e autonomia.",
      intro: "La pratica IKA sviluppa le persone tecnicamente, mentalmente e socialmente.",
      quote: "Vivere metà per la felicità di sé stessi e metà per la felicità degli altri.",
      blocks: [
        { title: "Sviluppo reciproco", text: "I praticanti si allenano insieme per crescere insieme." },
        { title: "Difesa prima dell'attacco", text: "Le tecniche privilegiano controllo, equilibrio e forza minima necessaria." },
        { title: "Mente e corpo", text: "La pratica combina tecniche dure e morbide con meditazione." },
        { title: "Società positiva", text: "L'allenamento deve formare persone capaci di contribuire con compassione." },
      ],
    },
    countries: { eyebrow: "Paesi membri", title: "IKA nel mondo", intro: "IKA riunisce organizzazioni membro in diversi paesi e continenti.", countries: memberCountries },
    dojos: { eyebrow: "Dojo", title: "Trova un dojo IKA", intro: "Il direttorio pubblico dei dojo mostrerà i dojo ufficiali per paese e città." },
    news: { eyebrow: "Notizie", title: "Ultime notizie IKA", intro: "Le notizie multilingue pubblicate appariranno qui quando il CMS sarà collegato." },
    events: { eyebrow: "Eventi", title: "Seminari, corsi e incontri", intro: "Gli eventi pubblici appariranno qui. Corsi e taikai saranno moduli separati." },
    join: {
      eyebrow: "Unisciti a IKA",
      title: "Collega la tua organizzazione alla famiglia internazionale IKA.",
      intro: "IKA accoglie organizzazioni che condividono radici tecniche, filosofia e formazione comune.",
      steps: [
        { number: "01", title: "Contatta IKA", text: "Presenta la tua organizzazione e il paese." },
        { number: "02", title: "Verifica l'allineamento", text: "Condividi informazioni tecniche, storiche e organizzative." },
        { number: "03", title: "Allenarsi insieme", text: "Partecipa a seminari, eventi e attività." },
      ],
    },
    contact: { eyebrow: "Contatti", title: "Contatta la International Kempo Association.", intro: "Usa l'email ufficiale per richieste sull'associazione.", emailLabel: "Email" },
    portal: { eyebrow: "Accesso privato", title: "Un login, il portale giusto per ogni ruolo.", intro: "Dopo il login ogni utente entra nel portale corretto secondo il ruolo.", blocks: [
      { title: "Kenshi", text: "Profilo personale, gradi, corsi, taikai, certificati e IKA Passport." },
      { title: "Admin dojo", text: "Pagina dojo, Kenshi del dojo, aggiornamenti e statistiche." },
      { title: "Admin paese", text: "Pagina paese, dojo, Kenshi, corsi, taikai e report." },
    ] },
  },
  fr: {
    about: { eyebrow: "À propos", title: "Une association internationale pour une famille Kempo commune.", intro: "L'International Kempo Association réunit des pratiquants et organisations partageant héritage, style et philosophie.", blocks: [
      { title: "Fondée à Kobe", text: "IKA a été lancée officiellement en octobre 2015 lors du premier séminaire IKA à Kobe, au Japon." },
      { title: "Racines communes", text: "Les organisations membres sont unies par les enseignements de Doshin So et l'esprit du Shorinji Kempo." },
    ] },
    philosophy: { eyebrow: "Philosophie", title: "Force, compassion et autonomie.", intro: "L'entraînement IKA développe les personnes techniquement, mentalement et socialement.", quote: "Vivre moitié pour son propre bonheur, moitié pour le bonheur des autres.", blocks: [
      { title: "Développement mutuel", text: "Les pratiquants s'entraînent ensemble pour grandir ensemble." },
      { title: "Défense avant attaque", text: "Les techniques privilégient contrôle, équilibre et force minimale." },
      { title: "Esprit et corps", text: "La pratique combine techniques dures et souples avec méditation." },
      { title: "Société positive", text: "L'entraînement forme des personnes capables de contribuer avec compassion." },
    ] },
    countries: { eyebrow: "Pays membres", title: "IKA dans le monde", intro: "IKA réunit des organisations membres dans plusieurs pays et continents.", countries: memberCountries },
    dojos: { eyebrow: "Dojos", title: "Trouver un dojo IKA", intro: "Le répertoire public des dojos affichera les dojos officiels par pays et ville." },
    news: { eyebrow: "Actualités", title: "Dernières actualités IKA", intro: "Les actualités multilingues publiées apparaîtront ici lorsque le CMS sera connecté." },
    events: { eyebrow: "Événements", title: "Séminaires, cours et rencontres", intro: "Les événements publics apparaîtront ici. Les cours et taikais resteront des modules séparés." },
    join: { eyebrow: "Rejoindre IKA", title: "Reliez votre organisation à la famille internationale IKA.", intro: "IKA accueille les organisations partageant ses racines techniques, sa philosophie et l'entraînement commun.", steps: [
      { number: "01", title: "Contacter IKA", text: "Présentez votre organisation et votre pays." },
      { number: "02", title: "Vérifier l'alignement", text: "Partagez les informations techniques, historiques et organisationnelles." },
      { number: "03", title: "S'entraîner ensemble", text: "Participez aux séminaires, événements et activités." },
    ] },
    contact: { eyebrow: "Contact", title: "Contactez l'International Kempo Association.", intro: "Utilisez l'email officiel pour les demandes concernant l'association.", emailLabel: "Email" },
    portal: { eyebrow: "Accès privé", title: "Un login, le bon portail pour chaque rôle.", intro: "Après connexion, chaque utilisateur accède au portail correspondant à son rôle.", blocks: [
      { title: "Kenshi", text: "Profil, grades, cours, taikais, certificats et IKA Passport." },
      { title: "Admin dojo", text: "Page dojo, Kenshi du dojo, mises à jour et statistiques." },
      { title: "Admin pays", text: "Page pays, dojos, Kenshi, cours, taikais et rapports." },
    ] },
  },
  ja: {
    about: { eyebrow: "IKAについて", title: "共通のKempoファミリーのための国際協会。", intro: "International Kempo Associationは、共通の伝統、技術、哲学を持つ実践者と団体を結びます。", blocks: [
      { title: "神戸で発足", text: "IKAは2015年10月、神戸での第1回IKAセミナーで正式に発足しました。" },
      { title: "共通の根", text: "加盟団体は宗道臣の教えと少林寺拳法の精神で結ばれています。" },
    ] },
    philosophy: { eyebrow: "理念", title: "強さ、慈悲、自立。", intro: "IKAの稽古は、技術、心、社会性を育てます。", quote: "自己の幸福の半分を、他者の幸福の半分を。", blocks: [
      { title: "相互の成長", text: "共に稽古し、共に成長します。" },
      { title: "攻撃より防御", text: "制御、崩し、急所、最小限の力を重視します。" },
      { title: "心と身体", text: "剛法と柔法、瞑想、内省を組み合わせます。" },
      { title: "より良い社会", text: "自信と慈悲を持って社会に貢献する人を育てます。" },
    ] },
    countries: { eyebrow: "加盟国", title: "世界のIKA", intro: "IKAは国と大陸を越えて加盟団体を結びます。", countries: memberCountries },
    dojos: { eyebrow: "道場", title: "IKA道場を探す", intro: "公式道場一覧は、CMS接続後に国と都市別に表示されます。" },
    news: { eyebrow: "ニュース", title: "IKA最新ニュース", intro: "CMS接続後、公開済みの多言語ニュースがここに表示されます。" },
    events: { eyebrow: "イベント", title: "セミナー、講習、集まり", intro: "公開イベントを表示します。講習と大会は別モジュールで管理します。" },
    join: { eyebrow: "参加", title: "あなたの団体を国際IKAファミリーへ。", intro: "IKAは技術的な根、哲学、国境を越えた稽古を共有する団体を歓迎します。", steps: [
      { number: "01", title: "IKAへ連絡", text: "団体と国を紹介します。" },
      { number: "02", title: "方向性の確認", text: "技術、歴史、組織情報を共有します。" },
      { number: "03", title: "共に稽古", text: "セミナー、イベント、協会活動に参加します。" },
    ] },
    contact: { eyebrow: "連絡", title: "International Kempo Associationへお問い合わせください。", intro: "協会への問い合わせは公式メールをご利用ください。", emailLabel: "Email" },
    portal: { eyebrow: "専用アクセス", title: "一つのログインで役割に応じたポータルへ。", intro: "ログイン後、拳士、道場管理者、国管理者、グローバル管理者、スーパー管理者の役割に応じて移動します。", blocks: [
      { title: "拳士", text: "プロフィール、段位、講習、大会、証明書、IKA Passport。" },
      { title: "道場管理者", text: "道場ページ、所属拳士、基本更新、統計。" },
      { title: "国管理者", text: "国ページ、道場、拳士、講習、大会、レポート。" },
    ] },
  },
  zh: {
    about: { eyebrow: "关于 IKA", title: "面向共同 Kempo 家庭的国际协会。", intro: "International Kempo Association 连接拥有共同传承、技术风格和哲学的练习者与组织。", blocks: [
      { title: "创立于神户", text: "IKA 于 2015 年 10 月在日本神户首届 IKA 研讨会上正式启动。" },
      { title: "共同根基", text: "成员组织由宗道臣的教义和少林寺拳法精神连接在一起。" },
    ] },
    philosophy: { eyebrow: "理念", title: "力量、慈悲与自立。", intro: "IKA 训练通过双人练习、冥想和哲学发展人的技术、心智和社会能力。", quote: "一半为自己的幸福而活，一半为他人的幸福而活。", blocks: [
      { title: "共同成长", text: "练习者共同训练，共同成长。" },
      { title: "防御优先", text: "技术强调控制、平衡、弱点和必要的最小力量。" },
      { title: "身心合一", text: "练习结合刚法、柔法、冥想和反思。" },
      { title: "积极社会", text: "训练培养能够自信且慈悲地贡献社会的人。" },
    ] },
    countries: { eyebrow: "成员国家", title: "世界各地的 IKA", intro: "IKA 连接多个国家和大洲的成员组织。", countries: memberCountries },
    dojos: { eyebrow: "道场", title: "寻找 IKA 道场", intro: "连接 CMS 后，公开道场目录将按国家和城市显示官方道场。" },
    news: { eyebrow: "新闻", title: "IKA 最新新闻", intro: "连接 CMS 后，已发布的多语言新闻将在这里显示。" },
    events: { eyebrow: "活动", title: "研讨会、课程和聚会", intro: "公开活动将在这里显示。课程和大会将作为独立模块管理。" },
    join: { eyebrow: "加入 IKA", title: "将你的组织连接到国际 IKA 家庭。", intro: "IKA 欢迎共享技术根基、哲学和跨国训练承诺的组织。", steps: [
      { number: "01", title: "联系 IKA", text: "介绍你的组织和国家。" },
      { number: "02", title: "审查契合度", text: "分享技术、历史和组织背景。" },
      { number: "03", title: "共同训练", text: "参加研讨会、活动和协会项目。" },
    ] },
    contact: { eyebrow: "联系", title: "联系 International Kempo Association。", intro: "请使用官方邮箱进行协会相关咨询。", emailLabel: "Email" },
    portal: { eyebrow: "私人访问", title: "一个登录，根据角色进入正确门户。", intro: "登录后，用户将根据角色进入拳士、道场管理员、国家管理员、全球管理员或超级管理员门户。", blocks: [
      { title: "拳士", text: "个人资料、段位、课程、大会、证书和 IKA Passport。" },
      { title: "道场管理员", text: "道场页面、道场拳士、基础更新和统计。" },
      { title: "国家管理员", text: "国家页面、道场、拳士、课程、大会和报告。" },
    ] },
  },
  cs: {
    about: { eyebrow: "O IKA", title: "Mezinárodní asociace pro společnou rodinu Kempo.", intro: "International Kempo Association spojuje praktikující a organizace se společným dědictvím, stylem a filozofií.", blocks: [
      { title: "Založeno v Kobe", text: "IKA byla oficiálně zahájena v říjnu 2015 na prvním semináři IKA v Kobe v Japonsku." },
      { title: "Společné kořeny", text: "Členské organizace spojují učení Doshina So a duch Shorinji Kempo." },
    ] },
    philosophy: { eyebrow: "Filozofie", title: "Síla, soucit a soběstačnost.", intro: "Trénink IKA rozvíjí člověka technicky, mentálně i sociálně.", quote: "Žít polovinu pro vlastní štěstí a polovinu pro štěstí druhých.", blocks: [
      { title: "Vzájemný rozvoj", text: "Praktikující trénují spolu, aby rostli společně." },
      { title: "Obrana před útokem", text: "Techniky zdůrazňují kontrolu, rovnováhu a minimální nutnou sílu." },
      { title: "Mysl a tělo", text: "Praxe kombinuje tvrdé a měkké techniky s meditací." },
      { title: "Pozitivní společnost", text: "Trénink formuje lidi schopné přispívat s jistotou a soucitem." },
    ] },
    countries: { eyebrow: "Členské země", title: "IKA ve světě", intro: "IKA spojuje členské organizace napříč zeměmi a kontinenty.", countries: memberCountries },
    dojos: { eyebrow: "Dódžó", title: "Najít IKA dódžó", intro: "Veřejný adresář dódžó zobrazí oficiální dódžó podle země a města." },
    news: { eyebrow: "Novinky", title: "Nejnovější zprávy IKA", intro: "Publikované vícejazyčné novinky se zobrazí po připojení CMS." },
    events: { eyebrow: "Události", title: "Semináře, kurzy a setkání", intro: "Veřejné události se zobrazí zde. Kurzy a taikai zůstanou samostatné moduly." },
    join: { eyebrow: "Připojit se k IKA", title: "Propojte svou organizaci s mezinárodní rodinou IKA.", intro: "IKA vítá organizace sdílející technické kořeny, filozofii a společný trénink.", steps: [
      { number: "01", title: "Kontaktovat IKA", text: "Představte organizaci a zemi." },
      { number: "02", title: "Ověřit soulad", text: "Sdílejte technické, historické a organizační informace." },
      { number: "03", title: "Trénovat společně", text: "Účastněte se seminářů, událostí a aktivit." },
    ] },
    contact: { eyebrow: "Kontakt", title: "Kontaktujte International Kempo Association.", intro: "Pro dotazy k asociaci použijte oficiální email.", emailLabel: "Email" },
    portal: { eyebrow: "Soukromý přístup", title: "Jedno přihlášení, správný portál pro každou roli.", intro: "Po přihlášení uživatel vstoupí do portálu podle své role.", blocks: [
      { title: "Kenshi", text: "Profil, historie stupňů, kurzy, taikai, certifikáty a IKA Passport." },
      { title: "Admin dódžó", text: "Stránka dódžó, Kenshi v dódžó, aktualizace a statistiky." },
      { title: "Admin země", text: "Stránka země, dódžó, Kenshi, kurzy, taikai a reporty." },
    ] },
  },
};

export function getPublicPageContent(locale: Locale, page: PublicPageKey) {
  return content[locale]?.[page] ?? content[defaultLocale][page];
}
