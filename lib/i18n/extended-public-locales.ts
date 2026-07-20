import type { Locale } from "./config";

type DictionaryShape = {
  nav: Record<string, string>;
  home: Record<string, string>;
  footer: Record<string, string>;
};

type PublicPageShape = {
  eyebrow: string;
  title: string;
  intro: string;
  quote?: string;
  blocks?: Array<{ title: string; text: string }>;
  steps?: Array<{ number: string; title: string; text: string }>;
  countries?: string[];
  emailLabel?: string;
  hasCmsBlocks?: boolean;
};

type AboutSectionShape = {
  title: string;
  image: string;
  body: string[];
  bullets?: string[];
  note?: string;
};

export const extendedDictionaries: Partial<Record<Locale, DictionaryShape>> = {
  id: {
    nav: {
      home: "Beranda",
      about: "Tentang IKA",
      philosophy: "Filsafat",
      countries: "Negara",
      dojos: "Dojo",
      join: "Bergabung dengan IKA",
      news: "Berita",
      events: "Acara",
      contact: "Kontak",
      admin: "Admin",
      portal: "Portal IKA",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Kembali ke semangat asli",
      summary:
        "Sebuah keluarga internasional praktisi dan organisasi Kempo, dipersatukan oleh warisan bersama, latihan, filsafat, dan pengembangan diri bersama.",
      primaryAction: "Kenali IKA",
      secondaryAction: "Lihat negara anggota",
      quote:
        "Hiduplah setengah untuk kebahagiaan diri sendiri, dan setengah untuk kebahagiaan orang lain.",
      introEyebrow: "IKA",
      introTitle: "Asosiasi global dengan akar yang sama",
      introText:
        "IKA didirikan di Kobe, Jepang, pada Oktober 2015 untuk menyatukan praktisi dan organisasi seni bela diri yang berbagi dasar dalam ajaran Doshin So, pendiri Shorinji Kempo.",
      familyTitle: "Apa yang menyatukan keluarga IKA",
      familyText:
        "Organisasi anggota mungkin menggunakan nama yang berbeda, tetapi semuanya berbagi warisan yang sama, gaya fisik yang sama, dan filsafat yang menggabungkan welas asih dengan kemandirian.",
      practiceTitle: "Latihan untuk tubuh, pikiran, dan masyarakat",
      practiceText:
        "Latihan menggabungkan teknik keras dan lunak, latihan berpasangan, meditasi, dan filsafat agar setiap praktisi berkembang dan memberi kontribusi positif kepada masyarakat.",
      accessTitle: "Akses pribadi anggota",
      accessText:
        "Kenshi, administrator dojo, administrator negara, dan administrator global masuk melalui satu akses aman sesuai perannya.",
      reportsEyebrow: "Laporan terbaru",
      reportsTitle: "Berita dari keluarga IKA",
      reportsAction: "Lihat semua berita",
      reportCardAction: "Baca laporan",
      readMoreEyebrow: "Baca lebih lanjut",
      readMoreTitle: "Jelajahi asosiasi",
      readMoreAction: "Baca lebih lanjut",
      articleAboutLabel: "Tentang IKA",
      articleAboutTitle: "Warisan bersama, latihan, dan filsafat",
      articleCountriesLabel: "Organisasi anggota",
      articleCountriesTitle: "Asosiasi internasional lintas benua",
      articleEventsLabel: "Acara mendatang",
      articleEventsTitle: "Seminar, kursus, dan pertemuan",
      joinEyebrow: "Bergabung dengan IKA",
      joinTitle: "Berlatih bersama untuk pengembangan diri bersama.",
      joinAction: "Hubungi asosiasi",
    },
    footer: {
      summary:
        "Kembali ke semangat asli melalui latihan internasional, persahabatan, filsafat, dan warisan Kempo yang dibagikan bersama.",
      webTitle: "Web",
      contactTitle: "Kontak",
      legal:
        "© Copyright IKA 2022, semua hak dilindungi. 'International Kempo Association' dan logo IKA adalah merek dagang terdaftar di Inggris.",
    },
  },
  ms: {
    nav: {
      home: "Laman utama",
      about: "Tentang IKA",
      philosophy: "Falsafah",
      countries: "Negara",
      dojos: "Dojo",
      join: "Sertai IKA",
      news: "Berita",
      events: "Acara",
      contact: "Hubungi",
      admin: "Admin",
      portal: "Portal IKA",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Kembali kepada semangat asal",
      summary:
        "Sebuah keluarga antarabangsa pengamal dan organisasi Kempo, disatukan oleh warisan bersama, latihan, falsafah, dan pembangunan diri bersama.",
      primaryAction: "Kenali IKA",
      secondaryAction: "Lihat negara ahli",
      quote:
        "Hiduplah separuh untuk kebahagiaan diri sendiri, dan separuh untuk kebahagiaan orang lain.",
      introEyebrow: "IKA",
      introTitle: "Persatuan global dengan akar yang sama",
      introText:
        "IKA ditubuhkan di Kobe, Jepun, pada Oktober 2015 untuk menyatukan pengamal dan organisasi seni bela diri yang berkongsi asas dalam ajaran Doshin So, pengasas Shorinji Kempo.",
      familyTitle: "Apa yang menyatukan keluarga IKA",
      familyText:
        "Organisasi ahli mungkin menggunakan nama yang berbeza, tetapi semuanya berkongsi warisan yang sama, gaya fizikal yang sama, dan falsafah yang menggabungkan belas kasihan dengan berdikari.",
      practiceTitle: "Latihan untuk tubuh, minda, dan masyarakat",
      practiceText:
        "Latihan menggabungkan teknik keras dan lembut, latihan berpasangan, meditasi, dan falsafah agar setiap pengamal berkembang dan menyumbang secara positif kepada masyarakat.",
      accessTitle: "Akses peribadi ahli",
      accessText:
        "Kenshi, pentadbir dojo, pentadbir negara, dan pentadbir global masuk melalui satu akses selamat mengikut peranan masing-masing.",
      reportsEyebrow: "Laporan terkini",
      reportsTitle: "Berita daripada keluarga IKA",
      reportsAction: "Lihat semua berita",
      reportCardAction: "Baca laporan",
      readMoreEyebrow: "Baca lagi",
      readMoreTitle: "Terokai persatuan",
      readMoreAction: "Baca lagi",
      articleAboutLabel: "Tentang IKA",
      articleAboutTitle: "Warisan bersama, latihan, dan falsafah",
      articleCountriesLabel: "Organisasi ahli",
      articleCountriesTitle: "Persatuan antarabangsa merentas benua",
      articleEventsLabel: "Acara akan datang",
      articleEventsTitle: "Seminar, kursus, dan pertemuan",
      joinEyebrow: "Sertai IKA",
      joinTitle: "Berlatih bersama untuk pembangunan diri bersama.",
      joinAction: "Hubungi persatuan",
    },
    footer: {
      summary:
        "Kembali kepada semangat asal melalui latihan antarabangsa, persahabatan, falsafah, dan warisan Kempo yang dikongsi bersama.",
      webTitle: "Web",
      contactTitle: "Hubungi",
      legal:
        "© Copyright IKA 2022, semua hak terpelihara. 'International Kempo Association' dan logo IKA ialah cap dagangan berdaftar di United Kingdom.",
    },
  },
  eu: {
    nav: {
      home: "Hasiera",
      about: "IKAri buruz",
      philosophy: "Filosofia",
      countries: "Herrialdeak",
      dojos: "Dojok",
      join: "IKArekin bat egin",
      news: "Albisteak",
      events: "Ekitaldiak",
      contact: "Kontaktua",
      admin: "Admin",
      portal: "IKA Portala",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Jatorrizko espiritura itzuli",
      summary:
        "Kempo praktikatzaile eta erakundeen nazioarteko familia bat, ondare partekatuak, entrenamenduak, filosofiak eta elkarren garapenak batua.",
      primaryAction: "IKA ezagutu",
      secondaryAction: "Kide diren herrialdeak ikusi",
      quote:
        "Bizi zaitez erdia zeure zorionerako, eta erdia besteen zorionerako.",
      introEyebrow: "IKA",
      introTitle: "Erro komuneko nazioarteko elkartea",
      introText:
        "IKA 2015eko urrian sortu zen, Kobe-n, Japonian, Doshin So-ren irakaspenetan oinarri bera duten arte martzialetako praktikatzaile eta erakundeak elkartzeko.",
      familyTitle: "Zerk batzen du IKA familia",
      familyText:
        "Kide diren erakundeek izen desberdinak erabil ditzakete, baina ondare bera, estilo fisiko bera eta errukia autoaskitasunarekin uztartzen duen filosofia bera partekatzen dituzte.",
      practiceTitle: "Gorputzerako, adimenerako eta gizarterako entrenamendua",
      practiceText:
        "Entrenamenduak teknika gogorrak eta leunak, bikoteka egindako lana, meditazioa eta filosofia uztartzen ditu, praktikatzaile bakoitza garatu eta gizarteari modu positiboan laguntzeko.",
      accessTitle: "Kideen sarbide pribatua",
      accessText:
        "Kenshi, dojo administratzaileak, herrialde administratzaileak eta administratzaile globalak sarbide seguru bakar batetik sartzen dira, beren rolari dagokionez.",
      reportsEyebrow: "Azken txostenak",
      reportsTitle: "IKA familiaren albisteak",
      reportsAction: "Albiste guztiak ikusi",
      reportCardAction: "Txostena irakurri",
      readMoreEyebrow: "Gehiago irakurri",
      readMoreTitle: "Elkartea ezagutu",
      readMoreAction: "Gehiago irakurri",
      articleAboutLabel: "IKAri buruz",
      articleAboutTitle: "Ondare partekatua, entrenamendua eta filosofia",
      articleCountriesLabel: "Kide diren erakundeak",
      articleCountriesTitle: "Kontinenteetan zehar hedatutako nazioarteko elkartea",
      articleEventsLabel: "Datozen ekitaldiak",
      articleEventsTitle: "Mintegiak, ikastaroak eta topaketak",
      joinEyebrow: "IKArekin bat egin",
      joinTitle: "Elkarrekin entrenatu, elkarren garapenerako.",
      joinAction: "Elkartearekin harremanetan jarri",
    },
    footer: {
      summary:
        "Jatorrizko espiritura itzuli nazioarteko entrenamenduaren, adiskidetasunaren, filosofiaren eta partekatutako Kempo ondarearen bidez.",
      webTitle: "Web",
      contactTitle: "Kontaktua",
      legal:
        "© Copyright IKA 2022, eskubide guztiak erreserbatuak. 'International Kempo Association' eta IKA logoa Erresuma Batuan erregistratutako markak dira.",
    },
  },
  pt: {
    nav: {
      home: "Início",
      about: "Sobre a IKA",
      philosophy: "Filosofia",
      countries: "Países",
      dojos: "Dojos",
      join: "Junte-se à IKA",
      news: "Notícias",
      events: "Eventos",
      contact: "Contacto",
      admin: "Admin",
      portal: "Portal IKA",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Voltar ao espírito original",
      summary:
        "Uma família internacional de praticantes e organizações de Kempo, unida por herança comum, treino, filosofia e desenvolvimento mútuo.",
      primaryAction: "Descobrir a IKA",
      secondaryAction: "Ver países membros",
      quote:
        "Viver metade para a felicidade de si próprio e metade para a felicidade dos outros.",
      introEyebrow: "IKA",
      introTitle: "Uma associação global com raízes comuns",
      introText:
        "A IKA foi lançada em Kobe, no Japão, em outubro de 2015, para reunir praticantes e organizações de artes marciais que partilham uma base comum nos ensinamentos de Doshin So, fundador do Shorinji Kempo.",
      familyTitle: "O que une a família IKA",
      familyText:
        "As organizações membro podem usar nomes diferentes, mas partilham uma herança comum, um estilo físico comum e uma filosofia que combina compaixão com autossuficiência.",
      practiceTitle: "Treino para corpo, mente e sociedade",
      practiceText:
        "O treino combina técnicas duras e suaves, prática em pares, meditação e filosofia para que cada praticante se desenvolva e contribua positivamente para a sociedade.",
      accessTitle: "Acesso privado para membros",
      accessText:
        "Kenshi, administradores de dojo, administradores de país e administradores globais entram através de um único acesso seguro de acordo com o seu papel.",
      reportsEyebrow: "Relatórios mais recentes",
      reportsTitle: "Notícias da família IKA",
      reportsAction: "Ver todas as notícias",
      reportCardAction: "Ler relatório",
      readMoreEyebrow: "Ler mais",
      readMoreTitle: "Explorar a associação",
      readMoreAction: "Ler mais",
      articleAboutLabel: "Sobre a IKA",
      articleAboutTitle: "Herança partilhada, treino e filosofia",
      articleCountriesLabel: "Organizações membro",
      articleCountriesTitle: "Uma associação internacional entre continentes",
      articleEventsLabel: "Próximos eventos",
      articleEventsTitle: "Seminários, cursos e encontros",
      joinEyebrow: "Junte-se à IKA",
      joinTitle: "Treinar juntos para o desenvolvimento mútuo.",
      joinAction: "Contactar a associação",
    },
    footer: {
      summary:
        "Voltar ao espírito original através de treino internacional, amizade, filosofia e herança Kempo partilhada.",
      webTitle: "Web",
      contactTitle: "Contacto",
      legal:
        "© Copyright IKA 2022, todos os direitos reservados. 'International Kempo Association' e o logótipo IKA são marcas registadas no Reino Unido.",
    },
  },
  de: {
    nav: {
      home: "Start",
      about: "Über IKA",
      philosophy: "Philosophie",
      countries: "Länder",
      dojos: "Dojos",
      join: "IKA beitreten",
      news: "Nachrichten",
      events: "Veranstaltungen",
      contact: "Kontakt",
      admin: "Admin",
      portal: "IKA-Portal",
    },
    home: {
      eyebrow: "International Kempo Association",
      title: "Zurück zum ursprünglichen Geist",
      summary:
        "Eine internationale Familie von Kempo-Praktizierenden und Organisationen, vereint durch gemeinsames Erbe, Training, Philosophie und gegenseitige Entwicklung.",
      primaryAction: "IKA entdecken",
      secondaryAction: "Mitgliedsländer ansehen",
      quote:
        "Lebe zur Hälfte für dein eigenes Glück und zur Hälfte für das Glück anderer.",
      introEyebrow: "IKA",
      introTitle: "Eine globale Vereinigung mit gemeinsamen Wurzeln",
      introText:
        "IKA wurde im Oktober 2015 in Kobe, Japan, gegründet, um Kampfkünstler und Organisationen zusammenzubringen, die eine gemeinsame Grundlage in den Lehren von Doshin So, dem Gründer von Shorinji Kempo, teilen.",
      familyTitle: "Was die IKA-Familie verbindet",
      familyText:
        "Mitgliedsorganisationen können unterschiedliche Namen verwenden, teilen aber ein gemeinsames Erbe, einen gemeinsamen körperlichen Stil und eine Philosophie, die Mitgefühl mit Selbstständigkeit verbindet.",
      practiceTitle: "Training für Körper, Geist und Gesellschaft",
      practiceText:
        "Das Training verbindet harte und weiche Techniken, Partnerübungen, Meditation und Philosophie, damit sich jede praktizierende Person entwickelt und positiv zur Gesellschaft beiträgt.",
      accessTitle: "Privater Zugang für Mitglieder",
      accessText:
        "Kenshi, Dojo-Administratoren, Länder-Administratoren und globale Administratoren greifen je nach Rolle über einen einzigen sicheren Zugang zu.",
      reportsEyebrow: "Neueste Berichte",
      reportsTitle: "Nachrichten aus der IKA-Familie",
      reportsAction: "Alle Nachrichten ansehen",
      reportCardAction: "Bericht lesen",
      readMoreEyebrow: "Mehr lesen",
      readMoreTitle: "Die Vereinigung entdecken",
      readMoreAction: "Mehr lesen",
      articleAboutLabel: "Über IKA",
      articleAboutTitle: "Gemeinsames Erbe, Training und Philosophie",
      articleCountriesLabel: "Mitgliedsorganisationen",
      articleCountriesTitle: "Eine internationale Vereinigung über Kontinente hinweg",
      articleEventsLabel: "Kommende Veranstaltungen",
      articleEventsTitle: "Seminare, Kurse und Treffen",
      joinEyebrow: "IKA beitreten",
      joinTitle: "Gemeinsam trainieren für gegenseitige Entwicklung.",
      joinAction: "Die Vereinigung kontaktieren",
    },
    footer: {
      summary:
        "Zurück zum ursprünglichen Geist durch internationales Training, Freundschaft, Philosophie und gemeinsames Kempo-Erbe.",
      webTitle: "Web",
      contactTitle: "Kontakt",
      legal:
        "© Copyright IKA 2022, alle Rechte vorbehalten. 'International Kempo Association' und das IKA-Logo sind im Vereinigten Königreich eingetragene Marken.",
    },
  },
};

