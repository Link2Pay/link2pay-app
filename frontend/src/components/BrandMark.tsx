import type { CSSProperties } from 'react';
import logoMarkLinkMask from '../assets/icons/link2pay-mark-link-mask.png';
import logoMarkShieldMask from '../assets/icons/link2pay-mark-shield-mask.png';

type BrandMarkProps = {
  className?: string;
  imgClassName?: string;
};

export default function BrandMark({ className = '', imgClassName = '' }: BrandMarkProps) {
  const shieldMaskStyle = {
    WebkitMaskImage: `url(${logoMarkShieldMask})`,
    maskImage: `url(${logoMarkShieldMask})`,
  } as CSSProperties;

  const linkMaskStyle = {
    WebkitMaskImage: `url(${logoMarkLinkMask})`,
    maskImage: `url(${logoMarkLinkMask})`,
  } as CSSProperties;

  return (
    <span
      role="img"
      aria-label="Link2Pay logo"
      className={`brand-mark-badge relative inline-flex items-center justify-center overflow-hidden p-1 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`brand-mark-part brand-mark-part-shield ${imgClassName}`}
        style={shieldMaskStyle}
      />
      <span
        aria-hidden="true"
        className={`brand-mark-part brand-mark-part-link ${imgClassName}`}
        style={linkMaskStyle}
      />
    </span>
  );
}
