export type RepresentativeLogoScope = {
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  roleKeys: readonly string[];
  countryIds: readonly string[];
};

export type StoredRepresentativeLogoAsset = {
  id: string;
  file_name: string;
  mime_type: string;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  migration_status: string;
};

type AssetLookup = Promise<{
  data: StoredRepresentativeLogoAsset | null;
  error: unknown;
}>;

export function canManageRepresentativeLogo(scope: RepresentativeLogoScope, countryId: string) {
  return scope.isSuperAdmin || scope.isGlobalAdmin || (
    scope.roleKeys.includes("country_admin") && scope.countryIds.includes(countryId)
  );
}

export function toRepresentativeLogoAsset(asset: StoredRepresentativeLogoAsset) {
  return {
    id: asset.id,
    url: `/api/media/public/${asset.id}`,
    fileName: asset.file_name,
    mimeType: asset.mime_type,
    byteSize: asset.byte_size,
    width: asset.width,
    height: asset.height,
  };
}

export async function completeRepresentativeLogoImport(args: {
  upload: () => Promise<{ assetId: string }>;
  findById: (assetId: string) => AssetLookup;
  findBySourceKey: () => AssetLookup;
}) {
  let uploaded: { assetId: string };
  try {
    uploaded = await args.upload();
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const winner = await args.findBySourceKey();
    if (winner.error) throw winner.error;
    if (!winner.data || winner.data.migration_status !== "verified") {
      throw new Error("The winning representative logo asset is not available");
    }
    return { asset: toRepresentativeLogoAsset(winner.data), reused: true };
  }

  const stored = await args.findById(uploaded.assetId);
  if (stored.error) throw stored.error;
  if (!stored.data || stored.data.migration_status !== "verified") {
    throw new Error("The uploaded representative logo asset is not available");
  }
  return { asset: toRepresentativeLogoAsset(stored.data), reused: false };
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}
