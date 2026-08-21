export function RequiredMark() {
  return <span className="text-red-600" aria-hidden="true">*</span>;
}

export function GoogleButton({
  role,
  next,
  label = 'Continue with Google',
}: {
  role?: 'OWNER' | 'CUSTOMER';
  next?: string;
  label?: string;
}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (next) params.set('next', next);
  const href = `/api/auth/google${params.toString() ? `?${params}` : ''}`;

  return (
    <a
      href={href}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l6.3 5.3C38.4 37.3 44 31.5 44 24c0-1.2-.1-2.3-.4-3.5z" />
      </svg>
      {label}
    </a>
  );
}
