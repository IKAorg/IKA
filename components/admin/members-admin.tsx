"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
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
import { fileToDataUrl, optimizeImageForUpload } from "@/lib/media/optimize-image";
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
  external_member_id: string | null;
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
  externalMemberId: string;
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

type CourseHistory = {
  id: string;
  member_id: string;
  grade: string;
  exam_date: string;
  exam_place: string | null;
  examiner: string | null;
  notes: string | null;
  course_type?: string | null;
  taikai_config?: {
    categories?: string[];
    results?: string[];
    medals?: string[];
    awards?: string[];
  } | null;
};

type AchievementHistory = {
  id: string;
  member_id: string;
  course_id: string | null;
  title: string;
  category: string | null;
  result: string | null;
  medal_type?: string | null;
  podium_position?: number | null;
  achieved_on: string;
  achieved_place: string | null;
  notes: string | null;
};

type CourseImportRow = {
  externalMemberId: string;
  ikaNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  dojoId: string;
  dojoName: string;
  courseTitle: string;
  courseDate: string;
  coursePlace: string;
  instructor: string;
  notes: string;
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

type ManualMemberForm = {
  externalMemberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  joinedDate: string;
  currentGrade: string;
  mainInstructor: string;
  guardianName: string;
  guardianEmail: string;
  memberGroup: string;
  notes: string;
};

type CourseEditForm = {
  title: string;
  date: string;
  place: string;
  instructor: string;
  notes: string;
  type: string;
};

type AchievementEditForm = {
  title: string;
  category: string;
  result: string;
  medalType: string;
  podiumPosition: string;
  achievedOn: string;
  achievedPlace: string;
  notes: string;
  courseId: string;
};

type BulkTaikaiAchievementForm = {
  id?: string;
  memberId: string;
  title: string;
  category: string;
  result: string;
  medalType: string;
  podiumPosition: string;
  notes: string;
};

type BulkCourseBuilderForm = {
  title: string;
  date: string;
  place: string;
  instructor: string;
  notes: string;
  type: string;
  taikaiCategories: string;
  taikaiResults: string;
  taikaiMedals: string;
  taikaiAwards: string;
  selectedMemberIds: string[];
  achievements: BulkTaikaiAchievementForm[];
};

type MembersPayload = {
  countries: CountryOption[];
  dojos: DojoOption[];
  members: MemberRow[];
  courseHistory: CourseHistory[];
  achievements?: AchievementHistory[];
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
  courseHistory: [],
  achievements: [],
};

const csvTemplate =
  "external_member_id,first_name,last_name,email,current_grade,joined_date,phone\n" +
  "SKBC-001,Ane,Gonzalez,ane@example.com,3 kyu,2026-01-10,+34 600 000 000\n";

const courseCsvTemplate =
  "external_member_id,ika_number,email,course_title,course_date,course_place,instructor,notes\n" +
  "SKBC-001,IKA-000001,ane@example.com,IKA Summer Course,2026-07-01,Madrid,Mizuno Sensei,Participacion completa\n";

const emptyCourseForm: CourseEditForm = {
  title: "",
  date: "",
  place: "",
  instructor: "",
  notes: "",
  type: "course",
};

const emptyAchievementForm: AchievementEditForm = {
  title: "",
  category: "",
  result: "",
  medalType: "",
  podiumPosition: "",
  achievedOn: "",
  achievedPlace: "",
  notes: "",
  courseId: "",
};

const emptyManualMemberForm: ManualMemberForm = {
  externalMemberId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  joinedDate: "",
  currentGrade: "",
  mainInstructor: "",
  guardianName: "",
  guardianEmail: "",
  memberGroup: "",
  notes: "",
};

const emptyBulkCourseBuilderForm: BulkCourseBuilderForm = {
  title: "",
  date: "",
  place: "",
  instructor: "",
  notes: "",
  type: "course",
  taikaiCategories: "",
  taikaiResults: "",
  taikaiMedals: "",
  taikaiAwards: "",
  selectedMemberIds: [],
  achievements: [],
};

type MembersAdminMode = "full" | "courses";

type CourseRegistryForm = {
  title: string;
  date: string;
  place: string;
  instructor: string;
  notes: string;
  type: string;
  taikaiCategories: string;
  taikaiResults: string;
  taikaiMedals: string;
  taikaiAwards: string;
  selectedMemberIds: string[];
  achievements: BulkTaikaiAchievementForm[];
};

export function MembersAdmin({
  initialLocale,
  mode = "full",
}: {
  initialLocale: Locale;
  mode?: MembersAdminMode;
}) {
  const copy = useMemo(() => membersAdminCopy(initialLocale), [initialLocale]);
  const taikaiResultsManagedInEvents = mode === "courses";
  const supabase = useMemo(() => createClient(), []);
  const [payload, setPayload] = useState<MembersPayload>(emptyPayload);
  const [csvText, setCsvText] = useState(csvTemplate);
  const [courseCsvText, setCourseCsvText] = useState(courseCsvTemplate);
  const [selectedDojoId, setSelectedDojoId] = useState("");
  const [manualMemberForm, setManualMemberForm] =
    useState<ManualMemberForm>(emptyManualMemberForm);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [creatingManualMember, setCreatingManualMember] = useState(false);
  const [importingCourses, setImportingCourses] = useState(false);
  const [inviteSendingId, setInviteSendingId] = useState("");
  const [deletingMemberId, setDeletingMemberId] = useState("");
  const [editingMemberId, setEditingMemberId] = useState("");
  const [savingMemberId, setSavingMemberId] = useState("");
  const [uploadingMemberImageId, setUploadingMemberImageId] = useState("");
  const [savingCourseId, setSavingCourseId] = useState("");
  const [deletingCourseId, setDeletingCourseId] = useState("");
  const [memberCourses, setMemberCourses] = useState<CourseHistory[]>([]);
  const [memberAchievements, setMemberAchievements] = useState<AchievementHistory[]>([]);
  const [newCourseForm, setNewCourseForm] = useState<CourseEditForm>(emptyCourseForm);
  const [newAchievementForm, setNewAchievementForm] =
    useState<AchievementEditForm>(emptyAchievementForm);
  const [bulkCourseForm, setBulkCourseForm] =
    useState<BulkCourseBuilderForm>(emptyBulkCourseBuilderForm);
  const [bulkCourseSearch, setBulkCourseSearch] = useState("");
  const [bulkCountryFilter, setBulkCountryFilter] = useState("");
  const [bulkDojoFilter, setBulkDojoFilter] = useState("");
  const [savingBulkCourse, setSavingBulkCourse] = useState(false);
  const [editingRegistryKey, setEditingRegistryKey] = useState("");
  const [registryForm, setRegistryForm] = useState<CourseRegistryForm | null>(null);
  const [registryMemberSearch, setRegistryMemberSearch] = useState("");
  const [registryCountryFilter, setRegistryCountryFilter] = useState("");
  const [registryDojoFilter, setRegistryDojoFilter] = useState("");
  const [savingRegistryKey, setSavingRegistryKey] = useState("");
  const [memberForm, setMemberForm] = useState<MemberEditForm | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusView, setMemberStatusView] = useState<
    "active" | "inactive" | "all"
  >("active");
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
  const courseRows = useMemo(
    () => parseFlexibleCourseCsvRows(courseCsvText, payload),
    [courseCsvText, payload],
  );
  const isGlobalScope = payload.scope?.isGlobal === true;
  const isSuperAdminScope =
    payload.scope?.roleKeys?.includes("super_admin") === true;
  const canManageCourses = isSuperAdminScope;
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
  const validCourseRows = useMemo(
    () =>
      courseRows.filter(
        (row) =>
          row.courseTitle &&
          row.courseDate &&
          (row.externalMemberId ||
            row.ikaNumber ||
            row.email ||
            (row.firstName && row.lastName)),
      ),
    [courseRows],
  );
  const importableCourseRows = useMemo(
    () => (validCourseRows.length > 0 ? validCourseRows : courseRows.filter((row) => row.courseTitle && row.courseDate)),
    [courseRows, validCourseRows],
  );
  const skippedRows = rows.length - validRows.length;
  const skippedCourseRows = courseRows.length - importableCourseRows.length;
  const activeMembersCount = useMemo(
    () => payload.members.filter((member) => member.status === "active").length,
    [payload.members],
  );
  const inactiveMembersCount = useMemo(
    () => payload.members.filter((member) => member.status !== "active").length,
    [payload.members],
  );
  const filteredMembers = useMemo(() => {
    const wanted = normalizeComparable(memberSearch);
    const statusScopedMembers = payload.members.filter((member) => {
      if (memberStatusView === "active") {
        return member.status === "active";
      }
      if (memberStatusView === "inactive") {
        return member.status !== "active";
      }
      return true;
    });

    if (!wanted) {
      return statusScopedMembers;
    }

    return statusScopedMembers.filter((member) =>
      normalizeComparable(
        [
          member.ika_number,
          member.first_name,
          member.last_name,
          member.email ?? "",
        ].join(" "),
      ).includes(wanted),
    );
  }, [memberSearch, memberStatusView, payload.members]);
  const taikaiCourseOptions = useMemo(
    () =>
      memberCourses
        .filter((course) => (course.course_type ?? "course") === "taikai")
        .map((course) => ({
          value: course.id,
          label: formatAchievementCourseOption(course),
        })),
    [memberCourses],
  );
  const bulkScopeMembers = useMemo(() => {
    const wanted = normalizeComparable(bulkCourseSearch);
    const scopedMembers = payload.members.filter((member) => {
      if (effectiveSelectedDojoId && member.dojo_id !== effectiveSelectedDojoId) {
        return false;
      }

      if (bulkCountryFilter && member.country_id !== bulkCountryFilter) {
        return false;
      }

      if (bulkDojoFilter && member.dojo_id !== bulkDojoFilter) {
        return false;
      }

      return member.status === "active";
    });

    if (!wanted) {
      return scopedMembers;
    }

    return scopedMembers.filter((member) =>
      normalizeComparable(
        [
          member.ika_number,
          member.first_name,
          member.last_name,
          member.email ?? "",
        ].join(" "),
      ).includes(wanted),
    );
  }, [bulkCountryFilter, bulkCourseSearch, bulkDojoFilter, effectiveSelectedDojoId, payload.members]);
  const bulkCountryOptions = useMemo(() => {
    return payload.countries
      .filter((country) =>
        payload.members.some((member) => member.status === "active" && member.country_id === country.id),
      )
      .map((country) => ({
        value: country.id,
        label: countryLabel(country, initialLocale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, initialLocale));
  }, [initialLocale, payload.countries, payload.members]);
  const bulkDojoOptions = useMemo(() => {
    return payload.dojos
      .filter((dojo) => {
        if (effectiveSelectedDojoId && dojo.id !== effectiveSelectedDojoId) {
          return false;
        }
        if (bulkCountryFilter && dojo.country_id !== bulkCountryFilter) {
          return false;
        }
        return payload.members.some((member) => member.status === "active" && member.dojo_id === dojo.id);
      })
      .map((dojo) => ({
        value: dojo.id,
        label: dojoLabel(dojo, initialLocale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, initialLocale));
  }, [bulkCountryFilter, effectiveSelectedDojoId, initialLocale, payload.dojos, payload.members]);
  const registryScopeMembers = useMemo(() => {
    const wanted = normalizeComparable(registryMemberSearch);
    const scopedMembers = payload.members.filter((member) => {
      if (effectiveSelectedDojoId && member.dojo_id !== effectiveSelectedDojoId) {
        return false;
      }
      if (registryCountryFilter && member.country_id !== registryCountryFilter) {
        return false;
      }
      if (registryDojoFilter && member.dojo_id !== registryDojoFilter) {
        return false;
      }
      return member.status === "active";
    });

    if (!wanted) {
      return scopedMembers;
    }

    return scopedMembers.filter((member) =>
      normalizeComparable(
        [
          member.ika_number,
          member.first_name,
          member.last_name,
          member.email ?? "",
        ].join(" "),
      ).includes(wanted),
    );
  }, [effectiveSelectedDojoId, payload.members, registryCountryFilter, registryDojoFilter, registryMemberSearch]);
  const registryCountryOptions = useMemo(() => {
    return payload.countries
      .filter((country) =>
        payload.members.some((member) => member.status === "active" && member.country_id === country.id),
      )
      .map((country) => ({
        value: country.id,
        label: countryLabel(country, initialLocale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, initialLocale));
  }, [initialLocale, payload.countries, payload.members]);
  const registryDojoOptions = useMemo(() => {
    return payload.dojos
      .filter((dojo) => {
        if (effectiveSelectedDojoId && dojo.id !== effectiveSelectedDojoId) {
          return false;
        }
        if (registryCountryFilter && dojo.country_id !== registryCountryFilter) {
          return false;
        }
        return payload.members.some((member) => member.status === "active" && member.dojo_id === dojo.id);
      })
      .map((dojo) => ({
        value: dojo.id,
        label: dojoLabel(dojo, initialLocale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, initialLocale));
  }, [effectiveSelectedDojoId, initialLocale, payload.dojos, payload.members, registryCountryFilter]);
  const groupedCourses = useMemo(() => {
    const scopedCourses = payload.courseHistory.filter((course) => {
      const member = payload.members.find((item) => item.id === course.member_id);
      if (!member) {
        return false;
      }
      if (effectiveSelectedDojoId && member.dojo_id !== effectiveSelectedDojoId) {
        return false;
      }
      return true;
    });

    const groups = new Map<
      string,
      {
        key: string;
        title: string;
        date: string;
        place: string;
        instructor: string;
        notes: string;
        type: string;
        courseIds: string[];
        memberIds: string[];
        achievements: AchievementHistory[];
        taikaiConfig: {
          categories: string[];
          results: string[];
          medals: string[];
          awards: string[];
        };
      }
    >();

    for (const course of scopedCourses) {
      const key = [
        course.grade,
        course.exam_date,
        course.course_type ?? "course",
        course.exam_place ?? "",
        course.examiner ?? "",
      ].join("||");

      const current = groups.get(key);
      if (current) {
        current.courseIds.push(course.id);
        current.memberIds.push(course.member_id);
        continue;
      }

      groups.set(key, {
        key,
        title: course.grade,
        date: course.exam_date,
        place: course.exam_place ?? "",
        instructor: course.examiner ?? "",
        notes: course.notes ?? "",
        type: course.course_type ?? "course",
        courseIds: [course.id],
        memberIds: [course.member_id],
        achievements: [],
        taikaiConfig: normalizeTaikaiConfig(course.taikai_config),
      });
    }

    for (const achievement of payload.achievements ?? []) {
      const linkedCourse = scopedCourses.find((course) => course.id === achievement.course_id);

      if (!linkedCourse) {
        continue;
      }

      const key = [
        linkedCourse.grade,
        linkedCourse.exam_date,
        linkedCourse.course_type ?? "course",
        linkedCourse.exam_place ?? "",
        linkedCourse.examiner ?? "",
      ].join("||");
      const current = groups.get(key);

      if (current) {
        current.achievements.push(achievement);
      }
    }

    return Array.from(groups.values()).sort((left, right) =>
      right.date.localeCompare(left.date),
    );
  }, [effectiveSelectedDojoId, payload.courseHistory, payload.members]);

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

  async function createManualMember() {
    if (!selectedDojoReady) {
      setMessage(copy.selectDojoFirst);
      return;
    }

    if (!manualMemberForm.firstName || !manualMemberForm.lastName) {
      setMessage(copy.manualMemberRequired);
      return;
    }

    setCreatingManualMember(true);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        rows: [
          {
            externalMemberId: manualMemberForm.externalMemberId,
            firstName: manualMemberForm.firstName,
            lastName: manualMemberForm.lastName,
            email: manualMemberForm.email,
            phone: manualMemberForm.phone,
            countryId: selectedDojo?.country_id ?? "",
            countryCode: "",
            countryName: "",
            dojoId: selectedDojo?.id ?? "",
            dojoName: "",
            birthDate: manualMemberForm.birthDate,
            joinedDate: manualMemberForm.joinedDate,
            currentGrade: manualMemberForm.currentGrade,
            status: "active",
            mainInstructor: manualMemberForm.mainInstructor,
            guardianName: manualMemberForm.guardianName,
            guardianEmail: manualMemberForm.guardianEmail,
            isMinor: manualMemberForm.memberGroup === "child" ? "true" : "false",
            notes: manualMemberForm.notes,
            memberGroup: manualMemberForm.memberGroup,
          },
        ],
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.manualMemberError);
      setCreatingManualMember(false);
      return;
    }

    const errors = Array.isArray(data.errors) ? data.errors.length : 0;
    if ((data.imported ?? 0) < 1 || errors > 0) {
      const firstError =
        Array.isArray(data.errors) && data.errors[0]?.error
          ? data.errors[0].error
          : copy.manualMemberError;
      setMessage(firstError);
      setCreatingManualMember(false);
      return;
    }

    setManualMemberForm(emptyManualMemberForm);
    await loadMembers();
    setCreatingManualMember(false);
    setMessage(copy.manualMemberCreated);
  }

  async function createBulkCourse() {
    if (!bulkCourseForm.title || !bulkCourseForm.date) {
      setMessage(copy.courseTitleDateRequired);
      return;
    }

    if (bulkCourseForm.selectedMemberIds.length === 0) {
      setMessage(copy.bulkSelectMembersRequired);
      return;
    }

    setSavingBulkCourse(true);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "bulk_create_course",
        course: {
          ...bulkCourseForm,
          taikaiConfig: buildTaikaiConfigFromForm(bulkCourseForm),
        },
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.bulkCourseError);
      setSavingBulkCourse(false);
      return;
    }

    setBulkCourseForm(emptyBulkCourseBuilderForm);
    setBulkCourseSearch("");
    await loadMembers();
    setSavingBulkCourse(false);
    setMessage(
      copy.bulkCourseCreated(
        data.createdCourses ?? 0,
        data.createdAchievements ?? 0,
      ),
    );
  }

  async function saveRegistryCourse(courseKey: string, courseIds: string[]) {
    if (!registryForm) {
      return;
    }

    setSavingRegistryKey(courseKey);
    setMessage("");

    const firstCourse = payload.courseHistory.find((course) => course.id === courseIds[0]);

    if (!firstCourse) {
      setMessage(copy.bulkCourseError);
      setSavingRegistryKey("");
      return;
    }

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "update_bulk_courses",
        memberId: firstCourse.member_id,
        courseIds,
        course: {
          ...registryForm,
          taikaiConfig: buildTaikaiConfigFromForm(registryForm),
        },
        selectedMemberIds: registryForm.selectedMemberIds,
        achievements: registryForm.achievements,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.bulkCourseError);
      setSavingRegistryKey("");
      return;
    }

    await loadMembers();
    setEditingRegistryKey("");
    setRegistryForm(null);
    setSavingRegistryKey("");
    setMessage(copy.bulkCourseUpdated());
  }

  async function importCourseRows() {
    setImportingCourses(true);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "import_courses",
        rows: importableCourseRows,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.importCoursesError);
      setImportingCourses(false);
      return;
    }

    const errors = Array.isArray(data.errors) ? data.errors.length : 0;
    setMessage(
      copy.coursesImported(
        data.imported ?? 0,
        data.updated ?? 0,
        data.skipped ?? 0,
        errors,
      ),
    );
    await loadMembers();
    setImportingCourses(false);
  }

  async function loadCsvFile(file: File) {
    setMessage("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage(copy.csvOnly);
      return;
    }

    setCsvText(await file.text());
  }

  async function loadCourseCsvFile(file: File) {
    setMessage("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage(copy.csvOnly);
      return;
    }

    setCourseCsvText(await file.text());
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
    setMemberCourses(
      payload.courseHistory
        .filter((course) => course.member_id === member.id)
        .sort((left, right) => right.exam_date.localeCompare(left.exam_date)),
    );
    setMemberAchievements(
      (payload.achievements ?? [])
        .filter((achievement) => achievement.member_id === member.id)
        .sort((left, right) => right.achieved_on.localeCompare(left.achieved_on)),
    );
    setNewCourseForm(emptyCourseForm);
    setNewAchievementForm(emptyAchievementForm);
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

  function updateCourseForm(
    courseId: string,
    field: keyof CourseEditForm,
    value: string,
  ) {
    setMemberCourses((current) =>
      current.map((course) =>
        course.id === courseId
          ? {
              ...course,
              grade: field === "title" ? value : course.grade,
              exam_date: field === "date" ? value : course.exam_date,
              exam_place: field === "place" ? value : course.exam_place,
              examiner: field === "instructor" ? value : course.examiner,
              notes: field === "notes" ? value : course.notes,
              course_type: field === "type" ? value : course.course_type,
            }
          : course,
      ),
    );
  }

  function updateNewCourseForm(field: keyof CourseEditForm, value: string) {
    setNewCourseForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateManualMemberForm(
    field: keyof ManualMemberForm,
    value: string,
  ) {
    setManualMemberForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function hydrateAchievementFromCourse(
    current: AchievementEditForm,
    courseId: string,
  ) {
    if (!courseId) {
      return { ...current, courseId: "" };
    }

    const linkedCourse = memberCourses.find((course) => course.id === courseId);

    if (!linkedCourse) {
      return { ...current, courseId };
    }

    return {
      ...current,
      courseId,
      title: current.title || linkedCourse.grade,
      achievedOn: current.achievedOn || linkedCourse.exam_date,
      achievedPlace: current.achievedPlace || linkedCourse.exam_place || "",
      notes:
        current.notes ||
        ((linkedCourse.course_type ?? "course") === "taikai"
          ? linkedCourse.notes ?? ""
          : ""),
    };
  }

  function updateAchievementForm(
    achievementId: string,
    field: keyof AchievementEditForm,
    value: string,
  ) {
    setMemberAchievements((current) =>
      current.map((achievement) =>
        achievement.id === achievementId
          ? (() => {
              const nextAchievement = {
                ...achievement,
                title: field === "title" ? value : achievement.title,
                category: field === "category" ? value : achievement.category,
                result: field === "result" ? value : achievement.result,
                medal_type: field === "medalType" ? value : achievement.medal_type,
                podium_position:
                  field === "podiumPosition"
                    ? Number.parseInt(value, 10) || null
                    : achievement.podium_position,
                achieved_on: field === "achievedOn" ? value : achievement.achieved_on,
                achieved_place:
                  field === "achievedPlace" ? value : achievement.achieved_place,
                notes: field === "notes" ? value : achievement.notes,
                course_id: field === "courseId" ? value : achievement.course_id,
              };

              if (field !== "courseId" || !value) {
                return nextAchievement;
              }

              const linkedCourse = memberCourses.find((course) => course.id === value);

              if (!linkedCourse) {
                return nextAchievement;
              }

              return {
                ...nextAchievement,
                title:
                  nextAchievement.title === achievement.title && !achievement.title
                    ? linkedCourse.grade
                    : nextAchievement.title,
                achieved_on:
                  nextAchievement.achieved_on === achievement.achieved_on &&
                  !achievement.achieved_on
                    ? linkedCourse.exam_date
                    : nextAchievement.achieved_on,
                achieved_place:
                  nextAchievement.achieved_place === achievement.achieved_place &&
                  !achievement.achieved_place
                    ? linkedCourse.exam_place
                    : nextAchievement.achieved_place,
              };
            })()
          : achievement,
      ),
    );
  }

  function updateNewAchievementForm(
    field: keyof AchievementEditForm,
    value: string,
  ) {
    setNewAchievementForm((current) =>
      field === "courseId"
        ? hydrateAchievementFromCourse(current, value)
        : { ...current, [field]: value },
    );
  }

  function updateBulkCourseForm(field: keyof Omit<BulkCourseBuilderForm, "selectedMemberIds" | "achievements">, value: string) {
    setBulkCourseForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleBulkMember(memberId: string) {
    setBulkCourseForm((current) => {
      const exists = current.selectedMemberIds.includes(memberId);
      const selectedMemberIds = exists
        ? current.selectedMemberIds.filter((id) => id !== memberId)
        : [...current.selectedMemberIds, memberId];
      const achievements = current.achievements.filter((entry) =>
        selectedMemberIds.includes(entry.memberId),
      );

      return {
        ...current,
        selectedMemberIds,
        achievements,
      };
    });
  }

  function addBulkAchievementRow() {
    setBulkCourseForm((current) => ({
      ...current,
      achievements: [
        ...current.achievements,
        {
          memberId: current.selectedMemberIds[0] ?? "",
          title: current.title || "",
          category: "",
          result: "",
          medalType: "",
          podiumPosition: "",
          notes: "",
        },
      ],
    }));
  }

  function updateBulkAchievementRow(
    index: number,
    field: keyof BulkTaikaiAchievementForm,
    value: string,
  ) {
    setBulkCourseForm((current) => ({
      ...current,
      achievements: current.achievements.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    }));
  }

  function removeBulkAchievementRow(index: number) {
    setBulkCourseForm((current) => ({
      ...current,
      achievements: current.achievements.filter((_, entryIndex) => entryIndex !== index),
    }));
  }

  function startEditingRegistryCourse(course: {
    key: string;
    title: string;
    date: string;
    place: string;
    instructor: string;
    notes: string;
    type: string;
    memberIds: string[];
    achievements: AchievementHistory[];
    taikaiConfig: {
      categories: string[];
      results: string[];
      medals: string[];
      awards: string[];
    };
  }) {
    setEditingRegistryKey(course.key);
    setRegistryForm({
      title: course.title,
      date: course.date,
      place: course.place,
      instructor: course.instructor,
      notes: course.notes,
      type: course.type,
      taikaiCategories: course.taikaiConfig.categories.join("\n"),
      taikaiResults: course.taikaiConfig.results.join("\n"),
      taikaiMedals: course.taikaiConfig.medals.join("\n"),
      taikaiAwards: course.taikaiConfig.awards.join("\n"),
      selectedMemberIds: [...course.memberIds],
      achievements: course.achievements.map((achievement) => ({
        id: achievement.id,
        memberId: achievement.member_id,
        title: achievement.title,
        category: achievement.category ?? "",
        result: achievement.result ?? "",
        medalType: achievement.medal_type ?? "",
        podiumPosition: achievement.podium_position
          ? String(achievement.podium_position)
          : "",
        notes: achievement.notes ?? "",
      })),
    });
  }

  function updateRegistryForm(field: keyof CourseRegistryForm, value: string) {
    setRegistryForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  function toggleRegistryMember(memberId: string) {
    setRegistryForm((current) => {
      if (!current) {
        return current;
      }

      const exists = current.selectedMemberIds.includes(memberId);
      const selectedMemberIds = exists
        ? current.selectedMemberIds.filter((id) => id !== memberId)
        : [...current.selectedMemberIds, memberId];

      return {
        ...current,
        selectedMemberIds,
        achievements: current.achievements.filter((entry) =>
          selectedMemberIds.includes(entry.memberId),
        ),
      };
    });
  }

  function addRegistryAchievementRow() {
    setRegistryForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        achievements: [
          ...current.achievements,
          {
            memberId: current.selectedMemberIds[0] ?? "",
            title: current.title,
            category: "",
            result: "",
            medalType: "",
            podiumPosition: "",
            notes: "",
          },
        ],
      };
    });
  }

  function updateRegistryAchievementRow(
    index: number,
    field: keyof BulkTaikaiAchievementForm,
    value: string,
  ) {
    setRegistryForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        achievements: current.achievements.map((entry, entryIndex) =>
          entryIndex === index
            ? {
                ...entry,
                [field]: value,
              }
            : entry,
        ),
      };
    });
  }

  function removeRegistryAchievementRow(index: number) {
    setRegistryForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        achievements: current.achievements.filter((_, entryIndex) => entryIndex !== index),
      };
    });
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
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 960,
        maxHeight: 960,
        quality: 0.76,
        maxBytes: 280 * 1024,
        outputType: "image/webp",
        fileNameBase: `${member.ika_number || member.id}-profile`,
      });
      imageDataUrl = await fileToDataUrl(optimizedFile);
      file = optimizedFile;
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

  async function addCourse(member: MemberRow) {
    if (!newCourseForm.title || !newCourseForm.date) {
      setMessage(copy.courseTitleDateRequired);
      return;
    }

    setSavingCourseId("new");
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "add_course",
        memberId: member.id,
        course: newCourseForm,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.courseSaveError);
      setSavingCourseId("");
      return;
    }

    const nextCourse = data.course as CourseHistory;
    setPayload((current) => ({
      ...current,
      courseHistory: [nextCourse, ...current.courseHistory],
    }));
    setMemberCourses((current) =>
      [nextCourse, ...current].sort((left, right) =>
        right.exam_date.localeCompare(left.exam_date),
      ),
    );
    setNewCourseForm(emptyCourseForm);
    setSavingCourseId("");
    setMessage(copy.courseAdded);
  }

  async function saveCourse(member: MemberRow, course: CourseHistory) {
    setSavingCourseId(course.id);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "update_course",
        memberId: member.id,
        courseId: course.id,
        course: {
          title: course.grade,
          date: course.exam_date,
          place: course.exam_place ?? "",
          instructor: course.examiner ?? "",
          notes: course.notes ?? "",
          type: course.course_type ?? "course",
        },
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.courseSaveError);
      setSavingCourseId("");
      return;
    }

    const nextCourse = data.course as CourseHistory;
    setPayload((current) => ({
      ...current,
      courseHistory: current.courseHistory.map((item) =>
        item.id === nextCourse.id ? nextCourse : item,
      ),
    }));
    setMemberCourses((current) =>
      current
        .map((item) => (item.id === nextCourse.id ? nextCourse : item))
        .sort((left, right) => right.exam_date.localeCompare(left.exam_date)),
    );
    setSavingCourseId("");
    setMessage(copy.courseUpdated);
  }

  async function deleteCourse(member: MemberRow, courseId: string) {
    setDeletingCourseId(courseId);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "delete_course",
        memberId: member.id,
        courseId,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.courseDeleteError);
      setDeletingCourseId("");
      return;
    }

    setPayload((current) => ({
      ...current,
      courseHistory: current.courseHistory.filter((item) => item.id !== courseId),
    }));
    setMemberCourses((current) =>
      current.filter((item) => item.id !== (data.courseId as string)),
    );
    setDeletingCourseId("");
    setMessage(copy.courseDeleted);
  }

  async function addAchievement(member: MemberRow) {
    if (!newAchievementForm.title || !newAchievementForm.achievedOn) {
      setMessage(copy.achievementTitleDateRequired);
      return;
    }

    setSavingCourseId("new-achievement");
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "add_achievement",
        memberId: member.id,
        achievement: newAchievementForm,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.achievementSaveError);
      setSavingCourseId("");
      return;
    }

    const nextAchievement = data.achievement as AchievementHistory;
    setPayload((current) => ({
      ...current,
      achievements: [nextAchievement, ...(current.achievements ?? [])],
    }));
    setMemberAchievements((current) =>
      [nextAchievement, ...current].sort((left, right) =>
        right.achieved_on.localeCompare(left.achieved_on),
      ),
    );
    setNewAchievementForm(emptyAchievementForm);
    setSavingCourseId("");
    setMessage(copy.achievementAdded);
  }

  async function saveAchievement(member: MemberRow, achievement: AchievementHistory) {
    setSavingCourseId(`achievement-${achievement.id}`);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "update_achievement",
        memberId: member.id,
        achievementId: achievement.id,
        achievement: {
          title: achievement.title,
          category: achievement.category ?? "",
          result: achievement.result ?? "",
          medalType: achievement.medal_type ?? "",
          podiumPosition: achievement.podium_position ? String(achievement.podium_position) : "",
          achievedOn: achievement.achieved_on,
          achievedPlace: achievement.achieved_place ?? "",
          notes: achievement.notes ?? "",
          courseId: achievement.course_id ?? "",
        },
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.achievementSaveError);
      setSavingCourseId("");
      return;
    }

    const nextAchievement = data.achievement as AchievementHistory;
    setPayload((current) => ({
      ...current,
      achievements: (current.achievements ?? []).map((item) =>
        item.id === nextAchievement.id ? nextAchievement : item,
      ),
    }));
    setMemberAchievements((current) =>
      current
        .map((item) => (item.id === nextAchievement.id ? nextAchievement : item))
        .sort((left, right) => right.achieved_on.localeCompare(left.achieved_on)),
    );
    setSavingCourseId("");
    setMessage(copy.achievementUpdated);
  }

  async function deleteAchievement(member: MemberRow, achievementId: string) {
    setDeletingCourseId(`achievement-${achievementId}`);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "delete_achievement",
        memberId: member.id,
        achievementId,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.achievementDeleteError);
      setDeletingCourseId("");
      return;
    }

    setPayload((current) => ({
      ...current,
      achievements: (current.achievements ?? []).filter((item) => item.id !== achievementId),
    }));
    setMemberAchievements((current) =>
      current.filter((item) => item.id !== (data.achievementId as string)),
    );
    setDeletingCourseId("");
    setMessage(copy.achievementDeleted);
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
      {mode === "full" ? (
      <details className="border border-[var(--line)] bg-white" open>
        <summary className="cursor-pointer px-5 py-4 text-xl font-semibold marker:text-[var(--accent)]">
          {copy.manualMemberTitle}
        </summary>
      <section className="grid gap-4 border-t border-[var(--line)] p-5">
        <div className="flex items-center gap-3">
          <UsersRound size={22} className="text-[var(--accent)]" />
          <div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              {copy.manualMemberHelp}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <EditField
            label={copy.externalMemberId}
            value={manualMemberForm.externalMemberId}
            onChange={(value) => updateManualMemberForm("externalMemberId", value)}
          />
          <div className="grid gap-1 font-semibold">
            <span>{copy.dojoDestination}</span>
            <select
              value={effectiveSelectedDojoId}
              disabled={isLockedToSingleDojo}
              onChange={(event) => setSelectedDojoId(event.target.value)}
              className="border border-[var(--line)] px-3 py-2 font-normal disabled:bg-[var(--paper)]"
            >
              <option value="">{copy.selectDojo}</option>
              {payload.dojos.map((dojo) => (
                <option key={dojo.id} value={dojo.id}>
                  {dojoLabel(dojo, initialLocale)}
                </option>
              ))}
            </select>
          </div>
          <EditField
            label={copy.firstName}
            value={manualMemberForm.firstName}
            onChange={(value) => updateManualMemberForm("firstName", value)}
          />
          <EditField
            label={copy.lastName}
            value={manualMemberForm.lastName}
            onChange={(value) => updateManualMemberForm("lastName", value)}
          />
          <EditField
            label={copy.email}
            value={manualMemberForm.email}
            onChange={(value) => updateManualMemberForm("email", value)}
          />
          <EditField
            label={copy.phone}
            value={manualMemberForm.phone}
            onChange={(value) => updateManualMemberForm("phone", value)}
          />
          <EditField
            label={copy.birthDate}
            type="date"
            value={manualMemberForm.birthDate}
            onChange={(value) => updateManualMemberForm("birthDate", value)}
          />
          <EditField
            label={copy.joinedDate}
            type="date"
            value={manualMemberForm.joinedDate}
            onChange={(value) => updateManualMemberForm("joinedDate", value)}
          />
          <EditField
            label={copy.grade}
            value={manualMemberForm.currentGrade}
            onChange={(value) => updateManualMemberForm("currentGrade", value)}
          />
          <EditField
            label={copy.instructor}
            value={manualMemberForm.mainInstructor}
            onChange={(value) => updateManualMemberForm("mainInstructor", value)}
          />
          <label className="grid gap-1 font-semibold">
            {copy.group}
            <select
              value={manualMemberForm.memberGroup}
              onChange={(event) => updateManualMemberForm("memberGroup", event.target.value)}
              className="border border-[var(--line)] px-3 py-2 font-normal"
            >
              <option value="">{copy.noGroup}</option>
              <option value="adult">{copy.adults}</option>
              <option value="child">{copy.children}</option>
            </select>
          </label>
          <EditField
            label={copy.guardian}
            value={manualMemberForm.guardianName}
            onChange={(value) => updateManualMemberForm("guardianName", value)}
          />
          <EditField
            label={copy.guardianEmail}
            value={manualMemberForm.guardianEmail}
            onChange={(value) => updateManualMemberForm("guardianEmail", value)}
          />
        </div>

        <label className="grid gap-1 font-semibold">
          {copy.notes}
          <textarea
            value={manualMemberForm.notes}
            onChange={(event) => updateManualMemberForm("notes", event.target.value)}
            rows={3}
            className="border border-[var(--line)] px-3 py-2 font-normal"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void createManualMember()}
            disabled={creatingManualMember || !effectiveSelectedDojoId}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {creatingManualMember ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {copy.createMember}
          </button>
          <button
            type="button"
            onClick={() => setManualMemberForm(emptyManualMemberForm)}
            className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
          >
            <X size={16} />
            {copy.clearForm}
          </button>
        </div>
      </section>
      </details>
      ) : null}

      {mode === "full" ? (
      <details className="border border-[var(--line)] bg-white">
        <summary className="cursor-pointer px-5 py-4 text-xl font-semibold marker:text-[var(--accent)]">
          {copy.importTitle}
        </summary>
      <section className="grid gap-4 border-t border-[var(--line)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <UsersRound size={22} className="text-[var(--accent)]" />
            </div>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
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
                    {countryLabelText ? ` | ${countryLabelText}` : ""}
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
      </details>
      ) : null}




      {mode === "courses" && canManageCourses ? (
      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <div className="border border-[var(--line)] bg-[var(--paper)] p-4">
          <p className="text-sm font-semibold">{copy.taikaiResultsUnifiedTitle}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {copy.taikaiResultsUnifiedHelp}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CalendarRange size={22} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-2xl font-semibold">{copy.bulkCourseTitle}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
              {copy.bulkCourseHelp}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <EditField
            label={copy.courseName}
            value={bulkCourseForm.title}
            onChange={(value) => updateBulkCourseForm("title", value)}
          />
          <SelectField
            label={copy.courseType}
            value={bulkCourseForm.type}
            onChange={(value) => updateBulkCourseForm("type", value)}
            options={courseTypeOptions(copy)}
          />
          <EditField
            label={copy.courseDate}
            type="date"
            value={bulkCourseForm.date}
            onChange={(value) => updateBulkCourseForm("date", value)}
          />
          <EditField
            label={copy.coursePlace}
            value={bulkCourseForm.place}
            onChange={(value) => updateBulkCourseForm("place", value)}
          />
          <EditField
            label={copy.courseInstructor}
            value={bulkCourseForm.instructor}
            onChange={(value) => updateBulkCourseForm("instructor", value)}
          />
        </div>

        <label className="grid gap-1 font-semibold">
          {copy.notes}
          <textarea
            value={bulkCourseForm.notes}
            onChange={(event) => updateBulkCourseForm("notes", event.target.value)}
            rows={2}
            className="border border-[var(--line)] px-3 py-2 font-normal"
          />
        </label>
        {bulkCourseForm.type === "taikai" && taikaiResultsManagedInEvents ? (
          <div className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
            {copy.taikaiResultsUnifiedHelp}
          </div>
        ) : null}
        {bulkCourseForm.type === "taikai" && !taikaiResultsManagedInEvents ? (
          <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
            <h3 className="text-lg font-semibold">{copy.taikaiSetupTitle}</h3>
            <p className="text-sm text-[var(--muted)]">{copy.taikaiSetupHelp}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 font-semibold">
                {copy.taikaiCategories}
                <textarea
                  value={bulkCourseForm.taikaiCategories}
                  onChange={(event) => updateBulkCourseForm("taikaiCategories", event.target.value)}
                  rows={4}
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 font-semibold">
                {copy.taikaiResults}
                <textarea
                  value={bulkCourseForm.taikaiResults}
                  onChange={(event) => updateBulkCourseForm("taikaiResults", event.target.value)}
                  rows={4}
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 font-semibold">
                {copy.taikaiMedals}
                <textarea
                  value={bulkCourseForm.taikaiMedals}
                  onChange={(event) => updateBulkCourseForm("taikaiMedals", event.target.value)}
                  rows={4}
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 font-semibold">
                {copy.taikaiAwards}
                <textarea
                  value={bulkCourseForm.taikaiAwards}
                  onChange={(event) => updateBulkCourseForm("taikaiAwards", event.target.value)}
                  rows={4}
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{copy.bulkMembersTitle}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{copy.bulkMembersHelp}</p>
            </div>
            <input
              value={bulkCourseSearch}
              onChange={(event) => setBulkCourseSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="min-w-[260px] border border-[var(--line)] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label={copy.filterCountry}
              value={bulkCountryFilter}
              onChange={(value) => {
                setBulkCountryFilter(value);
                setBulkDojoFilter("");
              }}
              options={[
                { value: "", label: copy.allCountries },
                ...bulkCountryOptions,
              ]}
            />
            <SelectField
              label={copy.filterDojo}
              value={bulkDojoFilter}
              onChange={setBulkDojoFilter}
              options={[
                { value: "", label: copy.allDojos },
                ...bulkDojoOptions,
              ]}
            />
          </div>
          <div className="max-h-72 overflow-y-auto border border-[var(--line)] bg-white">
            {bulkScopeMembers.map((member) => {
              const checked = bulkCourseForm.selectedMemberIds.includes(member.id);
              return (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-3 text-sm last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-[var(--muted)]">
                      {[member.ika_number, member.email ?? "", member.dojos ? dojoLabel(member.dojos, initialLocale) : ""]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBulkMember(member.id)}
                    className="size-4"
                  />
                </label>
              );
            })}
          </div>
          {bulkScopeMembers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.noBulkMembersForFilters}</p>
          ) : null}
          <p className="text-sm text-[var(--muted)]">
            {copy.bulkMembersSelected(bulkCourseForm.selectedMemberIds.length)}
          </p>
        </div>

        {bulkCourseForm.type === "taikai" && !taikaiResultsManagedInEvents ? (
          <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{copy.bulkTaikaiAchievementsTitle}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {copy.bulkTaikaiAchievementsHelp}
                </p>
              </div>
              <button
                type="button"
                onClick={addBulkAchievementRow}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
              >
                <Save size={16} />
                {copy.addAchievement}
              </button>
            </div>

            {bulkCourseForm.achievements.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{copy.noAchievements}</p>
            ) : (
              <div className="grid gap-3">
                {bulkCourseForm.achievements.map((achievement, index) => (
                  <div
                    key={`${achievement.memberId}-${index}`}
                    className="grid gap-3 border border-[var(--line)] bg-white p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <SelectField
                        label={copy.name}
                        value={achievement.memberId}
                        onChange={(value) => updateBulkAchievementRow(index, "memberId", value)}
                        options={bulkCourseForm.selectedMemberIds.map((memberId) => {
                          const member = payload.members.find((item) => item.id === memberId);
                          return {
                            value: memberId,
                            label: member ? `${member.first_name} ${member.last_name}` : memberId,
                          };
                        })}
                      />
                      <SelectField
                        label={copy.achievementTitle}
                        value={achievement.title}
                        onChange={(value) => updateBulkAchievementRow(index, "title", value)}
                        options={taikaiAwardOptions(copy, bulkCourseForm.taikaiAwards)}
                      />
                      <SelectField
                        label={copy.achievementCategory}
                        value={achievement.category}
                        onChange={(value) => updateBulkAchievementRow(index, "category", value)}
                        options={taikaiListOptions(copy, bulkCourseForm.taikaiCategories, copy.noCategory)}
                      />
                      <SelectField
                        label={copy.achievementResult}
                        value={achievement.result}
                        onChange={(value) => updateBulkAchievementRow(index, "result", value)}
                        options={taikaiListOptions(copy, bulkCourseForm.taikaiResults, copy.noResult)}
                      />
                      <SelectField
                        label={copy.medalType}
                        value={achievement.medalType}
                        onChange={(value) => updateBulkAchievementRow(index, "medalType", value)}
                        options={taikaiMedalOptions(copy, bulkCourseForm.taikaiMedals)}
                      />
                      <EditField
                        label={copy.podiumPosition}
                        value={achievement.podiumPosition}
                        onChange={(value) => updateBulkAchievementRow(index, "podiumPosition", value)}
                      />
                    </div>
                    <label className="grid gap-1 font-semibold">
                      {copy.notes}
                      <textarea
                        value={achievement.notes}
                        onChange={(event) => updateBulkAchievementRow(index, "notes", event.target.value)}
                        rows={2}
                        className="border border-[var(--line)] px-3 py-2 font-normal"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeBulkAchievementRow(index)}
                      className="inline-flex w-fit items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                    >
                      <Trash2 size={16} />
                      {copy.deleteAchievement}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void createBulkCourse()}
            disabled={savingBulkCourse}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {savingBulkCourse ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {copy.bulkCreateCourse}
          </button>
        </div>
      </section>
      ) : null}


      {mode === "courses" && canManageCourses ? (
      <details className="border border-[var(--line)] bg-white">
        <summary className="cursor-pointer px-5 py-4 text-xl font-semibold marker:text-[var(--accent)]">{copy.coursesTitle}</summary>
        <section className="grid gap-4 border-t border-[var(--line)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <CalendarRange size={22} className="text-[var(--accent)]" />
              <h2 className="text-2xl font-semibold">{copy.coursesTitle}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {copy.coursesHelp}
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold">
            <FileUp size={16} />
            {copy.uploadCoursesCsv}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void loadCourseCsvFile(file);
                }
              }}
            />
          </label>
        </div>

        <textarea
          value={courseCsvText}
          onChange={(event) => setCourseCsvText(event.target.value)}
          rows={8}
          className="w-full border border-[var(--line)] p-3 font-mono text-sm"
        />

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm font-semibold text-[var(--muted)]">
            {copy.coursesCsvHint}
          </p>

          <button
            type="button"
            onClick={importCourseRows}
            disabled={importingCourses || importableCourseRows.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {importingCourses ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {copy.importCourses(importableCourseRows.length)}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="py-2 pr-4">{copy.ikaId}</th>
                <th className="py-2 pr-4">{copy.email}</th>
                <th className="py-2 pr-4">{copy.courseName}</th>
                <th className="py-2 pr-4">{copy.courseDate}</th>
                <th className="py-2 pr-4">{copy.dojo}</th>
              </tr>
            </thead>
            <tbody>
              {importableCourseRows.slice(0, 20).map((row, index) => (
                <tr key={`${row.ikaNumber}-${row.email}-${index}`} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-4">{row.ikaNumber || "-"}</td>
                  <td className="py-2 pr-4">{row.email || "-"}</td>
                  <td className="py-2 pr-4">{row.courseTitle}</td>
                  <td className="py-2 pr-4">{row.courseDate}</td>
                  <td className="py-2 pr-4">
                    {row.dojoName || dojoLabelById(payload, row.dojoId, initialLocale) || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {courseRows.length > 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {copy.courseRowsSummary(importableCourseRows.length, skippedCourseRows)}
          </p>
        ) : null}
      </section>
      </details>
      ) : null}

      {mode === "courses" && canManageCourses ? (
      <details className="border border-[var(--line)] bg-white">
        <summary className="cursor-pointer px-5 py-4 text-xl font-semibold marker:text-[var(--accent)]">{copy.courseRegistryTitle}</summary>
        <section className="grid gap-4 border-t border-[var(--line)] p-5">
        <div className="flex items-center gap-3">
          <CalendarRange size={22} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-2xl font-semibold">{copy.courseRegistryTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {copy.courseRegistryHelp}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {groupedCourses.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.noCourses}</p>
          ) : (
            groupedCourses.map((course) => (
              <div key={course.key} className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
                {editingRegistryKey === course.key && registryForm ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <EditField
                        label={copy.courseName}
                        value={registryForm.title}
                        onChange={(value) => updateRegistryForm("title", value)}
                      />
                      <SelectField
                        label={copy.courseType}
                        value={registryForm.type}
                        onChange={(value) => updateRegistryForm("type", value)}
                        options={courseTypeOptions(copy)}
                      />
                      <EditField
                        label={copy.courseDate}
                        type="date"
                        value={registryForm.date}
                        onChange={(value) => updateRegistryForm("date", value)}
                      />
                      <EditField
                        label={copy.coursePlace}
                        value={registryForm.place}
                        onChange={(value) => updateRegistryForm("place", value)}
                      />
                      <EditField
                        label={copy.courseInstructor}
                        value={registryForm.instructor}
                        onChange={(value) => updateRegistryForm("instructor", value)}
                      />
                    </div>
                    <label className="grid gap-1 font-semibold">
                      {copy.notes}
                      <textarea
                        value={registryForm.notes}
                        onChange={(event) => updateRegistryForm("notes", event.target.value)}
                        rows={2}
                        className="border border-[var(--line)] px-3 py-2 font-normal"
                      />
                    </label>
                    {registryForm.type === "taikai" && taikaiResultsManagedInEvents ? (
                      <div className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
                        {copy.taikaiResultsUnifiedHelp}
                      </div>
                    ) : null}
                    {registryForm.type === "taikai" && !taikaiResultsManagedInEvents ? (
                      <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
                        <h4 className="text-base font-semibold">{copy.taikaiSetupTitle}</h4>
                        <p className="text-sm text-[var(--muted)]">{copy.taikaiSetupHelp}</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-1 font-semibold">
                            {copy.taikaiCategories}
                            <textarea
                              value={registryForm.taikaiCategories}
                              onChange={(event) => updateRegistryForm("taikaiCategories", event.target.value)}
                              rows={4}
                              className="border border-[var(--line)] px-3 py-2 font-normal"
                            />
                          </label>
                          <label className="grid gap-1 font-semibold">
                            {copy.taikaiResults}
                            <textarea
                              value={registryForm.taikaiResults}
                              onChange={(event) => updateRegistryForm("taikaiResults", event.target.value)}
                              rows={4}
                              className="border border-[var(--line)] px-3 py-2 font-normal"
                            />
                          </label>
                          <label className="grid gap-1 font-semibold">
                            {copy.taikaiMedals}
                            <textarea
                              value={registryForm.taikaiMedals}
                              onChange={(event) => updateRegistryForm("taikaiMedals", event.target.value)}
                              rows={4}
                              className="border border-[var(--line)] px-3 py-2 font-normal"
                            />
                          </label>
                          <label className="grid gap-1 font-semibold">
                            {copy.taikaiAwards}
                            <textarea
                              value={registryForm.taikaiAwards}
                              onChange={(event) => updateRegistryForm("taikaiAwards", event.target.value)}
                              rows={4}
                              className="border border-[var(--line)] px-3 py-2 font-normal"
                            />
                          </label>
                        </div>
                      </div>
                    ) : null}
                    <div className="grid gap-3 border border-[var(--line)] bg-white p-4">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold">{copy.bulkMembersTitle}</h4>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {copy.registryMembersHelp}
                          </p>
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          {copy.bulkMembersSelected(registryForm.selectedMemberIds.length)}
                        </p>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                        <input
                          value={registryMemberSearch}
                          onChange={(event) => setRegistryMemberSearch(event.target.value)}
                          placeholder={copy.searchPlaceholder}
                          className="border border-[var(--line)] px-3 py-2 text-sm"
                        />
                        <SelectField
                          label={copy.filterCountry}
                          value={registryCountryFilter}
                          onChange={(value) => {
                            setRegistryCountryFilter(value);
                            setRegistryDojoFilter("");
                          }}
                          options={[
                            { value: "", label: copy.allCountries },
                            ...registryCountryOptions,
                          ]}
                        />
                        <SelectField
                          label={copy.filterDojo}
                          value={registryDojoFilter}
                          onChange={setRegistryDojoFilter}
                          options={[
                            { value: "", label: copy.allDojos },
                            ...registryDojoOptions,
                          ]}
                        />
                      </div>
                      <div className="max-h-72 overflow-y-auto border border-[var(--line)] bg-[var(--paper)]">
                        {registryScopeMembers
                          .map((member) => {
                            const checked = registryForm.selectedMemberIds.includes(member.id);
                            return (
                              <label
                                key={member.id}
                                className="flex cursor-pointer items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-3 text-sm last:border-b-0"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold">
                                    {member.first_name} {member.last_name}
                                  </p>
                                  <p className="text-[var(--muted)]">
                                    {[member.ika_number, member.email ?? "", member.dojos ? dojoLabel(member.dojos, initialLocale) : ""]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleRegistryMember(member.id)}
                                  className="size-4"
                                />
                              </label>
                            );
                          })}
                      </div>
                      {registryScopeMembers.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">{copy.noBulkMembersForFilters}</p>
                      ) : null}
                    </div>
                    {registryForm.type === "taikai" && !taikaiResultsManagedInEvents ? (
                      <div className="grid gap-3 border border-[var(--line)] bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold">{copy.bulkTaikaiAchievementsTitle}</h4>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {copy.registryTaikaiHelp}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addRegistryAchievementRow}
                            className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                          >
                            <Save size={16} />
                            {copy.addAchievement}
                          </button>
                        </div>
                        {registryForm.achievements.length === 0 ? (
                          <p className="text-sm text-[var(--muted)]">{copy.noAchievements}</p>
                        ) : (
                          <div className="grid gap-3">
                            {registryForm.achievements.map((achievement, index) => (
                              <div
                                key={`${achievement.id ?? "new"}-${index}`}
                                className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-3"
                              >
                                <div className="grid gap-3 md:grid-cols-2">
                                  <SelectField
                                    label={copy.name}
                                    value={achievement.memberId}
                                    onChange={(value) =>
                                      updateRegistryAchievementRow(index, "memberId", value)
                                    }
                                    options={registryForm.selectedMemberIds.map((memberId) => {
                                      const member = payload.members.find((item) => item.id === memberId);
                                      return {
                                        value: memberId,
                                        label: member ? `${member.first_name} ${member.last_name}` : memberId,
                                      };
                                    })}
                                  />
                                  <SelectField
                                    label={copy.achievementTitle}
                                    value={achievement.title}
                                    onChange={(value) =>
                                      updateRegistryAchievementRow(index, "title", value)
                                    }
                                    options={taikaiAwardOptions(copy, registryForm.taikaiAwards)}
                                  />
                                  <SelectField
                                    label={copy.achievementCategory}
                                    value={achievement.category}
                                    onChange={(value) =>
                                      updateRegistryAchievementRow(index, "category", value)
                                    }
                                    options={taikaiListOptions(copy, registryForm.taikaiCategories, copy.noCategory)}
                                  />
                                  <SelectField
                                    label={copy.achievementResult}
                                    value={achievement.result}
                                    onChange={(value) =>
                                      updateRegistryAchievementRow(index, "result", value)
                                    }
                                    options={taikaiListOptions(copy, registryForm.taikaiResults, copy.noResult)}
                                  />
                                  <SelectField
                                    label={copy.medalType}
                                    value={achievement.medalType}
                                    onChange={(value) =>
                                      updateRegistryAchievementRow(index, "medalType", value)
                                    }
                                    options={taikaiMedalOptions(copy, registryForm.taikaiMedals)}
                                  />
                                  <EditField
                                    label={copy.podiumPosition}
                                    value={achievement.podiumPosition}
                                    onChange={(value) =>
                                      updateRegistryAchievementRow(index, "podiumPosition", value)
                                    }
                                  />
                                </div>
                                <label className="grid gap-1 font-semibold">
                                  {copy.notes}
                                  <textarea
                                    value={achievement.notes}
                                    onChange={(event) =>
                                      updateRegistryAchievementRow(index, "notes", event.target.value)
                                    }
                                    rows={2}
                                    className="border border-[var(--line)] px-3 py-2 font-normal"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeRegistryAchievementRow(index)}
                                  className="inline-flex w-fit items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                                >
                                  <Trash2 size={16} />
                                  {copy.deleteAchievement}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveRegistryCourse(course.key, course.courseIds)}
                        disabled={savingRegistryKey === course.key}
                        className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
                      >
                        {savingRegistryKey === course.key ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {copy.saveCourse}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRegistryKey("");
                          setRegistryForm(null);
                        }}
                        className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
                      >
                        <X size={16} />
                        {copy.cancel}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{course.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {[
                          course.type.toUpperCase(),
                          course.date,
                          course.place,
                          course.instructor,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {copy.bulkMembersSelected(course.memberIds.length)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditingRegistryCourse(course)}
                      className="inline-flex items-center justify-center gap-2 bg-[var(--ink-blue)] px-4 py-2 font-semibold text-white"
                    >
                      <Pencil size={16} />
                      {copy.edit}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      </details>
      ) : null}

      {mode === "full" ? (
      <details className="border border-[var(--line)] bg-white p-5">
        <summary className="cursor-pointer text-xl font-semibold">
          {copy.previewTitle}
        </summary>
        <section className="mt-4 grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
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
                <th className="py-2 pr-4">{copy.email}</th>
                {!isLockedToSingleDojo ? (
                  <th className="py-2 pr-4">{copy.country}</th>
                ) : null}
                <th className="py-2 pr-4">{copy.dojo}</th>
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
      </details>
      ) : null}

      {mode === "full" ? (
      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_minmax(220px,360px)] md:items-end">
          <div>
            <h3 className="text-xl font-semibold">{copy.kenshiTitle}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {copy.visibleMembers(filteredMembers.length, payload.members.length)}
            </p>
          </div>
        </div>
        <div className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_minmax(260px,360px)] lg:items-end">
            <div>
              <p className="text-sm font-semibold">{copy.kenshiControlTitle}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {copy.kenshiControlHelp}
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMemberStatusView("active")}
              className={`inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition ${
                memberStatusView === "active"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink)]"
              }`}
            >
              {copy.activeMembersView(activeMembersCount)}
            </button>
            <button
              type="button"
              onClick={() => setMemberStatusView("inactive")}
              className={`inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition ${
                memberStatusView === "inactive"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink)]"
              }`}
            >
              {copy.inactiveMembersView(inactiveMembersCount)}
            </button>
            <button
              type="button"
              onClick={() => setMemberStatusView("all")}
              className={`inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition ${
                memberStatusView === "all"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink)]"
              }`}
            >
              {copy.allMembersView(payload.members.length)}
            </button>
          </div>
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
                    {member.ika_number} | {member.email ?? copy.noEmail}
                  </span>
                </span>
                <span className="text-[var(--muted)]">
                  {member.current_grade ?? copy.noGrade} | {member.countries ? countryLabel(member.countries, initialLocale) : "-"} | {member.status === "active" ? copy.active : copy.inactiveLabel(member.status)}
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
                        label={copy.email}
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
                    {canManageCourses ? (
                      <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={18} className="text-[var(--accent)]" />
                          <span>{copy.memberCourses}</span>
                        </div>

                        <div className="grid gap-3">
                          {memberCourses.length === 0 ? (
                            <p className="text-sm font-normal text-[var(--muted)]">
                              {copy.noCourses}
                            </p>
                          ) : (
                            memberCourses.map((course) => (
                              <div
                                key={course.id}
                                className="grid gap-3 border border-[var(--line)] bg-white p-3"
                              >
                                <div className="grid gap-3 md:grid-cols-2">
                                  <EditField
                                    label={copy.courseName}
                                    value={course.grade}
                                    onChange={(value) =>
                                      updateCourseForm(course.id, "title", value)
                                    }
                                  />
                                  <SelectField
                                    label={copy.courseType}
                                    value={course.course_type ?? "course"}
                                    onChange={(value) =>
                                      updateCourseForm(course.id, "type", value)
                                    }
                                    options={courseTypeOptions(copy)}
                                  />
                                  <EditField
                                    label={copy.courseDate}
                                    type="date"
                                    value={course.exam_date}
                                    onChange={(value) =>
                                      updateCourseForm(course.id, "date", value)
                                    }
                                  />
                                  <EditField
                                    label={copy.coursePlace}
                                    value={course.exam_place ?? ""}
                                    onChange={(value) =>
                                      updateCourseForm(course.id, "place", value)
                                    }
                                  />
                                  <EditField
                                    label={copy.courseInstructor}
                                    value={course.examiner ?? ""}
                                    onChange={(value) =>
                                      updateCourseForm(course.id, "instructor", value)
                                    }
                                  />
                                </div>
                                <label className="grid gap-1 font-semibold">
                                  {copy.notes}
                                  <textarea
                                    value={course.notes ?? ""}
                                    onChange={(event) =>
                                      updateCourseForm(course.id, "notes", event.target.value)
                                    }
                                    rows={2}
                                    className="border border-[var(--line)] px-3 py-2 font-normal"
                                  />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void saveCourse(member, course)}
                                    disabled={savingCourseId === course.id}
                                    className="inline-flex items-center justify-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                  >
                                    {savingCourseId === course.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Save size={16} />
                                    )}
                                    {copy.saveCourse}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteCourse(member, course.id)}
                                    disabled={deletingCourseId === course.id}
                                    className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)] disabled:opacity-50"
                                  >
                                    {deletingCourseId === course.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                    {copy.deleteCourse}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="grid gap-3 border border-dashed border-[var(--line)] bg-white p-3">
                          <span className="font-semibold">{copy.addCourse}</span>
                          <div className="grid gap-3 md:grid-cols-2">
                            <EditField
                              label={copy.courseName}
                              value={newCourseForm.title}
                              onChange={(value) => updateNewCourseForm("title", value)}
                            />
                            <SelectField
                              label={copy.courseType}
                              value={newCourseForm.type}
                              onChange={(value) => updateNewCourseForm("type", value)}
                              options={courseTypeOptions(copy)}
                            />
                            <EditField
                              label={copy.courseDate}
                              type="date"
                              value={newCourseForm.date}
                              onChange={(value) => updateNewCourseForm("date", value)}
                            />
                            <EditField
                              label={copy.coursePlace}
                              value={newCourseForm.place}
                              onChange={(value) => updateNewCourseForm("place", value)}
                            />
                            <EditField
                              label={copy.courseInstructor}
                              value={newCourseForm.instructor}
                              onChange={(value) =>
                                updateNewCourseForm("instructor", value)
                              }
                            />
                          </div>
                          <label className="grid gap-1 font-semibold">
                            {copy.notes}
                            <textarea
                              value={newCourseForm.notes}
                              onChange={(event) =>
                                updateNewCourseForm("notes", event.target.value)
                              }
                              rows={2}
                              className="border border-[var(--line)] px-3 py-2 font-normal"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void addCourse(member)}
                            disabled={savingCourseId === "new"}
                            className="inline-flex w-fit items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
                          >
                            {savingCourseId === "new" ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            {copy.addCourse}
                          </button>
                        </div>
                        <div className="grid gap-3 border border-[var(--line)] bg-white p-4">
                          <div className="flex items-center gap-2">
                            <CalendarRange size={18} className="text-[var(--accent)]" />
                            <span>{copy.memberAchievements}</span>
                          </div>
                          <p className="text-sm font-normal text-[var(--muted)]">
                            {copy.achievementHelp}
                          </p>
                          <div className="grid gap-3">
                            {memberAchievements.length === 0 ? (
                              <p className="text-sm font-normal text-[var(--muted)]">
                                {copy.noAchievements}
                              </p>
                            ) : (
                              memberAchievements.map((achievement) => (
                                <div
                                  key={achievement.id}
                                  className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-3"
                                >
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <EditField
                                      label={copy.achievementTitle}
                                      value={achievement.title}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "title", value)
                                      }
                                    />
                                    <EditField
                                      label={copy.achievementCategory}
                                      value={achievement.category ?? ""}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "category", value)
                                      }
                                    />
                                    <EditField
                                      label={copy.achievementResult}
                                      value={achievement.result ?? ""}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "result", value)
                                      }
                                    />
                                    <SelectField
                                      label={copy.medalType}
                                      value={achievement.medal_type ?? ""}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "medalType", value)
                                      }
                                      options={achievementMedalOptions(copy)}
                                    />
                                    <EditField
                                      label={copy.podiumPosition}
                                      value={achievement.podium_position ? String(achievement.podium_position) : ""}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "podiumPosition", value)
                                      }
                                    />
                                    <EditField
                                      label={copy.achievementDate}
                                      type="date"
                                      value={achievement.achieved_on}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "achievedOn", value)
                                      }
                                    />
                                    <EditField
                                      label={copy.achievementPlace}
                                      value={achievement.achieved_place ?? ""}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "achievedPlace", value)
                                      }
                                    />
                                    <SelectField
                                      label={copy.relatedCourse}
                                      value={achievement.course_id ?? ""}
                                      onChange={(value) =>
                                        updateAchievementForm(achievement.id, "courseId", value)
                                      }
                                      options={[
                                        { value: "", label: copy.noRelatedCourse },
                                        ...taikaiCourseOptions,
                                      ]}
                                    />
                                  </div>
                                  <label className="grid gap-1 font-semibold">
                                    {copy.notes}
                                    <textarea
                                      value={achievement.notes ?? ""}
                                      onChange={(event) =>
                                        updateAchievementForm(achievement.id, "notes", event.target.value)
                                      }
                                      rows={2}
                                      className="border border-[var(--line)] px-3 py-2 font-normal"
                                    />
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void saveAchievement(member, achievement)}
                                      disabled={savingCourseId === `achievement-${achievement.id}`}
                                      className="inline-flex items-center justify-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                      {savingCourseId === `achievement-${achievement.id}` ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Save size={16} />
                                      )}
                                      {copy.saveAchievement}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void deleteAchievement(member, achievement.id)}
                                      disabled={deletingCourseId === `achievement-${achievement.id}`}
                                      className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)] disabled:opacity-50"
                                    >
                                      {deletingCourseId === `achievement-${achievement.id}` ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                      {copy.deleteAchievement}
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="grid gap-3 border border-dashed border-[var(--line)] bg-[var(--paper)] p-3">
                            <span className="font-semibold">{copy.addAchievement}</span>
                            <div className="grid gap-3 md:grid-cols-2">
                              <EditField
                                label={copy.achievementTitle}
                                value={newAchievementForm.title}
                                onChange={(value) => updateNewAchievementForm("title", value)}
                              />
                              <EditField
                                label={copy.achievementCategory}
                                value={newAchievementForm.category}
                                onChange={(value) => updateNewAchievementForm("category", value)}
                              />
                              <EditField
                                label={copy.achievementResult}
                                value={newAchievementForm.result}
                                onChange={(value) => updateNewAchievementForm("result", value)}
                              />
                              <SelectField
                                label={copy.medalType}
                                value={newAchievementForm.medalType}
                                onChange={(value) => updateNewAchievementForm("medalType", value)}
                                options={achievementMedalOptions(copy)}
                              />
                              <EditField
                                label={copy.podiumPosition}
                                value={newAchievementForm.podiumPosition}
                                onChange={(value) =>
                                  updateNewAchievementForm("podiumPosition", value)
                                }
                              />
                              <EditField
                                label={copy.achievementDate}
                                type="date"
                                value={newAchievementForm.achievedOn}
                                onChange={(value) => updateNewAchievementForm("achievedOn", value)}
                              />
                              <EditField
                                label={copy.achievementPlace}
                                value={newAchievementForm.achievedPlace}
                                onChange={(value) => updateNewAchievementForm("achievedPlace", value)}
                              />
                              <SelectField
                                label={copy.relatedCourse}
                                value={newAchievementForm.courseId}
                                onChange={(value) => updateNewAchievementForm("courseId", value)}
                                options={[
                                  { value: "", label: copy.noRelatedCourse },
                                  ...taikaiCourseOptions,
                                ]}
                              />
                            </div>
                            {taikaiCourseOptions.length === 0 ? (
                              <p className="text-sm font-normal text-[var(--muted)]">
                                {copy.noTaikaiCourses}
                              </p>
                            ) : null}
                            <label className="grid gap-1 font-semibold">
                              {copy.notes}
                              <textarea
                                value={newAchievementForm.notes}
                                onChange={(event) =>
                                  updateNewAchievementForm("notes", event.target.value)
                                }
                                rows={2}
                                className="border border-[var(--line)] px-3 py-2 font-normal"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => void addAchievement(member)}
                              disabled={savingCourseId === "new-achievement"}
                              className="inline-flex w-fit items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
                            >
                              {savingCourseId === "new-achievement" ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Save size={16} />
                              )}
                              {copy.addAchievement}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
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
                          setMemberCourses([]);
                          setNewCourseForm(emptyCourseForm);
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
      ) : null}
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
      getValue(record, "country") || getValue(record, "pais") || getValue(record, "paÃ­s");
    const dojoInput = getValue(record, "dojo") || getValue(record, "club");
    const country = resolveCountryInput(payload, countryInput);
    const dojo = resolveDojoInput(payload, dojoInput, country?.id ?? "");
    const classInput =
      getValue(record, "clase") ||
      getValue(record, "member_group") ||
      getValue(record, "grupo") ||
      getValue(record, "group");
    const memberGroup = normalizeMemberGroup(classInput);
    const familyEmail =
      getValue(record, "email_familia") || getValue(record, "emailfamilia");
    const directEmail = getValue(record, "email") || getValue(record, "correo");

    return {
      externalMemberId:
        getValue(record, "external_member_id") ||
        getValue(record, "club_member_id") ||
        getValue(record, "member_code") ||
        getValue(record, "alumnoref") ||
        getValue(record, "id"),
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
        getValue(record, "telÃ©fono alumno"),
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
        getValue(record, "join_date") ||
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

function parseCourseCsvRows(csv: string, payload: MembersPayload): CourseImportRow[] {
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
      getValue(record, "country") || getValue(record, "pais") || getValue(record, "paÃÂ­s");
    const dojoInput = getValue(record, "dojo") || getValue(record, "club");
    const country = resolveCountryInput(payload, countryInput);
    const dojo = resolveDojoInput(payload, dojoInput, country?.id ?? "");

    return {
      externalMemberId: getAnyValue(record, [
        "external_member_id",
        "club_member_id",
        "member_code",
        "alumnoref",
        "id",
      ]),
      ikaNumber:
        getValue(record, "ika_number") ||
        getValue(record, "ika_id") ||
        getValue(record, "kenshi_id"),
      email: getValue(record, "email") || getValue(record, "correo"),
      firstName:
        getValue(record, "first_name") ||
        getValue(record, "firstname") ||
        getValue(record, "nombre"),
      lastName:
        getValue(record, "last_name") ||
        getValue(record, "lastname") ||
        getValue(record, "apellido") ||
        getValue(record, "apellidos"),
      countryId: getValue(record, "country_id") || country?.id || "",
      countryCode:
        getValue(record, "country_code") ||
        getValue(record, "codigo_pais") ||
        (!country ? countryInput.toUpperCase() : ""),
      countryName: country ? "" : countryInput,
      dojoId: getValue(record, "dojo_id") || dojo?.id || "",
      dojoName: dojo ? "" : dojoInput,
      courseTitle:
        getValue(record, "course_title") ||
        getValue(record, "course") ||
        getValue(record, "curso"),
      courseDate:
        getValue(record, "course_date") ||
        getValue(record, "date") ||
        getValue(record, "fecha"),
      coursePlace:
        getValue(record, "course_place") ||
        getValue(record, "place") ||
        getValue(record, "lugar"),
      courseType:
        getValue(record, "course_type") ||
        getValue(record, "type") ||
        getValue(record, "format") ||
        getValue(record, "tipo") ||
        getValue(record, "formato") ||
        getValue(record, "modalidad"),
      instructor:
        getValue(record, "instructor") ||
        getValue(record, "teacher") ||
        getValue(record, "sensei"),
      notes: getValue(record, "notes") || getValue(record, "notas"),
    };
  });
}

