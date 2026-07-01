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
    introTitle: string;
    introText: string;
    familyTitle: string;
    familyText: string;
    practiceTitle: string;
    practiceText: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      home: "Home",
      about: "About",
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
      quote: "Live half for the happiness of oneself, and half for the happiness of others.",
      introTitle: "A global association with common roots",
      introText:
        "IKA was launched in Kobe, Japan, in October 2015 to bring together martial arts practitioners and organisations who share a foundation in the teachings of Doshin So, founder of Shorinji Kempo.",
      familyTitle: "What unites the IKA family",
      familyText:
        "Member organisations may use different names, but they share a common heritage, physical style, and a philosophy that combines compassion with self-reliance.",
      practiceTitle: "Training for body, mind, and society",
      practiceText:
        "Training combines hard and soft techniques, paired practice, meditation, and philosophy so practitioners develop themselves and contribute positively to society.",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      about: "Sobre IKA",
      philosophy: "Filosofía",
      countries: "Países",
      dojos: "Dojos",
      join: "Unirse",
      news: "Noticias",
      events: "Eventos",
      contact: "Contacto",
      admin: "Admin",
      portal: "Portal Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "Una familia internacional de practicantes y organizaciones de Kempo, unida por herencia, entrenamiento, filosofía y desarrollo mutuo.",
      primaryAction: "Descubrir IKA",
      secondaryAction: "Ver países miembros",
      quote: "Vivir la mitad para la felicidad de uno mismo y la mitad para la felicidad de los demás.",
      introTitle: "Una asociación global con raíces comunes",
      introText:
        "IKA se lanzó en Kobe, Japón, en octubre de 2015 para reunir a practicantes y organizaciones que comparten una base en las enseñanzas de Doshin So, fundador de Shorinji Kempo.",
      familyTitle: "Qué une a la familia IKA",
      familyText:
        "Las organizaciones miembro pueden usar nombres distintos, pero comparten herencia, estilo físico y una filosofía que combina compasión y autosuficiencia.",
      practiceTitle: "Entrenar cuerpo, mente y sociedad",
      practiceText:
        "El entrenamiento combina técnicas duras y suaves, práctica por parejas, meditación y filosofía para que cada practicante se desarrolle y aporte a la sociedad.",
    },
  },
  it: {
    nav: {
      home: "Home",
      about: "IKA",
      philosophy: "Filosofia",
      countries: "Paesi",
      dojos: "Dojo",
      join: "Unisciti",
      news: "Notizie",
      events: "Eventi",
      contact: "Contatti",
      admin: "Admin",
      portal: "Portale Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "Una famiglia internazionale di praticanti e organizzazioni Kempo, unita da patrimonio, allenamento, filosofia e sviluppo reciproco.",
      primaryAction: "Scopri IKA",
      secondaryAction: "Paesi membri",
      quote: "Vivere metà per la felicità di sé stessi e metà per la felicità degli altri.",
      introTitle: "Un'associazione globale con radici comuni",
      introText:
        "IKA nasce a Kobe, in Giappone, nell'ottobre 2015 per riunire praticanti e organizzazioni che condividono le basi degli insegnamenti di Doshin So.",
      familyTitle: "Cosa unisce la famiglia IKA",
      familyText:
        "Le organizzazioni membro possono usare nomi diversi, ma condividono patrimonio, stile fisico e una filosofia di compassione e autonomia.",
      practiceTitle: "Allenare corpo, mente e società",
      practiceText:
        "La pratica combina tecniche dure e morbide, lavoro in coppia, meditazione e filosofia per lo sviluppo personale e sociale.",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      philosophy: "Philosophie",
      countries: "Pays",
      dojos: "Dojos",
      join: "Rejoindre",
      news: "Actualités",
      events: "Événements",
      contact: "Contact",
      admin: "Admin",
      portal: "Portail Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "Une famille internationale de pratiquants et d'organisations Kempo, unie par un héritage, un entraînement, une philosophie et un développement mutuel.",
      primaryAction: "Découvrir IKA",
      secondaryAction: "Pays membres",
      quote: "Vivre moitié pour son propre bonheur, moitié pour le bonheur des autres.",
      introTitle: "Une association mondiale aux racines communes",
      introText:
        "IKA a été lancée à Kobe, au Japon, en octobre 2015 pour réunir les pratiquants et organisations partageant les enseignements de Doshin So.",
      familyTitle: "Ce qui unit la famille IKA",
      familyText:
        "Les organisations membres peuvent porter des noms différents, mais elles partagent un héritage, un style physique et une philosophie commune.",
      practiceTitle: "Former le corps, l'esprit et la société",
      practiceText:
        "L'entraînement combine techniques dures et souples, pratique à deux, méditation et philosophie pour développer chacun au service de la société.",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      about: "IKAについて",
      philosophy: "理念",
      countries: "国",
      dojos: "道場",
      join: "参加",
      news: "ニュース",
      events: "イベント",
      contact: "連絡",
      admin: "管理",
      portal: "拳士ポータル",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "共通の伝統、稽古、哲学、相互の成長で結ばれた国際的なKempoの家族です。",
      primaryAction: "IKAを見る",
      secondaryAction: "加盟国を見る",
      quote: "自己の幸福の半分を、他者の幸福の半分を。",
      introTitle: "共通の根を持つ国際協会",
      introText:
        "IKAは2015年10月、少林寺拳法の創始者である宗道臣の教えを共有する団体を結ぶため神戸で発足しました。",
      familyTitle: "IKAファミリーを結ぶもの",
      familyText:
        "加盟団体の名称は異なっても、共通の伝統、身体技法、慈悲と自立を重んじる哲学を共有しています。",
      practiceTitle: "身体、心、社会のための稽古",
      practiceText:
        "剛法と柔法、相対演練、瞑想、哲学を通じて、個人の成長と社会への貢献を目指します。",
    },
  },
  zh: {
    nav: {
      home: "首页",
      about: "关于 IKA",
      philosophy: "理念",
      countries: "国家",
      dojos: "道场",
      join: "加入",
      news: "新闻",
      events: "活动",
      contact: "联系",
      admin: "管理",
      portal: "拳士门户",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "由共同传承、训练、哲学和相互成长连接起来的国际 Kempo 练习者与组织大家庭。",
      primaryAction: "了解 IKA",
      secondaryAction: "成员国家",
      quote: "一半为自己的幸福而活，一半为他人的幸福而活。",
      introTitle: "拥有共同根基的国际协会",
      introText:
        "IKA 于 2015 年 10 月在日本神户成立，旨在连接共享宗道臣教义基础的武道练习者与组织。",
      familyTitle: "IKA 家庭的共同点",
      familyText:
        "成员组织名称可能不同，但共享传承、身体技法，以及结合慈悲与自立的哲学。",
      practiceTitle: "训练身体、心灵与社会责任",
      practiceText:
        "训练结合刚法、柔法、双人练习、冥想与哲学，帮助练习者成长并积极贡献社会。",
    },
  },
  cs: {
    nav: {
      home: "Domů",
      about: "O IKA",
      philosophy: "Filozofie",
      countries: "Země",
      dojos: "Dódžó",
      join: "Připojit se",
      news: "Novinky",
      events: "Události",
      contact: "Kontakt",
      admin: "Admin",
      portal: "Portál Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Return to the original spirit",
      summary:
        "Mezinárodní rodina praktikujících a organizací Kempo, spojená společným dědictvím, tréninkem, filozofií a vzájemným rozvojem.",
      primaryAction: "Objevit IKA",
      secondaryAction: "Členské země",
      quote: "Žít polovinu pro vlastní štěstí a polovinu pro štěstí druhých.",
      introTitle: "Globální asociace se společnými kořeny",
      introText:
        "IKA byla založena v Kobe v říjnu 2015, aby spojila praktikující a organizace sdílející učení Doshina So.",
      familyTitle: "Co spojuje rodinu IKA",
      familyText:
        "Členské organizace mohou používat různá jména, ale sdílejí dědictví, styl a filozofii soucitu a soběstačnosti.",
      practiceTitle: "Trénink těla, mysli a společnosti",
      practiceText:
        "Trénink spojuje tvrdé a měkké techniky, párovou praxi, meditaci a filozofii pro osobní rozvoj i službu společnosti.",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
