export type MemberImportIdentityStrategy = "external" | "email" | "name";

export function getMemberImportIdentityStrategy(input: {
  externalMemberId?: string | null;
  email?: string | null;
}): MemberImportIdentityStrategy {
  if (input.externalMemberId?.trim()) {
    return "external";
  }

  if (input.email?.trim()) {
    return "email";
  }

  return "name";
}
