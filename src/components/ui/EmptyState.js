"use client";

/**
 * Shared empty state: icon, headline, explanation, and — importantly — the
 * action itself, rather than text telling the reader to go find a button.
 *
 * `icon` accepts either an emoji string ("🎯") or a component (e.g. a lucide
 * icon). `text` and `description` are interchangeable.
 *
 *   <EmptyState icon="🎯" title="No goals yet"
 *     text="Set a goal and break it into milestones."
 *     actionLabel="Create goal" onAction={() => setIsModalOpen(true)} />
 */
export default function EmptyState({
  icon: Icon,
  title,
  text,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  const body = text || description;
  const isComponentIcon = typeof Icon === 'function';

  return (
    <div className={`es ${compact ? 'es-compact' : ''}`}>
      {Icon && (
        <span className="es-icon">
          {isComponentIcon ? <Icon size={34} strokeWidth={1.5} /> : Icon}
        </span>
      )}
      <p className="es-title">{title}</p>
      {body && <span className="es-text">{body}</span>}
      {actionLabel && onAction && (
        <button type="button" className="es-cta" onClick={onAction}>
          {actionLabel}
        </button>
      )}

      <style jsx>{`
        .es {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          padding: 48px 20px;
          border-radius: 16px;
          border: 1px dashed var(--border-color);
          background: var(--surface-low);
        }
        .es-compact { padding: 28px 16px; border: none; background: transparent; }
        .es-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          line-height: 1;
          opacity: 0.8;
          color: var(--text-muted);
        }
        .es-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .es-text { font-size: 0.86rem; color: var(--text-muted); max-width: 320px; line-height: 1.55; }
        .es-cta {
          margin-top: 10px;
          padding: 10px 22px;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px var(--accent-glow);
          transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease;
        }
        .es-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 22px var(--accent-glow); }
      `}</style>
    </div>
  );
}
