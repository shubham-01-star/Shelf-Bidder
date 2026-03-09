/**
 * MetricsCard Component
 * Feature: brand-dashboard-redesign
 * Task: 6.1 Create MetricsCard component
 * 
 * Reusable card component for displaying dashboard metrics with:
 * - Icon, label, and value props
 * - Gradient styling for wallet balance card
 * - Currency formatting utility
 * - Loading state skeleton
 * - Soft shadows and rounded corners (1.5rem)
 * 
 * Requirements: 1.3, 1.6, 1.7, 3.3, 3.7, 6.4, 6.6
 */

import React from 'react';

export interface MetricsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isLoading?: boolean;
  isGradient?: boolean;
  className?: string;
}

/**
 * Currency formatting utility function
 * Formats numbers as Indian Rupees with thousand separators
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted string with ₹ symbol and thousand separators
 * 
 * Examples:
 * - formatCurrency(12500) => "₹12,500"
 * - formatCurrency(1000000) => "₹10,00,000"
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * MetricsCard Component
 * 
 * Displays a metric with icon, label, and value in a styled card.
 * Supports gradient styling for special cards (e.g., wallet balance).
 * Shows skeleton loader during data fetch.
 */
export function MetricsCard({
  icon,
  label,
  value,
  isLoading = false,
  isGradient = false,
  className = '',
}: MetricsCardProps) {
  // Base card styles: white background, soft shadow, rounded corners
  const baseStyles = 'rounded-3xl p-6 transition-all duration-200';
  
  // Gradient styles for wallet balance card (purple-600 to blue-600)
  const gradientStyles = isGradient
    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
    : 'bg-white shadow-soft-shadow';
  
  // Text color styles
  const textStyles = isGradient ? 'text-white' : 'text-text-main';
  const labelStyles = isGradient ? 'text-white/80' : 'text-text-sub';

  return (
    <div className={`${baseStyles} ${gradientStyles} ${className}`}>
      {isLoading ? (
        // Loading state skeleton
        <div className="animate-pulse">
          <div className={`w-10 h-10 rounded-full mb-3 ${isGradient ? 'bg-white/20' : 'bg-gray-200'}`} />
          <div className={`h-4 rounded mb-2 w-24 ${isGradient ? 'bg-white/20' : 'bg-gray-200'}`} />
          <div className={`h-8 rounded w-32 ${isGradient ? 'bg-white/20' : 'bg-gray-200'}`} />
        </div>
      ) : (
        <>
          {/* Icon */}
          <div className={`mb-3 ${isGradient ? 'text-white' : 'text-brand-accent'}`}>
            {icon}
          </div>
          
          {/* Label */}
          <div className={`text-sm font-medium mb-1 ${labelStyles}`}>
            {label}
          </div>
          
          {/* Value */}
          <div className={`text-3xl font-bold ${textStyles}`}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </div>
        </>
      )}
    </div>
  );
}

export default MetricsCard;
