import "./overlay.css";

// Compact key for the loaded layers: one swatch per category present, with counts.
export default function Legend({ layers }) {
  if (!layers.length) return null;
  return (
    <div className="legend" aria-label="Legend">
      {layers.map((layer) => (
        <section key={layer.id}>
          <h3>{layer.title}</h3>
          <ul>
            {layer.categories.map((c) => (
              <li key={c.key}>
                <span className="swatch" style={{ background: c.color }} aria-hidden="true" />
                {c.label}
                <span className="legend__count">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
