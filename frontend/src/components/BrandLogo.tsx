import logoWordmark from '../assets/icons/link2pay-wordmark.png';

type BrandLogoProps = {
  className?: string;
  imgClassName?: string;
};

export default function BrandLogo({ className = '', imgClassName = '' }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center overflow-hidden ${className}`}>
      <img
        src={logoWordmark}
        alt="Link2Pay"
        className={`h-full w-full object-contain ${imgClassName}`}
      />
    </span>
  );
}