const memberCountries = {
  id: ["Kosta Rika", "Republik Ceko", "Indonesia dan Malaysia", "Irlandia", "Italia", "Hong Kong", "Jepang", "Spanyol", "Swiss", "Inggris Raya"],
  ms: ["Costa Rica", "Republik Czech", "Indonesia dan Malaysia", "Ireland", "Itali", "Hong Kong", "Jepun", "Sepanyol", "Switzerland", "United Kingdom"],
  eu: ["Costa Rica", "Txekiar Errepublika", "Indonesia eta Malaysia", "Irlanda", "Italia", "Hong Kong", "Japonia", "Espainia", "Suitza", "Erresuma Batua"],
  pt: ["Costa Rica", "República Checa", "Indonésia e Malásia", "Irlanda", "Itália", "Hong Kong", "Japão", "Espanha", "Suíça", "Reino Unido"],
  de: ["Costa Rica", "Tschechische Republik", "Indonesien und Malaysia", "Irland", "Italien", "Hongkong", "Japan", "Spanien", "Schweiz", "Vereinigtes Königreich"],
} as const;

export const extendedPublicPageContent: Partial<Record<Locale, Record<string, PublicPageShape>>> = {
  id: {
    about: { eyebrow: "Tentang IKA", title: "Tentang International Kempo Association", intro: "International Kempo Association menyatukan praktisi dan organisasi dari seluruh dunia yang berkongsi warisan, gaya fizikal, dan falsafah yang sama." },
    philosophy: { eyebrow: "Filsafat", title: "Kekuatan, welas asih, dan kemandirian.", intro: "Latihan IKA mengembangkan manusia secara teknis, mental, dan sosial melalui latihan berpasangan, meditasi, dan filsafat.", quote: "Hiduplah setengah untuk kebahagiaan diri sendiri, dan setengah untuk kebahagiaan orang lain.", blocks: [{ title: "Pengembangan bersama", text: "Para praktisi berlatih bersama untuk berkembang bersama." }, { title: "Bertahan sebelum menyerang", text: "Teknik menekankan kendali, keseimbangan, titik lemah, dan penggunaan tenaga seminimal mungkin." }, { title: "Pikiran dan tubuh", text: "Latihan menggabungkan teknik keras dan lunak dengan meditasi dan refleksi." }, { title: "Masyarakat yang positif", text: "Latihan harus membentuk manusia yang percaya diri dan berwelas asih." }] },
    countries: { eyebrow: "Negara anggota", title: "IKA di seluruh dunia", intro: "IKA menyatukan organisasi anggota di berbagai negara dan benua. Jelajahi negara-negara yang terhubung melalui International Kempo Association.", countries: [...memberCountries.id] },
    dojos: { eyebrow: "Dojos", title: "Temukan dojo IKA", intro: "Jelajahi dojo resmi IKA berdasarkan negara dan kota." },
    news: { eyebrow: "Berita", title: "Berita terbaru IKA", intro: "Baca berita, laporan, dan pembaruan terbaru dari International Kempo Association." },
    events: { eyebrow: "Acara", title: "Seminar, kursus, dan pertemuan", intro: "Temukan seminar, kursus, taikai, dan pertemuan internasional IKA yang terbuka untuk umum." },
    join: { eyebrow: "Bergabung dengan IKA", title: "Hubungkan organisasi Anda dengan keluarga internasional IKA.", intro: "IKA menyambut organisasi yang berbagi akar teknis, filsafat, dan komitmen untuk berlatih bersama lintas batas.", steps: [{ number: "01", title: "Hubungi IKA", text: "Perkenalkan organisasi dan negara Anda." }, { number: "02", title: "Biarkan kami mengenal Anda", text: "Bagikan latar belakang teknis, sejarah, dan organisasi Anda kepada kami." }, { number: "03", title: "Berbagi latihan", text: "Jika syarat sebelumnya terpenuhi, kami akan mengundang Anda untuk mengikuti suatu acara bersama kami agar kami dapat mengenal latihan Anda dan saling mengenal lebih baik." }, { number: "04", title: "Usulan dan penerimaan keanggotaan", text: "Usulan keanggotaan akan diajukan kepada dewan untuk ditinjau dan diputuskan." }] },
    contact: { eyebrow: "Kontak", title: "Hubungi International Kempo Association.", intro: "Gunakan formulir di bawah ini untuk menghubungi IKA.", emailLabel: "Email" },
    portal: { eyebrow: "Akses pribadi", title: "Satu login, portal yang tepat untuk setiap peran.", intro: "Setelah masuk, setiap pengguna akan masuk ke portal yang sesuai menurut perannya: Kenshi, admin dojo, admin negara, admin global, atau super admin.", blocks: [{ title: "Kenshi", text: "Profil pribadi, riwayat tingkatan, kursus, taikai, sertifikat, dan IKA Passport." }, { title: "Admin Dojo", text: "Halaman dojo, Kenshi dojo, pembaruan dasar, dan statistik dojo." }, { title: "Admin Negara", text: "Halaman negara, dojo, Kenshi, kursus, taikai, dan laporan negara." }] },
  },
  ms: {
    about: { eyebrow: "Tentang IKA", title: "Tentang International Kempo Association", intro: "International Kempo Association menghimpunkan pengamal dan organisasi dari seluruh dunia yang berkongsi warisan, gaya fizikal, dan falsafah yang sama." },
    philosophy: { eyebrow: "Falsafah", title: "Kekuatan, belas kasihan, dan berdikari.", intro: "Latihan IKA membangunkan manusia dari segi teknikal, mental, dan sosial melalui latihan berpasangan, meditasi, dan falsafah.", quote: "Hiduplah separuh untuk kebahagiaan diri sendiri, dan separuh untuk kebahagiaan orang lain.", blocks: [{ title: "Pembangunan bersama", text: "Para pengamal berlatih bersama untuk berkembang bersama." }, { title: "Pertahanan sebelum serangan", text: "Teknik menekankan kawalan, imbangan, titik lemah, dan penggunaan tenaga yang minimum." }, { title: "Minda dan tubuh", text: "Latihan menggabungkan teknik keras dan lembut dengan meditasi dan renungan." }, { title: "Masyarakat yang positif", text: "Latihan harus membentuk manusia yang yakin dan berbelas kasihan." }] },
    countries: { eyebrow: "Negara ahli", title: "IKA di seluruh dunia", intro: "IKA menghimpunkan organisasi ahli di pelbagai negara dan benua. Terokai negara-negara yang dihubungkan melalui International Kempo Association.", countries: [...memberCountries.ms] },
    dojos: { eyebrow: "Dojos", title: "Cari dojo IKA", intro: "Terokai dojo rasmi IKA mengikut negara dan bandar." },
    news: { eyebrow: "Berita", title: "Berita terkini IKA", intro: "Baca berita, laporan, dan kemas kini terkini daripada International Kempo Association." },
    events: { eyebrow: "Acara", title: "Seminar, kursus, dan pertemuan", intro: "Temui seminar, kursus, taikai, dan pertemuan antarabangsa IKA yang terbuka kepada umum." },
    join: { eyebrow: "Sertai IKA", title: "Hubungkan organisasi anda dengan keluarga antarabangsa IKA.", intro: "IKA mengalu-alukan organisasi yang berkongsi akar teknikal, falsafah, dan komitmen untuk berlatih bersama merentasi sempadan.", steps: [{ number: "01", title: "Hubungi IKA", text: "Perkenalkan organisasi dan negara anda." }, { number: "02", title: "Biar kami mengenali anda", text: "Kongsikan latar teknikal, sejarah, dan organisasi anda dengan kami." }, { number: "03", title: "Berkongsi latihan", text: "Jika syarat terdahulu dipenuhi, kami akan menjemput anda menyertai satu acara bersama kami supaya kami dapat mengenali latihan anda dan saling mengenali dengan lebih baik." }, { number: "04", title: "Cadangan dan penerimaan keahlian", text: "Cadangan keahlian akan dibentangkan kepada lembaga untuk semakan dan keputusan." }] },
    contact: { eyebrow: "Hubungi", title: "Hubungi International Kempo Association.", intro: "Gunakan borang di bawah untuk menghubungi IKA.", emailLabel: "Email" },
    portal: { eyebrow: "Akses peribadi", title: "Satu log masuk, portal yang betul bagi setiap peranan.", intro: "Selepas log masuk, setiap pengguna akan masuk ke portal yang betul mengikut peranannya: Kenshi, admin dojo, admin negara, admin global, atau super admin.", blocks: [{ title: "Kenshi", text: "Profil peribadi, sejarah pangkat, kursus, taikai, sijil, dan IKA Passport." }, { title: "Admin Dojo", text: "Halaman dojo, Kenshi dojo, kemas kini asas, dan statistik dojo." }, { title: "Admin Negara", text: "Halaman negara, dojo, Kenshi, kursus, taikai, dan laporan negara." }] },
  },
  eu: {
    about: { eyebrow: "IKAri buruz", title: "International Kempo Association-i buruz", intro: "International Kempo Associationek ondare, estilo fisiko eta filosofia bera partekatzen duten mundu osoko praktikatzaileak eta erakundeak elkartzen ditu." },
    philosophy: { eyebrow: "Filosofia", title: "Indarra, errukia eta autoaskitasuna.", intro: "IKAren entrenamenduak pertsonak teknikoki, mentalki eta sozialki garatzen ditu bikoteka egindako praktikaren, meditazioaren eta filosofiaren bidez.", quote: "Bizi zaitez erdia zeure zorionerako, eta erdia besteen zorionerako.", blocks: [{ title: "Elkarren garapena", text: "Praktikatzaileek elkarrekin entrenatzen dute elkarrekin hazteko." }, { title: "Defentsa erasoaren aurretik", text: "Teknikek kontrola, oreka, puntu ahulak eta behar den indar minimoa azpimarratzen dituzte." }, { title: "Adimena eta gorputza", text: "Praktikak teknika gogorrak eta leunak uztartzen ditu meditazioarekin eta gogoetarekin." }, { title: "Gizarte positiboa", text: "Entrenamenduak konfiantzaz eta errukiz laguntzen duten pertsonak sortu behar ditu." }] },
    countries: { eyebrow: "Kide diren herrialdeak", title: "IKA munduan zehar", intro: "IKAk herrialde eta kontinente askotako kide diren erakundeak biltzen ditu. Arakatu International Kempo Association-ek lotzen dituen herrialdeak.", countries: [...memberCountries.eu] },
    dojos: { eyebrow: "Dojok", title: "Aurkitu IKA dojo bat", intro: "Arakatu IKAko dojo ofizialak herrialde eta hiriaren arabera." },
    news: { eyebrow: "Albisteak", title: "IKAren azken albisteak", intro: "Irakurri International Kempo Association-en azken albisteak, txostenak eta eguneraketak." },
    events: { eyebrow: "Ekitaldiak", title: "Mintegiak, ikastaroak eta topaketak", intro: "Aurkitu jendearentzat irekitako IKA mintegi, ikastaro, taikai eta nazioarteko topaketak." },
    join: { eyebrow: "IKArekin bat egin", title: "Lotu zure erakundea IKAren nazioarteko familiarekin.", intro: "IKAk sustrai teknikoak, filosofia eta mugaz gaindi elkarrekin entrenatzeko konpromisoa partekatzen dituzten erakundeak ongietorria ematen ditu.", steps: [{ number: "01", title: "IKArekin harremanetan jarri", text: "Aurkeztu zure erakundea eta herrialdea." }, { number: "02", title: "Utzi zuri ezagutzen", text: "Partekatu gurekin zuen ibilbide teknikoa, historikoa eta antolakuntzakoa." }, { number: "03", title: "Entrenamendua partekatu", text: "Aurreko baldintzak betetzen badira, gurekin ekitaldi batean parte hartzera gonbidatuko zaituztegu zuen praktika ezagutzeko eta elkar hobeto ezagutzeko." }, { number: "04", title: "Kidetza proposamena eta onarpena", text: "Kidetza proposamena batzordeari aurkeztuko zaio aztertu eta erabaki dezan." }] },
    contact: { eyebrow: "Kontaktua", title: "Jarri harremanetan International Kempo Association-ekin.", intro: "Erabili beheko formularioa IKArekin harremanetan jartzeko.", emailLabel: "Emaila" },
    portal: { eyebrow: "Sarbide pribatua", title: "Saio hasiera bakarra, rol bakoitzarentzat dagokion ataria.", intro: "Saioa hasi ondoren, erabiltzaile bakoitza bere rolari dagokion atarian sartuko da: Kenshi, dojo admina, herrialde admina, admin globala edo super admina.", blocks: [{ title: "Kenshi", text: "Fitxa pertsonala, graduen historia, ikastaroak, taikaiak, ziurtagiriak eta IKA Passport." }, { title: "Dojo Admina", text: "Dojoaren orria, dojoaren Kenshiak, oinarrizko eguneraketak eta dojo estatistikak." }, { title: "Herrialde Admina", text: "Herrialdearen orria, dojoak, Kenshiak, ikastaroak, taikaiak eta herrialde txostenak." }] },
  },
  pt: {
    about: { eyebrow: "Sobre a IKA", title: "Sobre a International Kempo Association", intro: "A International Kempo Association reune praticantes e organizacoes de todo o mundo que partilham a mesma heranca, estilo fisico e filosofia." },
    philosophy: { eyebrow: "Filosofia", title: "Força, compaixão e autossuficiência.", intro: "O treino da IKA desenvolve as pessoas técnica, mental e socialmente através de prática em pares, meditação e filosofia.", quote: "Viver metade para a felicidade de si próprio e metade para a felicidade dos outros.", blocks: [{ title: "Desenvolvimento mútuo", text: "Os praticantes treinam juntos para crescer juntos." }, { title: "Defesa antes do ataque", text: "As técnicas privilegiam controlo, equilíbrio, pontos fracos e a força mínima necessária." }, { title: "Mente e corpo", text: "A prática combina técnicas duras e suaves com meditação e reflexão." }, { title: "Sociedade positiva", text: "O treino deve formar pessoas confiantes e compassivas." }] },
    countries: { eyebrow: "Países membros", title: "IKA no mundo", intro: "A IKA reúne organizações membros em vários países e continentes. Explore os países ligados através da International Kempo Association.", countries: [...memberCountries.pt] },
    dojos: { eyebrow: "Dojos", title: "Encontrar um dojo IKA", intro: "Explore os dojos oficiais da IKA por país e cidade." },
    news: { eyebrow: "Notícias", title: "Últimas notícias da IKA", intro: "Leia as últimas notícias, relatórios e atualizações da International Kempo Association." },
    events: { eyebrow: "Eventos", title: "Seminários, cursos e encontros", intro: "Descubra seminários, cursos, taikai e encontros internacionais da IKA abertos ao público." },
    join: { eyebrow: "Junte-se à IKA", title: "Ligue a sua organização à família internacional da IKA.", intro: "A IKA acolhe organizações que partilham as suas raízes técnicas, filosofia e compromisso de treinar em conjunto além-fronteiras.", steps: [{ number: "01", title: "Contactar a IKA", text: "Apresente a sua organização e país." }, { number: "02", title: "Deixe-nos conhecer-vos", text: "Partilhem connosco o vosso contexto técnico, histórico e organizacional." }, { number: "03", title: "Partilhar treino", text: "Se as condições anteriores forem cumpridas, convidar-vos-emos a participar connosco num evento para conhecermos a vossa prática e para nos conhecermos melhor mutuamente." }, { number: "04", title: "Proposta e aceitação de filiação", text: "A proposta de filiação será apresentada à direção para avaliação e decisão." }] },
    contact: { eyebrow: "Contacto", title: "Contacte a International Kempo Association.", intro: "Use o formulário abaixo para contactar a IKA.", emailLabel: "Email" },
    portal: { eyebrow: "Acesso privado", title: "Um único login, o portal certo para cada papel.", intro: "Depois do início de sessão, cada utilizador entra no portal correto segundo o seu papel: Kenshi, admin de dojo, admin de país, admin global ou super admin.", blocks: [{ title: "Kenshi", text: "Perfil pessoal, histórico de graduações, cursos, taikai, certificados e IKA Passport." }, { title: "Admin de Dojo", text: "Página do dojo, Kenshi do dojo, atualizações básicas e estatísticas do dojo." }, { title: "Admin de País", text: "Página do país, dojos, Kenshi, cursos, taikai e relatórios nacionais." }] },
  },
  de: {
    about: { eyebrow: "Über IKA", title: "Über die International Kempo Association", intro: "Die International Kempo Association verbindet Praktizierende und Organisationen aus aller Welt, die ein gemeinsames Erbe, einen gemeinsamen physischen Stil und eine gemeinsame Philosophie teilen." },
    philosophy: { eyebrow: "Philosophie", title: "Stärke, Mitgefühl und Selbstständigkeit.", intro: "Das IKA-Training entwickelt Menschen technisch, geistig und sozial durch Partnertraining, Meditation und Philosophie.", quote: "Lebe zur Hälfte für dein eigenes Glück und zur Hälfte für das Glück anderer.", blocks: [{ title: "Gegenseitige Entwicklung", text: "Praktizierende trainieren miteinander, um gemeinsam zu wachsen." }, { title: "Verteidigung vor Angriff", text: "Die Techniken betonen Kontrolle, Gleichgewicht, Schwachpunkte und den minimal nötigen Krafteinsatz." }, { title: "Geist und Körper", text: "Die Praxis verbindet harte und weiche Techniken mit Meditation und Reflexion." }, { title: "Positive Gesellschaft", text: "Das Training soll Menschen formen, die selbstbewusst und mitfühlend handeln." }] },
    countries: { eyebrow: "Mitgliedsländer", title: "IKA in der Welt", intro: "IKA vereint Mitgliedsorganisationen in verschiedenen Ländern und Kontinenten. Entdecken Sie die Länder, die durch die International Kempo Association verbunden sind.", countries: [...memberCountries.de] },
    dojos: { eyebrow: "Dojos", title: "Ein IKA-Dojo finden", intro: "Entdecken Sie offizielle IKA-Dojos nach Land und Stadt." },
    news: { eyebrow: "Nachrichten", title: "Neueste IKA-Nachrichten", intro: "Lesen Sie die neuesten Nachrichten, Berichte und Aktualisierungen der International Kempo Association." },
    events: { eyebrow: "Veranstaltungen", title: "Seminare, Kurse und Treffen", intro: "Finden Sie öffentliche IKA-Seminare, Kurse, Taikai und internationale Treffen." },
    join: { eyebrow: "IKA beitreten", title: "Verbinden Sie Ihre Organisation mit der internationalen IKA-Familie.", intro: "IKA heißt Organisationen willkommen, die dieselben technischen Wurzeln, dieselbe Philosophie und dasselbe Engagement für gemeinsames Training über Grenzen hinweg teilen.", steps: [{ number: "01", title: "IKA kontaktieren", text: "Stellen Sie Ihre Organisation und Ihr Land vor." }, { number: "02", title: "Lernen wir Sie kennen", text: "Teilen Sie uns Ihren technischen, historischen und organisatorischen Hintergrund mit." }, { number: "03", title: "Training miteinander teilen", text: "Wenn die vorherigen Voraussetzungen erfüllt sind, laden wir Sie ein, gemeinsam mit uns an einer Veranstaltung teilzunehmen, damit wir Ihre Praxis kennenlernen und uns gegenseitig besser kennenlernen können." }, { number: "04", title: "Vorschlag und Aufnahmeentscheidung", text: "Der Mitgliedschaftsvorschlag wird dem Vorstand zur Prüfung und Entscheidung vorgelegt." }] },
    contact: { eyebrow: "Kontakt", title: "Kontaktieren Sie die International Kempo Association.", intro: "Verwenden Sie das untenstehende Formular, um IKA zu kontaktieren.", emailLabel: "E-Mail" },
    portal: { eyebrow: "Privater Zugang", title: "Ein Login, das richtige Portal für jede Rolle.", intro: "Nach dem Login gelangt jede Person in das passende Portal entsprechend ihrer Rolle: Kenshi, Dojo-Admin, Länder-Admin, globaler Admin oder Super-Admin.", blocks: [{ title: "Kenshi", text: "Persönliches Profil, Graduierungshistorie, Kurse, Taikai, Zertifikate und IKA Passport." }, { title: "Dojo-Admin", text: "Dojo-Seite, Kenshi des Dojos, grundlegende Aktualisierungen und Dojo-Statistiken." }, { title: "Länder-Admin", text: "Länderseite, Dojos, Kenshi, Kurse, Taikai und nationale Berichte." }] },
  },
};

