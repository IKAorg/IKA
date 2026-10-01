"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, HardDrive, RefreshCw } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getAdminSessionBridgeHeaders } from "@/lib/supabase/admin-session-bridge";

type Status = {
  connected: boolean;
  accountEmail: string | null;
  rootFolderId: string | null;
  counts: Record<string, number>;
};

const text = {
  en: { intro: "Automatic optimized image storage for IKA.", connected: "Connected account", disconnected: "Google Drive is not connected yet.", connect: "Connect Google Drive", reconnect: "Reconnect", folder: "Open IKA folder", pending: "Pending", copied: "Copied", verified: "Verified", failed: "Failed" },
  es: { intro: "Almacenamiento automatico y optimizado de imagenes de IKA.", connected: "Cuenta conectada", disconnected: "Google Drive aun no esta conectado.", connect: "Conectar Google Drive", reconnect: "Volver a conectar", folder: "Abrir carpeta IKA", pending: "Pendientes", copied: "Copiadas", verified: "Verificadas", failed: "Fallidas" },
  it: { intro: "Archiviazione automatica e ottimizzata delle immagini IKA.", connected: "Account collegato", disconnected: "Google Drive non e ancora collegato.", connect: "Collega Google Drive", reconnect: "Ricollega", folder: "Apri cartella IKA", pending: "In attesa", copied: "Copiate", verified: "Verificate", failed: "Non riuscite" },
  fr: { intro: "Stockage automatique et optimise des images IKA.", connected: "Compte connecte", disconnected: "Google Drive n'est pas encore connecte.", connect: "Connecter Google Drive", reconnect: "Reconnecter", folder: "Ouvrir le dossier IKA", pending: "En attente", copied: "Copiees", verified: "Verifiees", failed: "Echecs" },
  ja: { intro: "IKA画像を自動で最適化して保存します。", connected: "接続済みアカウント", disconnected: "Google Driveはまだ接続されていません。", connect: "Google Driveに接続", reconnect: "再接続", folder: "IKAフォルダを開く", pending: "保留", copied: "コピー済み", verified: "確認済み", failed: "失敗" },
  zh: { intro: "自动优化并存储 IKA 图片。", connected: "已连接账户", disconnected: "Google Drive 尚未连接。", connect: "连接 Google Drive", reconnect: "重新连接", folder: "打开 IKA 文件夹", pending: "待处理", copied: "已复制", verified: "已验证", failed: "失败" },
  cs: { intro: "Automaticke optimalizovane ukladani obrazku IKA.", connected: "Pripojeny ucet", disconnected: "Google Drive zatim neni pripojen.", connect: "Pripojit Google Drive", reconnect: "Znovu pripojit", folder: "Otevrit slozku IKA", pending: "Ceka", copied: "Zkopirovano", verified: "Overeno", failed: "Selhalo" },
  id: { intro: "Penyimpanan gambar IKA otomatis dan teroptimasi.", connected: "Akun terhubung", disconnected: "Google Drive belum terhubung.", connect: "Hubungkan Google Drive", reconnect: "Hubungkan kembali", folder: "Buka folder IKA", pending: "Tertunda", copied: "Disalin", verified: "Diverifikasi", failed: "Gagal" },
  ms: { intro: "Storan imej IKA automatik dan dioptimumkan.", connected: "Akaun disambungkan", disconnected: "Google Drive belum disambungkan.", connect: "Sambung Google Drive", reconnect: "Sambung semula", folder: "Buka folder IKA", pending: "Menunggu", copied: "Disalin", verified: "Disahkan", failed: "Gagal" },
  eu: { intro: "IKA irudien biltegiratze automatiko eta optimizatua.", connected: "Konektatutako kontua", disconnected: "Google Drive ez dago konektatuta.", connect: "Konektatu Google Drive", reconnect: "Berriro konektatu", folder: "Ireki IKA karpeta", pending: "Zain", copied: "Kopiatuta", verified: "Egiaztatuta", failed: "Huts eginda" },
  pt: { intro: "Armazenamento automatico e otimizado de imagens IKA.", connected: "Conta ligada", disconnected: "O Google Drive ainda nao esta ligado.", connect: "Ligar Google Drive", reconnect: "Ligar novamente", folder: "Abrir pasta IKA", pending: "Pendentes", copied: "Copiadas", verified: "Verificadas", failed: "Falhas" },
  de: { intro: "Automatische optimierte Speicherung von IKA-Bildern.", connected: "Verbundenes Konto", disconnected: "Google Drive ist noch nicht verbunden.", connect: "Google Drive verbinden", reconnect: "Neu verbinden", folder: "IKA-Ordner offnen", pending: "Ausstehend", copied: "Kopiert", verified: "Gepruft", failed: "Fehlgeschlagen" },
} as const;

export function GoogleDriveAdmin({ locale }: { locale: Locale }) {
  const copy = text[locale as keyof typeof text] || text.en;
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/google-drive/status", { cache: "no-store", headers: getAdminSessionBridgeHeaders() });
    const result = await response.json();
    if (response.ok) setStatus(result);
    else setMessage(result.error || "Google Drive error");
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function connect() {
    setMessage("");
    const headers = { ...getAdminSessionBridgeHeaders(), accept: "application/json" };
    const response = await fetch("/api/admin/google-drive/connect", { headers });
    const result = await response.json();
    if (!response.ok || !result.authorizationUrl) return setMessage(result.error || "Google Drive error");
    window.location.assign(result.authorizationUrl);
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center gap-3"><HardDrive className="text-[var(--accent)]" size={22} /><p className="text-sm text-[var(--muted)]">{copy.intro}</p></div>
      <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-4">
        {(["pending", "copied", "verified", "failed"] as const).map((key) => <div key={key}><span className="text-xs font-semibold uppercase text-[var(--muted)]">{copy[key]}</span> <strong>{status?.counts[key] || 0}</strong></div>)}
      </div>
      <p className="text-sm">{status?.connected ? <><strong>{copy.connected}:</strong> {status.accountEmail}</> : copy.disconnected}</p>
      {message ? <p className="text-sm font-semibold text-[var(--accent)]">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void connect()} className="inline-flex min-h-11 items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white"><RefreshCw size={17} />{status?.connected ? copy.reconnect : copy.connect}</button>
        {status?.rootFolderId ? <a className="inline-flex min-h-11 items-center gap-2 border border-[var(--line)] bg-white px-4 py-2 font-semibold" href={`https://drive.google.com/drive/folders/${status.rootFolderId}`} target="_blank" rel="noreferrer"><ExternalLink size={17} />{copy.folder}</a> : null}
      </div>
    </div>
  );
}
