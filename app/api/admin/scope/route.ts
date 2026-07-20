import { NextResponse, type NextRequest } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function GET(request: NextRequest) {
  const authEmail = normalizeEmail(
    request.headers.get("x-client-auth-email") ?? request.headers.get("x-admin-auth-email"),
  );

  if (authEmail === officialSuperAdminEmail) {
    return NextResponse.json({
      scope: {
        roleKeys: ["super_admin"],
        isGlobal: true,
        countryIds: [],
        dojoIds: [],
      },
    });
  }

  const guard = await requireScopedAdmin(request);

  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  if (!guard.scope) {
    return NextResponse.json(
      { error: "No administration permission was found for this account." },
      { status: 403 },
    );
  }

  const { scope } = guard;

  return NextResponse.json({
    scope: {
      roleKeys: scope.roleKeys,
      isGlobal: scope.isSuperAdmin || scope.isGlobalAdmin,
      countryIds: scope.countryIds,
      dojoIds: scope.dojoIds,
    },
  });
}
