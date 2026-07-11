"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileUp,
  ImagePlus,
  Loader2,
  Mail,
  Pencil,
  Save,
  Send,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/browser";
import { getAdminSessionBridgeHeaders } from "@/lib/supabase/admin-session-bridge";

type CountryOption = {
  id: string;
  code: string;
  country_translations?: Array<{ language_code: string; name: string }>;
};

type DojoOption = {
  id: string;
  country_id: string;
  city: string;
  has_country_admin?: boolean;
  has_dojo_admin?: boolean;
  dojo_translations?: Array<{ language_code: string; name: string }>;
};

type MemberRow = {
  id: string;
  ika_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  current_grade: string | null;
  birth_date: string | null;
  joined_date: string | null;
  main_instructor: string | null;
  guardian_name: string | null;
  guardian_email: string | null;
  internal_notes: string | null;
  member_group: string | null;
  country_id: string | null;
  dojo_id: string | null;
  portal_invite_sent_at: string | null;
  portal_invite_sent_to: string | null;
  profile_image_url: string | null;
  countries: CountryOption | null;
  dojos: DojoOption | null;
};

type ImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  dojoId: string;
  dojoName: string;
  birthDate: string;
  joinedDate: string;
  currentGrade: string;
  status: string;
  mainInstructor: string;
  guardianName: string;
  guardianEmail: string;
  isMinor: string;
  notes: string;
  memberGroup: string;
};

type MemberEditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentGrade: string;
  birthDate: string;
  joinedDate: string;
  status: string;
  memberGroup: string;
  mainInstructor: string;
  guardianName: string;
  guardianEmail: string;
  notes: string;
  profileImageUrl: string;
};

type MembersPayload = {
  countries: CountryOption[];
  dojos: DojoOption[];
  members: MemberRow[];
  scope?: {
    isGlobal: boolean;
    roleKeys?: string[];
    countryIds: string[];
    dojoIds: string[];
  };
};

type MembersLoadResult =
  | { ok: true; payload: MembersPayload }
  | { ok: false; error: string; diagnostics?: unknown };

const emptyPayload: MembersPayload = {
  countries: [],
  dojos: [],
  members: [],
};

const csvTemplate =
  "first_name,last_name,email,current_grade,joined_date,phone\n" +
  "Ane,Gonzalez,ane@example.com,3 kyu,2026-01-10,+34 600 000 000\n";

