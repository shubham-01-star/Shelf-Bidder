import * as React from 'react';

interface OTPTemplateProps {
  otpCode: string;
  firstName?: string;
}

export const OTPTemplate: React.FC<Readonly<OTPTemplateProps>> = ({
  otpCode,
  firstName = 'Shopkeeper',
}) => (
  <div style={styles.container}>
    <div style={styles.card}>
      <h1 style={styles.title}>Shelf-Bidder Verification</h1>
      <p style={styles.text}>Hi {firstName},</p>
      <p style={styles.text}>Welcome to Shelf-Bidder! Please use the verification code below to complete your registration:</p>
      
      <div style={styles.otpBox}>
        <span style={styles.otp}>{otpCode}</span>
      </div>
      
      <p style={styles.text}>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      <hr style={styles.divider} />
      <p style={styles.footer}>© {new Date().getFullYear()} Shelf-Bidder. All rights reserved.</p>
    </div>
  </div>
);

const styles = {
  container: {
    backgroundColor: '#f6f9fc',
    padding: '40px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e6ebf1',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '32px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#0f172a',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 24px 0',
  },
  text: {
    color: '#334155',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px 0',
    textAlign: 'left' as const,
  },
  otpBox: {
    backgroundColor: '#f8fafc',
    border: '2px dashed #94a3b8',
    borderRadius: '12px',
    margin: '32px 0',
    padding: '24px',
  },
  otp: {
    color: '#0f172a',
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '8px',
  },
  divider: {
    borderTop: '1px solid #e6ebf1',
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
