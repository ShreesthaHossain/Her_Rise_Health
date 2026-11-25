export default function AdminUsersPage() {
  return (
    <section>
      <h1 className="text-3xl tracking-tight">Accounts</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The account directory is available to an admin token at GET /api/v1/admin/users. It returns display names and roles, not health logs.
      </p>
    </section>
  );
}