export function MembersAdmin({ initialLocale }: { initialLocale: Locale }) {
  const copy = useMemo(() => membersAdminCopy(initialLocale), [initialLocale]);
  const supabase = useMemo(() => createClient(), []);
  const [payload, setPayload] = useState<MembersPayload>(emptyPayload);
  const [csvText, setCsvText] = useState(csvTemplate);
  const [selectedDojoId, setSelectedDojoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [inviteSendingId, setInviteSendingId] = useState("");
  const [deletingMemberId, setDeletingMemberId] = useState("");
  const [editingMemberId, setEditingMemberId] = useState("");
  const [savingMemberId, setSavingMemberId] = useState("");
  const [uploadingMemberImageId, setUploadingMemberImageId] = useState("");
  const [memberForm, setMemberForm] = useState<MemberEditForm | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [message, setMessage] = useState("");

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const user = data.session?.user;
    const headers: Record<string, string> = token
      ? {}
      : getAdminSessionBridgeHeaders();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (user?.id) {
      headers["x-client-auth-user-id"] = user.id;
    }

    if (user?.email) {
      headers["x-client-auth-email"] = user.email;
    }

    return headers;
  }, [supabase]);

  const fetchMembersPayload = useCallback(async (): Promise<MembersLoadResult> => {
    const response = await fetch("/api/admin/members", {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: formatAdminError(
          data.error ?? copy.loadError,
          data.diagnostics,
        ),
        diagnostics: data.diagnostics,
      };
    }

    return { ok: true, payload: data as MembersPayload };
  }, [copy.loadError, getAuthHeaders]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const result = await fetchMembersPayload();

    if (!result.ok) {
      setPayload(emptyPayload);
      setMessage(result.error);
    } else {
      setPayload(result.payload);
    }

    setLoading(false);
  }, [fetchMembersPayload]);

  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(() => {
      if (ignore) {
        return;
      }

      void loadMembers();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setPayload(emptyPayload);
      setSelectedDojoId("");

      void loadMembers();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [loadMembers, supabase]);

  const rows = useMemo(() => parseCsvRows(csvText, payload), [csvText, payload]);
  const isGlobalScope = payload.scope?.isGlobal === true;
  const isLockedToSingleDojo = !isGlobalScope && payload.dojos.length === 1;
  const effectiveSelectedDojoId = isLockedToSingleDojo
    ? payload.dojos[0]?.id ?? ""
    : selectedDojoId;
  const selectedDojo =
    payload.dojos.find((dojo) => dojo.id === effectiveSelectedDojoId) ?? null;
  const selectedDojoReady = Boolean(selectedDojo);

  const validRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.firstName &&
          row.lastName &&
          (!row.status || isActiveImportStatus(row.status)),
      ),
    [rows],
  );
  const skippedRows = rows.length - validRows.length;
  const filteredMembers = useMemo(() => {
    const wanted = normalizeComparable(memberSearch);

    if (!wanted) {
      return payload.members;
    }

    return payload.members.filter((member) =>
      normalizeComparable(
        [
          member.ika_number,
          member.first_name,
          member.last_name,
          member.email ?? "",
        ].join(" "),
      ).includes(wanted),
    );
  }, [memberSearch, payload.members]);

  async function importRows() {
    setImporting(true);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        rows: validRows.map((row) => ({
          ...row,
          countryId: selectedDojo?.country_id ?? "",
          countryCode: "",
          countryName: "",
          dojoId: selectedDojo?.id ?? "",
          dojoName: "",
        })),
        sendInvites: false,
        locale: initialLocale,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo importar el lote Kenshi.");
      setImporting(false);
      return;
    }

    const errors = Array.isArray(data.errors) ? data.errors.length : 0;
    setMessage(
      `Importados: ${data.imported ?? 0}. Invitaciones: ${
        data.invited ?? 0
      }. Omitidos: ${data.skipped ?? 0}. Errores: ${errors}.`,
    );
    await loadMembers();
    setImporting(false);
  }

  async function loadCsvFile(file: File) {
    setMessage("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage(copy.csvOnly);
      return;
    }

    setCsvText(await file.text());
  }

  async function sendPortalInvite(member: MemberRow) {
    if (!member.email) {
      setMessage(copy.memberHasNoEmail);
      return;
    }

    setInviteSendingId(member.id);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "send_portal_invite",
        memberId: member.id,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.inviteError);
      setInviteSendingId("");
      return;
    }

    setPayload((current) => ({
      ...current,
      members: current.members.map((item) =>
        item.id === member.id
          ? {
              ...item,
              portal_invite_sent_at:
                data.member?.portal_invite_sent_at ?? new Date().toISOString(),
              portal_invite_sent_to:
                data.member?.portal_invite_sent_to ?? member.email,
            }
          : item,
      ),
    }));
    setMessage(
      copy.emailSent(data.member?.portal_invite_sent_to ?? member.email),
    );
    setInviteSendingId("");
  }

  function startEditingMember(member: MemberRow) {
    setEditingMemberId(member.id);
    setMemberForm(memberToForm(member));
    setMessage("");
  }

  function updateMemberForm(field: keyof MemberEditForm, value: string) {
    setMemberForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  async function uploadMemberProfileImage(member: MemberRow, file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImageFile);
      return;
    }

    setUploadingMemberImageId(member.id);
    setMessage("");

    let imageDataUrl = "";

    try {
      imageDataUrl = await fileToDataUrl(file);
    } catch {
      setMessage(copy.uploadPhotoError);
      setUploadingMemberImageId("");
      return;
    }

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "upload_profile_image",
        memberId: member.id,
        profileImageUpload: {
          name: file.name,
          type: file.type,
          dataUrl: imageDataUrl,
        },
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.uploadPhotoError);
      setUploadingMemberImageId("");
      return;
    }

    const updatedMember = data.member as MemberRow;

    setPayload((current) => ({
      ...current,
      members: current.members.map((item) =>
        item.id === updatedMember.id ? updatedMember : item,
      ),
    }));
    setMemberForm((current) =>
      current
        ? { ...current, profileImageUrl: updatedMember.profile_image_url ?? "" }
        : current,
    );
    setMessage(copy.photoUpdated);
    setUploadingMemberImageId("");
  }

  async function saveMember(member: MemberRow) {
    if (!memberForm) {
      return;
    }

    setSavingMemberId(member.id);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "update_member",
        memberId: member.id,
        member: memberForm,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.saveMemberError);
      setSavingMemberId("");
      return;
    }

    setPayload((current) => ({
      ...current,
      members: current.members.map((item) =>
        item.id === member.id ? { ...item, ...data.member } : item,
      ),
    }));
    setEditingMemberId("");
    setMemberForm(null);
    setSavingMemberId("");
    setMessage(copy.memberUpdated);
  }

  async function deleteMember(member: MemberRow) {
    const memberName = `${member.first_name} ${member.last_name}`.trim();

    if (
      typeof window !== "undefined" &&
      !window.confirm(copy.confirmDelete(memberName))
    ) {
      return;
    }

    setDeletingMemberId(member.id);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "delete_member",
        memberId: member.id,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.deleteMemberError);
      setDeletingMemberId("");
      return;
    }

    setPayload((current) => ({
      ...current,
      members: current.members.filter((item) => item.id !== member.id),
    }));
    setEditingMemberId("");
    setMemberForm(null);
    setDeletingMemberId("");
    setMessage(copy.memberDeleted);
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <UsersRound size={22} className="text-[var(--accent)]" />
              <h2 className="text-2xl font-semibold">{copy.importTitle}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {isLockedToSingleDojo
                ? copy.lockedDojoHelp
                : copy.importHelp}
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold">
            <FileUp size={16} />
            {copy.uploadCsv}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void loadCsvFile(file);
                }
              }}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          {copy.targetDojo}
          {isLockedToSingleDojo && selectedDojo ? (
            <div className="border border-[var(--line)] bg-[var(--paper)] px-3 py-2 font-normal">
              {dojoLabel(selectedDojo, initialLocale)}
            </div>
          ) : (
            <select
              value={selectedDojoId}
              onChange={(event) => setSelectedDojoId(event.target.value)}
              disabled={loading || payload.dojos.length === 0}
              className="border border-[var(--line)] px-3 py-2 font-normal"
            >
              <option value="">{copy.selectDojo}</option>
              {payload.dojos.map((dojo) => {
                const countryLabelText = countryLabelById(
                  payload,
                  dojo.country_id,
                  initialLocale,
                );

                return (
                  <option key={dojo.id} value={dojo.id}>
                    {dojoLabel(dojo, initialLocale)}
                    {countryLabelText ? ` · ${countryLabelText}` : ""}
                  </option>
                );
              })}
            </select>
          )}
          {payload.dojos.length === 0 ? (
            <span className="text-sm text-[var(--accent)]">
              {loading
                ? copy.loadingDojos
                : message || copy.noDojosForRole}
            </span>
          ) : null}
          <button
            type="button"
            onClick={loadMembers}
            disabled={loading}
            className="w-fit border border-[var(--line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? copy.loading : copy.reloadDojos}
          </button>
        </label>

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={8}
          className="w-full border border-[var(--line)] p-3 font-mono text-sm"
        />

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm font-semibold text-[var(--muted)]">
            {copy.csvNoEmails}
          </p>

          <button
            type="button"
            onClick={importRows}
            disabled={importing || validRows.length === 0 || !selectedDojoReady}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {copy.importKenshi(validRows.length)}
          </button>
        </div>

        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
        ) : null}
      </section>

      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{copy.previewTitle}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {copy.previewHelp}
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--muted)]">
            {copy.activeSkipped(validRows.length, skippedRows)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="py-2 pr-4">{copy.name}</th>
                <th className="py-2 pr-4">Email</th>
                {!isLockedToSingleDojo ? (
                  <th className="py-2 pr-4">{copy.country}</th>
                ) : null}
                <th className="py-2 pr-4">Dojo</th>
                <th className="py-2 pr-4">{copy.grade}</th>
              </tr>
            </thead>
            <tbody>
              {validRows.slice(0, 20).map((row, index) => (
                <tr key={`${row.email}-${index}`} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-4">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="py-2 pr-4">{row.email || "-"}</td>
                  {!isLockedToSingleDojo ? (
                    <td className="py-2 pr-4">
                      {selectedDojo
                        ? countryLabelById(
                            payload,
                            selectedDojo.country_id,
                            initialLocale,
                          )
                        : row.countryName ||
                          row.countryCode ||
                          countryLabelById(payload, row.countryId, initialLocale) ||
                          "-"}
                    </td>
                  ) : null}
                  <td className="py-2 pr-4">
                    {selectedDojo
                      ? dojoLabel(selectedDojo, initialLocale)
                      : row.dojoName ||
                        dojoLabelById(payload, row.dojoId, initialLocale) ||
                        "-"}
                  </td>
                  <td className="py-2 pr-4">{row.currentGrade || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {validRows.length > 20 ? (
          <p className="text-sm text-[var(--muted)]">
            {copy.showingRows(validRows.length)}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 border border-[var(--line)] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_minmax(220px,360px)] md:items-end">
          <div>
            <h3 className="text-xl font-semibold">Kenshi</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {copy.visibleMembers(filteredMembers.length, payload.members.length)}
            </p>
          </div>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.search}
            <input
              type="search"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="border border-[var(--line)] px-3 py-2 font-normal"
            />
          </label>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">{copy.loadingKenshi}</p>
        ) : payload.members.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{copy.noVisibleKenshi}</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{copy.noSearchKenshi}</p>
        ) : (
          <div className="grid max-h-[720px] gap-2 overflow-y-auto pr-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="grid gap-2 border border-[var(--line)] px-3 py-2 text-sm md:grid-cols-[1fr_auto]"
              >
                <span>
                  <strong>
                    {member.first_name} {member.last_name}
                  </strong>{" "}
                  <span className="text-[var(--muted)]">
                    {member.ika_number} · {member.email ?? copy.noEmail}
                  </span>
                </span>
                <span className="text-[var(--muted)]">
                  {member.current_grade ?? copy.noGrade} ·{" "}
                  {member.countries
                    ? countryLabel(member.countries, initialLocale)
                    : "-"}
                </span>
                <div className="grid gap-2 md:col-span-2 md:grid-cols-[1fr_auto] md:items-center">
                  {member.portal_invite_sent_to ? (
                    <span className="font-semibold text-[var(--accent)]">
                      {copy.emailSent(member.portal_invite_sent_to)}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">
                      {copy.invitePending}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingMember(member)}
                      className="inline-flex h-9 items-center justify-center gap-2 border border-[var(--line)] px-3 font-semibold"
                    >
                      <Pencil size={16} />
                      {copy.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMember(member)}
                      disabled={deletingMemberId === member.id}
                      className="inline-flex h-9 items-center justify-center gap-2 border border-[var(--line)] px-3 font-semibold text-[var(--accent)] disabled:opacity-50"
                    >
                      {deletingMemberId === member.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      {copy.delete}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendPortalInvite(member)}
                      disabled={!member.email || inviteSendingId === member.id}
                      className="inline-flex h-9 items-center justify-center gap-2 border border-[var(--line)] px-3 font-semibold disabled:opacity-50"
                    >
                      {inviteSendingId === member.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Mail size={16} />
                      )}
                      {copy.sendEmail}
                    </button>
                  </div>
                </div>
                {editingMemberId === member.id && memberForm ? (
                  <div className="grid gap-3 border-t border-[var(--line)] pt-3 md:col-span-2">
                    <div className="grid gap-3 md:grid-cols-2">
                      <EditField
                        label={copy.firstName}
                        value={memberForm.firstName}
                        onChange={(value) => updateMemberForm("firstName", value)}
                      />
                      <EditField
                        label={copy.lastName}
                        value={memberForm.lastName}
                        onChange={(value) => updateMemberForm("lastName", value)}
                      />
                      <EditField
                        label="Email"
                        value={memberForm.email}
                        onChange={(value) => updateMemberForm("email", value)}
                      />
                      <EditField
                        label={copy.phone}
                        value={memberForm.phone}
                        onChange={(value) => updateMemberForm("phone", value)}
                      />
                      <EditField
                        label={copy.grade}
                        value={memberForm.currentGrade}
                        onChange={(value) => updateMemberForm("currentGrade", value)}
                      />
                      <EditField
                        label={copy.joinedDate}
                        type="date"
                        value={memberForm.joinedDate}
                        onChange={(value) => updateMemberForm("joinedDate", value)}
                      />
                      <label className="grid gap-1 font-semibold">
                        {copy.group}
                        <select
                          value={memberForm.memberGroup}
                          onChange={(event) =>
                            updateMemberForm("memberGroup", event.target.value)
                          }
                          className="border border-[var(--line)] px-3 py-2 font-normal"
                        >
                          <option value="">{copy.noGroup}</option>
                          <option value="adult">{copy.adults}</option>
                          <option value="child">{copy.children}</option>
                        </select>
                      </label>
                      <label className="grid gap-1 font-semibold">
                        {copy.status}
                        <select
                          value={memberForm.status}
                          onChange={(event) =>
                            updateMemberForm("status", event.target.value)
                          }
                          className="border border-[var(--line)] px-3 py-2 font-normal"
                        >
                          <option value="active">{copy.active}</option>
                          <option value="inactive">{copy.inactive}</option>
                          <option value="temporary_leave">{copy.temporaryLeave}</option>
                        </select>
                      </label>
                      <EditField
                        label={copy.instructor}
                        value={memberForm.mainInstructor}
                        onChange={(value) =>
                          updateMemberForm("mainInstructor", value)
                        }
                      />
                      <EditField
                        label={copy.guardian}
                        value={memberForm.guardianName}
                        onChange={(value) => updateMemberForm("guardianName", value)}
                      />
                      <EditField
                        label={copy.guardianEmail}
                        value={memberForm.guardianEmail}
                        onChange={(value) =>
                          updateMemberForm("guardianEmail", value)
                        }
                      />
                      <EditField
                        label={copy.birthDate}
                        type="date"
                        value={memberForm.birthDate}
                        onChange={(value) => updateMemberForm("birthDate", value)}
                      />
                    </div>
                    <label className="grid gap-1 font-semibold">
                      {copy.notes}
                      <textarea
                        value={memberForm.notes}
                        onChange={(event) =>
                          updateMemberForm("notes", event.target.value)
                        }
                        rows={3}
                        className="border border-[var(--line)] px-3 py-2 font-normal"
                      />
                    </label>
                    <div className="grid gap-2 font-semibold">
                      <span>{copy.profilePhoto}</span>
                      <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-3 md:grid-cols-[140px_1fr] md:items-center">
                        {memberForm.profileImageUrl ? (
                          <div
                            className="h-32 w-32 border border-[var(--line)] bg-white bg-cover bg-center"
                            style={{
                              backgroundImage: `url("${memberForm.profileImageUrl}")`,
                            }}
                            aria-label={copy.profilePhotoPreview}
                          />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center border border-dashed border-[var(--line)] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {copy.noPhoto}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
                            {uploadingMemberImageId === member.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <ImagePlus size={16} />
                            )}
                            {memberForm.profileImageUrl ? copy.changePhoto : copy.uploadPhoto}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingMemberImageId === member.id}
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) {
                                  void uploadMemberProfileImage(member, file);
                                }
                              }}
                            />
                          </label>
                          {memberForm.profileImageUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateMemberForm("profileImageUrl", "")
                              }
                              className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                            >
                              <X size={16} />
                              {copy.removePhoto}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveMember(member)}
                        disabled={savingMemberId === member.id}
                        className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
                      >
                        {savingMemberId === member.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        {copy.saveKenshi}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemberId("");
                          setMemberForm(null);
                        }}
                        className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
                      >
                        <X size={16} />
                        {copy.cancel}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function parseCsvRows(csv: string, payload: MembersPayload): ImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((header) =>
    normalizeHeader(header),
  );

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    const record = new Map(headers.map((header, index) => [header, values[index] ?? ""]));
    const countryInput =
      getValue(record, "country") || getValue(record, "pais") || getValue(record, "país");
    const dojoInput = getValue(record, "dojo") || getValue(record, "club");
    const country = resolveCountryInput(payload, countryInput);
    const dojo = resolveDojoInput(payload, dojoInput, country?.id ?? "");
    const classInput = getValue(record, "clase");
    const memberGroup = normalizeMemberGroup(classInput);
    const familyEmail =
      getValue(record, "email_familia") || getValue(record, "emailfamilia");
    const directEmail = getValue(record, "email") || getValue(record, "correo");

    return {
      firstName:
        getValue(record, "first_name") ||
        getValue(record, "firstname") ||
        getValue(record, "nombre"),
      lastName:
        getValue(record, "last_name") ||
        getValue(record, "lastname") ||
        getValue(record, "apellido") ||
        getValue(record, "apellidos"),
      email:
        directEmail || (memberGroup === "child" ? "" : familyEmail),
      phone:
        getValue(record, "phone") ||
        getValue(record, "telefono") ||
        getValue(record, "telefono_alumno") ||
        getValue(record, "teléfono alumno"),
      countryId: getValue(record, "country_id") || country?.id || "",
      countryCode:
        getValue(record, "country_code") ||
        getValue(record, "codigo_pais") ||
        (!country ? countryInput.toUpperCase() : ""),
      countryName: country ? "" : countryInput,
      dojoId: getValue(record, "dojo_id") || dojo?.id || "",
      dojoName: dojo ? "" : dojoInput,
      birthDate: getValue(record, "birth_date") || getValue(record, "fecha_nacimiento"),
      joinedDate:
        getValue(record, "joined_date") ||
        getValue(record, "fecha_alta") ||
        getValue(record, "fecha_ingreso") ||
        getValue(record, "fecha ingreso"),
      currentGrade:
        getValue(record, "current_grade") ||
        getValue(record, "grade") ||
        getValue(record, "grado"),
      status: getValue(record, "status") || getValue(record, "estado"),
      mainInstructor:
        getValue(record, "main_instructor") || getValue(record, "instructor"),
      guardianName: getValue(record, "guardian_name") || getValue(record, "tutor"),
      guardianEmail:
        getValue(record, "guardian_email") ||
        getValue(record, "email_tutor") ||
        familyEmail,
      isMinor: getValue(record, "is_minor") || getValue(record, "menor"),
      notes: getValue(record, "notes") || getValue(record, "notas"),
      memberGroup,
    };
  });
}

