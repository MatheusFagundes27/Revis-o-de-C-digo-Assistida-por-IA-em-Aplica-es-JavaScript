import {
    CircleHelp,
    Code2,
    Moon,
  } from "lucide-react";
  
  function Header() {
    return (
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Code2 size={22} />
          </div>
  
          <div>
            <h1>CodeReview AI</h1>
  
            <span>
              Revisão de código assistida por IA
            </span>
          </div>
        </div>
  
        <div className="header-actions">
          <button
            className="header-button"
            type="button"
          >
            <CircleHelp size={18} />
            Ajuda
          </button>
  
          <button
            className="icon-button"
            type="button"
            aria-label="Alterar tema"
          >
            <Moon size={18} />
          </button>
        </div>
      </header>
    );
  }
  
  export default Header;