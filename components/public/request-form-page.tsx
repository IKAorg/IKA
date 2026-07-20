"use client";

import { useMemo, useState } from "react";
import {
  BookUser,
  Eye,
  EyeOff,
  FileBadge,
  Globe2,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

type FormPayload = {
  id: string;
  form_type: "country" | "dojo" | "kenshi";
  title: string;
  status: string;
  locale: string;
  country_id?: string | null;
  dojo_id?: string | null;
  legal_text?: string | null;
  countries?: {
    code?: string;
    country_translations?: Array<{ language_code: string; name: string }>;
  } | null;
  dojos?: {
    city?: string;
    dojo_translations?: Array<{ language_code: string; name: string }>;
  } | null;
};

export function RequestFormPage({
  locale,
  token,
  form,
}: {
  locale: Locale;
  token: string;
  form: FormPayload;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const isCountry = form.form_type === "country";
  const isDojo = form.form_type === "dojo";
  const isKenshi = form.form_type === "kenshi";
  const formIntro = useMemo(() => getFormIntro(form, locale), [form, locale]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    displayName: "",
    email: "",
    password: "",
    countryCode: "",
    countryName: "",
    responsiblePerson: "",
    representativeEntity: "",
    responsibleEmail: "",
    description: "",
    dojoName: "",
    city: "",
    address: "",
    responsibleInstructor: "",
    contactEmail: "",
    phone: "",
    website: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    joinedDate: "",
    currentGrade: "",
    mainInstructor: "",
    memberGroup: "",
    externalMemberId: "",
    notes: "",
  });
  const [consent, setConsent] = useState(false);

  const missingFields = useMemo(() => {
    const required = new Set<string>(["email", "password", "description"]);

    if (!isKenshi) {
      required.add("displayName");
    }

    if (isCountry) {
      [
        "countryCode",
        "countryName",
        "responsiblePerson",
        "responsibleEmail",
      ].forEach((key) => required.add(key));
    }

    if (isDojo) {
      [
        "dojoName",
        "city",
        "address",
        "responsibleInstructor",
        "contactEmail",
        "phone",
      ].forEach((key) => required.add(key));
    }

    if (isKenshi) {
      [
        "firstName",
        "lastName",
        "birthDate",
        "joinedDate",
        "currentGrade",
        "mainInstructor",
        "memberGroup",
        "phone",
      ].forEach((key) => required.add(key));
    }

    return Array.from(required).filter(
      (key) => !String(values[key] ?? "").trim(),
    );
  }, [isCountry, isDojo, isKenshi, values]);

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    const today = new Date().toISOString().slice(0, 10);

    const email = String(values.email ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      issues.push(copy.invalidEmail);
    }

    const password = String(values.password ?? "").trim();
    if (password && password.length < 8) {
      issues.push(copy.invalidPassword);
    }

    const phone = String(values.phone ?? "").trim();
    if (phone && phone.length < 6) {
      issues.push(copy.invalidPhone);
    }

    const website = String(values.website ?? "").trim();
    if (
      website &&
      !/^https?:\/\//i.test(website) &&
      !/^[\w.-]+\.[a-z]{2,}/i.test(website)
    ) {
      issues.push(copy.invalidWebsite);
    }

    const countryCode = String(values.countryCode ?? "").trim();
    if (isCountry && countryCode && !/^[A-Z]{2,3}$/.test(countryCode)) {
      issues.push(copy.invalidCountryCode);
    }

    const birthDate = String(values.birthDate ?? "").trim();
    if (birthDate && birthDate > today) {
      issues.push(copy.invalidBirthDate);
    }

    const joinedDate = String(values.joinedDate ?? "").trim();
    if (joinedDate && joinedDate > today) {
      issues.push(copy.invalidJoinedDate);
    }
    if (birthDate && joinedDate && joinedDate < birthDate) {
      issues.push(copy.invalidJoinedBeforeBirth);
    }

    const memberGroup = String(values.memberGroup ?? "").trim();
    if (isKenshi && birthDate && memberGroup) {
      const age = getAgeFromDate(birthDate);
      if (age !== null) {
        if (memberGroup === "child" && age >= 18) {
          issues.push(copy.invalidChildGroup);
        }
        if (memberGroup === "adult" && age < 18) {
          issues.push(copy.invalidAdultGroup);
        }
      }
    }

    const description = String(values.description ?? "").trim();
    if (description && description.length < 12) {
      issues.push(copy.invalidDescription);
    }

    return issues;
  }, [copy, isCountry, values]);

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    const email = String(values.email ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = copy.invalidEmail;
    }

    const password = String(values.password ?? "").trim();
    if (password && password.length < 8) {
      errors.password = copy.invalidPassword;
    }

    const phone = String(values.phone ?? "").trim();
    if (phone && phone.length < 6) {
      errors.phone = copy.invalidPhone;
    }

    const website = String(values.website ?? "").trim();
    if (
      website &&
      !/^https?:\/\//i.test(website) &&
      !/^[\w.-]+\.[a-z]{2,}/i.test(website)
    ) {
      errors.website = copy.invalidWebsite;
    }

    const countryCode = String(values.countryCode ?? "").trim();
    if (isCountry && countryCode && !/^[A-Z]{2,3}$/.test(countryCode)) {
      errors.countryCode = copy.invalidCountryCode;
    }

    const today = new Date().toISOString().slice(0, 10);
    const birthDate = String(values.birthDate ?? "").trim();
    if (birthDate && birthDate > today) {
      errors.birthDate = copy.invalidBirthDate;
    }

    const joinedDate = String(values.joinedDate ?? "").trim();
    if (joinedDate && joinedDate > today) {
      errors.joinedDate = copy.invalidJoinedDate;
    } else if (birthDate && joinedDate && joinedDate < birthDate) {
      errors.joinedDate = copy.invalidJoinedBeforeBirth;
    }

    const memberGroup = String(values.memberGroup ?? "").trim();
    if (isKenshi && birthDate && memberGroup) {
      const age = getAgeFromDate(birthDate);
      if (age !== null) {
        if (memberGroup === "child" && age >= 18) {
          errors.memberGroup = copy.invalidChildGroup;
        }
        if (memberGroup === "adult" && age < 18) {
          errors.memberGroup = copy.invalidAdultGroup;
        }
      }
    }

    const description = String(values.description ?? "").trim();
    if (description && description.length < 12) {
      errors.description = copy.invalidDescription;
    }

    return errors;
  }, [copy, isCountry, values]);

  const stepItems = useMemo(
    () => getStepItems({ copy, isCountry, isDojo, isKenshi, values, consent }),
    [copy, consent, isCountry, isDojo, isKenshi, values],
  );

  const canSubmit =
    missingFields.length === 0 && validationIssues.length === 0 && consent;

  async function submitForm() {
    setAttemptedSubmit(true);
    if (!canSubmit) {
      setOk(false);
      if (!consent) {
        setMessage(copy.missingConsent);
      } else if (validationIssues.length > 0) {
        setMessage(copy.validationSpecificError);
      } else {
        setMessage(copy.validationError);
      }
      return;
    }

    setSaving(true);
    setMessage("");
    setOk(false);

    const response = await fetch(`/api/request-forms/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        applicantName:
          values.displayName || `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        password: values.password,
        payload: values,
        consentAccepted: consent,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? copy.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOk(true);
    setMessage(copy.ok);
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="border border-[var(--line)] bg-white p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
            {copy.kicker}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--ink)]">
            {form.title}
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--muted)]">
            {copy.description}
          </p>

          <div className="mt-6 border border-[var(--line)] bg-white px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              {copy.formGuideKicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
              {formIntro.title}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[var(--muted)]">
              {formIntro.description}
            </p>
          </div>

          <div className="mt-6 border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {copy.requiredLegendTitle}
            </span>{" "}
            {copy.requiredLegendBody}
          </div>

          <div className="mt-6 border border-[var(--line)] bg-white px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              {copy.progressKicker}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stepItems.map((step, index) => (
                <div
                  key={step.label}
                  className={`border px-4 py-4 ${
                    step.state === "complete"
                      ? "border-green-600 bg-green-50"
                      : step.state === "current"
                        ? "border-[var(--accent)] bg-[var(--paper)]"
                        : "border-[var(--line)] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center text-sm font-semibold ${
                        step.state === "complete"
                          ? "bg-green-600 text-white"
                          : step.state === "current"
                            ? "bg-[var(--accent)] text-white"
                            : "border border-[var(--line)] bg-white text-[var(--muted)]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {step.label}
                      </p>
                      <p className="text-xs leading-6 text-[var(--muted)]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {attemptedSubmit && (!canSubmit || missingFields.length > 0) ? (
            <div className="mt-4 border border-[var(--accent)] bg-[var(--paper)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
              <p className="font-semibold text-[var(--accent)]">
                {copy.reviewBeforeSending}
              </p>
              <p className="mt-1">
                {copy.pendingFieldsLabel}{" "}
                <span className="font-semibold text-[var(--ink)]">
                  {formatMissingFields(missingFields, copy)}
                </span>
              </p>
              {!consent ? (
                <p className="mt-1 text-[var(--accent)]">{copy.missingConsent}</p>
              ) : null}
            </div>
          ) : null}

          {attemptedSubmit && validationIssues.length > 0 ? (
            <div className="mt-4 border border-[var(--accent)] bg-[var(--paper)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
              <p className="font-semibold text-[var(--accent)]">
                {copy.validationSpecificTitle}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 space-y-8">
            <FormSection
              title={copy.accessSection}
              description={copy.accessSectionHelp}
              icon={<LockKeyhole className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {!isKenshi ? (
                  <Field
                    label={copy.displayName}
                    hint={copy.displayNameHint}
                    required
                  >
                    <input
                      className="input-base"
                      placeholder={copy.displayNamePlaceholder}
                      value={values.displayName}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          displayName: e.target.value,
                        }))
                      }
                    />
                  </Field>
                ) : null}

                <Field
                  label={copy.email}
                  hint={copy.emailHint}
                  required
                  error={fieldErrors.email}
                >
                  <input
                    className="input-base"
                    type="email"
                    autoComplete="email"
                    placeholder={copy.emailPlaceholder}
                    value={values.email}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, email: e.target.value }))
                    }
                  />
                </Field>

                <Field
                  label={copy.password}
                  hint={copy.passwordHint}
                  required
                  error={fieldErrors.password}
                >
                  <input
                    className="input-base"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={copy.passwordPlaceholder}
                    value={values.password}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, password: e.target.value }))
                    }
                    style={{ paddingRight: "4rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? copy.hidePassword : copy.showPassword
                    }
                    className="absolute right-3 top-[44px] inline-flex h-10 w-10 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </Field>
              </div>
            </FormSection>

            {isCountry ? (
              <FormSection
                title={copy.countrySection}
                description={copy.countrySectionHelp}
                icon={<Globe2 className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={copy.countryCode}
                    hint={copy.countryCodeHint}
                    required
                    error={fieldErrors.countryCode}
                  >
                    <input
                      className="input-base"
                      placeholder={copy.countryCodePlaceholder}
                      value={values.countryCode}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          countryCode: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label={copy.countryName}
                    hint={copy.countryNameHint}
                    required
                  >
                    <input
                      className="input-base"
                      placeholder={copy.countryNamePlaceholder}
                      value={values.countryName}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          countryName: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label={copy.responsiblePerson} required>
                    <input
                      className="input-base"
                      placeholder={copy.responsiblePersonPlaceholder}
                      value={values.responsiblePerson}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          responsiblePerson: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label={copy.representativeEntity}
                    hint={copy.representativeEntityHint}
                  >
                    <input
                      className="input-base"
                      placeholder={copy.representativeEntityPlaceholder}
                      value={values.representativeEntity}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          representativeEntity: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label={copy.responsibleEmail} required>
                    <input
                      className="input-base"
                      type="email"
                      placeholder={copy.responsibleEmailPlaceholder}
                      value={values.responsibleEmail}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          responsibleEmail: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </FormSection>
            ) : null}

            {isDojo ? (
              <FormSection
                title={copy.dojoSection}
                description={copy.dojoSectionHelp}
                icon={<MapPinned className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={copy.dojoName} required>
                    <input
                      className="input-base"
                      placeholder={copy.dojoNamePlaceholder}
                      value={values.dojoName}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, dojoName: e.target.value }))
                      }
                    />
                  </Field>

                  <Field label={copy.city} required>
                    <input
                      className="input-base"
                      placeholder={copy.cityPlaceholder}
                      value={values.city}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, city: e.target.value }))
                      }
                    />
                  </Field>

                  <Field label={copy.address} hint={copy.addressHint} required>
                    <input
                      className="input-base"
                      placeholder={copy.addressPlaceholder}
                      value={values.address}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, address: e.target.value }))
                      }
                    />
                  </Field>

                  <Field label={copy.responsibleInstructor} required>
                    <input
                      className="input-base"
                      placeholder={copy.responsibleInstructorPlaceholder}
                      value={values.responsibleInstructor}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          responsibleInstructor: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label={copy.contactEmail} required>
                    <input
                      className="input-base"
                      type="email"
                      placeholder={copy.contactEmailPlaceholder}
                      value={values.contactEmail}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          contactEmail: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label={copy.phone}
                    hint={copy.phoneHint}
                    required
                    error={fieldErrors.phone}
                  >
                    <input
                      className="input-base"
                      placeholder={copy.phonePlaceholder}
                      value={values.phone}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, phone: e.target.value }))
                      }
                    />
                  </Field>

                  <Field
                    label={copy.website}
                    hint={copy.websiteHint}
                    error={fieldErrors.website}
                  >
                    <input
                      className="input-base"
                      placeholder={copy.websitePlaceholder}
                      value={values.website}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, website: e.target.value }))
                      }
                    />
                  </Field>
                </div>
              </FormSection>
            ) : null}

            {isKenshi ? (
              <>
                <FormSection
                  title={copy.personalSection}
                  description={copy.personalSectionHelp}
                  icon={<BookUser className="h-5 w-5" />}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={copy.firstName} required>
                      <input
                        className="input-base"
                        placeholder={copy.firstNamePlaceholder}
                        value={values.firstName}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field label={copy.lastName} required>
                      <input
                        className="input-base"
                        placeholder={copy.lastNamePlaceholder}
                        value={values.lastName}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field
                      label={copy.birthDate}
                      hint={copy.birthDateHint}
                      required
                      error={fieldErrors.birthDate}
                    >
                      <input
                        className="input-base"
                        type="date"
                        value={values.birthDate}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            birthDate: e.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field
                      label={copy.phone}
                      hint={copy.phoneHint}
                      required
                      error={fieldErrors.phone}
                    >
                      <input
                        className="input-base"
                        placeholder={copy.phonePlaceholder}
                        value={values.phone}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, phone: e.target.value }))
                        }
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  title={copy.practiceSection}
                  description={copy.practiceSectionHelp}
                  icon={<FileBadge className="h-5 w-5" />}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={copy.joinedDate}
                      hint={copy.joinedDateHint}
                      required
                      error={fieldErrors.joinedDate}
                    >
                      <input
                        className="input-base"
                        type="date"
                        value={values.joinedDate}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            joinedDate: e.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field
                      label={copy.currentGrade}
                      hint={copy.currentGradeHint}
                      required
                    >
                      <input
                        className="input-base"
                        placeholder={copy.currentGradePlaceholder}
                        value={values.currentGrade}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            currentGrade: e.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field label={copy.mainInstructor} required>
                      <input
                        className="input-base"
                        placeholder={copy.mainInstructorPlaceholder}
                        value={values.mainInstructor}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            mainInstructor: e.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field
                      label={copy.memberGroup}
                      hint={copy.memberGroupHint}
                      required
                      error={fieldErrors.memberGroup}
                    >
                      <select
                        className="input-base"
                        value={values.memberGroup}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            memberGroup: e.target.value,
                          }))
                        }
                      >
                        <option value="">{copy.selectOne}</option>
                        <option value="adult">{copy.adult}</option>
                        <option value="child">{copy.child}</option>
                      </select>
                    </Field>

                    <Field
                      label={copy.externalMemberId}
                      hint={copy.externalMemberIdHint}
                    >
                      <input
                        className="input-base"
                        placeholder={copy.externalMemberIdPlaceholder}
                        value={values.externalMemberId}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            externalMemberId: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                </FormSection>
              </>
            ) : null}

            <FormSection
              title={copy.extraSection}
              description={copy.extraSectionHelp}
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <Field
                  label={copy.descriptionField}
                  hint={copy.descriptionHint}
                  required
                  error={fieldErrors.description}
                >
                  <textarea
                    className="input-base min-h-[140px]"
                    placeholder={copy.descriptionPlaceholder}
                    value={values.description}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        description: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label={copy.notes} hint={copy.notesHint}>
                  <textarea
                    className="input-base min-h-[120px]"
                    placeholder={copy.notesPlaceholder}
                    value={values.notes}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, notes: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </FormSection>
          </div>

          <label className="mt-8 block border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-7 text-[var(--muted)]">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="font-semibold text-[var(--ink)]">
                  {copy.legalTitle}
                </p>
                <span className="mt-1 block">
                  {form.legal_text || copy.legalFallback}
                </span>
              </div>
            </div>
          </label>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={submitForm}
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? copy.sending : copy.submit}
            </button>

            <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
              {copy.pendingNote}
            </p>
          </div>

          {message ? (
            <p
              className={`mt-4 text-sm font-semibold ${
                ok ? "text-green-700" : "text-[var(--accent)]"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>

        <aside className="h-fit border border-[var(--line)] bg-[var(--paper)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
            {copy.helpKicker}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
            {copy.helpTitle}
          </h2>
          <ul className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted)]">
            <li>{copy.help1}</li>
            <li>{copy.help2}</li>
            <li>{copy.help3}</li>
          </ul>

          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {copy.summaryTitle}
            </p>
            <dl className="mt-3 space-y-3 text-sm leading-7 text-[var(--muted)]">
              <div>
                <dt className="font-semibold text-[var(--ink)]">
                  {copy.summaryScope}
                </dt>
                <dd>{getScopeSummary(form, locale)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--ink)]">
                  {copy.summaryAccess}
                </dt>
                <dd>{copy.summaryAccessBody}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center border border-[var(--line)] bg-[var(--paper)] text-[var(--accent)]">
              {icon}
            </span>
          ) : null}
          <h2 className="text-2xl font-semibold text-[var(--ink)]">{title}</h2>
        </div>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required = false,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-[var(--ink)]">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--accent)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-2 block text-xs leading-6 text-[var(--muted)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-2 block text-xs font-semibold leading-6 text-[var(--accent)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function getStepItems({
  copy,
  isCountry,
  isDojo,
  isKenshi,
  values,
  consent,
}: {
  copy: ReturnType<typeof getCopy>;
  isCountry: boolean;
  isDojo: boolean;
  isKenshi: boolean;
  values: Record<string, string>;
  consent: boolean;
}) {
  const stepConfigs = [
    {
      label: copy.stepAccess,
      description: copy.stepAccessHelp,
      done: Boolean(values.email.trim() && values.password.trim()),
    },
    isCountry
      ? {
          label: copy.stepScope,
          description: copy.stepCountryHelp,
          done: Boolean(
            values.displayName.trim() &&
              values.countryCode.trim() &&
              values.countryName.trim() &&
              values.responsiblePerson.trim(),
          ),
        }
      : isDojo
        ? {
            label: copy.stepScope,
            description: copy.stepDojoHelp,
            done: Boolean(
              values.displayName.trim() &&
                values.dojoName.trim() &&
                values.city.trim() &&
                values.responsibleInstructor.trim(),
            ),
          }
        : {
            label: copy.stepScope,
            description: copy.stepKenshiHelp,
            done: Boolean(
              values.firstName.trim() &&
                values.lastName.trim() &&
                values.birthDate.trim() &&
                values.joinedDate.trim(),
            ),
          },
    {
      label: copy.stepReview,
      description: copy.stepReviewHelp,
      done: Boolean(values.description.trim() && consent),
    },
  ];

  let currentMarked = false;
  return stepConfigs.map((step) => {
    if (step.done) {
      return { ...step, state: "complete" as const };
    }
    if (!currentMarked) {
      currentMarked = true;
      return { ...step, state: "current" as const };
    }
    return { ...step, state: "pending" as const };
  });
}

