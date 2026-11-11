export function normalizeCnpj(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[.\/\-\s]/g, '');
}
export function isValidCnpj(value: string): boolean {
  const normalized = normalizeCnpj(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(normalized) || /^(\d)\1{13}$/.test(normalized)) return false;
  const digit = (base: string) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const remainder =
      [...base].reduce((sum, char, index) => sum + (char.charCodeAt(0) - 48) * weights[index], 0) %
      11;
    return remainder < 2 ? '0' : String(11 - remainder);
  };
  return (
    digit(normalized.slice(0, 12)) === normalized[12] &&
    digit(normalized.slice(0, 13)) === normalized[13]
  );
}
export function formatCnpj(value: string): string {
  return normalizeCnpj(value).replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5');
}
export function formatDate(value: string | null, includeTime = false) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}
export function formatPeriod(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(`${value}-01T12:00:00Z`),
      )
    : 'Não informada pela fonte';
}
