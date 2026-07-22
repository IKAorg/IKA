import type { Locale } from "@/lib/i18n/config";

type ConsentContent = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  acceptance: string;
  accuracy: string;
};

const consentContent: Record<Locale, ConsentContent> = {
  en: {
    title: "Mandatory legal consent",
    intro:
      "Before sending this internal request, please read and accept the following legal notice. This consent is required so IKA can review, validate, and manage your data within its international organisational structure.",
    sections: [
      {
        heading: "1. Data controller and organisational purpose",
        body: [
          "International Kempo Association (IKA) and the authorised administrators operating within its official structure will process the information you submit in order to review this request, verify identity and eligibility, organise membership records, manage dojo and country structures, enable internal communication, and maintain legitimate historical records connected to the functioning of the association.",
        ],
      },
      {
        heading: "2. Categories of data processed",
        body: [
          "The data may include identification details, contact details, organisational role, dojo or country affiliation, training start date, grade information, internal notes, and any other information that you voluntarily provide in this form.",
          "If the request concerns a Kenshi, the data may also be incorporated into the private IKA member record once the request is approved.",
        ],
      },
      {
        heading: "3. International access and restricted visibility",
        body: [
          "Because IKA operates internationally, your data may be accessed only by authorised administrators whose role requires that access, including Super Admin, Country Admin, and Dojo Admin within the relevant scope.",
          "Access is limited to organisational need and must not be used for unrelated personal or commercial purposes.",
        ],
      },
      {
        heading: "4. Accuracy, verification, and approval workflow",
        body: [
          "Submitting this form does not automatically activate membership, dojo, or country status. The request remains pending until it is reviewed and approved by the appropriate IKA authority.",
          "You confirm that the information provided is true, current, and entered in good faith. IKA may request clarification, corrections, or additional supporting information before approving the request.",
        ],
      },
      {
        heading: "5. Storage, retention, and internal record keeping",
        body: [
          "IKA may retain request data, approval notes, timestamps, and linked organisational references for internal audit, continuity, safeguarding, and administrative history, including cases where a request is rejected or later deactivated.",
          "Data will be kept only for as long as reasonably necessary for legitimate organisational administration, legal protection, and continuity of membership records.",
        ],
      },
      {
        heading: "6. Rights and contact",
        body: [
          "You may request correction of inaccurate data or raise questions about how your information is being handled through the appropriate IKA administrator or official contact channel.",
          "If the request is being completed on behalf of another person, you confirm that you are authorised to provide the information and to accept this notice on their behalf where legally appropriate.",
        ],
      },
    ],
    acceptance:
      "I have read and understood this legal notice, and I expressly consent to the internal and international processing of the submitted data by IKA for review, approval, membership administration, and organisational management.",
    accuracy:
      "I confirm that the information provided is accurate to the best of my knowledge and that I am authorised to submit it.",
  },
  es: {
    title: "Consentimiento legal obligatorio",
    intro:
      "Antes de enviar esta solicitud interna, debes leer y aceptar el siguiente aviso legal. Este consentimiento es obligatorio para que IKA pueda revisar, validar y gestionar tus datos dentro de su estructura organizativa internacional.",
    sections: [
      {
        heading: "1. Responsable del tratamiento y finalidad organizativa",
        body: [
          "International Kempo Association (IKA) y los administradores autorizados que actuen dentro de su estructura oficial trataran la informacion enviada con el fin de revisar esta solicitud, verificar la identidad y la idoneidad, organizar los registros de membresia, gestionar la estructura de paises y dojos, permitir la comunicacion interna y mantener un historial legitimo vinculado al funcionamiento de la asociacion.",
        ],
      },
      {
        heading: "2. Categorias de datos tratados",
        body: [
          "Los datos pueden incluir informacion identificativa, datos de contacto, rol organizativo, vinculacion con dojo o pais, fecha de inicio en la practica, informacion de grado, notas internas y cualquier otro dato que aportes voluntariamente en este formulario.",
          "Si la solicitud corresponde a un Kenshi, los datos podran incorporarse tambien a la ficha privada de miembro IKA una vez aprobada la solicitud.",
        ],
      },
      {
        heading: "3. Acceso internacional y visibilidad restringida",
        body: [
          "Dado que IKA opera a nivel internacional, tus datos solo podran ser consultados por administradores autorizados cuyo rol requiera ese acceso, incluyendo Super Admin, Admin de pais y Admin de dojo dentro del ambito correspondiente.",
          "Ese acceso queda limitado a necesidades organizativas y no podra utilizarse para fines personales o comerciales ajenos a IKA.",
        ],
      },
      {
        heading: "4. Veracidad, verificacion y flujo de aprobacion",
        body: [
          "El envio de este formulario no activa automaticamente una membresia, un dojo o un pais. La solicitud quedara pendiente hasta que sea revisada y aprobada por la autoridad correspondiente de IKA.",
          "Confirmas que la informacion facilitada es veraz, actual y aportada de buena fe. IKA podra solicitar aclaraciones, correcciones o informacion adicional antes de aprobar la solicitud.",
        ],
      },
      {
        heading: "5. Conservacion, retencion y trazabilidad interna",
        body: [
          "IKA podra conservar los datos de la solicitud, notas de aprobacion, marcas temporales y referencias organizativas vinculadas para auditoria interna, continuidad, proteccion organizativa e historial administrativo, incluso en casos de rechazo o baja posterior.",
          "Los datos se conservaran solo durante el tiempo razonablemente necesario para la administracion legitima de la asociacion, su proteccion juridica y la continuidad de los registros de membresia.",
        ],
      },
      {
        heading: "6. Derechos y contacto",
        body: [
          "Puedes solicitar la correccion de datos inexactos o plantear dudas sobre el tratamiento de tu informacion a traves del administrador IKA correspondiente o del canal oficial de contacto.",
          "Si completas esta solicitud en nombre de otra persona, confirmas que estas autorizado para facilitar esos datos y aceptar este aviso en su nombre cuando legalmente proceda.",
        ],
      },
    ],
    acceptance:
      "He leido y comprendido este aviso legal y consiento expresamente el tratamiento interno e internacional de los datos enviados por parte de IKA para su revision, aprobacion, administracion de membresia y gestion organizativa.",
    accuracy:
      "Confirmo que la informacion aportada es correcta segun mi mejor conocimiento y que estoy autorizado para enviarla.",
  },
  it: {
    title: "Consenso legale obbligatorio",
    intro:
      "Prima di inviare questa richiesta interna, leggi e accetta il seguente avviso legale. Questo consenso e necessario affinche IKA possa esaminare, convalidare e gestire i tuoi dati all'interno della propria struttura organizzativa internazionale.",
    sections: [
      {
        heading: "1. Titolare del trattamento e finalita organizzative",
        body: [
          "International Kempo Association (IKA) e gli amministratori autorizzati che operano nella sua struttura ufficiale tratteranno le informazioni inviate per esaminare la richiesta, verificare identita e idoneita, organizzare i registri di affiliazione, gestire la struttura di paesi e dojo, consentire la comunicazione interna e mantenere uno storico legittimo relativo al funzionamento dell'associazione.",
        ],
      },
      {
        heading: "2. Categorie di dati trattati",
        body: [
          "I dati possono includere dati identificativi, dati di contatto, ruolo organizzativo, affiliazione a dojo o paese, data di inizio della pratica, informazioni sul grado, note interne e qualsiasi altro dato fornito volontariamente in questo modulo.",
        ],
      },
      {
        heading: "3. Accesso internazionale e visibilita limitata",
        body: [
          "Poiche IKA opera a livello internazionale, i tuoi dati potranno essere consultati solo da amministratori autorizzati il cui ruolo richieda tale accesso, entro il relativo ambito organizzativo.",
        ],
      },
      {
        heading: "4. Veridicita e approvazione",
        body: [
          "L'invio del modulo non attiva automaticamente l'affiliazione o il ruolo richiesto. La richiesta restera in attesa fino alla revisione e approvazione da parte dell'autorita IKA competente.",
        ],
      },
      {
        heading: "5. Conservazione e tracciabilita",
        body: [
          "IKA puo conservare dati della richiesta, note di revisione e riferimenti organizzativi per finalita di audit interno, continuita amministrativa e tutela legittima dell'associazione.",
        ],
      },
      {
        heading: "6. Diritti e contatto",
        body: [
          "Puoi richiedere la correzione di dati inesatti o chiedere chiarimenti tramite l'amministratore IKA competente o il canale ufficiale di contatto.",
        ],
      },
    ],
    acceptance:
      "Dichiaro di aver letto e compreso questo avviso legale e acconsento espressamente al trattamento interno e internazionale dei dati inviati da parte di IKA.",
    accuracy:
      "Confermo che le informazioni fornite sono corrette per quanto a mia conoscenza e che sono autorizzato a inviarle.",
  },
  fr: {
    title: "Consentement legal obligatoire",
    intro:
      "Avant d'envoyer cette demande interne, veuillez lire et accepter l'avis legal suivant. Ce consentement est necessaire pour permettre a IKA d'examiner, valider et gerer vos donnees dans sa structure organisationnelle internationale.",
    sections: [
      {
        heading: "1. Responsable du traitement et finalite organisationnelle",
        body: [
          "International Kempo Association (IKA) et les administrateurs autorises de sa structure officielle traiteront les informations transmises afin d'examiner la demande, verifier l'identite et l'eligibilite, gerer les dossiers d'adhesion, la structure des pays et des dojos, la communication interne et l'historique administratif legitime de l'association.",
        ],
      },
      {
        heading: "2. Categories de donnees",
        body: [
          "Les donnees peuvent inclure des informations d'identification, des coordonnees, le role organisationnel, l'affiliation a un dojo ou a un pays, la date de debut de pratique, le grade actuel, des notes internes et toute autre information fournie volontairement.",
        ],
      },
      {
        heading: "3. Acces international limite",
        body: [
          "IKA operant a l'international, vos donnees ne seront accessibles qu'aux administrateurs autorises qui ont besoin de cet acces dans leur perimetre de responsabilite.",
        ],
      },
      {
        heading: "4. Verification et approbation",
        body: [
          "L'envoi de ce formulaire n'active pas automatiquement l'adhesion ou le role demande. La demande restera en attente jusqu'a sa validation par l'autorite IKA competente.",
        ],
      },
      {
        heading: "5. Conservation",
        body: [
          "IKA peut conserver la demande, les notes de revision et les references organisationnelles pour l'audit interne, la continuite administrative et la protection legitime de l'association.",
        ],
      },
      {
        heading: "6. Droits et contact",
        body: [
          "Vous pouvez demander la correction de donnees inexactes ou poser des questions via l'administrateur IKA concerne ou le canal officiel de contact.",
        ],
      },
    ],
    acceptance:
      "Je declare avoir lu et compris cet avis legal et j'accepte expressement le traitement interne et international de mes donnees par IKA.",
    accuracy:
      "Je confirme que les informations fournies sont exactes au meilleur de ma connaissance et que je suis autorise a les transmettre.",
  },
  ja: {
    title: "必須の法的同意",
    intro:
      "この内部申請を送信する前に、以下の法的通知を読み、同意してください。この同意は、IKA が国際的な組織運営の中であなたの情報を審査、確認、管理するために必要です。",
    sections: [
      {
        heading: "1. 管理主体と利用目的",
        body: [
          "International Kempo Association (IKA) およびその正式な組織内で権限を持つ管理者は、申請の審査、本人確認、適格性確認、会員記録の管理、国と道場の構造管理、内部連絡、正当な運営履歴の保持のために情報を取り扱います。",
        ],
      },
      {
        heading: "2. 取り扱う情報",
        body: [
          "送信される情報には、本人確認情報、連絡先、組織上の役割、国または道場との所属、修練開始日、段級情報、内部メモ、および任意に提供されたその他の情報が含まれる場合があります。",
        ],
      },
      {
        heading: "3. 国際的な限定アクセス",
        body: [
          "IKA は国際組織であるため、あなたの情報には、職務上必要な範囲の権限ある管理者のみがアクセスできます。",
        ],
      },
      {
        heading: "4. 確認と承認",
        body: [
          "このフォームの送信によって、会員資格や役割が自動的に有効になることはありません。申請は、IKA の適切な責任者による確認と承認が完了するまで保留されます。",
        ],
      },
      {
        heading: "5. 保存と記録保持",
        body: [
          "IKA は内部監査、事務継続、正当な組織保護のために、申請内容、審査メモ、関連記録を保持する場合があります。",
        ],
      },
      {
        heading: "6. 権利と連絡",
        body: [
          "不正確な情報の訂正依頼や取扱いに関する質問は、担当する IKA 管理者または公式連絡窓口を通じて行うことができます。",
        ],
      },
    ],
    acceptance:
      "私はこの法的通知を読み、理解し、IKA による内部および国際的なデータ処理に明示的に同意します。",
    accuracy:
      "私は、提出した情報が私の知る限り正確であり、提出する権限を有していることを確認します。",
  },
  zh: {
    title: "必须接受的法律同意",
    intro:
      "在提交此内部申请之前，请阅读并接受以下法律说明。该同意是 IKA 在其国际组织结构内审核、核实和管理你所提交资料的必要条件。",
    sections: [
      {
        heading: "1. 数据管理方与用途",
        body: [
          "International Kempo Association (IKA) 及其正式组织内经授权的管理员，将为审核申请、核实身份与资格、维护会员记录、管理国家与道场结构、进行内部沟通以及保留合法行政记录而处理相关资料。",
        ],
      },
      {
        heading: "2. 处理的数据类别",
        body: [
          "数据可能包括身份信息、联系方式、组织角色、所属国家或道场、训练开始日期、级别信息、内部备注以及你在本表单中自愿提供的其他信息。",
        ],
      },
      {
        heading: "3. 国际范围内的有限访问",
        body: [
          "由于 IKA 是国际组织，你的数据仅会向在其职责范围内确有需要的授权管理员开放。",
        ],
      },
      {
        heading: "4. 核实与审批流程",
        body: [
          "提交本表单并不会自动激活会员、道场或国家资格。申请将在 IKA 相应负责人审核并批准后才会生效。",
        ],
      },
      {
        heading: "5. 保存与留档",
        body: [
          "IKA 可为内部审计、行政连续性及合法组织保护之目的，保留申请资料、审核备注及相关组织记录。",
        ],
      },
      {
        heading: "6. 权利与联系",
        body: [
          "你可以通过相关 IKA 管理员或官方联系渠道申请更正不准确的数据或咨询数据处理方式。",
        ],
      },
    ],
    acceptance:
      "我已阅读并理解本法律说明，并明确同意 IKA 对所提交数据进行内部及国际范围内的处理。",
    accuracy:
      "我确认所提供的信息据我所知真实准确，且我有权提交这些信息。",
  },
  cs: {
    title: "Povinny pravni souhlas",
    intro:
      "Pred odeslanim teto interni zadosti si prectete a prijmete nasledujici pravni upozorneni. Tento souhlas je nutny, aby IKA mohla vase udaje overit, posoudit a spravovat v ramci sve mezinarodni organizacni struktury.",
    sections: [
      {
        heading: "1. Spravce udaju a organizacni ucel",
        body: [
          "International Kempo Association (IKA) a opravneni administratori v jeji oficialni strukture budou zpracovavat poskytnute informace za ucelem posouzeni zadosti, overeni identity a opravnenosti, spravy clenskych zaznamu, struktury zemi a dojo, interni komunikace a uchovani legitimni administrativni historie asociace.",
        ],
      },
      {
        heading: "2. Kategorie zpracovavanych udaju",
        body: [
          "Udaje mohou zahrnovat identifikacni a kontaktni informace, organizacni roli, prislusnost k dojo nebo zemi, datum zahajeni treninku, informace o stupni, interni poznamky a dalsi dobrovolne poskytnute udaje.",
        ],
      },
      {
        heading: "3. Mezinarodni a omezeny pristup",
        body: [
          "Vzhledem k mezinarodnimu charakteru IKA budou vase data pristupna pouze opravnenym administratorum, kteri je potrebuji v ramci sve role.",
        ],
      },
      {
        heading: "4. Overeni a schvaleni",
        body: [
          "Odeslani formulare automaticky neaktivuje clenstvi ani pozadovanou roli. Zadost zustane cekat na schvaleni prislusnym organem IKA.",
        ],
      },
      {
        heading: "5. Uchovavani a evidence",
        body: [
          "IKA muze uchovavat udaje ze zadosti, poznamky z kontroly a organizacni vazby pro interni audit, administrativni kontinuitu a legitimni ochranu asociace.",
        ],
      },
      {
        heading: "6. Prava a kontakt",
        body: [
          "Muzete pozadat o opravu nepresnych udaju nebo se obratit na prislusneho administratora IKA ci oficialni kontaktni kanal.",
        ],
      },
    ],
    acceptance:
      "Potvrzuji, ze jsem si toto pravni upozorneni precetl(a), porozumel(a) mu a vyslovne souhlasim s internim a mezinarodnim zpracovanim udaju organizaci IKA.",
    accuracy:
      "Potvrzuji, ze poskytnute informace jsou podle meho nejlepsiho vedomi spravne a ze jsem opravnen(a) je odeslat.",
  },
  id: {
    title: "Persetujuan hukum wajib",
    intro:
      "Sebelum mengirim permohonan internal ini, mohon baca dan setujui pemberitahuan hukum berikut. Persetujuan ini diperlukan agar IKA dapat meninjau, memverifikasi, dan mengelola data Anda dalam struktur organisasinya yang bersifat internasional.",
    sections: [
      {
        heading: "1. Pengendali data dan tujuan organisasi",
        body: [
          "International Kempo Association (IKA) dan administrator berwenang dalam struktur resminya akan memproses informasi yang Anda kirim untuk meninjau permohonan, memverifikasi identitas dan kelayakan, mengelola catatan keanggotaan, struktur negara dan dojo, komunikasi internal, serta riwayat administrasi yang sah.",
        ],
      },
      {
        heading: "2. Jenis data yang diproses",
        body: [
          "Data dapat mencakup identitas, kontak, peran organisasi, afiliasi dojo atau negara, tanggal mulai latihan, informasi tingkatan, catatan internal, dan data lain yang Anda berikan secara sukarela.",
        ],
      },
      {
        heading: "3. Akses internasional yang terbatas",
        body: [
          "Karena IKA beroperasi secara internasional, data Anda hanya dapat diakses oleh administrator berwenang yang memang memerlukannya sesuai peran mereka.",
        ],
      },
      {
        heading: "4. Verifikasi dan persetujuan",
        body: [
          "Pengiriman formulir ini tidak otomatis mengaktifkan keanggotaan atau peran yang diminta. Permohonan akan menunggu peninjauan dan persetujuan dari otoritas IKA yang berwenang.",
        ],
      },
      {
        heading: "5. Penyimpanan dan pencatatan",
        body: [
          "IKA dapat menyimpan data permohonan, catatan peninjauan, dan referensi organisasi untuk audit internal, kesinambungan administrasi, dan perlindungan organisasi yang sah.",
        ],
      },
      {
        heading: "6. Hak dan kontak",
        body: [
          "Anda dapat meminta perbaikan data yang tidak akurat atau mengajukan pertanyaan melalui administrator IKA terkait atau saluran kontak resmi.",
        ],
      },
    ],
    acceptance:
      "Saya telah membaca dan memahami pemberitahuan hukum ini, dan saya secara tegas menyetujui pemrosesan data internal dan internasional oleh IKA.",
    accuracy:
      "Saya menyatakan bahwa informasi yang saya berikan benar menurut pengetahuan terbaik saya dan saya berwenang untuk mengirimkannya.",
  },
  ms: {
    title: "Persetujuan undang-undang wajib",
    intro:
      "Sebelum menghantar permohonan dalaman ini, sila baca dan terima notis undang-undang berikut. Persetujuan ini diperlukan supaya IKA boleh menyemak, mengesahkan, dan mengurus data anda dalam struktur organisasinya yang bersifat antarabangsa.",
    sections: [
      {
        heading: "1. Pengawal data dan tujuan organisasi",
        body: [
          "International Kempo Association (IKA) dan pentadbir yang diberi kuasa dalam struktur rasminya akan memproses maklumat yang anda hantar untuk menilai permohonan, mengesahkan identiti dan kelayakan, mengurus rekod keahlian, struktur negara dan dojo, komunikasi dalaman, serta rekod pentadbiran yang sah.",
        ],
      },
      {
        heading: "2. Jenis data yang diproses",
        body: [
          "Data mungkin termasuk maklumat pengenalan, butiran hubungan, peranan organisasi, hubungan dengan dojo atau negara, tarikh mula latihan, maklumat gred, nota dalaman, dan maklumat lain yang anda berikan secara sukarela.",
        ],
      },
      {
        heading: "3. Akses antarabangsa yang terhad",
        body: [
          "Oleh kerana IKA beroperasi secara antarabangsa, data anda hanya boleh diakses oleh pentadbir yang diberi kuasa dan memerlukannya dalam skop tugas mereka.",
        ],
      },
      {
        heading: "4. Pengesahan dan kelulusan",
        body: [
          "Penghantaran borang ini tidak akan mengaktifkan keahlian atau peranan yang diminta secara automatik. Permohonan akan menunggu semakan dan kelulusan oleh pihak IKA yang berkenaan.",
        ],
      },
      {
        heading: "5. Penyimpanan dan rekod",
        body: [
          "IKA boleh menyimpan data permohonan, nota semakan, dan rujukan organisasi untuk audit dalaman, kesinambungan pentadbiran, dan perlindungan organisasi yang sah.",
        ],
      },
      {
        heading: "6. Hak dan hubungan",
        body: [
          "Anda boleh meminta pembetulan data yang tidak tepat atau bertanya tentang pengendalian data melalui pentadbir IKA yang berkaitan atau saluran hubungan rasmi.",
        ],
      },
    ],
    acceptance:
      "Saya telah membaca dan memahami notis undang-undang ini, dan saya secara nyata bersetuju dengan pemprosesan data dalaman dan antarabangsa oleh IKA.",
    accuracy:
      "Saya mengesahkan bahawa maklumat yang diberikan adalah tepat setakat pengetahuan saya dan saya diberi kuasa untuk menghantarnya.",
  },
  eu: {
    title: "Legezko baimen nahitaezkoa",
    intro:
      "Barne eskabide hau bidali aurretik, irakurri eta onartu ondoko lege-oharra. Baimen hau beharrezkoa da IKAk zure datuak bere nazioarteko egitura antolaketan berrikusi, egiaztatu eta kudeatu ahal izateko.",
    sections: [
      {
        heading: "1. Datuen arduraduna eta xede antolatzailea",
        body: [
          "International Kempo Association (IKA) erakundeak eta bere egitura ofizialean baimendutako administratzaileek bidalitako informazioa tratatuko dute eskabidea aztertzeko, nortasuna eta egokitasuna egiaztatzeko, bazkidetza-erregistroak, herrialde eta dojo egiturak, barne-komunikazioa eta elkartearen administrazio-historial legitimoa kudeatzeko.",
        ],
      },
      {
        heading: "2. Tratatutako datu motak",
        body: [
          "Datuen artean egon daitezke identifikazio-datuak, harremanetarako datuak, antolaketa-rola, dojo edo herrialdearekiko lotura, entrenamendu-hasierako data, graduari buruzko informazioa, barne-oharrak eta borondatez emandako gainerako datuak.",
        ],
      },
      {
        heading: "3. Nazioarteko sarbide mugatua",
        body: [
          "IKA nazioarteko erakundea denez, zure datuak soilik ikus ditzakete beren eginkizunagatik behar duten administratzaile baimenduek.",
        ],
      },
      {
        heading: "4. Egiaztapena eta onarpena",
        body: [
          "Formulario hau bidaltzeak ez du automatikoki bazkidetza edo eskatutako rola aktibatuko. Eskabidea zain geratuko da dagokion IKA arduradunak berrikusi eta onartu arte.",
        ],
      },
      {
        heading: "5. Gordetzea eta erregistroa",
        body: [
          "IKAk eskabideko datuak, berrikuspen-oharrak eta antolaketa-erreferentziak gorde ditzake barne-auditoriaren, administrazio-jarraitutasunaren eta erakundearen babes legitimoaren helburuetarako.",
        ],
      },
      {
        heading: "6. Eskubideak eta harremana",
        body: [
          "Datu okerrak zuzentzea eskatu edo datuen tratamenduari buruz galdetu dezakezu dagokion IKA administratzailearen edo harremanetarako kanal ofizialaren bidez.",
        ],
      },
    ],
    acceptance:
      "Lege-ohar hau irakurri eta ulertu dudala adierazten dut, eta IKAk datuak barne eta nazioarte mailan tratatzea berariaz onartzen dut.",
    accuracy:
      "Emandako informazioa nire ezagutzaren arabera zuzena dela eta bidaltzeko baimena dudala berresten dut.",
  },
  pt: {
    title: "Consentimento legal obrigatorio",
    intro:
      "Antes de enviar este pedido interno, leia e aceite o seguinte aviso legal. Este consentimento e necessario para que a IKA possa rever, validar e gerir os seus dados dentro da sua estrutura organizacional internacional.",
    sections: [
      {
        heading: "1. Responsavel pelo tratamento e finalidade organizacional",
        body: [
          "A International Kempo Association (IKA) e os administradores autorizados da sua estrutura oficial tratarao as informacoes enviadas para analisar o pedido, verificar identidade e elegibilidade, organizar registos de membros, gerir a estrutura de paises e dojos, permitir a comunicacao interna e manter um historico administrativo legitimo da associacao.",
        ],
      },
      {
        heading: "2. Categorias de dados tratados",
        body: [
          "Os dados podem incluir informacoes de identificacao, contactos, funcao organizacional, ligacao a dojo ou pais, data de inicio da pratica, informacao de graduacao, notas internas e quaisquer outros dados fornecidos voluntariamente.",
        ],
      },
      {
        heading: "3. Acesso internacional restrito",
        body: [
          "Como a IKA opera internacionalmente, os seus dados apenas poderao ser acedidos por administradores autorizados que necessitem deles no ambito das suas funcoes.",
        ],
      },
      {
        heading: "4. Verificacao e aprovacao",
        body: [
          "O envio deste formulario nao ativa automaticamente a filiacao ou o papel solicitado. O pedido permanecera pendente ate ser revisto e aprovado pela autoridade competente da IKA.",
        ],
      },
      {
        heading: "5. Conservacao e registo",
        body: [
          "A IKA podera conservar os dados do pedido, notas de revisao e referencias organizacionais para auditoria interna, continuidade administrativa e protecao legitima da associacao.",
        ],
      },
      {
        heading: "6. Direitos e contacto",
        body: [
          "Pode pedir a correcao de dados incorretos ou colocar questoes atraves do administrador IKA responsavel ou do canal oficial de contacto.",
        ],
      },
    ],
    acceptance:
      "Declaro que li e compreendi este aviso legal e consinto expressamente o tratamento interno e internacional dos dados enviados pela IKA.",
    accuracy:
      "Confirmo que a informacao fornecida esta correta segundo o meu melhor conhecimento e que estou autorizado a submetela.",
  },
  de: {
    title: "Verpflichtende rechtliche Einwilligung",
    intro:
      "Bevor Sie diesen internen Antrag absenden, lesen und akzeptieren Sie bitte den folgenden rechtlichen Hinweis. Diese Einwilligung ist erforderlich, damit IKA Ihre Daten innerhalb ihrer internationalen Organisationsstruktur pru fen, bestaetigen und verwalten kann.",
    sections: [
      {
        heading: "1. Verantwortliche Stelle und organisatorischer Zweck",
        body: [
          "Die International Kempo Association (IKA) sowie autorisierte Administratoren innerhalb ihrer offiziellen Struktur verarbeiten die uebermittelten Informationen, um den Antrag zu pruefen, Identitaet und Eignung zu bestaetigen, Mitgliedsdaten zu verwalten, die Struktur von Laendern und Dojos zu organisieren, interne Kommunikation zu ermoeglichen und eine legitime Verwaltungshistorie zu fuehren.",
        ],
      },
      {
        heading: "2. Kategorien verarbeiteter Daten",
        body: [
          "Die Daten koennen Identifikations- und Kontaktdaten, die organisatorische Rolle, die Zugehoerigkeit zu Dojo oder Land, den Trainingsbeginn, Graduierungsinformationen, interne Notizen und weitere freiwillig angegebene Informationen umfassen.",
        ],
      },
      {
        heading: "3. Internationaler und beschraenkter Zugriff",
        body: [
          "Da IKA international taetig ist, duerfen Ihre Daten nur von autorisierten Administratoren eingesehen werden, die diesen Zugriff im Rahmen ihrer Aufgaben benoetigen.",
        ],
      },
      {
        heading: "4. Pruefung und Genehmigung",
        body: [
          "Das Absenden dieses Formulars aktiviert nicht automatisch die beantragte Mitgliedschaft oder Rolle. Der Antrag bleibt ausstehend, bis er von der zustaendigen IKA-Stelle geprueft und genehmigt wurde.",
        ],
      },
      {
        heading: "5. Speicherung und Nachweis",
        body: [
          "IKA kann Antragsdaten, Pruefnotizen und organisatorische Referenzen fuer interne Audits, administrative Kontinuitaet und den legitimen Schutz der Organisation speichern.",
        ],
      },
      {
        heading: "6. Rechte und Kontakt",
        body: [
          "Sie koennen die Berichtigung unrichtiger Daten verlangen oder Fragen ueber die Datenverarbeitung an den zustaendigen IKA-Administrator oder den offiziellen Kontaktkanal richten.",
        ],
      },
    ],
    acceptance:
      "Ich bestaetige, dass ich diesen rechtlichen Hinweis gelesen und verstanden habe und der internen sowie internationalen Verarbeitung meiner Daten durch IKA ausdruecklich zustimme.",
    accuracy:
      "Ich bestaetige, dass die von mir uebermittelten Angaben nach bestem Wissen korrekt sind und dass ich zu ihrer Uebermittlung berechtigt bin.",
  },
};

export function getRequestFormConsentContent(locale: string): ConsentContent {
  return consentContent[(locale as Locale) in consentContent ? (locale as Locale) : "en"];
}

export function getRequestFormConsentPlainText(locale: string): string {
  const content = getRequestFormConsentContent(locale);
  const blocks = [
    content.intro,
    ...content.sections.flatMap((section) => [
      section.heading,
      ...section.body,
    ]),
    content.acceptance,
    content.accuracy,
  ];

  return blocks.join("\n\n");
}
