import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    Tags,
  } from "lucide-react";
  
  import MetricCard from "./MetricCard";
  
  function MetricsBar() {
    return (
      <section className="metrics-bar">
        <MetricCard
          icon={<AlertTriangle size={20} />}
          label="Issues encontradas"
          value="0"
          description="Nenhuma análise executada"
        />
  
        <MetricCard
          icon={<Tags size={20} />}
          label="Categorias"
          value="0"
          description="Até 4 categorias"
        />
  
        <MetricCard
          icon={<BookOpen size={20} />}
          label="Contextos"
          value="0"
          description="Contextos recuperados"
        />
  
        <MetricCard
          icon={<CheckCircle2 size={20} />}
          label="Status"
          value="Aguardando"
          description="Pronto para análise"
        />
      </section>
    );
  }
  
  export default MetricsBar;