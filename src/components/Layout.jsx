const navItems = [
  { path: "/cliente", label: "Cliente agenda" },
  { path: "/admin", label: "Admin negocio" },
  { path: "/super-admin", label: "Super admin" }
];

export default function Layout({ route, setRoute, children }) {
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
              className={`role-tab ${route === item.path ? "active" : ""}`}
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
