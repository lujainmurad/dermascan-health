import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-accent-foreground" />
    </div>
    <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-md mb-6">{description}</p>
    {action}
  </div>
);

export default EmptyState;
