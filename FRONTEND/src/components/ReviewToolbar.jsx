import {
    Clipboard,
    CloudUpload,
    Sparkles,
  } from "lucide-react";
  
  function ReviewToolbar() {
    return (
      <section className="review-toolbar">
        <div className="toolbar-actions">
          <button
            className="secondary-button"
            type="button"
          >
            <Clipboard size={17} />
            Colar código
          </button>
  
          <button
            className="secondary-button"
            type="button"
          >
            <CloudUpload size={17} />
            Upload de arquivo
          </button>
        </div>
  
        <div className="toolbar-config">
          <label className="field">
            <span>Ambiente</span>
  
            <select defaultValue="node">
              <option value="node">
                Node.js
              </option>
  
              <option value="react">
                React
              </option>
            </select>
          </label>
  
          <label className="field">
            <span>Modo</span>
  
            <select defaultValue="hybrid">
              <option value="static">
                C1 — Estático
              </option>
  
              <option value="llm">
                C2 — LLM
              </option>
  
              <option value="hybrid">
                C3 — Híbrido
              </option>
            </select>
          </label>
  
          <button
            className="primary-button"
            type="button"
          >
            <Sparkles size={18} />
            Analisar Código
          </button>
        </div>
      </section>
    );
  }
  
  export default ReviewToolbar;