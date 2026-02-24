type BrandWordmarkProps = {
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
};

export default function BrandWordmark({
  className = '',
  leftClassName = '',
  rightClassName = '',
}: BrandWordmarkProps) {
  return (
    <span className={`brand-wordmark ${className}`}>
      <span className={`brand-wordmark-left ${leftClassName}`}>Link</span>
      <span className={`brand-wordmark-right ${rightClassName}`}>2Pay</span>
    </span>
  );
}