export const extendedAboutLabels: Partial<Record<Locale, { secretary: string }>> = {
  id: { secretary: "Sekretaris Jenderal" },
  ms: { secretary: "Setiausaha Agung" },
  eu: { secretary: "Idazkari nagusia" },
  pt: { secretary: "Secretário-geral" },
  de: { secretary: "Generalsekretär" },
};

export const extendedArchiveLabels: Partial<Record<Locale, { eyebrow: string; title: string; intro: string; all: string; months: string; category: string; read: string; noImage: string }>> = {
  id: { eyebrow: "Arsip berita lama", title: "Berita bersejarah IKA", intro: "Arsip laporan bersejarah IKA, disusun menurut tanggal dan bulan.", all: "Semua", months: "Arsip", category: "Kategori", read: "Buka berita lama", noImage: "Arsip" },
  ms: { eyebrow: "Arkib berita lama", title: "Berita sejarah IKA", intro: "Arkib laporan sejarah IKA, disusun mengikut tarikh dan bulan.", all: "Semua", months: "Arkib", category: "Kategori", read: "Buka berita lama", noImage: "Arkib" },
  eu: { eyebrow: "Albiste zaharren artxiboa", title: "IKAren albiste historikoak", intro: "IKAren txosten historikoen artxiboa, data eta hilaren arabera antolatuta.", all: "Guztiak", months: "Artxiboak", category: "Kategoria", read: "Albiste zaharra ireki", noImage: "Artxiboa" },
  pt: { eyebrow: "Arquivo de notícias antigas", title: "Notícias históricas da IKA", intro: "Arquivo de relatórios históricos da IKA, organizado por data e mês.", all: "Todas", months: "Arquivos", category: "Categoria", read: "Abrir notícia antiga", noImage: "Arquivo" },
  de: { eyebrow: "Archiv alter Nachrichten", title: "Historische IKA-Nachrichten", intro: "Archiv historischer IKA-Berichte, nach Datum und Monat geordnet.", all: "Alle", months: "Archive", category: "Kategorie", read: "Alte Nachricht öffnen", noImage: "Archiv" },
};

