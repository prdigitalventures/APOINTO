export function formatEmployeeCode(code?: string | null): string {
  if (!code) return '';
  if (code.startsWith('PRST') && code.length > 4) return `PR ST ${code.slice(4)}`;
  return code;
}

export function randomStaffPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
