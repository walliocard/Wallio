export function formatNum(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function formatPhone(raw: string | undefined): string {
  if (!raw) return "";
  const m = raw.match(/^(\+\d{1,4})(0?)(\d+)$/);
  if (!m) return raw;
  const prefix = m[1];
  const digits = m[3];
  if (digits.length >= 8) {
    const first = digits[0];
    const rest = digits.slice(1).match(/.{1,2}/g) || [];
    return `${prefix} ${[first, ...rest].join(" ")}`;
  }
  return `${prefix} ${digits}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
