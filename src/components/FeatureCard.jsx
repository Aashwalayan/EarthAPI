import { useEffect } from "react";
import "./overlay.css";

// Details for the clicked marker. Generic: it renders whatever Feature it is
// given (title, subtitle, ordered label/value fields), so every layer can use it.
export default function FeatureCard({ selection, onClose }) {
  useEffect(() => {
    if (!selection) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, onClose]);

  if (!selection) return null;
  const { feature, color } = selection;

  return (
    <aside className="feature-card" role="dialog" aria-label={`Details for ${feature.name}`}>
      <button className="feature-card__close" onClick={onClose} aria-label="Close details">
        ×
      </button>
      <h2 className="feature-card__title">{feature.name}</h2>
      <p className="feature-card__subtitle">
        <span className="swatch" style={{ background: color }} aria-hidden="true" />
        {feature.subtitle}
      </p>
      <dl className="feature-card__fields">
        {feature.fields.map(({ label, value, href }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
