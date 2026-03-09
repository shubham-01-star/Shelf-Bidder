'use client';

/**
 * Product Table Component
 * Feature: brand-dashboard-redesign
 * Task: 7.1 Create product table component
 * 
 * Displays brand products in a table format with responsive design
 */

import { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  imageUrl?: string;
}

export default function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5c61]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[#64748b]">
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-[#64748b]">
        <p>No products available. Add your first product to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">
              Product Name
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">
              Dimensions (W×H×D cm)
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-gray-100 hover:bg-[#f8f5f5] transition-colors"
            >
              <td className="py-3 px-4 text-sm text-[#1e293b]">
                {product.name}
              </td>
              <td className="py-3 px-4 text-sm text-[#64748b]">
                {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
