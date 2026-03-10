'use client';

/**
 * Campaign Creation Form Component
 * Feature: brand-dashboard-redesign
 * Task: 8.1 Create campaign creation form
 * 
 * Form for creating new advertising campaigns with validation
 */

import { useState, useEffect } from 'react';

interface CampaignFormData {
  productName: string;
  category: string;
  totalBudget: string;
  rewardPerPlacement: string;
}

interface CampaignCreationFormProps {
  onSubmit: (data: CampaignFormData) => Promise<void>;
  loading?: boolean;
}

export default function CampaignCreationForm({ onSubmit, loading = false }: CampaignCreationFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    productName: '',
    category: '',
    totalBudget: '',
    rewardPerPlacement: '',
  });

  const [errors, setErrors] = useState<Partial<CampaignFormData>>({});
  // Calculate potential reach - derived state is preferred over useEffect to avoid cascading renders
  const budget = parseFloat(formData.totalBudget) || 0;
  const reward = parseFloat(formData.rewardPerPlacement) || 0;
  const potentialReach = (budget > 0 && reward > 0) ? Math.floor(budget / reward) : 0;

  const validateForm = (): boolean => {
    const newErrors: Partial<CampaignFormData> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    const budget = parseFloat(formData.totalBudget);
    if (!formData.totalBudget || isNaN(budget) || budget <= 0) {
      newErrors.totalBudget = 'Total budget must be greater than 0';
    }

    const reward = parseFloat(formData.rewardPerPlacement);
    if (!formData.rewardPerPlacement || isNaN(reward) || reward <= 0) {
      newErrors.rewardPerPlacement = 'Reward per placement must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof CampaignFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Name */}
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-[#1e293b] mb-2">
          Product Name
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleChange}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg border ${errors.productName ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-[#ff5c61] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="e.g., Diet Coke 330ml"
        />
        {errors.productName && (
          <p className="mt-1 text-sm text-red-500">{errors.productName}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-[#1e293b] mb-2">
          Category
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg border ${errors.category ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-[#ff5c61] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="e.g., Beverages"
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category}</p>
        )}
      </div>

      {/* Total Budget */}
      <div>
        <label htmlFor="totalBudget" className="block text-sm font-medium text-[#1e293b] mb-2">
          Total Budget (₹)
        </label>
        <input
          type="number"
          id="totalBudget"
          name="totalBudget"
          value={formData.totalBudget}
          onChange={handleChange}
          disabled={loading}
          min="0"
          step="0.01"
          className={`w-full px-4 py-2 rounded-lg border ${errors.totalBudget ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-[#ff5c61] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="10000"
        />
        {errors.totalBudget && (
          <p className="mt-1 text-sm text-red-500">{errors.totalBudget}</p>
        )}
      </div>

      {/* Reward per Placement */}
      <div>
        <label htmlFor="rewardPerPlacement" className="block text-sm font-medium text-[#1e293b] mb-2">
          Reward per Placement (₹)
        </label>
        <input
          type="number"
          id="rewardPerPlacement"
          name="rewardPerPlacement"
          value={formData.rewardPerPlacement}
          onChange={handleChange}
          disabled={loading}
          min="0"
          step="0.01"
          className={`w-full px-4 py-2 rounded-lg border ${errors.rewardPerPlacement ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-[#ff5c61] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="100"
        />
        {errors.rewardPerPlacement && (
          <p className="mt-1 text-sm text-red-500">{errors.rewardPerPlacement}</p>
        )}
      </div>

      {/* Potential Reach Display */}
      {potentialReach > 0 && (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <p className="text-sm text-[#64748b] mb-1">Potential Reach</p>
          <p className="text-2xl font-bold text-[#1e293b]">
            {potentialReach.toLocaleString()} placements
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#ff5c61] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#ff4a50] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Launching Campaign...</span>
          </>
        ) : (
          'Launch Campaign'
        )}
      </button>
    </form>
  );
}
