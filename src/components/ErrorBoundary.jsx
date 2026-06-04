import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Erro no app:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-screen">
          <div className="panel">
            <p className="eyebrow">Erro ao abrir</p>
            <h1>O app carregou, mas encontrou um erro.</h1>
            <p>{this.state.error.message}</p>
            <button className="primary-button" onClick={() => window.location.reload()} type="button">
              Recarregar
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