function detectCsvDelimiter(headerLine: string) {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;

  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: "," | ";") {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  const cleanLine = line.replace(/^\uFEFF/, "");

  for (let index = 0; index < cleanLine.length; index += 1) {
    const char = cleanLine[index];
    const next = cleanLine[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getValue(record: Map<string, string>, key: string) {
  return record.get(normalizeHeader(key))?.trim() ?? "";
}

function resolveCountryInput(payload: MembersPayload, value: string) {
  const wanted = normalizeComparable(value);

  if (!wanted) {
    return null;
  }

  return (
    payload.countries.find(
      (country) =>
        normalizeComparable(country.code) === wanted ||
        country.country_translations?.some(
          (translation) => normalizeComparable(translation.name) === wanted,
        ),
    ) ?? null
  );
}

function resolveDojoInput(
  payload: MembersPayload,
  value: string,
  countryId: string,
) {
  const wanted = normalizeComparable(value);

  if (!wanted) {
    return null;
  }

  return (
    payload.dojos.find((dojo) => {
      const matches =
        normalizeComparable(dojo.city) === wanted ||
        dojo.dojo_translations?.some(
          (translation) => normalizeComparable(translation.name) === wanted,
        );

      return matches && (!countryId || dojo.country_id === countryId);
    }) ?? null
  );
}

function countryLabelById(
  payload: MembersPayload,
  id: string,
  locale: Locale,
) {
  const country = payload.countries.find((item) => item.id === id);
  return country ? countryLabel(country, locale) : "";
}

function dojoLabelById(payload: MembersPayload, id: string, locale: Locale) {
  const dojo = payload.dojos.find((item) => item.id === id);
  return dojo ? dojoLabel(dojo, locale) : "";
}

function countryLabel(country: CountryOption, locale: Locale) {
  return (
    country.country_translations?.find((item) => item.language_code === locale)
      ?.name ??
    country.country_translations?.[0]?.name ??
    country.code
  );
}

function dojoLabel(dojo: DojoOption, locale: Locale) {
  return (
    dojo.dojo_translations?.find((item) => item.language_code === locale)
      ?.name ??
    dojo.dojo_translations?.[0]?.name ??
    dojo.city
  );
}

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
      .trim();
}

function normalizeMemberGroup(value: string) {
  const comparable = normalizeComparable(value);

  if (["adult", "adulto", "adultos", "senior"].includes(comparable)) {
    return "adult";
  }

  if (["child", "children", "nino", "ninos", "niño", "niños", "infantil"].includes(comparable)) {
    return "child";
  }

  return "";
}

function isActiveImportStatus(value: string) {
  return ["active", "activo", "activa"].includes(normalizeComparable(value));
}

function memberToForm(member: MemberRow): MemberEditForm {
  return {
    firstName: member.first_name,
    lastName: member.last_name,
    email: member.email ?? "",
    phone: member.phone ?? "",
    currentGrade: member.current_grade ?? "",
    birthDate: member.birth_date ?? "",
    joinedDate: member.joined_date ?? "",
    status: member.status,
    memberGroup: member.member_group ?? "",
    mainInstructor: member.main_instructor ?? "",
    guardianName: member.guardian_name ?? "",
    guardianEmail: member.guardian_email ?? "",
    notes: member.internal_notes ?? "",
    profileImageUrl: member.profile_image_url ?? "",
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1 font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
}

function formatAdminError(error: string, diagnostics: unknown) {
  if (!diagnostics || typeof diagnostics !== "object") {
    return error;
  }

  const data = diagnostics as {
    authUserId?: string | null;
    authEmail?: string | null;
    clientAuthUserId?: string | null;
    clientAuthEmail?: string | null;
    profilesByAuth?: Array<{ email?: string | null; status?: string | null }>;
    profilesByEmail?: Array<{ email?: string | null; status?: string | null }>;
  };
  const details = [
    data.authEmail ? `Backend email: ${data.authEmail}` : "Backend email: vacio",
    data.authUserId ? `Backend user: ${data.authUserId}` : "Backend user: vacio",
    data.clientAuthEmail ? `Navegador email: ${data.clientAuthEmail}` : "",
    data.clientAuthUserId ? `Navegador user: ${data.clientAuthUserId}` : "",
    `Perfiles por auth: ${data.profilesByAuth?.length ?? 0}`,
    `Perfiles por email: ${data.profilesByEmail?.length ?? 0}`,
  ].filter(Boolean);

  return `${error} ${details.join(" | ")}`;
}

function membersAdminCopy(locale: Locale) {
  const es = locale === "es";

  return {
    loadError: es ? "No se pudo cargar el modulo Kenshi." : "The Kenshi module could not be loaded.",
    csvOnly: es ? "Por ahora sube un CSV exportado desde Excel." : "For now, upload a CSV exported from Excel.",
    memberHasNoEmail: es ? "Ese Kenshi no tiene email." : "That Kenshi has no email.",
    inviteError: es ? "No se pudo enviar la invitacion." : "The invitation could not be sent.",
    emailSent: (email: string) =>
      es ? `Email enviado al email ${email}.` : `Email sent to ${email}.`,
    selectImageFile: es ? "Selecciona un archivo de imagen." : "Select an image file.",
    saveMemberError: es ? "No se pudo guardar el Kenshi." : "The Kenshi could not be saved.",
    uploadPhotoError: es ? "No se pudo subir la foto." : "The photo could not be uploaded.",
    photoUpdated: es ? "Foto de perfil actualizada." : "Profile photo updated.",
    memberUpdated: es ? "Kenshi actualizado." : "Kenshi updated.",
    confirmDelete: (name: string) =>
      es ? `Eliminar definitivamente a ${name}?` : `Permanently delete ${name}?`,
    deleteMemberError: es ? "No se pudo eliminar el Kenshi." : "The Kenshi could not be deleted.",
    memberDeleted: es ? "Kenshi eliminado." : "Kenshi deleted.",
    importTitle: es ? "Importacion Kenshi" : "Kenshi import",
    lockedDojoHelp: es
      ? "Tu usuario esta limitado a este dojo. Sube el CSV y se importara solo aqui."
      : "Your user is limited to this dojo. Upload the CSV and it will be imported only here.",
    importHelp: es
      ? "Selecciona primero el dojo y despues importa muchos practicantes a la vez desde Excel exportado como CSV."
      : "Select the dojo first, then import many practitioners at once from an Excel CSV export.",
    uploadCsv: es ? "Subir CSV" : "Upload CSV",
    targetDojo: es ? "Dojo destino" : "Target dojo",
    selectDojo: es ? "Selecciona dojo" : "Select dojo",
    loadingDojos: es ? "Cargando dojos..." : "Loading dojos...",
    noDojosForRole: es ? "No hay dojos disponibles para tu rol." : "There are no dojos available for your role.",
    loading: es ? "Cargando..." : "Loading...",
    reloadDojos: es ? "Recargar dojos" : "Reload dojos",
    csvNoEmails: es
      ? "El volcado CSV no envia emails. Las invitaciones se enviaran despues manualmente desde el area del dojo."
      : "CSV import does not send emails. Invitations will be sent manually later from the dojo area.",
    importKenshi: (count: number) => (es ? `Importar ${count} Kenshi` : `Import ${count} Kenshi`),
    previewTitle: es ? "Previsualizacion" : "Preview",
    previewHelp: es ? "Solo se muestran las filas activas que se van a importar." : "Only active rows that will be imported are shown.",
    activeSkipped: (active: number, skipped: number) =>
      es ? `Activos: ${active} / Omitidos: ${skipped}` : `Active: ${active} / Skipped: ${skipped}`,
    name: es ? "Nombre" : "Name",
    country: es ? "Pais" : "Country",
    grade: es ? "Grado" : "Grade",
    showingRows: (count: number) =>
      es ? `Mostrando 20 de ${count} filas activas.` : `Showing 20 of ${count} active rows.`,
    visibleMembers: (visible: number, total: number) =>
      es ? `${visible} visibles de ${total}.` : `${visible} visible of ${total}.`,
    search: es ? "Buscar" : "Search",
    searchPlaceholder: es ? "Numero, nombre o apellidos" : "Number, first name or surname",
    loadingKenshi: es ? "Cargando Kenshi..." : "Loading Kenshi...",
    noVisibleKenshi: es ? "No hay Kenshi visibles." : "There are no visible Kenshi.",
    noSearchKenshi: es ? "No hay Kenshi para esa busqueda." : "No Kenshi match that search.",
    noEmail: es ? "sin email" : "no email",
    noGrade: es ? "sin grado" : "no grade",
    invitePending: es ? "Invitacion al portal pendiente." : "Portal invitation pending.",
    edit: es ? "Editar" : "Edit",
    delete: es ? "Eliminar" : "Delete",
    sendEmail: es ? "Enviar email" : "Send email",
    firstName: es ? "Nombre" : "First name",
    lastName: es ? "Apellidos" : "Surname",
    phone: es ? "Telefono" : "Phone",
    joinedDate: es ? "Fecha ingreso" : "Start date",
    group: es ? "Grupo" : "Group",
    noGroup: es ? "Sin grupo" : "No group",
    adults: es ? "Adultos" : "Adults",
    children: es ? "Ninos" : "Children",
    status: es ? "Estado" : "Status",
    active: es ? "Activo" : "Active",
    inactive: es ? "Inactivo" : "Inactive",
    temporaryLeave: es ? "Baja temporal" : "Temporary leave",
    instructor: es ? "Instructor" : "Instructor",
    guardian: es ? "Tutor" : "Guardian",
    guardianEmail: es ? "Email tutor" : "Guardian email",
    birthDate: es ? "Fecha nacimiento" : "Birth date",
    notes: es ? "Notas" : "Notes",
    profilePhoto: es ? "Foto de perfil" : "Profile photo",
    profilePhotoPreview: es ? "Vista previa de la foto de perfil" : "Profile photo preview",
    noPhoto: es ? "Sin foto" : "No photo",
    changePhoto: es ? "Cambiar foto" : "Change photo",
    uploadPhoto: es ? "Subir foto" : "Upload photo",
    removePhoto: es ? "Quitar foto" : "Remove photo",
    saveKenshi: es ? "Guardar Kenshi" : "Save Kenshi",
    cancel: es ? "Cancelar" : "Cancel",
  };
}