function getScopeSummary(form: FormPayload, locale: Locale) {
  const es = locale === "es";

  if (form.form_type === "country") {
    return es
      ? "Solicitud para registrar un nuevo pais dentro de IKA."
      : "Request to register a new country within IKA.";
  }

  if (form.form_type === "dojo") {
    const countryName =
      form.countries?.country_translations?.[0]?.name ??
      form.countries?.code ??
      "";
    return es
      ? `Solicitud para crear un dojo dentro de ${countryName || "un pais existente"}.`
      : `Request to create a dojo within ${countryName || "an existing country"}.`;
  }

  const dojoName =
    form.dojos?.dojo_translations?.[0]?.name ?? form.dojos?.city ?? "";

  return es
    ? `Solicitud para alta interna de Kenshi en ${dojoName || "un dojo existente"}.`
    : `Internal Kenshi request for ${dojoName || "an existing dojo"}.`;
}

function getAgeFromDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getFormIntro(form: FormPayload, locale: Locale) {
  const es = locale === "es";

  if (form.form_type === "country") {
    return {
      title: es
        ? "Alta interna de nuevo pais IKA"
        : "Internal new IKA country request",
      description: es
        ? "Este formulario sirve para proponer la incorporacion de un nuevo pais a la estructura oficial de IKA. Rellena los datos del pais, de su representante y de la entidad responsable si existe."
        : "This form is used to propose the addition of a new country to the official IKA structure. Fill in the country details, the representative, and the responsible entity if applicable.",
    };
  }

  if (form.form_type === "dojo") {
    return {
      title: es ? "Alta interna de nuevo dojo" : "Internal new dojo request",
      description: es
        ? "Usa este formulario para registrar un nuevo dojo dentro de un pais ya existente. Conviene indicar claramente el nombre publico, la ciudad, la direccion de entrenamiento y el responsable tecnico."
        : "Use this form to register a new dojo within an existing country. Clearly provide the public name, city, training address, and technical lead.",
    };
  }

  return {
    title: es ? "Alta interna de Kenshi" : "Internal Kenshi request",
    description: es
      ? "Este formulario sirve para dar de alta a un practicante dentro de un dojo existente. Introduce los datos tal y como deban quedar en su ficha IKA, especialmente nombre, fecha de nacimiento, inicio en la practica y grado actual."
      : "This form is used to register a practitioner inside an existing dojo. Enter the details exactly as they should appear on the IKA profile, especially name, birth date, training start date, and current grade.",
  };
}

