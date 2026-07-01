import type { Locale } from "./config";

type Dictionary = {
  nav: {
    home: string;
    about: string;
    philosophy: string;
    countries: string;
    dojos: string;
    join: string;
    news: string;
    events: string;
    contact: string;
    admin: string;
    portal: string;
  };
  home: {
    eyebrow: string;
    title: string;
    summary: string;
    primaryAction: string;
    secondaryAction: string;
    quote: string;
    introEyebrow: string;
    introTitle: string;
    introText: string;
    familyTitle: string;
    familyText: string;
    practiceTitle: string;
    practiceText: string;
    accessTitle: string;
    accessText: string;
    reportsEyebrow: string;
    reportsTitle: string;
    reportsAction: string;
    reportCardAction: string;
    readMoreEyebrow: string;
    readMoreTitle: string;
    readMoreAction: string;
    articleAboutLabel: string;
    articleAboutTitle: string;
    articleCountriesLabel: string;
    articleCountriesTitle: string;
    articleEventsLabel: string;
    articleEventsTitle: string;
    joinEyebrow: string;
    joinTitle: string;
    joinAction: string;
  };
  footer: {
    summary: string;
    webTitle: string;
    contactTitle: string;
    legal: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      home: "Home",
      about: "About IKA",
      philosophy: "Philosophy",
      countries: "Countries",
      dojos: "Dojos",
      join: "Join IKA",
      news: "News",
      events: "Events",
      contact: "Contact",
      admin: "Admin",
      portal: "Kenshi Portal",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "An international family of Kempo practitioners and organisations, united by shared heritage, training, philosophy, and mutual self-development.",
      primaryAction: "Discover IKA",
      secondaryAction: "Find member countries",
      quote:
        "Live half for the happiness of oneself, and half for the happiness of others.",
      introEyebrow: "IKA",
      introTitle: "A global association with common roots",
      introText:
        "IKA was launched in Kobe, Japan, in October 2015 to bring together martial arts practitioners and organisations who share a foundation in the teachings of Doshin So, founder of Shorinji Kempo.",
      familyTitle: "What unites the IKA family",
      familyText:
        "Member organisations may use different names, but they share a common heritage, physical style, and a philosophy that combines compassion with self-reliance.",
      practiceTitle: "Training for body, mind, and society",
      practiceText:
        "Training combines hard and soft techniques, paired practice, meditation, and philosophy so practitioners develop themselves and contribute positively to society.",
      accessTitle: "Private member access",
      accessText:
        "Kenshi, dojo administrators, country administrators, and global administrators enter through one secure access point according to their role.",
      reportsEyebrow: "Latest reports",
      reportsTitle: "News from the IKA family",
      reportsAction: "View all news",
      reportCardAction: "Read report",
      readMoreEyebrow: "Read more",
      readMoreTitle: "Explore the association",
      readMoreAction: "Read more",
      articleAboutLabel: "About the IKA",
      articleAboutTitle: "Shared heritage, training, and philosophy",
      articleCountriesLabel: "Member organisations",
      articleCountriesTitle: "An international association across continents",
      articleEventsLabel: "Upcoming events",
      articleEventsTitle: "Seminars, courses, and gatherings",
      joinEyebrow: "Join IKA",
      joinTitle: "Train together for mutual self-development.",
      joinAction: "Contact the association",
    },
    footer: {
      summary:
        "Return to the original spirit through international training, friendship, philosophy, and shared Kempo heritage.",
      webTitle: "Web",
      contactTitle: "Contact",
      legal:
        "© Copyright IKA 2022, all rights reserved. 'International Kempo Association' and the IKA logo are UK registered trademarks.",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      about: "Sobre IKA",
      philosophy: "Filosofía",
      countries: "Países",
      dojos: "Dojos",
      join: "Unirse a IKA",
      news: "Noticias",
      events: "Eventos",
      contact: "Contacto",
      admin: "Admin",
      portal: "Portal Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Volver al espíritu original",
      summary:
        "Una familia internacional de practicantes y organizaciones de Kempo, unida por una herencia común, entrenamiento, filosofía y desarrollo mutuo.",
      primaryAction: "Descubrir IKA",
      secondaryAction: "Ver países miembros",
      quote:
        "Vivir la mitad para la felicidad de uno mismo y la mitad para la felicidad de los demás.",
      introEyebrow: "IKA",
      introTitle: "Una asociación global con raíces comunes",
      introText:
        "IKA nació en Kobe, Japón, en octubre de 2015 para reunir a practicantes y organizaciones de artes marciales que comparten una base en las enseñanzas de Doshin So, fundador de Shorinji Kempo.",
      familyTitle: "Qué une a la familia IKA",
      familyText:
        "Las organizaciones miembro pueden usar nombres distintos, pero comparten una herencia, un estilo físico y una filosofía que combina compasión con autosuficiencia.",
      practiceTitle: "Entrenamiento para cuerpo, mente y sociedad",
      practiceText:
        "El entrenamiento combina técnicas duras y suaves, práctica por parejas, meditación y filosofía para que cada practicante se desarrolle y contribuya positivamente a la sociedad.",
      accessTitle: "Acceso privado para miembros",
      accessText:
        "Kenshi, administradores de dojo, administradores de país y administradores globales entran por un único acceso seguro según su rol.",
      reportsEyebrow: "Últimos informes",
      reportsTitle: "Noticias de la familia IKA",
      reportsAction: "Ver todas las noticias",
      reportCardAction: "Leer informe",
      readMoreEyebrow: "Leer más",
      readMoreTitle: "Explora la asociación",
      readMoreAction: "Leer más",
      articleAboutLabel: "Sobre IKA",
      articleAboutTitle: "Herencia compartida, entrenamiento y filosofía",
      articleCountriesLabel: "Organizaciones miembro",
      articleCountriesTitle: "Una asociación internacional entre continentes",
      articleEventsLabel: "Próximos eventos",
      articleEventsTitle: "Seminarios, cursos y encuentros",
      joinEyebrow: "Unirse a IKA",
      joinTitle: "Entrenar juntos para el desarrollo mutuo.",
      joinAction: "Contactar con la asociación",
    },
    footer: {
      summary:
        "Volver al espíritu original mediante entrenamiento internacional, amistad, filosofía y herencia Kempo compartida.",
      webTitle: "Web",
      contactTitle: "Contacto",
      legal:
        "© Copyright IKA 2022, todos los derechos reservados. 'International Kempo Association' y el logo de IKA son marcas registradas en el Reino Unido.",
    },
  },
  it: {
    nav: {
      home: "Home",
      about: "IKA",
      philosophy: "Filosofia",
      countries: "Paesi",
      dojos: "Dojo",
      join: "Unisciti a IKA",
      news: "Notizie",
      events: "Eventi",
      contact: "Contatti",
      admin: "Admin",
      portal: "Portale Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Ritornare allo spirito originale",
      summary:
        "Una famiglia internazionale di praticanti e organizzazioni Kempo, unita da patrimonio comune, allenamento, filosofia e sviluppo reciproco.",
      primaryAction: "Scopri IKA",
      secondaryAction: "Trova i paesi membri",
      quote:
        "Vivere metà per la felicità di sé stessi e metà per la felicità degli altri.",
      introEyebrow: "IKA",
      introTitle: "Un'associazione globale con radici comuni",
      introText:
        "IKA è nata a Kobe, in Giappone, nell'ottobre 2015 per riunire praticanti e organizzazioni di arti marziali che condividono una base negli insegnamenti di Doshin So, fondatore dello Shorinji Kempo.",
      familyTitle: "Cosa unisce la famiglia IKA",
      familyText:
        "Le organizzazioni membro possono usare nomi diversi, ma condividono patrimonio, stile fisico e una filosofia che unisce compassione e autonomia.",
      practiceTitle: "Allenamento per corpo, mente e società",
      practiceText:
        "La pratica combina tecniche dure e morbide, lavoro in coppia, meditazione e filosofia per lo sviluppo personale e il contributo positivo alla società.",
      accessTitle: "Accesso privato per i membri",
      accessText:
        "Kenshi, amministratori di dojo, amministratori nazionali e amministratori globali accedono da un unico punto sicuro in base al proprio ruolo.",
      reportsEyebrow: "Ultimi report",
      reportsTitle: "Notizie dalla famiglia IKA",
      reportsAction: "Vedi tutte le notizie",
      reportCardAction: "Leggi il report",
      readMoreEyebrow: "Leggi di più",
      readMoreTitle: "Esplora l'associazione",
      readMoreAction: "Leggi di più",
      articleAboutLabel: "Informazioni su IKA",
      articleAboutTitle: "Patrimonio condiviso, allenamento e filosofia",
      articleCountriesLabel: "Organizzazioni membro",
      articleCountriesTitle: "Un'associazione internazionale tra continenti",
      articleEventsLabel: "Prossimi eventi",
      articleEventsTitle: "Seminari, corsi e incontri",
      joinEyebrow: "Unisciti a IKA",
      joinTitle: "Allenarsi insieme per lo sviluppo reciproco.",
      joinAction: "Contatta l'associazione",
    },
    footer: {
      summary:
        "Ritornare allo spirito originale attraverso allenamento internazionale, amicizia, filosofia e patrimonio Kempo condiviso.",
      webTitle: "Web",
      contactTitle: "Contatti",
      legal:
        "© Copyright IKA 2022, tutti i diritti riservati. 'International Kempo Association' e il logo IKA sono marchi registrati nel Regno Unito.",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      philosophy: "Philosophie",
      countries: "Pays",
      dojos: "Dojos",
      join: "Rejoindre IKA",
      news: "Actualités",
      events: "Événements",
      contact: "Contact",
      admin: "Admin",
      portal: "Portail Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Retrouver l'esprit originel",
      summary:
        "Une famille internationale de pratiquants et d'organisations Kempo, unie par un héritage commun, l'entraînement, la philosophie et le développement mutuel.",
      primaryAction: "Découvrir IKA",
      secondaryAction: "Trouver les pays membres",
      quote:
        "Vivre moitié pour son propre bonheur, moitié pour le bonheur des autres.",
      introEyebrow: "IKA",
      introTitle: "Une association mondiale aux racines communes",
      introText:
        "IKA a été lancée à Kobe, au Japon, en octobre 2015 pour réunir des pratiquants et organisations d'arts martiaux partageant une base dans les enseignements de Doshin So, fondateur du Shorinji Kempo.",
      familyTitle: "Ce qui unit la famille IKA",
      familyText:
        "Les organisations membres peuvent porter des noms différents, mais elles partagent un héritage, un style physique et une philosophie qui associe compassion et autonomie.",
      practiceTitle: "Entraînement du corps, de l'esprit et de la société",
      practiceText:
        "L'entraînement combine techniques dures et souples, pratique en binôme, méditation et philosophie afin que chacun se développe et contribue positivement à la société.",
      accessTitle: "Accès privé des membres",
      accessText:
        "Kenshi, administrateurs de dojo, administrateurs nationaux et administrateurs globaux entrent par un accès sécurisé unique selon leur rôle.",
      reportsEyebrow: "Derniers rapports",
      reportsTitle: "Actualités de la famille IKA",
      reportsAction: "Voir toutes les actualités",
      reportCardAction: "Lire le rapport",
      readMoreEyebrow: "Lire plus",
      readMoreTitle: "Explorer l'association",
      readMoreAction: "Lire plus",
      articleAboutLabel: "À propos d'IKA",
      articleAboutTitle: "Héritage partagé, entraînement et philosophie",
      articleCountriesLabel: "Organisations membres",
      articleCountriesTitle: "Une association internationale entre continents",
      articleEventsLabel: "Événements à venir",
      articleEventsTitle: "Séminaires, cours et rencontres",
      joinEyebrow: "Rejoindre IKA",
      joinTitle: "S'entraîner ensemble pour le développement mutuel.",
      joinAction: "Contacter l'association",
    },
    footer: {
      summary:
        "Retrouver l'esprit originel grâce à l'entraînement international, l'amitié, la philosophie et un héritage Kempo partagé.",
      webTitle: "Web",
      contactTitle: "Contact",
      legal:
        "© Copyright IKA 2022, tous droits réservés. 'International Kempo Association' et le logo IKA sont des marques déposées au Royaume-Uni.",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      about: "IKAについて",
      philosophy: "理念",
      countries: "加盟国",
      dojos: "道場",
      join: "IKAに参加",
      news: "ニュース",
      events: "イベント",
      contact: "連絡先",
      admin: "管理",
      portal: "拳士ポータル",
    },
    home: {
      eyebrow: "国際拳法協会",
      title: "原点の精神へ戻る",
      summary:
        "共通の伝統、稽古、哲学、相互の自己成長によって結ばれた、Kempoの実践者と団体の国際的な家族です。",
      primaryAction: "IKAを知る",
      secondaryAction: "加盟国を探す",
      quote: "自己の幸せの半分を、他者の幸せの半分を。",
      introEyebrow: "IKA",
      introTitle: "共通の根を持つ国際協会",
      introText:
        "IKAは2015年10月、日本の神戸で発足しました。少林寺拳法の創始者である宗道臣の教えを土台に共有する武道の実践者と団体を結ぶためです。",
      familyTitle: "IKAファミリーを結ぶもの",
      familyText:
        "加盟団体は異なる名称を用いることがありますが、共通の伝統、身体技法、慈悲と自立を重んじる哲学を共有しています。",
      practiceTitle: "身体、心、社会のための稽古",
      practiceText:
        "剛法と柔法、相対演練、瞑想、哲学を組み合わせ、実践者が自らを成長させ社会に前向きに貢献できるようにします。",
      accessTitle: "会員専用アクセス",
      accessText:
        "拳士、道場管理者、国管理者、グローバル管理者は、役割に応じて一つの安全な入口からアクセスします。",
      reportsEyebrow: "最新レポート",
      reportsTitle: "IKAファミリーからのニュース",
      reportsAction: "すべてのニュースを見る",
      reportCardAction: "レポートを読む",
      readMoreEyebrow: "さらに読む",
      readMoreTitle: "協会を探る",
      readMoreAction: "さらに読む",
      articleAboutLabel: "IKAについて",
      articleAboutTitle: "共有される伝統、稽古、哲学",
      articleCountriesLabel: "加盟団体",
      articleCountriesTitle: "大陸を越える国際協会",
      articleEventsLabel: "今後のイベント",
      articleEventsTitle: "セミナー、講習、集まり",
      joinEyebrow: "IKAに参加",
      joinTitle: "相互の自己成長のために共に稽古する。",
      joinAction: "協会に連絡する",
    },
    footer: {
      summary:
        "国際的な稽古、友情、哲学、共有されたKempoの伝統を通じて、原点の精神へ戻ります。",
      webTitle: "ウェブ",
      contactTitle: "連絡先",
      legal:
        "© Copyright IKA 2022, all rights reserved. 'International Kempo Association' and the IKA logo are UK registered trademarks.",
    },
  },
  zh: {
    nav: {
      home: "首页",
      about: "关于 IKA",
      philosophy: "理念",
      countries: "成员国家",
      dojos: "道场",
      join: "加入 IKA",
      news: "新闻",
      events: "活动",
      contact: "联系",
      admin: "管理",
      portal: "拳士门户",
    },
    home: {
      eyebrow: "国际拳法协会",
      title: "回到原初精神",
      summary:
        "由共同传承、训练、哲学和相互自我成长连接起来的国际 Kempo 练习者与组织大家庭。",
      primaryAction: "了解 IKA",
      secondaryAction: "查找成员国家",
      quote: "一半为自己的幸福而活，一半为他人的幸福而活。",
      introEyebrow: "IKA",
      introTitle: "拥有共同根基的全球协会",
      introText:
        "IKA 于 2015 年 10 月在日本神户成立，旨在连接以少林寺拳法创始人宗道臣教义为共同基础的武道练习者与组织。",
      familyTitle: "连接 IKA 大家庭的共同点",
      familyText:
        "成员组织可能使用不同名称，但共享共同传承、身体技法，以及结合慈悲与自立的哲学。",
      practiceTitle: "为了身体、心灵与社会的训练",
      practiceText:
        "训练结合刚法、柔法、双人练习、冥想和哲学，帮助练习者发展自我并积极贡献社会。",
      accessTitle: "会员私人访问",
      accessText:
        "拳士、道场管理员、国家管理员和全球管理员根据各自角色，通过一个安全入口进入。",
      reportsEyebrow: "最新报告",
      reportsTitle: "IKA 大家庭新闻",
      reportsAction: "查看全部新闻",
      reportCardAction: "阅读报告",
      readMoreEyebrow: "阅读更多",
      readMoreTitle: "探索协会",
      readMoreAction: "阅读更多",
      articleAboutLabel: "关于 IKA",
      articleAboutTitle: "共同传承、训练与哲学",
      articleCountriesLabel: "成员组织",
      articleCountriesTitle: "跨越大陆的国际协会",
      articleEventsLabel: "即将举行的活动",
      articleEventsTitle: "研讨会、课程与聚会",
      joinEyebrow: "加入 IKA",
      joinTitle: "为了相互自我成长而共同训练。",
      joinAction: "联系协会",
    },
    footer: {
      summary:
        "通过国际训练、友谊、哲学和共同的 Kempo 传承，回到原初精神。",
      webTitle: "网站",
      contactTitle: "联系",
      legal:
        "© Copyright IKA 2022, all rights reserved. 'International Kempo Association' and the IKA logo are UK registered trademarks.",
    },
  },
  cs: {
    nav: {
      home: "Domů",
      about: "O IKA",
      philosophy: "Filozofie",
      countries: "Země",
      dojos: "Dódžó",
      join: "Připojit se k IKA",
      news: "Novinky",
      events: "Události",
      contact: "Kontakt",
      admin: "Admin",
      portal: "Portál Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Návrat k původnímu duchu",
      summary:
        "Mezinárodní rodina praktikujících a organizací Kempo, spojená společným dědictvím, tréninkem, filozofií a vzájemným seberozvojem.",
      primaryAction: "Objevit IKA",
      secondaryAction: "Najít členské země",
      quote: "Žít polovinu pro vlastní štěstí a polovinu pro štěstí druhých.",
      introEyebrow: "IKA",
      introTitle: "Globální asociace se společnými kořeny",
      introText:
        "IKA vznikla v říjnu 2015 v Kobe v Japonsku, aby spojila praktikující a organizace bojových umění sdílející základ v učení Doshina So, zakladatele Shorinji Kempo.",
      familyTitle: "Co spojuje rodinu IKA",
      familyText:
        "Členské organizace mohou používat různé názvy, ale sdílejí společné dědictví, fyzický styl a filozofii spojující soucit se soběstačností.",
      practiceTitle: "Trénink pro tělo, mysl a společnost",
      practiceText:
        "Trénink kombinuje tvrdé a měkké techniky, párovou praxi, meditaci a filozofii, aby se praktikující rozvíjeli a pozitivně přispívali společnosti.",
      accessTitle: "Soukromý přístup členů",
      accessText:
        "Kenshi, administrátoři dódžó, národní administrátoři a globální administrátoři vstupují jedním bezpečným přístupovým bodem podle své role.",
      reportsEyebrow: "Nejnovější zprávy",
      reportsTitle: "Novinky z rodiny IKA",
      reportsAction: "Zobrazit všechny novinky",
      reportCardAction: "Číst zprávu",
      readMoreEyebrow: "Číst více",
      readMoreTitle: "Prozkoumat asociaci",
      readMoreAction: "Číst více",
      articleAboutLabel: "O IKA",
      articleAboutTitle: "Sdílené dědictví, trénink a filozofie",
      articleCountriesLabel: "Členské organizace",
      articleCountriesTitle: "Mezinárodní asociace napříč kontinenty",
      articleEventsLabel: "Nadcházející události",
      articleEventsTitle: "Semináře, kurzy a setkání",
      joinEyebrow: "Připojit se k IKA",
      joinTitle: "Trénovat společně pro vzájemný seberozvoj.",
      joinAction: "Kontaktovat asociaci",
    },
    footer: {
      summary:
        "Návrat k původnímu duchu prostřednictvím mezinárodního tréninku, přátelství, filozofie a sdíleného dědictví Kempo.",
      webTitle: "Web",
      contactTitle: "Kontakt",
      legal:
        "© Copyright IKA 2022, všechna práva vyhrazena. 'International Kempo Association' a logo IKA jsou registrované ochranné známky ve Spojeném království.",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