export const extendedOfficialInstructorsPageCopy: Partial<Record<Locale, Record<string, string>>> = {
  id: { eyebrow: "Instruktur resmi", title: "Instruktur resmi IKA", intro: "Kenali instruktur resmi IKA.", gradeLabel: "Tingkat", countryLabel: "Negara asal", noGrade: "Instruktur terkonfirmasi", empty: "Belum ada instruktur resmi yang dipublikasikan.", chiefBadge: "Instruktur Utama IKA" },
  ms: { eyebrow: "Jurulatih rasmi", title: "Jurulatih rasmi IKA", intro: "Kenali jurulatih rasmi IKA.", gradeLabel: "Gred", countryLabel: "Negara asal", noGrade: "Jurulatih disahkan", empty: "Belum ada jurulatih rasmi yang diterbitkan.", chiefBadge: "Ketua Jurulatih IKA" },
  eu: { eyebrow: "Irakasle ofizialak", title: "IKAko irakasle ofizialak", intro: "Ezagutu IKAko irakasle ofizialak.", gradeLabel: "Gradua", countryLabel: "Jatorrizko herrialdea", noGrade: "Baieztatutako irakaslea", empty: "Oraindik ez dago argitaratutako irakasle ofizialik.", chiefBadge: "IKAko irakasle nagusia" },
  pt: { eyebrow: "Instrutores oficiais", title: "Instrutores oficiais da IKA", intro: "Conheça os instrutores oficiais da IKA.", gradeLabel: "Grau", countryLabel: "País de origem", noGrade: "Instrutor confirmado", empty: "Ainda não existem instrutores oficiais publicados.", chiefBadge: "Instrutor-Chefe da IKA" },
  de: { eyebrow: "Offizielle Instruktoren", title: "Offizielle IKA-Instruktoren", intro: "Lernen Sie die offiziellen IKA-Instruktoren kennen.", gradeLabel: "Grad", countryLabel: "Herkunftsland", noGrade: "Bestätigter Instruktor", empty: "Es sind noch keine offiziellen Instruktoren veröffentlicht.", chiefBadge: "IKA-Chefausbilder" },
};