function formatMissingFields(
  missingFields: string[],
  copy: ReturnType<typeof getCopy>,
) {
  if (!missingFields.length) {
    return copy.nonePendingFields;
  }

  return missingFields
    .map((field) => copy.fieldNames[field] ?? field)
    .join(", ");
}

function getCopy(locale: Locale) {
  const es = locale === "es";

  return {
    kicker: es ? "Solicitud interna IKA" : "IKA internal request",
    description: es
      ? "Rellena esta solicitud interna con calma. El responsable correspondiente la revisara antes de activarla dentro del sistema."
      : "Complete this internal request carefully. The appropriate administrator will review it before activating it in the system.",
    formGuideKicker: es ? "Guia rapida" : "Quick guide",
    progressKicker: es ? "Progreso del formulario" : "Form progress",
    requiredLegendTitle: es ? "Campos obligatorios:" : "Required fields:",
    requiredLegendBody: es
      ? "los marcados con * deben rellenarse para que la solicitud pueda revisarse correctamente."
      : "fields marked with * should be completed so the request can be reviewed properly.",
    reviewBeforeSending: es ? "Revisa antes de enviar" : "Review before sending",
    pendingFieldsLabel: es ? "Quedan por completar:" : "Still missing:",
    nonePendingFields: es ? "Ninguno" : "None",
    validationError: es
      ? "Todavia faltan campos obligatorios por completar."
      : "There are still required fields to complete.",
    validationSpecificError: es
      ? "Hay algunos campos que necesitan correccion antes de enviar."
      : "Some fields need correction before submitting.",
    validationSpecificTitle: es
      ? "Corrige estos puntos"
      : "Please correct these items",
    missingConsent: es
      ? "Debes aceptar el texto legal antes de enviar la solicitud."
      : "You must accept the legal text before submitting the request.",
    invalidEmail: es
      ? "El email no tiene un formato valido."
      : "The email format is invalid.",
    invalidPassword: es
      ? "La contrasena debe tener al menos 8 caracteres."
      : "The password must be at least 8 characters long.",
    invalidPhone: es
      ? "El telefono parece demasiado corto."
      : "The phone number looks too short.",
    invalidWebsite: es
      ? "La web o enlace no tiene un formato reconocible."
      : "The website or link does not have a recognizable format.",
    invalidCountryCode: es
      ? "El codigo del pais debe tener 2 o 3 letras mayusculas."
      : "The country code must have 2 or 3 uppercase letters.",
    invalidBirthDate: es
      ? "La fecha de nacimiento no puede estar en el futuro."
      : "The birth date cannot be in the future.",
    invalidJoinedDate: es
      ? "La fecha de inicio en la practica no puede estar en el futuro."
      : "The training start date cannot be in the future.",
    invalidJoinedBeforeBirth: es
      ? "La fecha de inicio en la practica no puede ser anterior a la fecha de nacimiento."
      : "The training start date cannot be earlier than the birth date.",
    invalidChildGroup: es
      ? "El grupo infantil no encaja con la fecha de nacimiento indicada."
      : "The child group does not match the provided birth date.",
    invalidAdultGroup: es
      ? "El grupo adulto no encaja con la fecha de nacimiento indicada."
      : "The adult group does not match the provided birth date.",
    invalidDescription: es
      ? "La descripcion breve necesita algo mas de contexto."
      : "The short description needs a bit more context.",
    stepAccess: es ? "Acceso" : "Access",
    stepAccessHelp: es
      ? "Email y contrasena para la futura cuenta."
      : "Email and password for the future account.",
    stepScope: es ? "Datos principales" : "Main details",
    stepCountryHelp: es
      ? "Pais, responsable y entidad representante."
      : "Country, responsible person, and representative entity.",
    stepDojoHelp: es
      ? "Nombre, ciudad y responsable tecnico."
      : "Name, city, and technical lead.",
    stepKenshiHelp: es
      ? "Identidad del Kenshi e inicio en la practica."
      : "Kenshi identity and training start details.",
    stepReview: es ? "Revision final" : "Final review",
    stepReviewHelp: es
      ? "Descripcion breve y aceptacion legal."
      : "Short description and legal consent.",
    accessSection: es ? "Datos de acceso" : "Access details",
    accessSectionHelp: es
      ? "Estos datos se usaran para identificarte y para darte acceso cuando la solicitud sea aprobada."
      : "These details are used to identify you and to grant access once the request is approved.",
    displayName: es ? "Nombre visible" : "Display name",
    displayNameHint: es
      ? "Es el nombre general con el que quieres que aparezca esta solicitud."
      : "This is the general name you want this request to display.",
    displayNamePlaceholder: es
      ? "Por ejemplo: Dojo Central IKA"
      : "For example: IKA Central Dojo",
    email: "Email",
    emailHint: es
      ? "Usa un email real, porque sera el canal de comunicacion y acceso."
      : "Use a real email address, as it will be used for communication and access.",
    emailPlaceholder: es
      ? "tuemail@ejemplo.com"
      : "your.email@example.com",
    password: es ? "Contrasena" : "Password",
    passwordHint: es
      ? "Crea una contrasena que recuerdes. Se aplicara cuando la solicitud sea aprobada."
      : "Create a password you will remember. It will be applied once the request is approved.",
    passwordPlaceholder: es
      ? "Escribe aqui tu contrasena"
      : "Enter your password here",
    showPassword: es ? "Mostrar contrasena" : "Show password",
    hidePassword: es ? "Ocultar contrasena" : "Hide password",
    countrySection: es ? "Datos del pais" : "Country details",
    countrySectionHelp: es
      ? "Rellena esta parte solo si estas solicitando el alta de un nuevo pais dentro de IKA."
      : "Fill in this section only if you are requesting a new country within IKA.",
    countryCode: es ? "Codigo del pais" : "Country code",
    countryCodeHint: es
      ? "Usa el codigo corto internacional, por ejemplo ES, FR, JP o BR."
      : "Use the short international code, for example ES, FR, JP or BR.",
    countryCodePlaceholder: es ? "Ejemplo: ES" : "Example: ES",
    countryName: es ? "Nombre del pais" : "Country name",
    countryNameHint: es
      ? "Escribe el nombre oficial del pais tal y como debe mostrarse en la web."
      : "Enter the official country name exactly as it should appear on the website.",
    countryNamePlaceholder: es ? "Ejemplo: Espana" : "Example: Spain",
    responsiblePerson: es ? "Responsable principal" : "Main representative",
    responsiblePersonPlaceholder: es
      ? "Nombre y apellidos del responsable"
      : "Full name of the responsible person",
    representativeEntity: es
      ? "Entidad representante"
      : "Representative entity",
    representativeEntityHint: es
      ? "Si existe una asociacion o entidad que representa el pais, indicala aqui."
      : "If there is an association or entity representing the country, enter it here.",
    representativeEntityPlaceholder: es
      ? "Nombre de la asociacion o entidad"
      : "Association or entity name",
    responsibleEmail: es ? "Email del responsable" : "Responsible email",
    responsibleEmailPlaceholder: es
      ? "Email directo del responsable"
      : "Direct email of the responsible person",
    dojoSection: es ? "Datos del dojo" : "Dojo details",
    dojoSectionHelp: es
      ? "Introduce aqui la informacion publica y operativa del dojo que se quiere crear."
      : "Enter the public and operational information for the dojo you want to create.",
    dojoName: es ? "Nombre del dojo" : "Dojo name",
    dojoNamePlaceholder: es
      ? "Nombre oficial del dojo"
      : "Official dojo name",
    city: es ? "Ciudad" : "City",
    cityPlaceholder: es ? "Ciudad principal del dojo" : "Main dojo city",
    address: es ? "Direccion" : "Address",
    addressHint: es
      ? "Pon la direccion o ubicacion donde se entrena habitualmente."
      : "Enter the address or location where training usually takes place.",
    addressPlaceholder: es ? "Calle, numero, ciudad" : "Street, number, city",
    responsibleInstructor: es
      ? "Responsable tecnico o sensei"
      : "Technical lead or sensei",
    responsibleInstructorPlaceholder: es
      ? "Nombre del responsable tecnico"
      : "Technical lead name",
    contactEmail: es ? "Email de contacto" : "Contact email",
    contactEmailPlaceholder: es
      ? "Email publico del dojo"
      : "Public dojo email",
    website: es ? "Web o redes" : "Website or social links",
    websiteHint: es
      ? "Opcional. Puedes poner la web, Instagram o cualquier enlace principal."
      : "Optional. You can add the website, Instagram, or another main link.",
    websitePlaceholder: "https://...",
    personalSection: es ? "Datos personales" : "Personal details",
    personalSectionHelp: es
      ? "Introduce aqui los datos personales del Kenshi tal y como deben quedar en la ficha IKA."
      : "Enter the Kenshi's personal details exactly as they should appear on the IKA profile.",
    firstName: es ? "Nombre" : "First name",
    firstNamePlaceholder: es ? "Nombre del Kenshi" : "Kenshi first name",
    lastName: es ? "Apellidos" : "Last name",
    lastNamePlaceholder: es ? "Apellidos del Kenshi" : "Kenshi last name",
    birthDate: es ? "Fecha de nacimiento" : "Birth date",
    birthDateHint: es
      ? "Sirve para calcular edad, grupo y estadisticas."
      : "Used to calculate age, category, and statistics.",
    practiceSection: es ? "Datos de practica" : "Training details",
    practiceSectionHelp: es
      ? "Aqui debes indicar la trayectoria marcial real del Kenshi. Esta parte se refiere al inicio de su practica marcial, no al alta en IKA ni en la web."
      : "Here you should enter the Kenshi's actual martial arts history. This refers to the start of martial arts practice, not the date they joined IKA or the website.",
    joinedDate: es
      ? "Fecha de inicio en la practica marcial"
      : "Martial arts training start date",
    joinedDateHint: es
      ? "Pon la fecha en la que empezo a practicar este arte marcial, aunque fuese en otro dojo, otra organizacion o muchos años antes de entrar en IKA."
      : "Enter the date when this person started practising this martial art, even if it was in another dojo, another organisation, or many years before joining IKA.",
    currentGrade: es ? "Grado actual" : "Current grade",
    currentGradeHint: es
      ? "Escribe el grado tal y como debe verse en la ficha. Por ejemplo: 4 DAN o 2 KYU."
      : "Enter the grade exactly as it should appear on the profile, for example: 4 DAN or 2 KYU.",
    currentGradePlaceholder: es ? "Ejemplo: 1 DAN" : "Example: 1 DAN",
    mainInstructor: es ? "Sensei principal" : "Main instructor",
    mainInstructorPlaceholder: es
      ? "Nombre del sensei responsable"
      : "Name of the responsible sensei",
    memberGroup: es ? "Grupo" : "Group",
    memberGroupHint: es
      ? "Selecciona si el Kenshi pertenece al grupo infantil o adulto."
      : "Select whether the Kenshi belongs to the child or adult group.",
    externalMemberId: es ? "ID externo del club" : "External club ID",
    externalMemberIdHint: es
      ? "Opcional. Solo si tu dojo o sistema local ya usa otro identificador."
      : "Optional. Only if your dojo or local system already uses another identifier.",
    externalMemberIdPlaceholder: es
      ? "Por ejemplo: SKBC-024"
      : "For example: SKBC-024",
    phone: es ? "Telefono" : "Phone",
    phoneHint: es
      ? "Incluye prefijo internacional si es posible."
      : "Include the international country code if possible.",
    phonePlaceholder: es
      ? "Por ejemplo: +34 600 000 000"
      : "For example: +34 600 000 000",
    extraSection: es ? "Informacion adicional" : "Additional information",
    extraSectionHelp: es
      ? "Usa este espacio para aclaraciones, contexto o detalles que deban revisar antes de aprobar."
      : "Use this area for clarifications, context, or details that should be reviewed before approval.",
    descriptionField: es ? "Descripcion breve" : "Short description",
    descriptionHint: es
      ? "Resume en pocas lineas que se esta solicitando o cualquier contexto importante."
      : "Summarise in a few lines what is being requested or any important context.",
    descriptionPlaceholder: es
      ? "Escribe aqui una descripcion breve"
      : "Write a short description here",
    notes: es ? "Notas adicionales" : "Additional notes",
    notesHint: es
      ? "Este campo es opcional. Solo anade informacion extra si realmente ayuda a revisar la solicitud."
      : "This field is optional. Only add extra information if it really helps review the request.",
    notesPlaceholder: es ? "Observaciones opcionales" : "Optional notes",
    legalFallback: es
      ? "Acepto el tratamiento internacional de mis datos personales por parte de IKA para la gestion interna de membresia."
      : "I accept the international processing of my personal data by IKA for internal membership management.",
    legalTitle: es
      ? "Consentimiento legal obligatorio"
      : "Required legal consent",
    submit: es ? "Enviar solicitud" : "Submit request",
    sending: es ? "Enviando..." : "Sending...",
    pendingNote: es
      ? "La solicitud no sera inmediata: quedara pendiente de revision y aprobacion."
      : "The request is not immediate: it will remain pending review and approval.",
    ok: es
      ? "Solicitud enviada correctamente. Queda pendiente de aprobacion."
      : "Request sent successfully. It is now pending approval.",
    error: es
      ? "No se pudo enviar la solicitud."
      : "The request could not be sent.",
    helpKicker: es ? "Antes de enviar" : "Before you submit",
    helpTitle: es
      ? "Como rellenar este formulario"
      : "How to complete this form",
    help1: es
      ? "Rellena solo datos reales y actuales. Si un dato no aplica, dejalo vacio antes que inventarlo."
      : "Enter only real and current data. If a field does not apply, leave it empty rather than guessing.",
    help2: es
      ? "La fecha de inicio se refiere al comienzo real de la practica de este arte marcial, no al alta en IKA ni al acceso web."
      : "The training start date means the real start of martial arts practice, not the date the person joined IKA or got web access.",
    help3: es
      ? "Tras enviar la solicitud, el responsable correspondiente la revisara y te confirmara la activacion."
      : "After submission, the appropriate administrator will review it and confirm activation.",
    summaryTitle: es ? "Resumen de esta solicitud" : "Request summary",
    summaryScope: es ? "Ambito" : "Scope",
    summaryAccess: es ? "Acceso" : "Access",
    summaryAccessBody: es
      ? "El email y la contrasena que introduzcas seran los datos base para tu acceso una vez aprobada la solicitud."
      : "The email and password you enter will be the base credentials for your access once the request is approved.",
    selectOne: es ? "Selecciona una opcion" : "Select one option",
    adult: es ? "Adulto" : "Adult",
    child: es ? "Nino" : "Child",
    fieldNames: {
      displayName: es ? "nombre visible" : "display name",
      email: "email",
      password: es ? "contrasena" : "password",
      countryCode: es ? "codigo del pais" : "country code",
      countryName: es ? "nombre del pais" : "country name",
      responsiblePerson: es ? "responsable principal" : "main representative",
      responsibleEmail: es ? "email del responsable" : "responsible email",
      dojoName: es ? "nombre del dojo" : "dojo name",
      city: es ? "ciudad" : "city",
      address: es ? "direccion" : "address",
      responsibleInstructor: es
        ? "responsable tecnico o sensei"
        : "technical lead or sensei",
      contactEmail: es ? "email de contacto" : "contact email",
      firstName: es ? "nombre" : "first name",
      lastName: es ? "apellidos" : "last name",
      birthDate: es ? "fecha de nacimiento" : "birth date",
      joinedDate: es ? "inicio en la practica" : "training start date",
      currentGrade: es ? "grado actual" : "current grade",
      mainInstructor: es ? "sensei principal" : "main instructor",
      memberGroup: es ? "grupo" : "group",
      phone: es ? "telefono" : "phone",
      description: es ? "descripcion breve" : "short description",
    } as Record<string, string>,
  };
}
