import * as React from 'react';

interface BrandOTPTemplateProps {
  otpCode: string;
  brandName?: string;
  contactPerson?: string;
}

export const BrandOTPTemplate: React.FC<Readonly<BrandOTPTemplateProps>> = ({
  otpCode,
  brandName = 'Brand Partner',
  contactPerson = 'there',
}) => (
  <div style={styles.container}>
    <div style={styles.card}>
      <h1 style={styles.title}>Shelf-Bidder for Brands</h1>
      <p style={styles.text}>Hello {contactPerson},</p>
      <p style={styles.text}>
        Welcome to the Shelf-Bidder Brand Portal for <strong>{brandName}</strong>.
        Please use the secure code below to verify your corporate email address:
      </p>
      
      <div style={styles.otpBox}>
        <span style={styles.otp}>{otpCode}</span>
      </div>
      
      <p style={styles.text}>This code is valid for 10 minutes. Do not share this code with anyone outside your organization.</p>
      <hr style={styles.divider} />
      <p style={styles.footer}>© {new Date().getFullYear()} Shelf-Bidder Corporate. All rights reserved.</p>
    </div>
  </div>
);

const styles = {
  container: {
    backgroundColor: '#0a0510',
    padding: '40px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#120a1d',
    border: '1px solid #2d1a45',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(140, 37, 244, 0.15)',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '32px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 24px 0',
  },
  text: {
    color: '#cbd5e1',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px 0',
    textAlign: 'left' as const,
  },
  otpBox: {
    backgroundColor: '#1a0e29',
    border: '2px solid #8c25f4',
    borderRadius: '12px',
    margin: '32px 0',
    padding: '24px',
  },
  otp: {
    color: '#ffffff',
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '8px',
  },
  divider: {
    borderTop: '1px solid #2d1a45',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    margin: '32px 0',
  },
  footer: {
    color: '#64748b',
    fontSize: '14px',
    margin: '0',
  },
};