export const extendedLatestReportTranslations: Partial<Record<Locale, Record<string, { title: string; excerpt: string }>>> = {
  id: {
    "ika-seminar-in-sicily-june-2023": { title: "Seminar IKA di Sisilia, Juni 2023", excerpt: "Seminar IKA Eropa pertama sejak pandemi diselenggarakan oleh Dojo Messina di Sisilia, dengan anggota dari Italia, Swiss, dan Inggris." },
    "ika-training-and-grading-in-indonesia-february-2023": { title: "Latihan dan ujian IKA di Indonesia, Februari 2023", excerpt: "Instruktur senior IKA pergi ke Jawa Barat, Indonesia, untuk latihan dan ujian bersama anggota setempat." },
    "grading-results": { title: "Hasil ujian kenaikan tingkat", excerpt: "Ringkasan hasil ujian dan pembaruan asosiasi dari anggota IKA." },
    "condolences-message": { title: "Pesan belasungkawa", excerpt: "Pesan dari keluarga IKA sebagai kenangan dan solidaritas." },
    "porkemi-indonesia-accepted-to-national-olympic-committee": { title: "Porkemi (Indonesia) diterima oleh Komite Olimpiade Nasional", excerpt: "Tonggak pengakuan penting bagi Porkemi dan Kempo Indonesia." },
    "report-from-international-seminar-in-spain": { title: "Laporan seminar internasional di Spanyol", excerpt: "Laporan dari seminar internasional yang diadakan di Spanyol dengan anggota IKA berlatih bersama." },
  },
  ms: {
    "ika-seminar-in-sicily-june-2023": { title: "Seminar IKA di Sicily, Jun 2023", excerpt: "Seminar IKA Eropah pertama sejak pandemik dianjurkan oleh Dojo Messina di Sicily, dengan ahli dari Itali, Switzerland, dan United Kingdom." },
    "ika-training-and-grading-in-indonesia-february-2023": { title: "Latihan dan ujian IKA di Indonesia, Februari 2023", excerpt: "Jurulatih kanan IKA pergi ke Jawa Barat, Indonesia, untuk latihan dan ujian bersama ahli tempatan." },
    "grading-results": { title: "Keputusan ujian", excerpt: "Ringkasan keputusan ujian dan kemas kini persatuan daripada ahli IKA." },
    "condolences-message": { title: "Ucapan takziah", excerpt: "Mesej daripada keluarga IKA sebagai kenangan dan solidariti." },
    "porkemi-indonesia-accepted-to-national-olympic-committee": { title: "Porkemi (Indonesia) diterima oleh Jawatankuasa Olimpik Kebangsaan", excerpt: "Satu pencapaian pengiktirafan bagi Porkemi dan Kempo Indonesia." },
    "report-from-international-seminar-in-spain": { title: "Laporan seminar antarabangsa di Sepanyol", excerpt: "Laporan seminar antarabangsa yang diadakan di Sepanyol dengan ahli IKA berlatih bersama." },
  },
  eu: {
    "ika-seminar-in-sicily-june-2023": { title: "IKA mintegia Sizilian, 2023ko ekainean", excerpt: "Pandemiaren ondorengo Europako lehen IKA mintegia Dojo Messinak antolatu zuen Sizilian, Italia, Suitza eta Erresuma Batuko kideekin." },
    "ika-training-and-grading-in-indonesia-february-2023": { title: "IKA entrenamendua eta azterketa Indonesian, 2023ko otsailean", excerpt: "IKAko goi-mailako irakasleak Mendebaldeko Javara joan ziren, Indonesiara, tokiko kideekin entrenatu eta azterketak egiteko." },
    "grading-results": { title: "Azterketen emaitzak", excerpt: "IKAko kideen azterketa emaitzen eta elkartearen eguneraketen laburpena." },
    "condolences-message": { title: "Dolumin mezuak", excerpt: "IKA familiaren mezuak oroimenez eta elkartasunez." },
    "porkemi-indonesia-accepted-to-national-olympic-committee": { title: "Porkemi (Indonesia) Batzorde Olinpiko Nazionalean onartua", excerpt: "Porkemirentzat eta Indonesiako Kemporentzat aitortza mugarri bat." },
    "report-from-international-seminar-in-spain": { title: "Espainiako nazioarteko mintegiaren txostena", excerpt: "Espainian egindako nazioarteko mintegiaren txostena, IKAko kideak elkarrekin entrenatzen." },
  },
  pt: {
    "ika-seminar-in-sicily-june-2023": { title: "Seminário IKA na Sicília, junho de 2023", excerpt: "O primeiro seminário europeu da IKA desde a pandemia foi organizado pelo Dojo Messina, na Sicília, com membros de Itália, Suíça e Reino Unido." },
    "ika-training-and-grading-in-indonesia-february-2023": { title: "Treino e exames IKA na Indonésia, fevereiro de 2023", excerpt: "Instrutores seniores da IKA deslocaram-se a Java Ocidental, Indonésia, para treino e exames com membros locais." },
    "grading-results": { title: "Resultados de graduação", excerpt: "Resumo dos resultados de graduação e das atualizações da associação entre membros da IKA." },
    "condolences-message": { title: "Mensagens de condolências", excerpt: "Mensagens da família IKA em memória e solidariedade." },
    "porkemi-indonesia-accepted-to-national-olympic-committee": { title: "Porkemi (Indonésia) aceite pelo Comité Olímpico Nacional", excerpt: "Um marco de reconhecimento para a Porkemi e o Kempo indonésio." },
    "report-from-international-seminar-in-spain": { title: "Relatório do seminário internacional em Espanha", excerpt: "Relatório de um seminário internacional realizado em Espanha com membros da IKA a treinarem juntos." },
  },
  de: {
    "ika-seminar-in-sicily-june-2023": { title: "IKA-Seminar auf Sizilien, Juni 2023", excerpt: "Das erste europäische IKA-Seminar seit der Pandemie wurde vom Dojo Messina auf Sizilien mit Mitgliedern aus Italien, der Schweiz und dem Vereinigten Königreich organisiert." },
    "ika-training-and-grading-in-indonesia-february-2023": { title: "IKA-Training und Graduierungen in Indonesien, Februar 2023", excerpt: "Erfahrene IKA-Instruktoren reisten nach Westjava, Indonesien, um mit lokalen Mitgliedern zu trainieren und Graduierungen durchzuführen." },
    "grading-results": { title: "Graduierungsergebnisse", excerpt: "Eine Zusammenfassung der Graduierungsergebnisse und Verbandsneuigkeiten der IKA-Mitglieder." },
    "condolences-message": { title: "Beileidsbekundungen", excerpt: "Botschaften der IKA-Familie in Erinnerung und Solidarität." },
    "porkemi-indonesia-accepted-to-national-olympic-committee": { title: "Porkemi (Indonesien) in das Nationale Olympische Komitee aufgenommen", excerpt: "Ein wichtiger Anerkennungsmeilenstein für Porkemi und das indonesische Kempo." },
    "report-from-international-seminar-in-spain": { title: "Bericht vom internationalen Seminar in Spanien", excerpt: "Bericht über ein internationales Seminar in Spanien, bei dem IKA-Mitglieder gemeinsam trainierten." },
  },
};

