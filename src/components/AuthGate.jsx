import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient.js";

export default function AuthGate({ children, requiredRole, selectedBusinessId }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [membershipLoaded, setMembershipLoaded] = useState(false);
  const [hasStoreAccess, setHasStoreAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      if (data.session?.user && selectedBusinessId) loadMembership(data.session.user.id, selectedBusinessId);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) loadProfile(nextSession.user.id);
      if (nextSession?.user && selectedBusinessId) loadMembership(nextSession.user.id, selectedBusinessId);
      if (!nextSession) {
        setProfile(null);
        setProfileLoaded(false);
        setHasStoreAccess(false);
        setMembershipLoaded(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user) return;
    if (!selectedBusinessId) {
      setMembershipLoaded(true);
      setHasStoreAccess(false);
      return;
    }

    loadMembership(session.user.id, selectedBusinessId);
  }, [session?.user?.id, selectedBusinessId]);

  async function loadProfile(userId) {
    setProfileLoaded(false);
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) setError(profileError.message);
    setProfile(data);
    setProfileLoaded(true);
  }

  async function loadMembership(userId, businessId) {
    setMembershipLoaded(false);
    const { data, error: membershipError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", userId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (membershipError) setError(membershipError.message);
    setHasStoreAccess(Boolean(data));
    setMembershipLoaded(true);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.get("email"),
      password: form.get("password")
    });
    if (loginError) setError(loginError.message);
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    const confirm = form.get("confirm");

    if (password !== confirm) {
      setError("As senhas nao conferem.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false }
    });
    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (session?.user?.id) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false, password_changed_at: new Date().toISOString() })
        .eq("id", session.user.id);
      await loadProfile(session.user.id);
      if (selectedBusinessId) await loadMembership(session.user.id, selectedBusinessId);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div>
        <div className="auth-warning">Modo demo: configure Supabase para ativar login real.</div>
        {children}
      </div>
    );
  }

  if (isLoading) {
    return <div className="panel auth-panel">Carregando acesso...</div>;
  }

  if (!session) {
    return (
      <section className="auth-screen">
        <form className="panel auth-panel" onSubmit={handleLogin}>
          <p className="eyebrow">Acesso restrito</p>
          <h1>Entrar no painel</h1>
          <label>
            E-mail
            <input name="email" required type="email" />
          </label>
          <label>
            Senha temporaria ou senha atual
            <input name="password" required type="password" />
          </label>
          {selectedBusinessId ? <small>Loja: /admin/{selectedBusinessId}</small> : null}
          {error ? <strong className="auth-error">{error}</strong> : null}
          <button className="primary-button full" type="submit">Entrar</button>
        </form>
      </section>
    );
  }

  const mustChangePassword = profile?.must_change_password || session.user.user_metadata?.must_change_password;
  if (!profileLoaded || (requiredRole === "store_admin" && selectedBusinessId && !membershipLoaded)) {
    return <div className="panel auth-panel">Carregando permissoes...</div>;
  }

  if (mustChangePassword) {
    return (
      <section className="auth-screen">
        <form className="panel auth-panel" onSubmit={handlePasswordChange}>
          <p className="eyebrow">Primeiro acesso</p>
          <h1>Crie sua senha definitiva</h1>
          <p>Voce entrou com uma senha temporaria. Para continuar, escolha uma nova senha.</p>
          <label>
            Nova senha
            <input minLength="8" name="password" required type="password" />
          </label>
          <label>
            Confirmar senha
            <input minLength="8" name="confirm" required type="password" />
          </label>
          {error ? <strong className="auth-error">{error}</strong> : null}
          <button className="primary-button full" type="submit">Salvar nova senha</button>
        </form>
      </section>
    );
  }

  const canUseRole =
    !requiredRole ||
    profile?.role === requiredRole ||
    (requiredRole === "store_admin" && profile?.role === "super_admin");
  const canUseStore = requiredRole !== "store_admin" || !selectedBusinessId || profile?.role === "super_admin" || hasStoreAccess;

  if (!canUseRole || !canUseStore) {
    return (
      <section className="auth-screen">
        <div className="panel auth-panel">
          <p className="eyebrow">Sem permissao</p>
          <h1>Acesso nao autorizado</h1>
          <p>Esse usuario nao tem permissao para acessar esta area.</p>
          <button className="secondary-button" onClick={() => supabase.auth.signOut()} type="button">Sair</button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="session-bar">
        <span>{session.user.email}</span>
        <button className="secondary-button" onClick={() => supabase.auth.signOut()} type="button">Sair</button>
      </div>
      {children}
    </>
  );
}
