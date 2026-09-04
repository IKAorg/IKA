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
  const [membersResult, countriesResult, dojosResult] = await Promise.all([
    guard.admin
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    guard.admin
      .from("countries")
      .select("id", { count: "exact", head: true }),
    guard.admin
      .from("dojos")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  return NextResponse.json({
    scope: {
      roleKeys: scope.roleKeys,
      isGlobal: scope.isSuperAdmin || scope.isGlobalAdmin,
      countryIds: scope.countryIds,
      dojoIds: scope.dojoIds,
    },
    summary: {
      activeMembers: membersResult.count ?? 0,
      countries: countriesResult.count ?? 0,
      dojos: dojosResult.count ?? 0,
    },
  });
}
