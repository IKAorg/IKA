const adminSessionBridgeKey = "ika-admin-session";

type BridgeSession = {
  accessToken?: string;
  userId?: string;
  email?: string;
};

export function saveAdminSessionBridge(session: {
  access_token?: string | null;
  user?: { id?: string | null; email?: string | null } | null;
}) {
  if (typeof window === "undefined" || !session.access_token) {
    return;
  }

  window.sessionStorage.setItem(
    adminSessionBridgeKey,
    JSON.stringify({
      accessToken: session.access_token,
      userId: session.user?.id ?? "",
      email: session.user?.email ?? "",
    }),
  );
}

export function getAdminSessionBridgeHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.sessionStorage.getItem(adminSessionBridgeKey);

  if (!raw) {
    return {};
  }

  try {
    const session = JSON.parse(raw) as BridgeSession;
    const headers: Record<string, string> = {};

    if (session.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    if (session.userId) {
      headers["x-client-auth-user-id"] = session.userId;
    }

    if (session.email) {
      headers["x-client-auth-email"] = session.email;
    }

    return headers;
  } catch {
    window.sessionStorage.removeItem(adminSessionBridgeKey);
    return {};
  }
}