export const extendedOlderArchiveTranslations: Partial<Record<Locale, Record<string, { title: string; excerpt: string }>>> = {
  id: {
    "report-from-seminar-in-switzerland": { title: "Laporan seminar di Swiss", excerpt: "Seminar internasional tahunan di Swiss, yang kedua dalam rangkaian seminar Eropa musim panas itu, kembali diselenggarakan di Neuchatel." },
    "report-from-ika-seminar-in-czech-republic": { title: "Laporan seminar di Republik Ceko", excerpt: "Seminar internasional pertama pada musim panas itu diadakan di Karlovy Vary, Republik Ceko, dengan tamu dari beberapa negara anggota IKA." },
    "report-from-ika-leaders-seminar-cyprus-2018": { title: "Laporan Seminar Pemimpin IKA, Siprus 2018", excerpt: "Anggota IKA dari Hong Kong, Irlandia, Jepang, Swiss, dan Inggris berkumpul untuk seminar intensif para pemimpin di Siprus." },
    "report-from-3rd-ika-seminar-uk": { title: "Laporan Seminar IKA ke-3, Inggris", excerpt: "Seminar IKA ketiga diadakan di Bristol, Inggris, dengan kehadiran Kenshi dari Republik Ceko, Irlandia, Jepang, Spanyol, Swiss, dan Inggris." },
    "report-from-2nd-ika-taikai-spain": { title: "Laporan Taikai IKA ke-2, Spanyol", excerpt: "Taikai IKA ke-2 diadakan di Beasain, wilayah Basque di Spanyol, sekaligus memperingati 35 tahun Shorinji Kempo di kawasan tersebut." },
    "bskf-2017-university-training-seminar-report": { title: "Laporan Seminar Latihan Universitas BSKF 2017", excerpt: "Seminar Latihan Universitas tahunan BSKF diadakan di Glasgow dengan mahasiswa dari seluruh Inggris dan Irlandia." },
    "report-from-2016-leaders-seminar": { title: "Laporan Seminar Pemimpin 2016", excerpt: "Seminar tahunan pemimpin IKA kembali ke Siprus dengan latihan tingkat lanjut, prinsip teknik, latihan shakujo, dan studi bersama." },
    "report-from-ika-taikai-czech-republic": { title: "Laporan Taikai IKA, Republik Ceko", excerpt: "Taikai Internasional IKA pertama berlangsung di Karlovy Vary, Republik Ceko, dengan instruktur dan siswa dari beberapa negara anggota." },
    "report-from-swiss-seminar-2016": { title: "Laporan seminar Swiss 2016", excerpt: "Anggota IKA dari Inggris dan Spanyol bergabung dengan siswa dari seluruh Swiss untuk seminar dua hari di Neuchatel." },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": { title: "Laporan BSKF dari Seminar IKA pertama di Kobe, Jepang", excerpt: "Laporan tentang Seminar IKA pertama di Kobe, Jepang, yang awalnya ditulis oleh Will Ng dan diterbitkan kembali untuk arsip IKA." },
    "post-1": { title: "Kembali ke semangat asli", excerpt: "International Kempo Association secara resmi diluncurkan pada Oktober 2015 dalam seminar perdana IKA di Kobe, Jepang." },
  },
  ms: {
    "report-from-seminar-in-switzerland": { title: "Laporan seminar di Switzerland", excerpt: "Seminar antarabangsa tahunan di Switzerland, yang kedua dalam siri seminar Eropah musim panas itu, sekali lagi diadakan di Neuchatel." },
    "report-from-ika-seminar-in-czech-republic": { title: "Laporan seminar di Republik Czech", excerpt: "Seminar antarabangsa pertama pada musim panas itu diadakan di Karlovy Vary, Republik Czech, dengan tetamu dari beberapa negara ahli IKA." },
    "report-from-ika-leaders-seminar-cyprus-2018": { title: "Laporan Seminar Pemimpin IKA, Cyprus 2018", excerpt: "Ahli IKA dari Hong Kong, Ireland, Jepun, Switzerland, dan United Kingdom berkumpul untuk seminar intensif para pemimpin di Cyprus." },
    "report-from-3rd-ika-seminar-uk": { title: "Laporan Seminar IKA ke-3, United Kingdom", excerpt: "Seminar IKA ketiga diadakan di Bristol, United Kingdom, dengan kehadiran Kenshi dari Republik Czech, Ireland, Jepun, Sepanyol, Switzerland, dan United Kingdom." },
    "report-from-2nd-ika-taikai-spain": { title: "Laporan Taikai IKA ke-2, Sepanyol", excerpt: "Taikai IKA ke-2 diadakan di Beasain, wilayah Basque di Sepanyol, sambil menandakan ulang tahun ke-35 Shorinji Kempo di wilayah itu." },
    "bskf-2017-university-training-seminar-report": { title: "Laporan Seminar Latihan Universiti BSKF 2017", excerpt: "Seminar latihan universiti tahunan BSKF diadakan di Glasgow dengan pelajar dari seluruh United Kingdom dan Ireland." },
    "report-from-2016-leaders-seminar": { title: "Laporan Seminar Pemimpin 2016", excerpt: "Seminar tahunan pemimpin IKA kembali ke Cyprus dengan latihan lanjutan, prinsip teknikal, latihan shakujo, dan pembelajaran bersama." },
    "report-from-ika-taikai-czech-republic": { title: "Laporan Taikai IKA, Republik Czech", excerpt: "Taikai Antarabangsa IKA yang pertama berlangsung di Karlovy Vary, Republik Czech, dengan jurulatih dan pelajar dari beberapa negara ahli." },
    "report-from-swiss-seminar-2016": { title: "Laporan seminar Switzerland 2016", excerpt: "Ahli IKA dari United Kingdom dan Sepanyol menyertai pelajar dari seluruh Switzerland untuk seminar dua hari di Neuchatel." },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": { title: "Laporan BSKF dari Seminar IKA pertama di Kobe, Jepun", excerpt: "Laporan mengenai Seminar IKA pertama di Kobe, Jepun, yang pada asalnya ditulis oleh Will Ng dan diterbitkan semula untuk arkib IKA." },
    "post-1": { title: "Kembali kepada semangat asal", excerpt: "International Kempo Association dilancarkan secara rasmi pada Oktober 2015 semasa seminar sulung IKA di Kobe, Jepun." },
  },
  eu: {
    "report-from-seminar-in-switzerland": { title: "Suitzako mintegiaren txostena", excerpt: "Suitzako nazioarteko urteko mintegia, uda hartako Europako mintegien bigarrena, berriro Neuchatelen egin zen." },
    "report-from-ika-seminar-in-czech-republic": { title: "Txekiar Errepublikako mintegiaren txostena", excerpt: "Uda hartako nazioarteko lehen mintegia Karlovy Varyn, Txekiar Errepublikan, egin zen, IKAko hainbat herrialdetako gonbidatuekin." },
    "report-from-ika-leaders-seminar-cyprus-2018": { title: "IKAko buruzagien mintegiaren txostena, Zipre 2018", excerpt: "Hong Kong, Irlanda, Japonia, Suitza eta Erresuma Batuko IKA kideak Zipren elkartu ziren buruzagien mintegi intentsibo baterako." },
    "report-from-3rd-ika-seminar-uk": { title: "3. IKA mintegiaren txostena, Erresuma Batua", excerpt: "Hirugarren IKA mintegia Bristolen egin zen, eta Txekiar Errepublikako, Irlandako, Japoniako, Espainiako, Suitzako eta Erresuma Batuko Kenshiak izan ziren bertan." },
    "report-from-2nd-ika-taikai-spain": { title: "2. IKA Taikaiaren txostena, Espainia", excerpt: "2. IKA taikaia Beasainen egin zen, Espainiako euskal eskualdean, eta bertako Shorinji Kempo-ren 35. urteurrena ere ospatu zuen." },
    "bskf-2017-university-training-seminar-report": { title: "BSKF 2017 unibertsitate entrenamendu mintegiaren txostena", excerpt: "BSKFren urteko unibertsitate entrenamendu mintegia Glasgown egin zen, Erresuma Batuko eta Irlandako ikasleekin." },
    "report-from-2016-leaders-seminar": { title: "2016ko buruzagien mintegiaren txostena", excerpt: "IKAren urteko buruzagien mintegia Ziprera itzuli zen entrenamendu aurreratuarekin, printzipio teknikoekin, shakujo praktikarekin eta ikasketa partekatuarekin." },
    "report-from-ika-taikai-czech-republic": { title: "IKA Taikaiaren txostena, Txekiar Errepublika", excerpt: "Lehen IKA Nazioarteko Taikaia Karlovy Varyn egin zen, Txekiar Errepublikan, hainbat herrialdetako instruktore eta ikasleekin." },
    "report-from-swiss-seminar-2016": { title: "2016ko Suitzako mintegiaren txostena", excerpt: "Erresuma Batuko eta Espainiako IKA kideak Suitza osoko ikasleekin elkartu ziren Neuchatelen egindako bi eguneko mintegi batean." },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": { title: "BSKFren txostena Kobeko lehen IKA mintegiari buruz, Japonia", excerpt: "Koben, Japonian, egindako lehen IKA mintegiari buruzko txostena, jatorriz Will Ng-k idatzia eta IKAren artxiborako berrargitaratua." },
    "post-1": { title: "Jatorrizko espiritura itzuli", excerpt: "International Kempo Association ofizialki 2015eko urrian abiatu zen, Kobe-n, Japonian, egindako lehen IKA mintegian." },
  },
  pt: {
    "report-from-seminar-in-switzerland": { title: "Relatório do seminário na Suíça", excerpt: "O seminário internacional anual na Suíça, o segundo da série europeia desse verão, voltou a realizar-se em Neuchatel." },
    "report-from-ika-seminar-in-czech-republic": { title: "Relatório do seminário na República Checa", excerpt: "O primeiro seminário internacional desse verão realizou-se em Karlovy Vary, República Checa, com convidados de vários países membros da IKA." },
    "report-from-ika-leaders-seminar-cyprus-2018": { title: "Relatório do Seminário de Líderes IKA, Chipre 2018", excerpt: "Membros da IKA de Hong Kong, Irlanda, Japão, Suíça e Reino Unido reuniram-se em Chipre para um seminário intensivo de líderes." },
    "report-from-3rd-ika-seminar-uk": { title: "Relatório do 3.º Seminário IKA, Reino Unido", excerpt: "O terceiro seminário IKA realizou-se em Bristol, Reino Unido, com a presença de Kenshi da República Checa, Irlanda, Japão, Espanha, Suíça e Reino Unido." },
    "report-from-2nd-ika-taikai-spain": { title: "Relatório do 2.º Taikai IKA, Espanha", excerpt: "O 2.º Taikai IKA teve lugar em Beasain, no País Basco, e marcou também o 35.º aniversário do Shorinji Kempo na região." },
    "bskf-2017-university-training-seminar-report": { title: "Relatório do Seminário Universitário BSKF 2017", excerpt: "O seminário universitário anual da BSKF foi organizado em Glasgow e recebeu estudantes de todo o Reino Unido e Irlanda." },
    "report-from-2016-leaders-seminar": { title: "Relatório do Seminário de Líderes 2016", excerpt: "O seminário anual de líderes da IKA regressou a Chipre com treino avançado, princípios técnicos, prática de shakujo e estudo partilhado." },
    "report-from-ika-taikai-czech-republic": { title: "Relatório do Taikai IKA, República Checa", excerpt: "O primeiro Taikai Internacional IKA teve lugar em Karlovy Vary, República Checa, com instrutores e estudantes de vários países membros." },
    "report-from-swiss-seminar-2016": { title: "Relatório do seminário suíço 2016", excerpt: "Membros da IKA do Reino Unido e de Espanha juntaram-se a estudantes de toda a Suíça para um seminário de dois dias em Neuchatel." },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": { title: "Relatório da BSKF sobre o 1.º Seminário IKA em Kobe, Japão", excerpt: "Relatório sobre o primeiro Seminário IKA em Kobe, Japão, escrito originalmente por Will Ng e republicado para o arquivo da IKA." },
    "post-1": { title: "Regresso ao espírito original", excerpt: "A International Kempo Association foi oficialmente lançada em outubro de 2015 no seminário inaugural da IKA em Kobe, Japão." },
  },
  de: {
    "report-from-seminar-in-switzerland": { title: "Bericht vom Seminar in der Schweiz", excerpt: "Das jährliche internationale Seminar in der Schweiz, das zweite der europäischen Seminarreihe jenes Sommers, fand erneut in Neuchatel statt." },
    "report-from-ika-seminar-in-czech-republic": { title: "Bericht vom Seminar in der Tschechischen Republik", excerpt: "Das erste internationale Seminar jenes Sommers fand in Karlovy Vary in der Tschechischen Republik mit Gästen aus mehreren IKA-Mitgliedsländern statt." },
    "report-from-ika-leaders-seminar-cyprus-2018": { title: "Bericht vom IKA-Leiterseminar, Zypern 2018", excerpt: "IKA-Mitglieder aus Hongkong, Irland, Japan, der Schweiz und dem Vereinigten Königreich kamen in Zypern zu einem intensiven Leiterseminar zusammen." },
    "report-from-3rd-ika-seminar-uk": { title: "Bericht vom 3. IKA-Seminar, Vereinigtes Königreich", excerpt: "Das dritte IKA-Seminar fand in Bristol statt, mit Kenshi aus der Tschechischen Republik, Irland, Japan, Spanien, der Schweiz und dem Vereinigten Königreich." },
    "report-from-2nd-ika-taikai-spain": { title: "Bericht vom 2. IKA-Taikai, Spanien", excerpt: "Das 2. IKA-Taikai fand in Beasain im Baskenland statt und markierte zugleich das 35-jährige Bestehen von Shorinji Kempo in der Region." },
    "bskf-2017-university-training-seminar-report": { title: "Bericht zum BSKF-Universitätstrainingsseminar 2017", excerpt: "Das jährliche Universitätstrainingsseminar der BSKF wurde in Glasgow ausgerichtet und begrüßte Studierende aus dem gesamten Vereinigten Königreich und Irland." },
    "report-from-2016-leaders-seminar": { title: "Bericht vom Leiterseminar 2016", excerpt: "Das jährliche Leiterseminar der IKA kehrte mit fortgeschrittenem Training, technischen Prinzipien, Shakujo-Praxis und gemeinsamem Studium nach Zypern zurück." },
    "report-from-ika-taikai-czech-republic": { title: "Bericht vom IKA-Taikai, Tschechische Republik", excerpt: "Das erste internationale IKA-Taikai fand in Karlovy Vary in der Tschechischen Republik mit Instruktoren und Studierenden aus mehreren Mitgliedsländern statt." },
    "report-from-swiss-seminar-2016": { title: "Bericht vom Schweizer Seminar 2016", excerpt: "IKA-Mitglieder aus dem Vereinigten Königreich und Spanien nahmen gemeinsam mit Studierenden aus der ganzen Schweiz an einem zweitägigen Seminar in Neuchatel teil." },
    "bskf-report-from-1st-ika-seminar-in-kobe-japan": { title: "BSKF-Bericht vom 1. IKA-Seminar in Kobe, Japan", excerpt: "Ein Bericht vom ersten IKA-Seminar in Kobe, Japan, ursprünglich von Will Ng verfasst und für das IKA-Archiv erneut veröffentlicht." },
    "post-1": { title: "Zurück zum ursprünglichen Geist", excerpt: "Die International Kempo Association wurde im Oktober 2015 beim ersten IKA-Seminar in Kobe, Japan, offiziell gegründet." },
  },
};

