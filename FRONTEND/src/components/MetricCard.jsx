function MetricCard({
    icon,
    label,
    value,
    description,
  }) {
    return (
      <article className="metric-card">
        <div className="metric-icon">
          {icon}
        </div>
  
        <div>
          <span className="metric-label">
            {label}
          </span>
  
          <strong className="metric-value">
            {value}
          </strong>
  
          <small>
            {description}
          </small>
        </div>
      </article>
    );
  }
  
  export default MetricCard;