export type PasswordRuleKey =
  | "minLength"
  | "hasLowercase"
  | "hasUppercase"
  | "hasNumber"
  | "hasSymbol";

export type PasswordChecklistItem = {
  key: PasswordRuleKey;
  label: string;
  ok: boolean;
};

export const PASSWORD_MIN_LENGTH = 8;

export function passwordChecklist(password: string): PasswordChecklistItem[] {
  const value = password ?? "";
  return [
    {
      key: "minLength",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      ok: value.length >= PASSWORD_MIN_LENGTH,
    },
    { key: "hasLowercase", label: "One lowercase letter", ok: /[a-z]/.test(value) },
    { key: "hasUppercase", label: "One uppercase letter", ok: /[A-Z]/.test(value) },
    { key: "hasNumber", label: "One number", ok: /\d/.test(value) },
    { key: "hasSymbol", label: "One symbol", ok: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function validateNewPassword(password: string): string | null {
  const items = passwordChecklist(password);
  const allOk = items.every((item) => item.ok);
  return allOk ? null : "Password does not meet the requirements.";
}

