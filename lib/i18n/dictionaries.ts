import type { Locale } from "./config";

type Dictionary = {
  nav: {
    home: string;
    countries: string;
    dojos: string;
    news: string;
    events: string;
    admin: string;
    portal: string;
  };
  home: {
    eyebrow: string;
    title: string;
    summary: string;
    primaryAction: string;
    secondaryAction: string;
    foundationTitle: string;
    foundationText: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      home: "Home",
      countries: "Countries",
      dojos: "Dojos",
      news: "News",
      events: "Events",
      admin: "Admin",
      portal: "Kenshi Portal",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "A multilingual digital foundation for public content, country administration, dojo management, and the international Kenshi registry.",
      primaryAction: "Explore countries",
      secondaryAction: "Admin access",
      foundationTitle: "Foundation first",
      foundationText:
        "The platform starts with architecture, database permissions, multilingual content, and privacy boundaries before expanding into advanced modules.",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      countries: "Países",
      dojos: "Dojos",
      news: "Noticias",
      events: "Eventos",
      admin: "Admin",
      portal: "Portal Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "Una base digital multilingüe para contenido público, administración por países, gestión de dojos y registro internacional de Kenshi.",
      primaryAction: "Ver países",
      secondaryAction: "Acceso admin",
      foundationTitle: "Primero la base",
      foundationText:
        "La plataforma empieza por arquitectura, permisos de base de datos, contenido multilingüe y límites de privacidad antes de crecer en módulos avanzados.",
    },
  },
  it: {
    nav: {
      home: "Home",
      countries: "Paesi",
      dojos: "Dojo",
      news: "Notizie",
      events: "Eventi",
      admin: "Admin",
      portal: "Portale Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "Una base digitale multilingue per contenuti pubblici, amministrazione nazionale, gestione dei dojo e registro internazionale Kenshi.",
      primaryAction: "Esplora paesi",
      secondaryAction: "Accesso admin",
      foundationTitle: "Prima le fondamenta",
      foundationText:
        "La piattaforma parte da architettura, permessi database, contenuti multilingue e privacy prima dei moduli avanzati.",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      countries: "Pays",
      dojos: "Dojos",
      news: "Actualités",
      events: "Événements",
      admin: "Admin",
      portal: "Portail Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "Une base numérique multilingue pour le contenu public, l'administration des pays, la gestion des dojos et le registre international Kenshi.",
      primaryAction: "Voir les pays",
      secondaryAction: "Accès admin",
      foundationTitle: "Les fondations d'abord",
      foundationText:
        "La plateforme commence par l'architecture, les permissions, le contenu multilingue et la confidentialité avant les modules avancés.",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      countries: "国",
      dojos: "道場",
      news: "ニュース",
      events: "イベント",
      admin: "管理",
      portal: "拳士ポータル",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "公開コンテンツ、国別管理、道場管理、国際拳士登録のための多言語デジタル基盤です。",
      primaryAction: "国を見る",
      secondaryAction: "管理画面",
      foundationTitle: "基盤を先に",
      foundationText:
        "高度な機能の前に、アーキテクチャ、権限、多言語コンテンツ、プライバシー境界を整えます。",
    },
  },
  zh: {
    nav: {
      home: "首页",
      countries: "国家",
      dojos: "道场",
      news: "新闻",
      events: "活动",
      admin: "管理",
      portal: "拳士门户",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "面向公开内容、国家管理、道场管理和国际拳士注册的多语言数字平台基础。",
      primaryAction: "查看国家",
      secondaryAction: "管理入口",
      foundationTitle: "先打好基础",
      foundationText:
        "平台先建立架构、数据库权限、多语言内容和隐私边界，再扩展高级模块。",
    },
  },
  cs: {
    nav: {
      home: "Domů",
      countries: "Země",
      dojos: "Dódžó",
      news: "Novinky",
      events: "Události",
      admin: "Admin",
      portal: "Portál Kenshi",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "IKA Platform",
      summary:
        "Vícejazyčný digitální základ pro veřejný obsah, správu zemí, správu dódžó a mezinárodní registr Kenshi.",
      primaryAction: "Zobrazit země",
      secondaryAction: "Administrace",
      foundationTitle: "Nejdřív základy",
      foundationText:
        "Platforma začíná architekturou, databázovými oprávněními, vícejazyčným obsahem a ochranou soukromí.",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
