type BrandWordmarkProps = {
  className?: string;
};

export default function BrandWordmark({ className = '' }: BrandWordmarkProps) {
  return (
    <span className={`brand-wordmark ${className}`}>
      <span className="brand-wordmark-left">Link</span>
      <span className="brand-wordmark-right">2Pay</span>
    </span>
  );
}
