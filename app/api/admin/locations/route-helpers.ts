type RepresentativeLogoInput = {
  representativeLogoMediaId?: string | null;
  representativeLogoMediaUrl?: string | null;
};

type RepresentativeLogoScope = {
  isGlobal: boolean;
  countryAdminIds: string[];
  countryIds?: string[];
};

export function canManageCountryRepresentativeLogo(
  scope: RepresentativeLogoScope,
  countryId: string,
) {
  return scope.isGlobal || scope.countryAdminIds.includes(countryId);
}

export function getRepresentativeLogoMutation(
  input: RepresentativeLogoInput,
  canManageRepresentativeLogo: boolean,
) {
  const hasLogoInput =
    Object.prototype.hasOwnProperty.call(input, "representativeLogoMediaId") ||
    Object.prototype.hasOwnProperty.call(input, "representativeLogoMediaUrl");

  if (!canManageRepresentativeLogo || !hasLogoInput) {
    return { action: "preserve" } as const;
  }

  return {
    action: "resolve",
    mediaId: input.representativeLogoMediaId,
    mediaUrl: input.representativeLogoMediaUrl,
  } as const;
}

export async function applyRepresentativeLogoToCountryPayload<
  T extends Record<string, unknown>,
>(
  payload: T,
  input: RepresentativeLogoInput,
  scope: RepresentativeLogoScope,
  countryId: string,
  resolveMediaId: (
    mediaId: string | null | undefined,
    mediaUrl: string | null | undefined,
  ) => Promise<string | null>,
): Promise<T & { representative_logo_media_id?: string | null }> {
  const mutation = getRepresentativeLogoMutation(
    input,
    !countryId || canManageCountryRepresentativeLogo(scope, countryId),
  );

  if (mutation.action === "preserve") {
    return { ...payload };
  }

  return {
    ...payload,
    representative_logo_media_id: await resolveMediaId(
      mutation.mediaId,
      mutation.mediaUrl,
    ),
  };
}
