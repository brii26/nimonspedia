import React from 'react';

const Footer = ({ className = '', ...props }) => {
  return (
    <footer className={`footer ${className}`} {...props}>
      <div className="container">
        <div className="footer-content">
          {props.children}
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Nimonspedia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export const FooterSection = ({ title, children, className = '' }) => {
  return (
    <div className={`footer-section ${className}`}>
      {title && <h4>{title}</h4>}
      {children}
    </div>
  );
};

export const FooterLinks = ({ links, className = '' }) => {
  return (
    <ul className={`footer-links ${className}`}>
      {links.map((link, index) => (
        <li key={index}>
          <a href={link.href}>{link.label}</a>
        </li>
      ))}
    </ul>
  );
};

export default Footer;
