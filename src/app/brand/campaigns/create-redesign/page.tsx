'use client';

/**
 * Campaign Creation Page
 * Feature: brand-dashboard-redesign
 * Task: 8.2 Implement campaign submission logic
 * 
 * Page for creating new campaigns with API integration
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CampaignCreationForm from '@/components/brand/CampaignCreationForm';

interface CampaignFormData {
  productName: string;
  category: string;
  totalBudget: string;
  rewardPerPlacement: string;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: CampaignFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Get brand info from localStorage
      const brandToken = localStorage.getItem('brandToken');
      const brandName = localStorage.getItem('brandName');

      if (!brandToken) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Call campaigns API endpoint
      const response = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${brandToken}`,
        },
        body: JSON.stringify({
          productName: formData.productName,
          brandName: brandName || 'Unknown Brand',
          category: formData.category,
          budget: parseFloat(formData.totalBudget),
          payoutPerTask: parseFloat(formData.rewardPerPlacement),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create campaign: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Show success message
      alert('Campaign created successfully!');
      
      // Redirect to dashboard
      router.push('/brand/dashboard-redesign');
    } catch (err) {
      console.error('Campaign creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f5]">
      {/* Header */}
      <header className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1e293b]">Create New Campaign</h1>
            <button
              onClick={() => router.push('/brand/dashboard-redesign')}
              className="text-[#64748b] hover:text-[#1e293b] transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-[1.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#1e293b] mb-2">
              Campaign Details
            </h2>
            <p className="text-[#64748b]">
              Fill in the details below to launch your advertising campaign.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <CampaignCreationForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </main>
    </div>
  );
}
