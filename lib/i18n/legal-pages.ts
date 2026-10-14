import type { Locale } from "./config";

type LegalCopy = {
  privacyTitle: string;
  privacyIntro: string;
  termsTitle: string;
  termsIntro: string;
  updated: string;
  controller: string;
  data: string;
  purpose: string;
  providers: string;
  retention: string;
  rights: string;
  use: string;
  accounts: string;
  content: string;
  availability: string;
  liability: string;
  changes: string;
  contact: string;
};

const en: LegalCopy = {
  privacyTitle: "Privacy policy",
  privacyIntro: "This policy explains how the International Kempo Association (IKA) processes personal information through the IKA website and its private management platform.",
  termsTitle: "Terms of service",
  termsIntro: "These terms govern access to and use of the IKA website, member portal and administration tools.",
  updated: "Last updated: 14 October 2026",
  controller: "Data controller",
  data: "Information we process",
  purpose: "Purposes and lawful use",
  providers: "Service providers and storage",
  retention: "Retention and security",
  rights: "Your rights",
  use: "Permitted use",
  accounts: "Accounts and access",
  content: "Content and intellectual property",
  availability: "Availability and changes to the service",
  liability: "Responsibility",
  changes: "Changes to these terms",
  contact: "Contact",
};

const localized: Partial<Record<Locale, LegalCopy>> = {
  en,
  es: { ...en, privacyTitle: "Política de privacidad", privacyIntro: "Esta política explica cómo la International Kempo Association (IKA) trata la información personal mediante su sitio web y su plataforma privada de gestión.", termsTitle: "Condiciones del servicio", termsIntro: "Estas condiciones regulan el acceso y el uso del sitio web, el portal de miembros y las herramientas de administración de IKA.", updated: "Última actualización: 14 de octubre de 2026", controller: "Responsable del tratamiento", data: "Información que tratamos", purpose: "Finalidades y uso legítimo", providers: "Proveedores y almacenamiento", retention: "Conservación y seguridad", rights: "Tus derechos", use: "Uso permitido", accounts: "Cuentas y acceso", content: "Contenido y propiedad intelectual", availability: "Disponibilidad y cambios del servicio", liability: "Responsabilidad", changes: "Cambios en estas condiciones", contact: "Contacto" },
  it: { ...en, privacyTitle: "Informativa sulla privacy", termsTitle: "Termini di servizio", updated: "Ultimo aggiornamento: 14 ottobre 2026", controller: "Titolare del trattamento", data: "Informazioni trattate", purpose: "Finalità e uso legittimo", providers: "Fornitori e archiviazione", retention: "Conservazione e sicurezza", rights: "I tuoi diritti", use: "Uso consentito", accounts: "Account e accesso", content: "Contenuti e proprietà intellettuale", availability: "Disponibilità e modifiche del servizio", liability: "Responsabilità", changes: "Modifiche ai termini", contact: "Contatti" },
  fr: { ...en, privacyTitle: "Politique de confidentialité", termsTitle: "Conditions d'utilisation", updated: "Dernière mise à jour : 14 octobre 2026", controller: "Responsable du traitement", data: "Informations traitées", purpose: "Finalités et utilisation légitime", providers: "Prestataires et stockage", retention: "Conservation et sécurité", rights: "Vos droits", use: "Utilisation autorisée", accounts: "Comptes et accès", content: "Contenu et propriété intellectuelle", availability: "Disponibilité et évolution du service", liability: "Responsabilité", changes: "Modification des conditions", contact: "Contact" },
  ja: { ...en, privacyTitle: "プライバシーポリシー", termsTitle: "利用規約", updated: "最終更新日：2026年10月14日", controller: "データ管理者", data: "取り扱う情報", purpose: "利用目的", providers: "サービス提供者と保存", retention: "保存と安全管理", rights: "利用者の権利", use: "許可される利用", accounts: "アカウントとアクセス", content: "コンテンツと知的財産", availability: "サービスの提供と変更", liability: "責任", changes: "規約の変更", contact: "お問い合わせ" },
  zh: { ...en, privacyTitle: "隐私政策", termsTitle: "服务条款", updated: "最后更新：2026年10月14日", controller: "数据控制者", data: "我们处理的信息", purpose: "处理目的和合法使用", providers: "服务提供商和存储", retention: "保留和安全", rights: "您的权利", use: "允许的使用", accounts: "账户和访问", content: "内容和知识产权", availability: "服务可用性和变更", liability: "责任", changes: "条款变更", contact: "联系我们" },
  cs: { ...en, privacyTitle: "Zásady ochrany osobních údajů", termsTitle: "Podmínky služby", updated: "Poslední aktualizace: 14. října 2026", controller: "Správce údajů", data: "Zpracovávané informace", purpose: "Účely a oprávněné použití", providers: "Poskytovatelé a úložiště", retention: "Uchovávání a zabezpečení", rights: "Vaše práva", use: "Povolené použití", accounts: "Účty a přístup", content: "Obsah a duševní vlastnictví", availability: "Dostupnost a změny služby", liability: "Odpovědnost", changes: "Změny podmínek", contact: "Kontakt" },
  id: { ...en, privacyTitle: "Kebijakan privasi", termsTitle: "Ketentuan layanan", updated: "Terakhir diperbarui: 14 Oktober 2026", controller: "Pengendali data", data: "Informasi yang kami proses", purpose: "Tujuan dan penggunaan yang sah", providers: "Penyedia layanan dan penyimpanan", retention: "Penyimpanan dan keamanan", rights: "Hak Anda", use: "Penggunaan yang diizinkan", accounts: "Akun dan akses", content: "Konten dan kekayaan intelektual", availability: "Ketersediaan dan perubahan layanan", liability: "Tanggung jawab", changes: "Perubahan ketentuan", contact: "Kontak" },
  ms: { ...en, privacyTitle: "Dasar privasi", termsTitle: "Terma perkhidmatan", updated: "Kemas kini terakhir: 14 Oktober 2026", controller: "Pengawal data", data: "Maklumat yang diproses", purpose: "Tujuan dan penggunaan yang sah", providers: "Penyedia dan penyimpanan", retention: "Penyimpanan dan keselamatan", rights: "Hak anda", use: "Penggunaan yang dibenarkan", accounts: "Akaun dan akses", content: "Kandungan dan harta intelek", availability: "Ketersediaan dan perubahan perkhidmatan", liability: "Tanggungjawab", changes: "Perubahan terma", contact: "Hubungi" },
  eu: { ...en, privacyTitle: "Pribatutasun politika", termsTitle: "Zerbitzuaren baldintzak", updated: "Azken eguneratzea: 2026ko urriaren 14a", controller: "Datuen arduraduna", data: "Tratatutako informazioa", purpose: "Helburuak eta erabilera legitimoa", providers: "Hornitzaileak eta biltegiratzea", retention: "Kontserbazioa eta segurtasuna", rights: "Zure eskubideak", use: "Baimendutako erabilera", accounts: "Kontuak eta sarbidea", content: "Edukia eta jabetza intelektuala", availability: "Erabilgarritasuna eta aldaketak", liability: "Erantzukizuna", changes: "Baldintzen aldaketak", contact: "Kontaktua" },
  pt: { ...en, privacyTitle: "Política de privacidade", termsTitle: "Termos de serviço", updated: "Última atualização: 14 de outubro de 2026", controller: "Responsável pelo tratamento", data: "Informações tratadas", purpose: "Finalidades e utilização legítima", providers: "Prestadores e armazenamento", retention: "Conservação e segurança", rights: "Os seus direitos", use: "Utilização permitida", accounts: "Contas e acesso", content: "Conteúdo e propriedade intelectual", availability: "Disponibilidade e alterações do serviço", liability: "Responsabilidade", changes: "Alterações aos termos", contact: "Contacto" },
  de: { ...en, privacyTitle: "Datenschutzerklärung", termsTitle: "Nutzungsbedingungen", updated: "Letzte Aktualisierung: 14. Oktober 2026", controller: "Verantwortlicher", data: "Verarbeitete Informationen", purpose: "Zwecke und rechtmäßige Nutzung", providers: "Dienstleister und Speicherung", retention: "Aufbewahrung und Sicherheit", rights: "Ihre Rechte", use: "Zulässige Nutzung", accounts: "Konten und Zugriff", content: "Inhalte und geistiges Eigentum", availability: "Verfügbarkeit und Änderungen", liability: "Verantwortung", changes: "Änderungen der Bedingungen", contact: "Kontakt" },
};

export function getLegalCopy(locale: Locale) {
  return localized[locale] ?? en;
}
