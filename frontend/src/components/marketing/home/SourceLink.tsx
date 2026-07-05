import { ArrowUpRight } from 'lucide-react';

type SourceLinkProps = {
  href: string;
  label: string;
  tone?: 'default' | 'inverse' | 'primary';
  className?: string;
};

export default function SourceLink({
  href,
  label,
  tone = 'default',
  className = '',
}: SourceLinkProps) {
  const toneClass =
    tone === 'inverse'
      ? 'text-card-invert-foreground/60 hover:text-card-invert-foreground'
      : tone === 'primary'
        ? 'text-primary-foreground/70 hover:text-primary-foreground'
        : 'text-muted-foreground hover:text-accent-ink';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-2xs font-medium uppercase tracking-[0.14em] transition-colors ${toneClass} ${className}`.trim()}
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