function parseFlexibleCourseCsvRows(
  csv: string,
  payload: MembersPayload,
): CourseImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const firstRow = splitCsvLine(lines[0], delimiter);
  const headers = firstRow.map((header) =>
    normalizeHeader(header),
  );
  const knownHeaders = new Set([
    "external_member_id",
    "club_member_id",
    "member_code",
    "alumnoref",
    "ika_number",
    "ika_id",
    "kenshi_id",
    "email",
    "correo",
    "mail",
    "first_name",
    "firstname",
    "nombre",
    "last_name",
    "lastname",
    "apellido",
    "apellidos",
    "country",
    "pais",
    "country_name",
    "country_id",
    "country_code",
    "codigo_pais",
    "dojo",
    "club",
    "dojo_name",
    "dojo_id",
    "course_title",
    "course",
    "curso",
    "activity",
    "course_type",
    "type",
    "format",
    "tipo",
    "formato",
    "modalidad",
    "course_date",
    "date",
    "fecha",
    "course_place",
    "place",
    "lugar",
    "donde",
    "where",
    "instructor",
    "teacher",
    "sensei",
    "coach",
    "notes",
    "notas",
    "comments",
    "observaciones",
    "id",
  ]);
  const hasRecognizedHeader = headers.some((header) => knownHeaders.has(header));
  const dataLines = hasRecognizedHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return [];
  }

  return dataLines.map((line) => {
    const values = splitCsvLine(line, delimiter);

    if (!hasRecognizedHeader) {
      return {
        externalMemberId: values[1]?.trim() ?? "",
        ikaNumber: values[6]?.trim()?.startsWith("IKA-") ? values[6].trim() : "",
        email: "",
        firstName: "",
        lastName: "",
        countryId: "",
        countryCode: "",
        countryName: "",
        dojoId: "",
        dojoName: "",
        courseTitle: values[3]?.trim() ?? "",
        courseDate: values[0]?.trim() ?? "",
        coursePlace: values[2]?.trim() ?? "",
        courseType: values[8]?.trim() ?? "",
        instructor: values[4]?.trim() ?? "",
        notes: [values[5], values[6], values[7]].filter(Boolean).join(" | "),
      };
    }

    const record = new Map(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
    const countryInput = getAnyValue(record, [
      "country",
      "pais",
      "country_name",
    ]);
    const dojoInput = getAnyValue(record, ["dojo", "club", "dojo_name"]);
    const country = resolveCountryInput(payload, countryInput);
    const dojo = resolveDojoInput(payload, dojoInput, country?.id ?? "");

    return {
      externalMemberId: getAnyValue(record, [
        "external_member_id",
        "club_member_id",
        "member_code",
        "alumnoref",
        "id",
      ]),
      ikaNumber: getAnyValue(record, [
        "ika_number",
        "ika_id",
        "kenshi_id",
      ]),
      email: getAnyValue(record, ["email", "correo", "mail"]),
      firstName: getAnyValue(record, ["first_name", "firstname", "nombre", "name"]),
      lastName: getAnyValue(record, [
        "last_name",
        "lastname",
        "apellido",
        "apellidos",
        "surname",
      ]),
      countryId: getAnyValue(record, ["country_id"]) || country?.id || "",
      countryCode:
        getAnyValue(record, ["country_code", "codigo_pais"]) ||
        (!country ? countryInput.toUpperCase() : ""),
      countryName: country ? "" : countryInput,
      dojoId: getAnyValue(record, ["dojo_id"]) || dojo?.id || "",
      dojoName: dojo ? "" : dojoInput,
      courseTitle: getAnyValue(record, [
        "course_title",
        "course",
        "curso",
        "activity",
      ]),
      courseDate: getAnyValue(record, ["course_date", "date", "fecha"]),
      coursePlace: getAnyValue(record, [
        "course_place",
        "place",
        "lugar",
        "donde",
        "where",
      ]),
      courseType: getAnyValue(record, [
        "course_type",
        "type",
        "format",
        "tipo",
        "formato",
        "modalidad",
      ]),
      instructor: getAnyValue(record, [
        "instructor",
        "teacher",
        "sensei",
        "coach",
      ]),
      notes: getAnyValue(record, [
        "notes",
        "notas",
        "comments",
        "observaciones",
      ]),
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

function getAnyValue(record: Map<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = getValue(record, key);

    if (value) {
      return value;
    }
  }

  return "";
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

  if (["child", "children", "nino", "ninos", "niÃ±o", "niÃ±os", "infantil"].includes(comparable)) {
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1 font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function courseTypeOptions(copy: ReturnType<typeof membersAdminCopy>) {
  const es = copy.courseType === "Formato del curso";

  return [
    { value: "course", label: es ? "Curso" : "Course" },
    { value: "seminar", label: es ? "Seminario" : "Seminar" },
    { value: "taikai", label: "Taikai" },
    { value: "encounter", label: es ? "Encuentro" : "Encounter" },
    { value: "busen", label: "Busen" },
  ];
}

function achievementMedalOptions(copy: ReturnType<typeof membersAdminCopy>) {
  const es = copy.medalType === "Medalla";

  return [
    { value: "", label: es ? "Sin medalla" : "No medal" },
    { value: "gold", label: es ? "Oro" : "Gold" },
    { value: "silver", label: es ? "Plata" : "Silver" },
    { value: "bronze", label: es ? "Bronce" : "Bronze" },
    { value: "finalist", label: es ? "Finalista" : "Finalist" },
    { value: "participant", label: es ? "Participante" : "Participant" },
  ];
}

function normalizeTextareaList(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) {
        return false;
      }
      const comparable = normalizeComparable(entry);
      if (seen.has(comparable)) {
        return false;
      }
      seen.add(comparable);
      return true;
    });
}

function normalizeTaikaiConfig(
  config:
    | {
        categories?: string[];
        results?: string[];
        medals?: string[];
        awards?: string[];
      }
    | null
    | undefined,
) {
  return {
    categories: config?.categories ?? [],
    results: config?.results ?? [],
    medals: config?.medals ?? [],
    awards: config?.awards ?? [],
  };
}

function buildTaikaiConfigFromForm(form: {
  type: string;
  taikaiCategories: string;
  taikaiResults: string;
  taikaiMedals: string;
  taikaiAwards: string;
}) {
  if (form.type !== "taikai") {
    return {
      categories: [],
      results: [],
      medals: [],
      awards: [],
    };
  }

  return {
    categories: normalizeTextareaList(form.taikaiCategories),
    results: normalizeTextareaList(form.taikaiResults),
    medals: normalizeTextareaList(form.taikaiMedals),
    awards: normalizeTextareaList(form.taikaiAwards),
  };
}

function taikaiListOptions(
  copy: ReturnType<typeof membersAdminCopy>,
  rawValue: string,
  emptyLabel: string,
) {
  return [
    { value: "", label: emptyLabel },
    ...normalizeTextareaList(rawValue).map((value) => ({
      value,
      label: value,
    })),
  ];
}

function taikaiAwardOptions(copy: ReturnType<typeof membersAdminCopy>, rawValue: string) {
  return taikaiListOptions(copy, rawValue, copy.noAward);
}

function taikaiMedalOptions(copy: ReturnType<typeof membersAdminCopy>, rawValue: string) {
  const values = normalizeTextareaList(rawValue);

  if (values.length === 0) {
    return achievementMedalOptions(copy);
  }

  return [
    { value: "", label: copy.noMedal },
    ...values.map((value) => ({
      value,
      label: value,
    })),
  ];
}

function formatAchievementCourseOption(course: CourseHistory) {
  const typeLabel = (course.course_type ?? "course").toUpperCase();
  const parts = [typeLabel, course.grade, course.exam_date, course.exam_place ?? ""].filter(Boolean);
  return parts.join(" | ");
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
    coursesTitle: es ? "Importacion de cursos IKA" : "IKA course import",
    bulkCourseTitle: es ? "Crear curso historico IKA" : "Create historical IKA course",
    lockedDojoHelp: es
      ? "Tu usuario esta limitado a este dojo. Sube el CSV y se importara solo aqui."
      : "Your user is limited to this dojo. Upload the CSV and it will be imported only here.",
    importHelp: es
      ? "Selecciona primero el dojo y despues importa muchos practicantes a la vez desde Excel exportado como CSV."
      : "Select the dojo first, then import many practitioners at once from an Excel CSV export.",
    coursesHelp: es
      ? "Importa cursos masivamente usando IKA ID, email o nombre+dojo. El sistema colocara cada curso en el Kenshi correspondiente dentro de tu ambito."
      : "Import courses in bulk using IKA ID, email, or name plus dojo. The system will place each course on the matching Kenshi within your scope.",
    bulkCourseHelp: es
      ? "Crea aqui cursos y registros historicos de IKA. Para taikai con inscripciones, check-in y adjudicacion de premios usa siempre el modulo de Eventos y calendario."
      : "Create historical IKA courses and manual records here. For taikai with registrations, check-in, and award assignment, always use the Events and calendar module.",
    taikaiResultsUnifiedTitle: es
      ? "Resultados de taikai unificados en Eventos"
      : "Taikai results unified in Events",
    taikaiResultsUnifiedHelp: es
      ? "Super admin y admin de pais usan ahora la misma logica para resultados de taikai: Eventos y calendario > Ver inscritos. Este modulo queda solo para cursos historicos o cargas manuales."
      : "Super admin and country admin now use the same taikai results workflow: Events and calendar > View registrations. This module remains only for historical courses or manual loads.",
    uploadCsv: es ? "Subir CSV" : "Upload CSV",
    uploadCoursesCsv: es ? "Subir CSV cursos" : "Upload courses CSV",
    targetDojo: es ? "Dojo destino" : "Target dojo",
    selectDojo: es ? "Selecciona dojo" : "Select dojo",
    loadingDojos: es ? "Cargando dojos..." : "Loading dojos...",
    noDojosForRole: es ? "No hay dojos disponibles para tu rol." : "There are no dojos available for your role.",
    loading: es ? "Cargando..." : "Loading...",
    reloadDojos: es ? "Recargar dojos" : "Reload dojos",
    csvNoEmails: es
      ? "El volcado CSV no envia emails. Las invitaciones se enviaran despues manualmente desde el area del dojo."
      : "CSV import does not send emails. Invitations will be sent manually later from the dojo area.",
    coursesCsvHint: es
      ? "Columnas recomendadas: external_member_id, ika_number, email, first_name, last_name, course_title, course_date, course_place, instructor, notes, dojo, country."
      : "Recommended columns: external_member_id, ika_number, email, first_name, last_name, course_title, course_date, course_place, instructor, notes, dojo, country.",
    importKenshi: (count: number) => (es ? `Importar ${count} Kenshi` : `Import ${count} Kenshi`),
    importCourses: (count: number) =>
      es ? `Importar ${count} cursos` : `Import ${count} courses`,
    importCoursesError: es
      ? "No se pudo importar el lote de cursos."
      : "The course batch could not be imported.",
    bulkCourseError: es
      ? "No se pudo crear el curso historico."
      : "The historical course could not be created.",
    bulkCourseCreated: (courses: number, achievements: number) =>
      es
        ? `Curso historico adjuntado a ${courses} Kenshis. Logros creados o actualizados: ${achievements}.`
        : `Historical course attached to ${courses} Kenshis. Achievements created or updated: ${achievements}.`,
    bulkCreateCourse: es ? "Crear y adjuntar" : "Create and attach",
    bulkMembersTitle: es ? "Kenshis asistentes" : "Attending Kenshis",
    filterCountry: es ? "Filtrar por pais" : "Filter by country",
    filterDojo: es ? "Filtrar por dojo" : "Filter by dojo",
    allCountries: es ? "Todos los paises" : "All countries",
    allDojos: es ? "Todos los dojos" : "All dojos",
    bulkMembersHelp: es
      ? "Selecciona los Kenshis asistentes dentro de tu alcance. El curso se guardara en todos ellos."
      : "Select the attending Kenshis within your scope. The course will be saved for all of them.",
    bulkMembersSelected: (count: number) =>
      es ? `${count} Kenshis seleccionados.` : `${count} Kenshis selected.`,
    noBulkMembersForFilters: es
      ? "No hay Kenshis que coincidan con los filtros actuales."
      : "No Kenshis match the current filters.",
    bulkSelectMembersRequired: es
      ? "Selecciona al menos un Kenshi para adjuntar el curso."
      : "Select at least one Kenshi to attach the course.",
    taikaiSetupTitle: es ? "Configuracion del Taikai" : "Taikai setup",
    taikaiSetupHelp: es
      ? "Define aqui las modalidades, resultados, medallas y premios que despues apareceran como desplegables en los resultados del Taikai."
      : "Define here the categories, results, medals, and awards that will later appear as dropdowns in Taikai results.",
    taikaiCategories: es ? "Modalidades o categorias" : "Categories or divisions",
    taikaiResults: es ? "Resultados posibles" : "Available results",
    taikaiMedals: es ? "Medallas o distintivos" : "Medals or distinctions",
    taikaiAwards: es ? "Premios o logros" : "Awards or achievements",
    bulkTaikaiAchievementsTitle: es ? "Resultados del Taikai" : "Taikai results",
    bulkTaikaiAchievementsHelp: es
      ? "AÃ±ade aqui podios, medallas y logros de competicion. La asistencia se guardara para todos los Kenshis seleccionados aunque solo algunos tengan resultado."
      : "Add podiums, medals, and competition achievements here. Attendance will be saved for all selected Kenshis even if only some receive a result.",
    courseRegistryTitle: es ? "Cursos ya creados" : "Created courses",
    courseRegistryHelp: es
      ? "Selecciona cualquier curso historico ya creado para revisar y editar sus datos globales. Los taikai operativos se gestionan desde Eventos."
      : "Select any previously created historical course to review and edit its global data. Operational taikai are managed from Events.",
    registryMembersHelp: es
      ? "Aqui puedes anadir o quitar Kenshis asistentes despues de crear el curso o Taikai."
      : "Here you can add or remove Kenshi attendees after creating the course or Taikai.",
    registryTaikaiHelp: es
      ? "Si el formato es Taikai, completa aqui categorias, resultados, medallas y posiciones para los Kenshis seleccionados."
      : "If the format is Taikai, complete categories, results, medals, and positions here for the selected Kenshi.",
    bulkCourseUpdated: () =>
      es
        ? "Curso o Taikai actualizado correctamente."
        : "Course or Taikai updated successfully.",
    coursesImported: (imported: number, updated: number, skipped: number, errors: number) =>
      es
        ? `Cursos nuevos: ${imported}. Actualizados: ${updated}. Omitidos: ${skipped}. Errores: ${errors}.`
        : `New courses: ${imported}. Updated: ${updated}. Skipped: ${skipped}. Errors: ${errors}.`,
    previewTitle: es ? "Previsualizacion" : "Preview",
    previewHelp: es ? "Solo se muestran las filas activas que se van a importar." : "Only active rows that will be imported are shown.",
    manualMemberTitle: es ? "Alta manual de Kenshi" : "Manual Kenshi registration",
    manualMemberHelp: es
      ? "Crea un Kenshi nuevo rapidamente rellenando la ficha y asignandolo a un dojo existente."
      : "Create a new Kenshi quickly by filling out the form and assigning them to an existing dojo.",
    manualMemberRequired: es
      ? "Nombre y apellido son obligatorios para crear el Kenshi."
      : "First name and surname are required to create the Kenshi.",
    manualMemberCreated: es ? "Kenshi creado correctamente." : "Kenshi created successfully.",
    manualMemberError: es ? "No se pudo crear el Kenshi." : "The Kenshi could not be created.",
    createMember: es ? "Crear Kenshi" : "Create Kenshi",
    clearForm: es ? "Limpiar formulario" : "Clear form",
    selectDojoFirst: es ? "Selecciona primero un dojo." : "Select a dojo first.",
    dojoDestination: es ? "Dojo destino" : "Target dojo",
    externalMemberId: es ? "ID externo del club" : "Club external ID",
    activeSkipped: (active: number, skipped: number) =>
      es ? `Activos: ${active} / Omitidos: ${skipped}` : `Active: ${active} / Skipped: ${skipped}`,
    courseRowsSummary: (valid: number, skipped: number) =>
      es ? `Cursos validos: ${valid} / Omitidos: ${skipped}` : `Valid courses: ${valid} / Skipped: ${skipped}`,
    name: es ? "Nombre" : "Name",
    kenshiTitle: es ? "Kenshi" : "Kenshi",
    ikaId: es ? "IKA ID" : "IKA ID",
    email: es ? "Email" : "Email",
    country: es ? "Pais" : "Country",
    dojo: es ? "Dojo" : "Dojo",
    grade: es ? "Grado" : "Grade",
    showingRows: (count: number) =>
      es ? `Mostrando 20 de ${count} filas activas.` : `Showing 20 of ${count} active rows.`,
    visibleMembers: (visible: number, total: number) =>
      es ? `${visible} visibles de ${total}.` : `${visible} visible of ${total}.`,
    kenshiControlTitle: es ? "Control de listado" : "List controls",
    kenshiControlHelp: es
      ? "Filtra por estado y busca rapidamente por numero, nombre o apellidos antes de editar."
      : "Filter by status and search quickly by number, first name, or surname before editing.",
    activeMembersView: (count: number) =>
      es ? `Activos (${count})` : `Active (${count})`,
    inactiveMembersView: (count: number) =>
      es ? `Inactivos y bajas (${count})` : `Inactive and archived (${count})`,
    allMembersView: (count: number) =>
      es ? `Todos (${count})` : `All (${count})`,
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
    inactiveLabel: (status: string) =>
      es
        ? status === "temporary_leave"
          ? "Baja temporal"
          : "Inactivo"
        : status === "temporary_leave"
          ? "Temporary leave"
          : "Inactive",
    temporaryLeave: es ? "Baja temporal" : "Temporary leave",
    instructor: es ? "Instructor" : "Instructor",
    courseName: es ? "Curso" : "Course",
    courseDate: es ? "Fecha del curso" : "Course date",
    coursePlace: es ? "Lugar" : "Place",
    courseType: es ? "Formato del curso" : "Course format",
    courseInstructor: es ? "Instructor del curso" : "Course instructor",
    memberCourses: es ? "Cursos IKA del Kenshi" : "Kenshi IKA courses",
    noCourses: es ? "Este Kenshi todavia no tiene cursos registrados." : "This Kenshi has no registered courses yet.",
    memberAchievements: es ? "Logros y medallero" : "Achievements and medals",
    achievementHelp: es
      ? "Usa este bloque para registrar podios, medallas y resultados de competicion. Lo ideal es vincular cada logro a un Taikai ya creado."
      : "Use this area to register podiums, medals, and competition results. Ideally, link each achievement to an existing Taikai.",
    noAchievements: es ? "Este Kenshi todavia no tiene logros registrados." : "This Kenshi has no registered achievements yet.",
    noTaikaiCourses: es
      ? "Todavia no hay Taikais creados para vincular logros. Crea primero el Taikai como curso IKA con formato Taikai."
      : "There are no Taikai records yet to link achievements. Create the Taikai first as an IKA course with Taikai format.",
    achievementTitle: es ? "Logro" : "Achievement",
    achievementCategory: es ? "Categoria" : "Category",
    achievementResult: es ? "Resultado" : "Result",
    medalType: es ? "Medalla" : "Medal",
    podiumPosition: es ? "Posicion" : "Position",
    noCategory: es ? "Sin categoria" : "No category",
    noResult: es ? "Sin resultado" : "No result",
    noAward: es ? "Sin premio" : "No award",
    noMedal: es ? "Sin medalla" : "No medal",
    achievementDate: es ? "Fecha del logro" : "Achievement date",
    achievementPlace: es ? "Lugar" : "Place",
    relatedCourse: es ? "Curso relacionado" : "Related course",
    noRelatedCourse: es ? "Sin curso relacionado" : "No related course",
    addCourse: es ? "Anadir curso" : "Add course",
    saveCourse: es ? "Guardar curso" : "Save course",
    deleteCourse: es ? "Quitar curso" : "Remove course",
    courseAdded: es ? "Curso anadido." : "Course added.",
    courseUpdated: es ? "Curso actualizado." : "Course updated.",
    courseDeleted: es ? "Curso eliminado." : "Course deleted.",
    courseSaveError: es ? "No se pudo guardar el curso." : "The course could not be saved.",
    courseDeleteError: es ? "No se pudo eliminar el curso." : "The course could not be deleted.",
    courseTitleDateRequired: es
      ? "El curso necesita titulo y fecha."
      : "The course needs a title and date.",
    addAchievement: es ? "Anadir logro" : "Add achievement",
    saveAchievement: es ? "Guardar logro" : "Save achievement",
    deleteAchievement: es ? "Quitar logro" : "Remove achievement",
    achievementAdded: es ? "Logro anadido." : "Achievement added.",
    achievementUpdated: es ? "Logro actualizado." : "Achievement updated.",
    achievementDeleted: es ? "Logro eliminado." : "Achievement deleted.",
    achievementSaveError: es ? "No se pudo guardar el logro." : "The achievement could not be saved.",
    achievementDeleteError: es ? "No se pudo eliminar el logro." : "The achievement could not be deleted.",
    achievementTitleDateRequired: es
      ? "El logro necesita titulo y fecha."
      : "The achievement needs a title and date.",
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



