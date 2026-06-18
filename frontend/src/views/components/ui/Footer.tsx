import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

interface FooterProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  children?: ReactNode;
}

interface FooterSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  className?: string;
}

interface FooterLink {
  href: string;
  label: string;
}

interface FooterLinksProps extends HTMLAttributes<HTMLUListElement> {
  links: FooterLink[];
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '', children, ...props }) => {
  return (
    <footer className={`bg-[#f5f5f5] border-t border-[#e8e8e8] py-5 ${className}`} {...props}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {children}
        </div>
        <div className="text-center">
          <p className="text-sm text-[#757575]">&copy; 2025 - {new Date().getFullYear()} Nimonspedia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export const FooterSection: React.FC<FooterSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`${className}`}>
      {title && <h4 className="text-lg font-semibold mb-4">{title}</h4>}
      {children}
    </div>
  );
};

export const FooterLinks: React.FC<FooterLinksProps> = ({ links, className = '' }) => {
  return (
    <ul className={`space-y-2 ${className}`}>
      {links.map((link, index) => (
        <li key={index}>
          <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">{link.label}</a>
        </li>
      ))}
    </ul>
  );
};

export default Footer;
