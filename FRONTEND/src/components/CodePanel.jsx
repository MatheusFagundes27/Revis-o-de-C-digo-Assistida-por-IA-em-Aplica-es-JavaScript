import {
    FileCode2,
  } from "lucide-react";
  
  function CodePanel() {
    return (
      <section className="code-panel">
        <div className="panel-header">
          <div className="panel-title">
            <FileCode2 size={17} />
  
            <span>
              snippet.js
            </span>
          </div>
  
          <span className="panel-status">
            Nenhuma alteração
          </span>
        </div>
  
        <div className="code-placeholder">
          <span>//</span>
  
          <p>
            O editor de código será exibido aqui.
          </p>
        </div>
  
        <footer className="code-footer">
          <span>JavaScript</span>
          <span>UTF-8</span>
          <span>Node.js</span>
        </footer>
      </section>
    );
  }
  
  export default CodePanel;