export const extendedAboutQuotes: Partial<Record<Locale, string[]>> = {
  id: ["Hindari daripada bertarung,", "Bertarung daripada melukai,", "Melukai daripada melumpuhkan,", "Melumpuhkan daripada membunuh,", "Karena setiap kehidupan berharga dan tak tergantikan."],
  ms: ["Elakkan daripada bertarung,", "Bertarung daripada mencederakan,", "Mencederakan daripada melumpuhkan,", "Melumpuhkan daripada membunuh,", "Kerana setiap kehidupan berharga dan tidak dapat diganti."],
  eu: ["Saihestu borrokatu aurretik,", "Borrokatu zauritu aurretik,", "Zauritu mutilatu aurretik,", "Mutilatu hil aurretik,", "Bizitza oro baliotsua baita eta ordezkaezina."],
  pt: ["Evitar antes de lutar,", "Lutar antes de ferir,", "Ferir antes de mutilar,", "Mutilar antes de matar,", "Pois toda a vida é preciosa e não pode ser substituída."],
  de: ["Vermeide eher als zu kämpfen,", "Kämpfe eher als zu verletzen,", "Verletze eher als zu verstümmeln,", "Verstümmele eher als zu töten,", "Denn jedes Leben ist wertvoll und kann nicht ersetzt werden."],
};

