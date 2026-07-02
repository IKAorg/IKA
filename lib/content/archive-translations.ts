import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getLatestReports } from "./latest-reports";

export type ArchiveCopy = {
  title: string;
  excerpt: string;
  bodyHtml?: string;
};

const olderArchiveTranslations: Record<
  Locale,
  Record<string, ArchiveCopy>
> = {
  en: {},
  es: {
    "report-from-seminar-in-switzerland": {
      title: "Informe del seminario en Suiza",
      excerpt:
        "El seminario internacional anual en Suiza, segundo de la serie europea de verano, se celebró de nuevo en Neuchatel.",
    },
    "report-from-ika-seminar-in-czech-republic": {
      title: "Informe del seminario en la República Checa",
      excerpt:
        "El primer seminario internacional de aquel verano se celebró en Karlovy Vary, con invitados de varios países miembros de IKA.",
    },
    "report-from-ika-leaders-seminar-cyprus-2018": {
      title: "Informe del Seminario de Líderes IKA, Chipre 2018",
      excerpt:
        "Miembros de IKA de Hong Kong, Irlanda, Japón, Suiza y Reino Unido se reunieron en Chipre para una semana intensiva de formación.",
    },
    "report-from-3rd-ika-seminar-uk": {
      title: "Informe del 3.er Seminario IKA, Reino Unido",
      excerpt:
        "El tercer seminario IKA se celebró en Bristol con kenshi de República Checa, Irlanda, Japón, España, Suiza y Reino Unido.",
    },
    "report-from-2nd-ika-taikai-spain": {
      title: "Informe del 2.º Taikai IKA, España",
      excerpt:
        "El segundo Taikai IKA se celebró en Beasain, en el País Vasco, coincidiendo con el 35.º aniversario de Shorinji Kempo en la región.",
    },
    "bskf-2017-university-training-seminar-report": {
      title: "Informe BSKF del seminario universitario de 2017",
      excerpt:
        "El seminario universitario anual de BSKF se celebró en Glasgow y reunió a estudiantes de Reino Unido e Irlanda.",
    },
    "report-from-2016-leaders-seminar": {
      title: "Informe del Seminario de Líderes 2016",
      excerpt:
        "El seminario anual de líderes de IKA volvió a Chipre con formación avanzada, principios técnicos, práctica de shakujo y estudio compartido.",
    },
    "report-from-ika-taikai-czech-republic": {
      title: "Informe del Taikai IKA, República Checa",
      excerpt:
        "El primer Taikai Internacional IKA tuvo lugar en Karlovy Vary con instructores y estudiantes de varios países miembros.",
    },
    "report-from-swiss-seminar-2016": {
      title: "Informe del seminario suizo 2016",
      excerpt:
        "Miembros de IKA de Reino Unido y España se unieron a estudiantes de toda Suiza para un seminario de dos días en Neuchatel.",
    },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": {
      title: "Informe BSKF del 1.er Seminario IKA en Kobe, Japón",
      excerpt:
        "Informe del primer Seminario IKA en Kobe, escrito originalmente por Will Ng y republicado para el archivo de IKA.",
    },
    "post-1": {
      title: "Regreso al espíritu original",
      excerpt:
        "La International Kempo Association se lanzó oficialmente en octubre de 2015 durante el seminario inaugural de IKA en Kobe, Japón.",
    },
  },
  it: {
    "report-from-seminar-in-switzerland": {
      title: "Report dal seminario in Svizzera",
      excerpt:
        "Il seminario internazionale annuale in Svizzera, secondo della serie europea estiva, si è svolto di nuovo a Neuchatel.",
    },
    "report-from-ika-seminar-in-czech-republic": {
      title: "Report dal seminario nella Repubblica Ceca",
      excerpt:
        "Il primo seminario internazionale di quell'estate si è tenuto a Karlovy Vary con ospiti da diversi paesi membri IKA.",
    },
    "report-from-ika-leaders-seminar-cyprus-2018": {
      title: "Report dal Seminario Leader IKA, Cipro 2018",
      excerpt:
        "Membri IKA da Hong Kong, Irlanda, Giappone, Svizzera e Regno Unito si sono riuniti a Cipro per una settimana intensiva di formazione.",
    },
    "report-from-3rd-ika-seminar-uk": {
      title: "Report dal 3° Seminario IKA, Regno Unito",
      excerpt:
        "Il terzo seminario IKA si è svolto a Bristol con kenshi da Repubblica Ceca, Irlanda, Giappone, Spagna, Svizzera e Regno Unito.",
    },
    "report-from-2nd-ika-taikai-spain": {
      title: "Report dal 2° Taikai IKA, Spagna",
      excerpt:
        "Il secondo Taikai IKA si è tenuto a Beasain, nei Paesi Baschi, in occasione del 35° anniversario dello Shorinji Kempo nella regione.",
    },
    "bskf-2017-university-training-seminar-report": {
      title: "Report BSKF del seminario universitario 2017",
      excerpt:
        "Il seminario universitario annuale BSKF si è svolto a Glasgow e ha accolto studenti dal Regno Unito e dall'Irlanda.",
    },
    "report-from-2016-leaders-seminar": {
      title: "Report dal Seminario Leader 2016",
      excerpt:
        "Il seminario annuale leader IKA è tornato a Cipro con allenamento avanzato, principi tecnici, pratica di shakujo e studio condiviso.",
    },
    "report-from-ika-taikai-czech-republic": {
      title: "Report dal Taikai IKA, Repubblica Ceca",
      excerpt:
        "Il primo Taikai internazionale IKA si è svolto a Karlovy Vary con istruttori e studenti da diversi paesi membri.",
    },
    "report-from-swiss-seminar-2016": {
      title: "Report dal seminario svizzero 2016",
      excerpt:
        "Membri IKA dal Regno Unito e dalla Spagna si sono uniti agli studenti svizzeri per un seminario di due giorni a Neuchatel.",
    },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": {
      title: "Report BSKF dal 1° Seminario IKA a Kobe, Giappone",
      excerpt:
        "Report dal primo Seminario IKA a Kobe, scritto originariamente da Will Ng e ripubblicato per l'archivio IKA.",
    },
    "post-1": {
      title: "Ritorno allo spirito originale",
      excerpt:
        "L'International Kempo Association è stata lanciata ufficialmente nell'ottobre 2015 durante il seminario inaugurale IKA a Kobe, Giappone.",
    },
  },
  fr: {
    "report-from-seminar-in-switzerland": {
      title: "Rapport du séminaire en Suisse",
      excerpt:
        "Le séminaire international annuel en Suisse, deuxième de la série européenne d'été, s'est tenu de nouveau à Neuchatel.",
    },
    "report-from-ika-seminar-in-czech-republic": {
      title: "Rapport du séminaire en République tchèque",
      excerpt:
        "Le premier séminaire international de cet été-là s'est tenu à Karlovy Vary avec des invités de plusieurs pays membres de l'IKA.",
    },
    "report-from-ika-leaders-seminar-cyprus-2018": {
      title: "Rapport du séminaire des leaders IKA, Chypre 2018",
      excerpt:
        "Des membres IKA de Hong Kong, d'Irlande, du Japon, de Suisse et du Royaume-Uni se sont réunis à Chypre pour une semaine intensive d'entraînement.",
    },
    "report-from-3rd-ika-seminar-uk": {
      title: "Rapport du 3e séminaire IKA, Royaume-Uni",
      excerpt:
        "Le troisième séminaire IKA s'est tenu à Bristol avec des kenshi de République tchèque, d'Irlande, du Japon, d'Espagne, de Suisse et du Royaume-Uni.",
    },
    "report-from-2nd-ika-taikai-spain": {
      title: "Rapport du 2e Taikai IKA, Espagne",
      excerpt:
        "Le deuxième Taikai IKA s'est tenu à Beasain, au Pays basque, pour le 35e anniversaire du Shorinji Kempo dans la région.",
    },
    "bskf-2017-university-training-seminar-report": {
      title: "Rapport BSKF du séminaire universitaire 2017",
      excerpt:
        "Le séminaire universitaire annuel de la BSKF s'est tenu à Glasgow et a accueilli des étudiants du Royaume-Uni et d'Irlande.",
    },
    "report-from-2016-leaders-seminar": {
      title: "Rapport du séminaire des leaders 2016",
      excerpt:
        "Le séminaire annuel des leaders IKA est revenu à Chypre avec entraînement avancé, principes techniques, pratique du shakujo et étude partagée.",
    },
    "report-from-ika-taikai-czech-republic": {
      title: "Rapport du Taikai IKA, République tchèque",
      excerpt:
        "Le premier Taikai international IKA a eu lieu à Karlovy Vary avec des instructeurs et étudiants de plusieurs pays membres.",
    },
    "report-from-swiss-seminar-2016": {
      title: "Rapport du séminaire suisse 2016",
      excerpt:
        "Des membres IKA du Royaume-Uni et d'Espagne ont rejoint des étudiants de toute la Suisse pour un séminaire de deux jours à Neuchatel.",
    },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": {
      title: "Rapport BSKF du 1er séminaire IKA à Kobe, Japon",
      excerpt:
        "Rapport du premier séminaire IKA à Kobe, écrit à l'origine par Will Ng et republié pour les archives IKA.",
    },
    "post-1": {
      title: "Retour à l'esprit originel",
      excerpt:
        "L'International Kempo Association a été officiellement lancée en octobre 2015 lors du séminaire inaugural IKA à Kobe, au Japon.",
    },
  },
  ja: {
    "report-from-seminar-in-switzerland": {
      title: "スイスセミナー報告",
      excerpt:
        "スイスでの年次国際セミナーは、夏の欧州シリーズ第2回として再びヌーシャテルで開催されました。",
    },
    "report-from-ika-seminar-in-czech-republic": {
      title: "チェコ共和国セミナー報告",
      excerpt:
        "その夏最初の国際セミナーはカルロヴィ・ヴァリで開催され、複数のIKA加盟国から参加者が集まりました。",
    },
    "report-from-ika-leaders-seminar-cyprus-2018": {
      title: "2018年キプロス IKAリーダーセミナー報告",
      excerpt:
        "香港、アイルランド、日本、スイス、英国のIKAメンバーがキプロスに集まり、集中的なリーダー研修を行いました。",
    },
    "report-from-3rd-ika-seminar-uk": {
      title: "第3回IKAセミナー 英国報告",
      excerpt:
        "第3回IKAセミナーはブリストルで開催され、チェコ共和国、アイルランド、日本、スペイン、スイス、英国の拳士が参加しました。",
    },
    "report-from-2nd-ika-taikai-spain": {
      title: "第2回IKA大会 スペイン報告",
      excerpt:
        "第2回IKA大会はスペイン・バスク地方のベアサインで開催され、同地域の少林寺拳法35周年を記念しました。",
    },
    "bskf-2017-university-training-seminar-report": {
      title: "2017年BSKF大学研修セミナー報告",
      excerpt:
        "BSKF年次大学研修セミナーはグラスゴーで開催され、英国とアイルランド各地から学生が参加しました。",
    },
    "report-from-2016-leaders-seminar": {
      title: "2016年リーダーセミナー報告",
      excerpt:
        "IKA年次リーダーセミナーはキプロスで行われ、高度な稽古、技術原理、錫杖の実践、共同研究が行われました。",
    },
    "report-from-ika-taikai-czech-republic": {
      title: "IKA大会 チェコ共和国報告",
      excerpt:
        "第1回IKA国際大会はカルロヴィ・ヴァリで開催され、複数の加盟国から指導者と学生が参加しました。",
    },
    "report-from-swiss-seminar-2016": {
      title: "2016年スイスセミナー報告",
      excerpt:
        "英国とスペインのIKAメンバーがスイス各地の学生と合流し、ヌーシャテルで2日間のセミナーを行いました。",
    },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": {
      title: "神戸第1回IKAセミナー BSKF報告",
      excerpt:
        "神戸で開催された第1回IKAセミナーの報告で、Will Ngによる原文をIKAアーカイブとして再掲載したものです。",
    },
    "post-1": {
      title: "原点の精神へ戻る",
      excerpt:
        "International Kempo Associationは、2015年10月に神戸で開催された初回IKAセミナーで正式に発足しました。",
    },
  },
  zh: {
    "report-from-seminar-in-switzerland": {
      title: "瑞士研讨会报告",
      excerpt:
        "年度瑞士国际研讨会作为夏季欧洲系列的第二场，再次在纳沙泰尔举行。",
    },
    "report-from-ika-seminar-in-czech-republic": {
      title: "捷克共和国研讨会报告",
      excerpt:
        "该年夏季首场国际研讨会在卡罗维发利举行，来自多个 IKA 成员国家的嘉宾参加。",
    },
    "report-from-ika-leaders-seminar-cyprus-2018": {
      title: "2018 年塞浦路斯 IKA 领导者研讨会报告",
      excerpt:
        "来自香港、爱尔兰、日本、瑞士和英国的 IKA 成员在塞浦路斯参加密集领导者训练。",
    },
    "report-from-3rd-ika-seminar-uk": {
      title: "第三届 IKA 英国研讨会报告",
      excerpt:
        "第三届 IKA 研讨会在布里斯托举行，来自捷克共和国、爱尔兰、日本、西班牙、瑞士和英国的拳士参加。",
    },
    "report-from-2nd-ika-taikai-spain": {
      title: "第二届 IKA 西班牙大会报告",
      excerpt:
        "第二届 IKA 大会在西班牙巴斯克地区贝亚赛因举行，并纪念该地区少林寺拳法 35 周年。",
    },
    "bskf-2017-university-training-seminar-report": {
      title: "2017 年 BSKF 大学训练研讨会报告",
      excerpt:
        "BSKF 年度大学训练研讨会在格拉斯哥举行，欢迎来自英国和爱尔兰各地的学生。",
    },
    "report-from-2016-leaders-seminar": {
      title: "2016 年领导者研讨会报告",
      excerpt:
        "IKA 年度领导者研讨会回到塞浦路斯，内容包括高级训练、技术原则、锡杖练习和共同学习。",
    },
    "report-from-ika-taikai-czech-republic": {
      title: "IKA 捷克共和国大会报告",
      excerpt:
        "首届 IKA 国际大会在卡罗维发利举行，来自多个成员国家的教练和学生参加。",
    },
    "report-from-swiss-seminar-2016": {
      title: "2016 年瑞士研讨会报告",
      excerpt:
        "来自英国和西班牙的 IKA 成员与瑞士各地学生一起，在纳沙泰尔参加为期两天的研讨会。",
    },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": {
      title: "BSKF 日本神户首届 IKA 研讨会报告",
      excerpt:
        "神户首届 IKA 研讨会报告，原文由 Will Ng 撰写，并作为 IKA 档案重新发布。",
    },
    "post-1": {
      title: "回归原始精神",
      excerpt:
        "International Kempo Association 于 2015 年 10 月在日本神户举行的首届 IKA 研讨会上正式成立。",
    },
  },
  cs: {
    "report-from-seminar-in-switzerland": {
      title: "Zpráva ze semináře ve Švýcarsku",
      excerpt:
        "Každoroční mezinárodní seminář ve Švýcarsku, druhý v letní evropské sérii, se znovu konal v Neuchatelu.",
    },
    "report-from-ika-seminar-in-czech-republic": {
      title: "Zpráva ze semináře v České republice",
      excerpt:
        "První mezinárodní seminář tohoto léta se konal v Karlových Varech za účasti hostů z několika členských zemí IKA.",
    },
    "report-from-ika-leaders-seminar-cyprus-2018": {
      title: "Zpráva ze semináře vedoucích IKA, Kypr 2018",
      excerpt:
        "Členové IKA z Hongkongu, Irska, Japonska, Švýcarska a Spojeného království se sešli na Kypru k intenzivnímu semináři vedoucích.",
    },
    "report-from-3rd-ika-seminar-uk": {
      title: "Zpráva ze 3. semináře IKA, Spojené království",
      excerpt:
        "Třetí seminář IKA se konal v Bristolu za účasti kenshi z Česka, Irska, Japonska, Španělska, Švýcarska a Spojeného království.",
    },
    "report-from-2nd-ika-taikai-spain": {
      title: "Zpráva z 2. IKA Taikai, Španělsko",
      excerpt:
        "Druhé IKA Taikai se konalo v Beasainu v Baskicku a připomnělo 35. výročí Shorinji Kempo v regionu.",
    },
    "bskf-2017-university-training-seminar-report": {
      title: "Zpráva BSKF z univerzitního tréninkového semináře 2017",
      excerpt:
        "Každoroční univerzitní tréninkový seminář BSKF hostil Glasgow a přivítal studenty z celého Spojeného království a Irska.",
    },
    "report-from-2016-leaders-seminar": {
      title: "Zpráva ze semináře vedoucích 2016",
      excerpt:
        "Každoroční seminář vedoucích IKA se vrátil na Kypr s pokročilým tréninkem, technickými principy, praxí shakujo a společným studiem.",
    },
    "report-from-ika-taikai-czech-republic": {
      title: "Zpráva z IKA Taikai, Česká republika",
      excerpt:
        "První mezinárodní IKA Taikai se uskutečnilo v Karlových Varech s instruktory a studenty z několika členských zemí.",
    },
    "report-from-swiss-seminar-2016": {
      title: "Zpráva ze švýcarského semináře 2016",
      excerpt:
        "Členové IKA ze Spojeného království a Španělska se připojili ke studentům z celého Švýcarska na dvoudenním semináři v Neuchatelu.",
    },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": {
      title: "Zpráva BSKF z 1. semináře IKA v Kobe, Japonsko",
      excerpt:
        "Zpráva z prvního semináře IKA v Kobe, původně napsaná Willem Ng a znovu publikovaná pro archiv IKA.",
    },
    "post-1": {
      title: "Návrat k původnímu duchu",
      excerpt:
        "International Kempo Association byla oficiálně založena v říjnu 2015 na úvodním semináři IKA v Kobe v Japonsku.",
    },
  },
};

export function getArchiveCopy(locale: Locale, slug: string) {
  const latestReport = getLatestReports(locale).find((report) => report.slug === slug);

  if (latestReport) {
    return {
      title: latestReport.title,
      excerpt: latestReport.excerpt,
    };
  }

  return (
    olderArchiveTranslations[locale]?.[slug] ??
    olderArchiveTranslations[defaultLocale]?.[slug]
  );
}
