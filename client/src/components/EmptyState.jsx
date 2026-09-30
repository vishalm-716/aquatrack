import { HiOutlineInbox } from 'react-icons/hi2';

export default function EmptyState({
  title = 'No records found',
  description = 'No data matches your current filters or query.',
  actionLabel,
  onAction,
  icon: Icon = HiOutlineInbox
}) {
  return (
    <div className="empty-state">
      <Icon style={{ fontSize: '48px', color: 'var(--sand-400)', margin: '0 auto 12px' }} />
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
