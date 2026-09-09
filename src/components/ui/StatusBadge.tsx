import { ProcessStatus } from '../../lib/types';

interface StatusBadgeProps {
  status: ProcessStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const styles = {
    OPEN: 'bg-primary/10 text-primary border-primary/20',
    CLOSED: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  };

  const labels = {
    OPEN: 'Aberto',
    CLOSED: 'Fechado',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${styles[status]} ${sizes[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'OPEN' ? 'bg-primary' : 'bg-text-muted'}`} />
      {labels[status]}
    </span>
  );
}
