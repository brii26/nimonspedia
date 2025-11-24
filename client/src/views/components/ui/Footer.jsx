import React from 'react';

const Footer = ({ className = '', ...props }) => {
  return (
    <footer className={`bg-[#2c3e50] border-t-4 border-[#667eea] text-white py-8 ${className}`} {...props}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {props.children}
        </div>
        <div className="border-t border-gray-600 pt-6 text-center">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Nimonspedia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export const FooterSection = ({ title, children, className = '' }) => {
  return (
    <div className={`${className}`}>
      {title && <h4 className="text-lg font-semibold mb-4">{title}</h4>}
      {children}
    </div>
  );
};

export const FooterLinks = ({ links, className = '' }) => {
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
