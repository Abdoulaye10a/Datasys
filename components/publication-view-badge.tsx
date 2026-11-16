import { Eye } from "lucide-react";

function getViewLevel(count: number) {
  if (count === 0) return "none";
  if (count < 10) return "low";
  if (count < 50) return "medium";
  return "high";
}

export function PublicationViewBadge({
  count,
  showLabel = false,
}: {
  count: number;
  showLabel?: boolean;
}) {
  return (
    <span
      className={`publication-view-count view-count-${getViewLevel(count)}`}
      aria-label={`${count} visiteurs`}
    >
      <Eye size={14} aria-hidden="true" />
      <strong>{count}</strong>
      {showLabel && <span className="publication-view-label">vues</span>}
    </span>
  );
}