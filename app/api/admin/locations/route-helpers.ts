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
