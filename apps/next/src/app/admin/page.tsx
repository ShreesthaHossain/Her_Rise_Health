export default function AdminHomePage() {
  return (
    <section>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 text-4xl tracking-tight">Administration</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Role checks happen here and again on the API. Assign the admin role in the database. The app does not ship a default administrator.
      </p>
    </section>
  );
}
