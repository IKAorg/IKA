import { NextResponse, type NextRequest } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";

type AuditLogRow = {
  id: string;
  actor_profile_id: string | null;
  director_profile_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value: unknown;
  new_value: unknown;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor:
    | { email: string | null; display_name: string | null }
    | Array<{ email: string | null; display_name: string | null }>
    | null;
  admin:
    | { display_name: string | null; is_active: boolean | null }
    | Array<{ display_name: string | null; is_active: boolean | null }>
    | null;
};

export async function GET(request: NextRequest) {
  const guard = await requireScopedAdmin(request);

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  if (!guard.scope.isSuperAdmin) {
    return NextResponse.json(
      { error: "Solo super admin puede consultar la auditoria." },
      { status: 403 },
    );
  }

  if (!guard.scope.director) {
    return NextResponse.json(
      { error: "Valida tu PIN de admin antes de consultar la auditoria." },
      { status: 403 },
    );
  }

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit") ?? "100"), 20),
    200,
  );
  const result = await guard.admin
    .from("audit_logs")
    .select(
      "id,actor_profile_id,director_profile_id,action,table_name,record_id,old_value,new_value,metadata,created_at,actor:users_profiles!audit_logs_actor_profile_id_fkey(email,display_name),admin:super_admin_directors!audit_logs_director_profile_id_fkey(display_name,is_active)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({
    logs: ((result.data ?? []) as AuditLogRow[]).map((log) => {
      const actor = firstRelation(log.actor);
      const admin = firstRelation(log.admin);

      return {
        id: log.id,
        createdAt: log.created_at,
        action: log.action,
        tableName: log.table_name,
        recordId: log.record_id,
        actorProfileId: log.actor_profile_id,
        adminProfileId: log.director_profile_id,
        actorName: actor?.display_name ?? actor?.email ?? "",
        actorEmail: actor?.email ?? "",
        adminName: admin?.display_name ?? "",
        oldValue: log.old_value,
        newValue: log.new_value,
        metadata: log.metadata ?? {},
      };
    }),
  });
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
