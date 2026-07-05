type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'default' | 'inverse';
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'default',
  className = '',
}: SectionHeadingProps) {
  const centered = align === 'center';
  const eyebrowClass =
    tone === 'inverse' ? 'text-card-invert-foreground/60' : 'text-muted-foreground';
  const titleClass =
    tone === 'inverse' ? 'text-card-invert-foreground' : 'text-foreground';
  const descriptionClass =
    tone === 'inverse' ? 'text-card-invert-foreground/72' : 'text-muted-foreground';

  return (
    <div className={`${centered ? 'mx-auto text-center' : ''} ${className}`.trim()}>
      {eyebrow && (
        <p className={`text-2xs font-medium uppercase tracking-label ${eyebrowClass}`}>
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl ${titleClass} [text-wrap:balance]`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 max-w-2xl text-base leading-7 ${descriptionClass} ${centered ? 'mx-auto' : ''} [text-wrap:pretty]`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
