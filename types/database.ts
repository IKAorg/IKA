export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentStatus = "draft" | "published" | "archived";

export type MemberStatus = "active" | "inactive" | "temporary_leave";

export type LanguageCode = "en" | "es" | "it" | "fr" | "ja" | "zh" | "cs";
