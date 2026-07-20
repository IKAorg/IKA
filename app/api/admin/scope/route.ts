import { NextResponse, type NextRequest } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";

export async function GET(request: NextRequest) {
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
