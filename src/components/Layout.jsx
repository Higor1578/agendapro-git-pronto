export default function Layout({ businesses, route, setRoute, children }) {
  const firstStore = businesses[0]?.id ?? "brilho-car";
  const navItems = [
    { path: "/", label: "Venda SaaS", group: "landing" },
    { path: `/loja/${firstStore}`, label: "Pagina da loja", group: "store" },
    { path: "/admin", label: "Admin negocio", group: "admin" },
    { path: "/super-admin", label: "Super admin", group: "super-admin" }
  ];

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">AP</div>
          <div>
            <strong>AgendaPro</strong>
            <span>SaaS instalavel</span>
          </div>
        </div>

        <nav className="role-tabs" aria-label="Areas separadas">
          {navItems.map((item) => (
            <button
              className={`role-tab ${
                item.group === "store" ? route.startsWith("/loja/") ? "active" : "" : route === item.path ? "active" : ""
              }`}
              key={item.path}
              onClick={() => setRoute(item.path)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main>{children}</main>
    </>
  );
}
