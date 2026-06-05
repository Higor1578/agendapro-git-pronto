export default function Layout({ businesses, route, setRoute, children }) {
  const isPublicStore = route.startsWith("/loja/");
  const navItems = [
    { path: "/", label: "Venda SaaS", group: "landing" },
    { path: "/super-admin", label: "Super admin", group: "super-admin" }
  ];

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">AP</div>
          <div>
            <strong>{isPublicStore ? "Agendamento online" : "AgendaPro"}</strong>
            <span>{isPublicStore ? "Loja publica" : "SaaS instalavel"}</span>
          </div>
        </div>

        {!isPublicStore ? (
          <nav className="role-tabs" aria-label="Areas separadas">
            {navItems.map((item) => (
              <button
                className={`role-tab ${
                  route === item.path ? "active" : ""
                }`}
                key={item.path}
                onClick={() => setRoute(item.path)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      <main>{children}</main>
    </>
  );
}
