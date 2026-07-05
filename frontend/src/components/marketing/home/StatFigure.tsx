type StatFigureTone = 'default' | 'inverse' | 'primary' | 'success';

type StatFigureProps = {
  value: string;
  label: string;
  tone?: StatFigureTone;
  className?: string;
};

const TONE_CLASSES: Record<StatFigureTone, string> = {
  default: 'border border-border bg-card text-foreground',
  inverse: 'border border-card-invert-foreground/10 bg-card-invert/40 text-card-invert-foreground',
  primary: 'border border-primary/20 bg-primary text-primary-foreground',
  success: 'border border-success-border bg-success-subtle text-foreground',
};

const VALUE_CLASSES: Record<StatFigureTone, string> = {
  default: 'text-foreground',
  inverse: 'text-card-invert-foreground',
  primary: 'text-primary-foreground',
  success: 'text-foreground',
};

const LABEL_CLASSES: Record<StatFigureTone, string> = {
  default: 'text-muted-foreground',
  inverse: 'text-card-invert-foreground/72',
  primary: 'text-primary-foreground/78',
  success: 'text-muted-foreground',
};

export default function StatFigure({
  value,
  label,
  tone = 'default',
  className = '',
}: StatFigureProps) {
  return (
    <article className={`rounded-2xl p-5 sm:p-6 ${TONE_CLASSES[tone]} ${className}`.trim()}>
      <div
        className={`font-mono text-3xl font-semibold leading-none [font-variant-numeric:tabular-nums] sm:text-4xl ${VALUE_CLASSES[tone]}`}
      >
        {value}
      </div>
      <p className={`mt-3 text-sm leading-6 [text-wrap:pretty] ${LABEL_CLASSES[tone]}`}>{label}</p>
    </article>
  );
}
