import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { extendedLatestReportTranslations } from "@/lib/i18n/extended-public-locales";

export type LatestReport = {
  date: string;
  title: string;
  excerpt: string;
  image: string;
  slug: string;
};

type ReportSource = {
  date: string;
  image: string;
  slug: string;
  translations: Partial<Record<Locale, { title: string; excerpt: string }>>;
};

const reportSources: ReportSource[] = [
  {
    date: "30/6/2023",
    image: "/images/reports/sicily.webp",
    slug: "ika-seminar-in-sicily-june-2023",
    translations: {
      en: {
        title: "IKA seminar in Sicily, June 2023",
        excerpt:
          "The first European IKA seminar since covid was organised by Dojo Messina in Sicily, with members from Italy, Switzerland and the UK.",
      },
      es: {
        title: "Seminario IKA en Sicilia, junio de 2023",
        excerpt:
          "El primer seminario europeo de IKA desde la pandemia fue organizado por Dojo Messina en Sicilia, con miembros de Italia, Suiza y Reino Unido.",
      },
      it: {
        title: "Seminario IKA in Sicilia, giugno 2023",
        excerpt:
          "Il primo seminario europeo IKA dopo il covid è stato organizzato dal Dojo Messina in Sicilia, con membri da Italia, Svizzera e Regno Unito.",
      },
      fr: {
        title: "Séminaire IKA en Sicile, juin 2023",
        excerpt:
          "Le premier séminaire européen IKA depuis le covid a été organisé par le Dojo Messina en Sicile, avec des membres d'Italie, de Suisse et du Royaume-Uni.",
      },
      ja: {
        title: "2023年6月 シチリアでのIKAセミナー",
        excerpt:
          "コロナ後初の欧州IKAセミナーがシチリアのDojo Messinaにより開催され、イタリア、スイス、英国のメンバーが参加しました。",
      },
      zh: {
        title: "2023 年 6 月 IKA 西西里研讨会",
        excerpt:
          "疫情后首个欧洲 IKA 研讨会由西西里的 Dojo Messina 举办，来自意大利、瑞士和英国的成员参加。",
      },
      cs: {
        title: "Seminář IKA na Sicílii, červen 2023",
        excerpt:
          "První evropský seminář IKA od covidu uspořádalo Dojo Messina na Sicílii za účasti členů z Itálie, Švýcarska a Spojeného království.",
      },
    },
  },
  {
    date: "28/2/2023",
    image: "/images/reports/indonesia.webp",
    slug: "ika-training-and-grading-in-indonesia-february-2023",
    translations: {
      en: {
        title: "IKA training and grading in Indonesia, February 2023",
        excerpt:
          "Senior IKA instructors travelled to West Java, Indonesia for training and grading with local members.",
      },
      es: {
        title: "Entrenamiento y examen IKA en Indonesia, febrero de 2023",
        excerpt:
          "Instructores senior de IKA viajaron a Java Occidental, Indonesia, para entrenar y examinar con miembros locales.",
      },
      it: {
        title: "Allenamento ed esami IKA in Indonesia, febbraio 2023",
        excerpt:
          "Istruttori senior IKA si sono recati a Giava Occidentale, Indonesia, per allenamento ed esami con i membri locali.",
      },
      fr: {
        title: "Entraînement et passages de grade IKA en Indonésie, février 2023",
        excerpt:
          "Des instructeurs seniors IKA se sont rendus à Java occidental, en Indonésie, pour s'entraîner et faire passer des grades aux membres locaux.",
      },
      ja: {
        title: "2023年2月 インドネシアでのIKA稽古と昇級審査",
        excerpt:
          "IKA上級指導者がインドネシア西ジャワを訪れ、現地メンバーと稽古および審査を行いました。",
      },
      zh: {
        title: "2023 年 2 月 IKA 印度尼西亚训练与考级",
        excerpt:
          "IKA 高级教练前往印度尼西亚西爪哇，与当地成员进行训练和考级。",
      },
      cs: {
        title: "Trénink a zkoušky IKA v Indonésii, únor 2023",
        excerpt:
          "Seniorní instruktoři IKA cestovali do Západní Jávy v Indonésii na trénink a zkoušky s místními členy.",
      },
    },
  },
  {
    date: "7/10/2022",
    image: "/images/reports/grading.webp",
    slug: "grading-results",
    translations: {
      en: {
        title: "Grading results",
        excerpt:
          "A summary of grading results and association updates from IKA members.",
      },
      es: {
        title: "Resultados de examen",
        excerpt:
          "Resumen de resultados de examen y novedades de la asociación entre miembros de IKA.",
      },
      it: {
        title: "Risultati degli esami",
        excerpt:
          "Un riepilogo dei risultati degli esami e degli aggiornamenti dell'associazione dai membri IKA.",
      },
      fr: {
        title: "Résultats des passages de grade",
        excerpt:
          "Un résumé des résultats de passages de grade et des nouvelles de l'association parmi les membres IKA.",
      },
      ja: {
        title: "審査結果",
        excerpt: "IKAメンバーによる審査結果と協会更新情報の概要です。",
      },
      zh: {
        title: "考级结果",
        excerpt: "IKA 成员考级结果和协会更新的摘要。",
      },
      cs: {
        title: "Výsledky zkoušek",
        excerpt: "Souhrn výsledků zkoušek a aktualit asociace od členů IKA.",
      },
    },
  },
  {
    date: "22/11/2021",
    image: "/images/reports/condolences.webp",
    slug: "condolences-message",
    translations: {
      en: {
        title: "Messages of condolences",
        excerpt: "Messages from the IKA family in memory and solidarity.",
      },
      es: {
        title: "Mensajes de condolencia",
        excerpt: "Mensajes de la familia IKA en recuerdo y solidaridad.",
      },
      it: {
        title: "Messaggi di cordoglio",
        excerpt: "Messaggi dalla famiglia IKA in memoria e solidarietà.",
      },
      fr: {
        title: "Messages de condoléances",
        excerpt: "Messages de la famille IKA en mémoire et solidarité.",
      },
      ja: {
        title: "追悼メッセージ",
        excerpt: "追悼と連帯のためのIKAファミリーからのメッセージ。",
      },
      zh: {
        title: "慰问信息",
        excerpt: "IKA 大家庭为纪念与团结发出的信息。",
      },
      cs: {
        title: "Kondolenční zprávy",
        excerpt: "Zprávy rodiny IKA na památku a ve vzájemné solidaritě.",
      },
    },
  },
  {
    date: "12/10/2019",
    image: "/images/reports/porkemi.webp",
    slug: "porkemi-indonesia-accepted-to-national-olympic-committee",
    translations: {
      en: {
        title: "Porkemi (Indonesia) accepted to National Olympic Committee",
        excerpt:
          "A recognition milestone for Porkemi and Indonesian Kempo.",
      },
      es: {
        title: "Porkemi (Indonesia) aceptada por el Comité Olímpico Nacional",
        excerpt:
          "Un hito de reconocimiento para Porkemi y el Kempo indonesio.",
      },
      it: {
        title: "Porkemi (Indonesia) accettata dal Comitato Olimpico Nazionale",
        excerpt:
          "Una tappa di riconoscimento per Porkemi e il Kempo indonesiano.",
      },
      fr: {
        title: "Porkemi (Indonésie) acceptée par le Comité olympique national",
        excerpt:
          "Une étape de reconnaissance pour Porkemi et le Kempo indonésien.",
      },
      ja: {
        title: "Porkemi（インドネシア）が国内オリンピック委員会に承認",
        excerpt:
          "PorkemiとインドネシアKempoにとって認知の節目となりました。",
      },
      zh: {
        title: "Porkemi（印度尼西亚）获国家奥委会认可",
        excerpt: "这是 Porkemi 和印度尼西亚 Kempo 获得认可的重要里程碑。",
      },
      cs: {
        title: "Porkemi (Indonésie) přijata do Národního olympijského výboru",
        excerpt:
          "Milník uznání pro Porkemi a indonéské Kempo.",
      },
    },
  },
  {
    date: "25/6/2019",
    image: "/images/reports/spain.webp",
    slug: "report-from-international-seminar-in-spain",
    translations: {
      en: {
        title: "Report from international seminar in Spain",
        excerpt:
          "Report from an international seminar hosted in Spain with IKA members training together.",
      },
      es: {
        title: "Informe del seminario internacional en España",
        excerpt:
          "Informe de un seminario internacional celebrado en España con miembros de IKA entrenando juntos.",
      },
      it: {
        title: "Report dal seminario internazionale in Spagna",
        excerpt:
          "Report da un seminario internazionale ospitato in Spagna con membri IKA che si allenano insieme.",
      },
      fr: {
        title: "Rapport du séminaire international en Espagne",
        excerpt:
          "Rapport d'un séminaire international organisé en Espagne avec des membres IKA s'entraînant ensemble.",
      },
      ja: {
        title: "スペイン国際セミナー報告",
        excerpt:
          "スペインで開催され、IKAメンバーが共に稽古した国際セミナーの報告です。",
      },
      zh: {
        title: "西班牙国际研讨会报告",
        excerpt: "在西班牙举办的国际研讨会报告，IKA 成员共同训练。",
      },
      cs: {
        title: "Zpráva z mezinárodního semináře ve Španělsku",
        excerpt:
          "Zpráva z mezinárodního semináře pořádaného ve Španělsku, kde členové IKA trénovali společně.",
      },
    },
  },
];

export function getLatestReports(locale: Locale): LatestReport[] {
  return reportSources.map((report) => ({
    date: report.date,
    image: report.image,
    slug: report.slug,
    ...(
      report.translations[locale] ??
      extendedLatestReportTranslations[locale]?.[report.slug] ??
      report.translations[defaultLocale]!
    ),
  }));
}

export const latestReports = getLatestReports(defaultLocale);
