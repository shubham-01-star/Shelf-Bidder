'use client';

/**
 * Command Center Component
 * Feature: brand-dashboard-redesign
 * Task: 10.1 Create command center layout container
 * 
 * Left sidebar containing Product Catalog and Campaign Builder sections
 */

import { useRouter } from 'next/navigation';
import ProductTable from './ProductTable';

export default function CommandCenter() {
  const router = useRouter();

  const handleCreateCampaign = () => {
    router.push('/brand/campaigns/create-redesign');
  };

  return (
    <div className="space-y-6">
      {/* Product Catalog Section */}
      <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <h2 className="text-lg font-semibold text-[#1e293b] mb-4">
          Product Catalog
        </h2>
        <ProductTable />
      </div>

      {/* Campaign Builder Section */}
      <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <h2 className="text-lg font-semibold text-[#1e293b] mb-4">
          Campaign Builder
        </h2>
        <p className="text-sm text-[#64748b] mb-4">
          Launch new advertising campaigns to reach more customers.
        </p>
        <button
          onClick={handleCreateCampaign}
          className="w-full bg-[#ff5c61] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#ff4a50] transition-colors"
        >
          Create Campaign
        </button>
      </div>
    </div>
  );
}