export const extendedAboutSections: Partial<Record<Locale, AboutSectionShape[]>> = {
  id: [
    { title: "Tentang IKA", image: "/images/about/about-intro.webp", body: ["International Kempo Association dibentuk untuk menyatukan praktisi dari keluarga seni bela diri tertentu dari seluruh dunia.", "Walaupun organisasi anggota menggunakan nama yang berbeda untuk menggambarkan seni bela dirinya, semuanya berbagi warisan bersama, gaya fisik yang sama, dan terutama filsafat yang sama.", "IKA menyatukan semua organisasi ini agar mereka dapat berlatih bersama untuk pengembangan diri bersama, persahabatan, dan kebersamaan."] },
    { title: "Apa yang menyatukan keluarga Kempo IKA?", image: "/images/about/kobe-2015.webp", body: ["Keluarga seni bela diri Kempo yang membentuk International Kempo Association adalah seni bela diri tradisional Jepang, namun dapat menelusuri warisannya hingga ke Kuil Shaolin di Tiongkok.", "Mereka secara kualitatif berbeda baik dari seni bela diri Tiongkok maupun dari aliran karate Jepang."], bullets: ["Mereka melatih teknik keras seperti tendangan, pukulan, dan tangkisan, serta teknik lunak seperti lemparan, gulat, dan serangan titik saraf.", "Mereka melatih pikiran dan tubuh melalui latihan fisik yang dipadukan dengan meditasi dan filsafat.", "Mereka menekankan welas asih bersama dengan kekuatan kemandirian.", "Mereka berlatih berpasangan untuk mempercepat pembelajaran sekaligus membangun hubungan.", "Gaya mereka mencakup teknik yang melumpuhkan dengan tenaga minimum dari pembela dan kerusakan minimum bagi lawan.", "Mereka sangat menekankan pertahanan daripada serangan."], note: "Kempo, atau kenpo, adalah istilah untuk beberapa aliran seni bela diri Jepang dan digunakan oleh banyak anggota IKA. Ini adalah pembacaan Jepang dari istilah Tiongkok quan fa: ken berarti kepalan tangan dan ho berarti metode atau sistem." },
    { title: "Sejarah", image: "/images/about/history.webp", body: ["Para anggota pendiri IKA pertama kali bertemu pada perayaan ulang tahun ke-40 British Shorinji Kempo Federation di London pada tahun 2014.", "Dalam pertemuan setelah acara tersebut mereka berjanji untuk bekerja sama, berbagi pengalaman mengajar, dan memfasilitasi latihan melintasi perbatasan negara dan benua.", "Kata Shorinji adalah pembacaan Jepang dari Shaolinsi dalam bahasa Tiongkok, yang berarti Kuil Shaolin."] },
    { title: "Filsafat", image: "/images/about/philosophy.webp", body: ["Semua anggota IKA dipersatukan oleh keinginan untuk membentuk individu yang percaya diri dan mandiri sehingga dapat memberi dampak positif bagi masyarakatnya.", "Hal ini diringkas dengan baik oleh So Doshin, pendiri Shorinji Kempo, sebagai hidup setengah untuk diri sendiri dan setengah untuk orang lain.", "Selama latihan, para murid berlatih satu sama lain untuk perkembangan bersama, bukan untuk persaingan pribadi."] },
    { title: "Teknik", image: "/images/about/techniques.webp", body: ["Teknik yang dilatih sesuai dengan filsafat yang diajarkan di kelas. Semua teknik menggunakan prinsip yang memungkinkan pembela yang lebih lemah mengatasi penyerang yang lebih kuat."], bullets: ["Dengan berfokus pada titik lemah alami tubuh penyerang, seperti memukul atau menekan sambungan saraf.", "Dengan menggunakan reaksi naluriah penyerang untuk memengaruhi dan mengendalikan gerakannya, misalnya dengan mengganggu keseimbangannya.", "Dengan memahami prinsip mekanik tubuh manusia, seperti menggunakan pembalikan sendi untuk melempar.", "Dengan menggunakan dan mengalihkan momentum penyerang."], note: "Teknik-teknik ini membentuk pertahanan terhadap serangan dan memungkinkan pembela melumpuhkan penyerang dengan kerusakan sesedikit mungkin." },
  ],
  ms: [
    { title: "Tentang IKA", image: "/images/about/about-intro.webp", body: ["International Kempo Association ditubuhkan untuk menghimpunkan pengamal daripada satu keluarga seni bela diri tertentu dari seluruh dunia.", "Walaupun organisasi ahli menggunakan nama yang berbeza untuk menggambarkan seni bela diri mereka, semuanya berkongsi warisan yang sama, gaya fizikal yang sama, dan yang paling penting sekali, falsafah yang sama.", "IKA menghimpunkan semua organisasi ini supaya mereka dapat berlatih bersama untuk pembangunan diri bersama, persahabatan, dan kebersamaan."] },
    { title: "Apakah yang menyatukan keluarga Kempo IKA?", image: "/images/about/kobe-2015.webp", body: ["Keluarga seni bela diri Kempo yang membentuk International Kempo Association ialah seni bela diri tradisional Jepun, tetapi warisannya boleh dikesan kembali ke Kuil Shaolin di China.", "Ia berbeza secara kualitatif daripada seni bela diri China dan juga gaya karate Jepun."], bullets: ["Mereka melatih teknik keras seperti tendangan, tumbukan, dan sekatan, serta teknik lembut seperti balingan, kuncian, dan serangan titik saraf.", "Mereka melatih minda dan tubuh melalui latihan fizikal yang digabungkan dengan meditasi dan falsafah.", "Mereka menekankan belas kasihan bersama kekuatan berdikari.", "Mereka berlatih secara berpasangan untuk mempercepat pembelajaran dan membina hubungan.", "Gaya mereka merangkumi teknik yang melumpuhkan dengan tenaga minimum daripada pembela dan kerosakan minimum kepada lawan.", "Mereka sangat menekankan pertahanan berbanding serangan."], note: "Kempo, atau kenpo, ialah istilah bagi beberapa gaya seni bela diri Jepun dan dikongsi oleh ramai ahli IKA. Ia ialah bacaan Jepun bagi istilah Cina quan fa: ken bermaksud penumbuk dan ho bermaksud kaedah atau sistem." },
    { title: "Sejarah", image: "/images/about/history.webp", body: ["Ahli pengasas IKA pada asalnya bertemu semasa sambutan ulang tahun ke-40 British Shorinji Kempo Federation di London pada tahun 2014.", "Dalam pertemuan selepas acara itu, mereka berjanji untuk bekerjasama, berkongsi pengalaman mengajar, dan memudahkan latihan merentasi sempadan negara dan benua.", "Perkataan Shorinji ialah bacaan Jepun bagi perkataan Cina Shaolinsi, yang bermaksud Kuil Shaolin."] },
    { title: "Falsafah", image: "/images/about/philosophy.webp", body: ["Semua ahli IKA disatukan oleh keinginan untuk membangunkan individu yang yakin dan berdikari agar dapat memberi kesan positif dalam masyarakat masing-masing.", "So Doshin, pengasas Shorinji Kempo, merumuskannya sebagai hidup separuh untuk diri sendiri dan separuh untuk orang lain.", "Semasa latihan, para pelajar berlatih bersama untuk pembangunan bersama, bukan untuk persaingan peribadi."] },
    { title: "Teknik", image: "/images/about/techniques.webp", body: ["Teknik yang dipraktikkan sepadan dengan falsafah yang diajar di dalam kelas. Semua teknik menggunakan prinsip yang membolehkan pembela yang kurang kuat mengatasi penyerang yang lebih kuat."], bullets: ["Dengan menumpukan kepada titik lemah semula jadi pada tubuh penyerang, seperti memukul atau menekan sambungan saraf.", "Dengan menggunakan reaksi naluri penyerang untuk mempengaruhi dan mengawal pergerakannya, contohnya dengan mengganggu keseimbangannya.", "Dengan memahami prinsip mekanikal tubuh manusia, seperti menggunakan pusingan sendi untuk membaling.", "Dengan menggunakan dan mengalihkan momentum penyerang."], note: "Teknik-teknik ini membentuk pertahanan terhadap serangan dan membolehkan pembela melumpuhkan penyerang dengan kerosakan seminimum mungkin." },
  ],
  eu: [
    { title: "IKAri buruz", image: "/images/about/about-intro.webp", body: ["International Kempo Association sortu zen mundu osoko arte martzial familia jakin bateko praktikatzaileak elkartzeko.", "Kide diren erakundeek beren arte martziala deskribatzeko izen desberdinak erabiltzen badituzte ere, guztiek ondare bera, estilo fisiko bera eta, batez ere, filosofia bera partekatzen dituzte.", "IKAk erakunde horiek guztiak elkartzen ditu elkarrekin entrenatu ahal izan dezaten elkarren garapenerako, adiskidetasunerako eta giro onerako."] },
    { title: "Zerk batzen du IKAko Kempo familia?", image: "/images/about/kobe-2015.webp", body: ["International Kempo Association osatzen duten Kempo arte martzialen familia Japoniako arte martzial tradizionaletakoa da, baina bere ondarea Txinako Shaolin tenpluraino jarrai daiteke.", "Kalitatez desberdinak dira bai Txinako arte martzialetatik bai Japoniako karate estiloetatik."], bullets: ["Teknika gogorrak lantzen dituzte, hala nola ostikoak, ukabilkadak eta blokeoak, eta baita teknika leunak ere, hala nola jaurtiketak, loturak eta nerbio puntuetako erasoak.", "Adimena eta gorputza garatzeko entrenatzen dute, entrenamendu fisikoa meditazioarekin eta filosofiaren ikasketarekin uztartuz.", "Errukia eta autoaskitasunaren indarra azpimarratzen dituzte.", "Bikoteka praktikatzen dute ikaskuntza azkartzeko eta harremanak eraikitzeko.", "Haien estiloak aurkaria ezgaitzen duten teknikak ditu, defendatzailearen indar minimoarekin eta aurkariari eragindako kalte minimoarekin.", "Defentsari garrantzi handia ematen diote erasoaren aurretik."], note: "Kempo, edo kenpo, Japoniako hainbat arte martzial estiloren terminoa da, eta IKAko kide askok partekatzen dute. Txinako quan fa terminoaren japoniar irakurketa da: kenek ukabila esan nahi du, eta hok metodoa edo sistema." },
    { title: "Historia", image: "/images/about/history.webp", body: ["IKAren kide sortzaileak 2014an Londresen egindako British Shorinji Kempo Federation-aren 40. urteurreneko ospakizunetan ezagutu ziren lehen aldiz.", "Ekitaldi haren ondorengo bilera batean, elkarlanean aritzeko, irakaskuntza esperientzia partekatzeko eta herrialdeen eta kontinenteen arteko entrenamendua errazteko konpromisoa hartu zuten.", "Shorinji hitza Shaolinsi txinerazko hitzaren japoniar irakurketa da, eta Shaolin tenplua esan nahi du."] },
    { title: "Filosofia", image: "/images/about/philosophy.webp", body: ["IKAko kide guztiak pertsona seguruak eta autoaskiak garatzeko nahian elkartuta daude, beren gizartean eragin positiboa izan dezaten.", "So Doshin, Shorinji Kempo-ren sortzaileak, honela laburbildu zuen: bizi erdia norberarentzat eta erdia besteentzat.", "Entrenamenduan, ikasleek elkarrekin praktikatzen dute elkarren garapenerako, ez lehia pertsonalerako."] },
    { title: "Teknikak", image: "/images/about/techniques.webp", body: ["Praktikatzen diren teknikak klaseetan irakasten den filosofiarekin bat datoz. Teknikek printzipioak erabiltzen dituzte defendatzaile ahulago bati erasotzaile indartsuago bat gainditzeko aukera emateko."], bullets: ["Erasotzailearen gorputzeko puntu ahul naturaletan zentratuz, hala nola nerbio loturetan jotzea edo presioa egitea.", "Erasotzailearen erreakzio instintiboak erabiliz bere mugimenduak eragin eta kontrolatzeko, adibidez, oreka nahastuz.", "Giza gorputzaren printzipio mekanikoak ulertuz, hala nola artikulazioaren alderantzikatzeak erabiliz jaurtitzeko.", "Erasotzailearen inertzia erabiliz eta birbideratuz."], note: "Teknikek erasoaren aurkako defentsa osatzen dute eta defendatzaileari erasotzailea kalte minimoarekin ezgaitzeko aukera ematen diote." },
  ],
  pt: [
    { title: "Sobre a IKA", image: "/images/about/about-intro.webp", body: ["A International Kempo Association foi criada para reunir praticantes de uma família específica de artes marciais de todo o mundo.", "Embora as organizações membro usem nomes diferentes para descrever a sua arte marcial, todas partilham uma herança comum, um estilo físico comum e, acima de tudo, uma filosofia comum.", "A IKA reúne todas estas organizações para que possam treinar juntas para desenvolvimento mútuo, amizade e boa companhia."] },
    { title: "O que une a família Kempo da IKA?", image: "/images/about/kobe-2015.webp", body: ["A família de artes marciais Kempo que compõe a International Kempo Association pertence às artes marciais tradicionais japonesas, mas pode traçar a sua herança até ao Templo Shaolin, na China.", "É qualitativamente diferente tanto das artes marciais chinesas como dos estilos japoneses de karate."], bullets: ["Treinam técnicas duras, como pontapés, socos e bloqueios, e técnicas suaves, como projeções, agarramentos e ataques a pontos nervosos.", "Treinam para desenvolver mente e corpo através de treino físico combinado com meditação e filosofia.", "Enfatizam a compaixão juntamente com a força da autossuficiência.", "Praticam em pares para aumentar a velocidade de aprendizagem e construir relações.", "O seu estilo inclui técnicas que incapacitam com a força mínima necessária do defensor e o dano mínimo infligido ao oponente.", "Colocam uma forte ênfase na defesa em vez do ataque."], note: "Kempo, ou kenpo, é um termo usado para vários estilos japoneses de artes marciais e é partilhado por muitos membros da IKA. É a leitura japonesa do chinês quan fa: ken significa punho e ho significa método ou sistema." },
    { title: "História", image: "/images/about/history.webp", body: ["Os membros fundadores da IKA conheceram-se originalmente nas celebrações do 40.º aniversário da British Shorinji Kempo Federation, em Londres, em 2014.", "Numa reunião após esse evento, comprometeram-se a cooperar, partilhar experiência de ensino e facilitar o treino através de fronteiras nacionais e divisões continentais.", "A palavra Shorinji é a leitura japonesa do chinês Shaolinsi, que significa Templo Shaolin."] },
    { title: "Filosofia", image: "/images/about/philosophy.webp", body: ["Todos os membros da IKA estão unidos no desejo de desenvolver indivíduos confiantes e autossuficientes, capazes de fazer uma diferença positiva nas suas sociedades.", "So Doshin, fundador do Shorinji Kempo, resumiu isto como viver metade para si mesmo e metade para os outros.", "Durante o treino, os estudantes praticam uns com os outros para desenvolvimento mútuo, não para competição pessoal."] },
    { title: "Técnicas", image: "/images/about/techniques.webp", body: ["As técnicas praticadas correspondem à filosofia ensinada nas aulas. Todas utilizam princípios que permitem a um defensor menos poderoso superar um atacante mais poderoso."], bullets: ["Focando-se nos pontos fracos naturais do corpo do atacante, como golpear ou aplicar pressão em junções nervosas.", "Usando as reações instintivas do atacante para influenciar e controlar os seus movimentos, por exemplo interferindo com a sua estratégia de equilíbrio.", "Compreendendo os princípios mecânicos do corpo humano, como utilizar torções articulares para projetar.", "Usando e redirecionando o impulso do atacante."], note: "As técnicas formam a defesa contra um ataque e permitem ao defensor incapacitar o atacante com a quantidade mínima de dano." },
  ],
  de: [
    { title: "Über IKA", image: "/images/about/about-intro.webp", body: ["Die International Kempo Association wurde gegründet, um Praktizierende einer bestimmten Familie von Kampfkünsten aus der ganzen Welt zusammenzubringen.", "Obwohl die Mitgliedsorganisationen unterschiedliche Namen verwenden, um ihre Kampfkunst zu beschreiben, teilen sie alle ein gemeinsames Erbe, einen gemeinsamen körperlichen Stil und vor allem eine gemeinsame Philosophie.", "IKA bringt all diese Organisationen zusammen, damit sie für gegenseitige Entwicklung, Freude und gute Gemeinschaft gemeinsam trainieren können."] },
    { title: "Was verbindet die IKA-Kempo-Familie?", image: "/images/about/kobe-2015.webp", body: ["Die Kempo-Familie der Kampfkünste, die die International Kempo Association bildet, gehört zu den traditionellen japanischen Kampfkünsten, kann ihr Erbe jedoch bis zum Shaolin-Tempel in China zurückverfolgen.", "Sie unterscheidet sich qualitativ sowohl von chinesischen Kampfkünsten als auch von japanischen Karate-Stilen."], bullets: ["Sie trainieren sowohl harte Techniken wie Tritte, Schläge und Blöcke als auch weiche Techniken wie Würfe, Grappling und Angriffe auf Nervenpunkte.", "Sie trainieren zur Entwicklung von Geist und Körper durch körperliches Training in Verbindung mit Meditation und Philosophie.", "Sie betonen Mitgefühl zusammen mit der Stärke der Selbstständigkeit.", "Sie üben paarweise, um das Lernen zu beschleunigen und Beziehungen aufzubauen.", "Ihr Stil umfasst Techniken, die mit minimaler Kraft des Verteidigers und minimalem Schaden für den Gegner kampfunfähig machen.", "Sie legen großen Wert auf Verteidigung statt auf Angriff."], note: "Kempo oder Kenpo ist ein Begriff für mehrere japanische Kampfkünste und wird von vielen IKA-Mitgliedern geteilt. Es ist die japanische Lesung des chinesischen quan fa: ken bedeutet Faust und ho bedeutet Methode oder System." },
    { title: "Geschichte", image: "/images/about/history.webp", body: ["Die Gründungsmitglieder der IKA trafen sich ursprünglich bei den Feierlichkeiten zum 40-jährigen Bestehen der British Shorinji Kempo Federation 2014 in London.", "Bei einem Treffen nach dieser Veranstaltung versprachen sie, zusammenzuarbeiten, Lehrerfahrung zu teilen und das Training über nationale Grenzen und Kontinente hinweg zu erleichtern.", "Das Wort Shorinji ist die japanische Lesung des chinesischen Shaolinsi und bedeutet Shaolin-Tempel."] },
    { title: "Philosophie", image: "/images/about/philosophy.webp", body: ["Alle Mitglieder der IKA sind durch den Wunsch verbunden, Menschen zu entwickeln, die selbstbewusst und selbstständig genug sind, um in ihrer Gesellschaft einen positiven Unterschied zu bewirken.", "So Doshin, der Gründer von Shorinji Kempo, fasste dies zusammen als halb für sich selbst und halb für andere zu leben.", "Während des Trainings üben die Schülerinnen und Schüler miteinander für gegenseitige Entwicklung, nicht für persönlichen Wettbewerb."] },
    { title: "Techniken", image: "/images/about/techniques.webp", body: ["Die geübten Techniken entsprechen der in den Klassen vermittelten Philosophie. Alle Techniken nutzen Prinzipien, die es einem weniger starken Verteidiger ermöglichen, einen stärkeren Angreifer zu überwinden."], bullets: ["Indem sie sich auf natürliche Schwachpunkte des Körpers des Angreifers konzentrieren, etwa durch Schläge oder Druck auf Nervenverbindungen.", "Indem sie die instinktiven Reaktionen des Angreifers nutzen, um seine Bewegungen zu beeinflussen und zu kontrollieren, zum Beispiel durch Störung seines Gleichgewichts.", "Indem sie die mechanischen Prinzipien des menschlichen Körpers verstehen, etwa durch den Einsatz von Gelenkhebeln zum Werfen.", "Indem sie den Schwung des Angreifers nutzen und umlenken."], note: "Die Techniken bilden die Verteidigung gegen einen Angriff und ermöglichen es dem Verteidiger, den Angreifer mit minimalem Schaden kampfunfähig zu machen." },
  ],
};
