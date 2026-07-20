import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getLatestReports } from "./latest-reports";
import { extendedOlderArchiveTranslations } from "@/lib/i18n/extended-public-locales";

export type ArchiveCopy = {
  title: string;
  excerpt: string;
  bodyHtml?: string;
};

const olderArchiveTranslations: Partial<
  Record<Locale, Record<string, ArchiveCopy>>
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
  const bodyHtml = archiveBodyTranslations[locale]?.[slug];
  const latestReport = getLatestReports(locale).find((report) => report.slug === slug);

  if (latestReport) {
    return {
      title: latestReport.title,
      excerpt: latestReport.excerpt,
      bodyHtml,
    };
  }

  const copy =
    extendedOlderArchiveTranslations[locale]?.[slug] ??
    olderArchiveTranslations[locale]?.[slug] ??
    extendedOlderArchiveTranslations[defaultLocale]?.[slug] ??
    olderArchiveTranslations[defaultLocale]?.[slug];

  return copy ? { ...copy, bodyHtml } : undefined;
}

const archiveBodyTranslations: Partial<Record<Locale, Record<string, string>>> = {
  es: {
    "ika-seminar-in-sicily-june-2023": `
      <div>
        <p>El primer seminario europeo de IKA desde la pandemia fue organizado recientemente por Dojo Messina, en Sicilia. Se celebró durante el fin de semana del 23 al 25 de junio de 2023 y contó con la participación de miembros de IKA de Italia, Suiza y Reino Unido.</p>
        <p>Además del entrenamiento, el encuentro incluyó demostraciones de los asistentes y de otros grupos locales de artes marciales. El sábado por la noche también se celebró una agradable cena Gran Gala.</p>
        <p>IKA desea expresar su agradecimiento a Antonio Romeo Sensei y a los kenshi italianos por su hospitalidad y por organizar un evento tan positivo.</p>
      </div>
    `,
    "ika-training-and-grading-in-indonesia-february-2023": `
      <div>
        <p>Los instructores senior de IKA Tameo Mizuno (8.º dan), Robert Villiers (6.º dan) y Yasue Kadowaki (6.º dan), del Reino Unido, junto con Naganori Maeda (8.º dan), de Japón, viajaron recientemente a Java Occidental, Indonesia, para impartir un seminario especial de entrenamiento y realizar exámenes de IKA. Participaron más de 50 kenshi senior procedentes de 20 provincias de Indonesia.</p>
        <p>IKA agradece a FKI y a su presidente, Bpk. Yasonna Hamonangan Laoly, la cálida hospitalidad recibida y felicita a todos los participantes que superaron con éxito su examen.</p>
        <p><strong>Ascendidos a 4.º dan</strong><br />Megawati<br />Indah Kharina Br Bangun<br />Amran Irawan<br />Januarto<br />Liliek Trihizrahwaty<br />Hartini<br />Siauw Rudi<br />Edi Mulyadi<br />Erlina<br />Adimas Bramantya Adnan Ibrahim<br />Moh. Aminullah<br />Muhamad Rizal Hamdani</p>
        <p><strong>Ascendidos a 5.º dan</strong><br />Haspriadi<br />Hariyanto<br />Kamin<br />Moch. Naim<br />Gallan Sendjaya<br />Awad Ibrahim</p>
        <p><strong>Ascendidos a 6.º dan</strong><br />Agus Salim<br />Abdul Rahman Sabara<br />Effendi Yusuf<br />Yasue Kadowaki</p>
        <p><strong>Ascendido a 7.º dan</strong><br />Nurdin Rohim Sani</p>
      </div>
    `,
    "grading-results": `
      <div>
        <p>IKA se complace en anunciar los resultados de los recientes exámenes senior celebrados en octubre de 2022.</p>
        <p><strong>Maeda Naganori Sensei completó con éxito el examen a 8.º dan</strong> en Londres, Reino Unido. Maeda Sensei ha sido un apoyo muy activo para IKA y es responsable del desarrollo de Rakkan Kempo, que cubre técnicas avanzadas de appo, teiho, kappo y seiho. IKA le felicita por este importante resultado.</p>
        <p>El grupo de instructores senior de FKI (Indonesia) también realizó y superó exámenes en la IKA Busen Academy de Chipre.</p>
        <p><strong>Ascendidos a 7.º dan</strong><br />Nurfitri Syamsuddin<br />Elisabeth Prahmanawaty</p>
        <p><strong>Ascendidos a 6.º dan</strong><br />Muhammad Samaun Abdul Thalib<br />Muhammad Ramlan Siregar<br />Sjahrul Effendy Jusuf</p>
        <p><strong>Ascendido a 5.º dan</strong><br />Yulianto Maris</p>
        <p>Enhorabuena a todos por su éxito.</p>
      </div>
    `,
    "condolences-message": `
      <div>
        <p>IKA lamenta profundamente el fallecimiento de uno de sus miembros senior de Suiza, muy querido y habitual en los eventos de la asociación. A continuación se recogen mensajes del Instructor Jefe y del responsable de Kempo Freestyle (Suiza).</p>
        <p><strong>Mensaje de T. Mizuno</strong><br />Gassho. Siento muchísimo la noticia del fallecimiento de Gilles. Ha sido un golpe muy duro. Para nosotros, Gilles fue un compañero y amigo irremplazable. Compartimos muchas oportunidades de práctica y estudio de técnicas de Shorinji Kempo, y contribuyó de forma significativa al desarrollo de Shorinji Kempo en Suiza y de la International Kempo Association.</p>
        <p>Mizuno Sensei expresó su dolor por no haber podido reunirse durante los dos años anteriores debido a la expansión mundial de la enfermedad, y trasladó sus pensamientos y oraciones a la familia de Gilles.</p>
        <p><strong>Mensaje de Bazz Smith</strong><br />Bazz Smith recordó a Gilles como alumno, compañero de entrenamiento y, sobre todo, amigo cercano durante casi 30 años. Recordó sus primeros pasos en el dojo, su comprensión de la filosofía de Shorinji Kempo, su intenso entrenamiento, la apertura de su propia rama en Lausanne tras alcanzar 2.º dan y su posterior 4.º dan Seikenshi.</p>
        <p>También destacó los viajes compartidos a seminarios internacionales en Japón, Francia, Reino Unido, Chipre, Italia, España, República Checa y Suiza, así como la honestidad, fuerza y apoyo de Gilles. Sus pensamientos acompañan a Pascaline y a la familia de Gilles en Francia.</p>
      </div>
    `,
    "porkemi-indonesia-accepted-to-national-olympic-committee": `
      <div>
        <p>IKA se complace en anunciar que la Unión Deportiva de Kempo de Indonesia (Porkemi) ha recibido membresía del Comité Olímpico Nacional de Indonesia.</p>
        <p>Este reconocimiento supone un hito importante para la promoción de Shorinji Kempo en Indonesia. IKA desea a Porkemi todo lo mejor en esta nueva etapa: salam persatuan.</p>
      </div>
    `,
    "report-from-international-seminar-in-spain": `
      <div>
        <p>El tercer y último seminario de la serie de verano se celebró en Beasain, en el País Vasco, durante el fin de semana del 22 y 23 de junio. Fue organizado por GUSKE y contó con participantes del País Vasco, Canarias y Reino Unido.</p>
        <p>La enseñanza estuvo a cargo del instructor invitado Maeda Sensei (7.º dan), de Japón, especialista en seiho, appo y kappo.</p>
      </div>
    `,
    "report-from-seminar-in-switzerland": `
      <div>
        <p>El seminario internacional anual en Suiza, segundo de la serie europea de verano, se celebró de nuevo en Neuchatel los días 15 y 16 de junio, organizado por Sensei Bazz y sus estudiantes.</p>
        <p>Mizuno Sensei y Kawamura Sensei continuaron su recorrido desde la República Checa y se unieron a instructores senior y kenshi de Reino Unido y Suiza.</p>
        <p>El seminario suizo de ese año fue especial porque también recibió a una delegación del nuevo grupo indonesio Porkemi (Indonesian Sports Kempo Association). Se realizó un examen para varios miembros de alto grado de la delegación, un primer paso importante para establecer una nueva amistad con Indonesia. Posteriormente, Porkemi fue aceptada como miembro de pleno derecho de IKA.</p>
      </div>
    `,
    "report-from-ika-seminar-in-czech-republic": `
      <div>
        <p>El primer seminario internacional de la serie de verano se celebró en la ciudad balneario de Karlovy Vary, República Checa, durante el fin de semana del 8 y 9 de junio de 2019.</p>
        <p>Fue organizado por Sensei Miroslav, de la rama Karlovy Vary de la Federación Checa, y contó con invitados de la rama de Praga, Eslovaquia, Inglaterra, Escocia y Japón.</p>
        <p>La instrucción fue impartida por Kawamura Sensei, 7.º dan y presidente de JSKF, que viajó desde Nagoya, Japón, y por Mizuno Sensei, instructor jefe de BSKF, quien también dirigió un examen.</p>
      </div>
    `,
    "report-from-ika-leaders-seminar-cyprus-2018": `
      <div>
        <p>Septiembre de 2018 marcó el último año de la serie actual de seminarios de líderes en Chipre. Miembros de IKA de Hong Kong, Irlanda, Japón, Suiza y Reino Unido se reunieron para una semana intensiva de entrenamiento.</p>
        <p>Las mañanas se centraron en aplicaciones de principios avanzados desarrollados por Mizuno Sensei y en el estudio de técnicas de cinturón negro con el instructor invitado Imai Sensei.</p>
        <p>Las tardes se dedicaron al estudio al aire libre de armas especializadas de Shorinji Kempo, incluyendo shakujo y nyoi. También hubo tiempo para comer, compartir, descansar y reforzar amistades.</p>
        <p>Como en años anteriores, fue una gran oportunidad para estudiar aspectos de nivel superior de Shorinji Kempo, reafirmar amistades antiguas y crear nuevas. Aunque fue el último seminario de líderes de la serie actual, IKA anunció que habría más encuentros en el futuro, comenzando con el Taikai de IKA en Japón.</p>
      </div>
    `,
    "report-from-3rd-ika-seminar-uk": `
      <div>
        <p>El tercer seminario IKA se celebró en Bristol, Reino Unido, durante el fin de semana del 28 y 29 de abril de 2018. Fue organizado por la British Shorinji Kempo Federation y coordinado por Bristol City Branch.</p>
        <p>Participaron kenshi de República Checa, Irlanda, Japón, España, Suiza y Reino Unido. El encuentro combinó entrenamiento técnico, estudio compartido y convivencia entre miembros de diferentes países.</p>
      </div>
    `,
    "report-from-2nd-ika-taikai-spain": `
      <div>
        <p>El segundo Taikai IKA se celebró en Beasain, en el País Vasco, y coincidió con el 35.º aniversario de Shorinji Kempo en la región.</p>
        <p>Miembros de IKA de distintos países se reunieron para entrenar, compartir conocimientos y reforzar los lazos entre organizaciones y dojos. El evento puso de relieve la continuidad del trabajo internacional y el espíritu de cooperación dentro de IKA.</p>
      </div>
    `,
    "bskf-2017-university-training-seminar-report": `
      <div>
        <p>El seminario universitario anual de BSKF de 2017 se celebró en Glasgow y reunió a estudiantes de diferentes universidades del Reino Unido e Irlanda.</p>
        <p>El encuentro ofreció entrenamiento intensivo, intercambio técnico y una oportunidad para que estudiantes de distintas ramas practicaran juntos y reforzaran su conexión con la comunidad internacional de Kempo.</p>
      </div>
    `,
    "report-from-2016-leaders-seminar": `
      <div>
        <p>El seminario anual de líderes de IKA volvió a Chipre en 2016 con un programa centrado en entrenamiento avanzado, principios técnicos y práctica compartida.</p>
        <p>Los participantes estudiaron aspectos superiores de Shorinji Kempo, incluyendo práctica con shakujo, trabajo técnico detallado y sesiones pensadas para líderes e instructores. El seminario también sirvió para fortalecer amistades y coordinación entre miembros de varios países.</p>
      </div>
    `,
    "report-from-ika-taikai-czech-republic": `
      <div>
        <p>El primer Taikai Internacional IKA tuvo lugar en Karlovy Vary, República Checa, con instructores y estudiantes de varios países miembros.</p>
        <p>El encuentro reunió entrenamiento, demostraciones y convivencia internacional, consolidando el trabajo conjunto de IKA tras su creación y reforzando los vínculos entre las organizaciones participantes.</p>
      </div>
    `,
    "report-from-swiss-seminar-2016": `
      <div>
        <p>Miembros de IKA de Reino Unido y España se unieron a estudiantes de toda Suiza para un seminario de dos días en Neuchatel.</p>
        <p>El seminario permitió compartir entrenamiento técnico, fortalecer la cooperación entre países y continuar el desarrollo de la red internacional de IKA en Europa.</p>
      </div>
    `,
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": `
      <div>
        <p>Este informe fue escrito originalmente por Will Ng, 2.º dan, y publicado en la web de la rama BSKF Mayfair. Las opiniones expresadas pertenecen al autor y no necesariamente reflejan las de BSKF o IKA.</p>
        <p>En octubre de 2015, grupos que se habían separado de WSKO, algunos sin relación previa entre sí, se reunieron finalmente para participar en el primer seminario internacional bajo la bandera de la International Kempo Association. No fue solo un seminario de entrenamiento: cada grupo participante ayudó a construir una nueva organización en la que cada persona pudiera expresarse libremente y contribuir a los objetivos de Shorinji Kempo.</p>
        <p>El seminario comenzó la mañana del 10 de octubre y reunió a más de 70 representantes de Japón, Reino Unido, Suiza, Italia, España, República Checa y Hong Kong. A pesar del cansancio de los viajes, la energía fue positiva y todos buscaron aprender de los maestros y también unos de otros, cambiando regularmente de compañero y creando nuevas amistades.</p>
        <p>Mizuno Sensei (8.º dan, instructor jefe de BSKF) dirigió una sesión de filosofía en inglés y japonés. Subrayó la responsabilidad personal sobre la propia vida, las acciones y las decisiones, una idea que requiere valentía: creer, mantenerse firme y asumir los propios actos.</p>
        <p>El informe también destaca que la creación de IKA fue posible gracias a la solidaridad y camaradería mostradas por países, ramas e individuos. La celebración posterior del domingo reunió discursos, gratitud, amistad y emoción entre Mizuno Sensei, Imai Sensei y Yoshinaga Sensei. El final del entrenamiento fue solo el comienzo de una nueva etapa.</p>
        <p>BSKF agradeció a Yoshinaga Sensei, Imai Sensei, los demás sensei, kenshi y colaboradores por hacer posible un evento fluido, agradable y divertido, y expresó su deseo de muchos seminarios exitosos en el futuro.</p>
      </div>
    `,
    "post-1": `
      <div>
        <h2>Lanzamiento de IKA</h2>
        <p>La International Kempo Association fue lanzada oficialmente en octubre de 2015 durante el seminario inaugural de IKA en Kobe, Japón.</p>
        <p>Practicantes de Shorinji Kempo de organizaciones miembro de Italia, España, Suiza y Reino Unido se unieron a estudiantes de Japón para dos días de entrenamiento.</p>
        <p>El evento marcó el regreso al espíritu original y el comienzo de una nueva etapa de cooperación internacional para los miembros de IKA.</p>
      </div>
    `,
  },
};
