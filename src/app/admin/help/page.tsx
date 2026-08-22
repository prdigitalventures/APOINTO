export default function AdminHelpPage() {
  const sections = [
    {
      title: 'Open the dashboard',
      body: 'Go to https://www.apointo.online/admin after your work email is on ADMIN_EMAILS or a super admin has invited you. This is not in the owner bottom nav — it is for Apointo employees only.',
    },
    {
      title: 'CRM',
      body: 'CRM lists every owner and customer who created an Apointo account. Open a contact to add notes and tags. This is not the same as a shop owner’s CRM of walk-in clients.',
    },
    {
      title: 'Create owners and customers',
      body: 'Accounts → create the person first (no email is sent yet). Reset or generate a password, then click Send credentials so they get login email, password, and a “your account is created” message. Edit lets you change name, email, and phone.',
    },
    {
      title: 'Create and assign a business',
      body: 'Create the owner on Accounts first. Businesses → create the shop with that owner email (no email yet). Click Email owner when you want to send the shop-ready message. Live shops show a green Live pill; disabled shops show a red Not live pill.',
    },
    {
      title: 'Disable malpractice or duplicates',
      body: 'On Businesses, Disable hides the listing from public booking. On Accounts, Disable stops that person logging in. Always add a reason.',
    },
    {
      title: 'Password reset',
      body: 'Send credentials emails a temporary password. Reset link emails /reset-password instead. Copy the password from the yellow banner if email is not configured.',
    },
    {
      title: 'Campaigns',
      body: 'Save a draft, pick Owners / Customers / All, then Send email. For WhatsApp, export the CSV until Meta Cloud API is connected.',
    },
    {
      title: 'Privileges',
      body: 'Team → invite staff and assign Sales, Media, Support, or Super admin. Each feature can be No access, Read only, or Read and edit.',
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">How to use the admin dashboard</h1>
      <p className="text-sm text-gray-600">Tutorials for new Apointo employees.</p>
      {sections.map((s) => (
        <section key={s.title} className="rounded-2xl border bg-white p-5 dark:bg-[#16181d] dark:border-gray-800">
          <h2 className="font-semibold">{s.title}</h2>
          <p className="mt-2 text-sm text-gray-600">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
