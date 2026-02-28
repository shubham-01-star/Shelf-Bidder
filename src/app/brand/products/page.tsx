'use client';

/**
 * Brand Products Page
 * Add and manage products for auction bidding
 */

import { useState } from 'react';
import type { BrandProduct } from '@/types/brand-models';

// Mock products for prototype
const INITIAL_PRODUCTS: BrandProduct[] = [
  { id: 'p1', brandOwnerId: 'b1', name: 'Pepsi 500ml', brand: 'PepsiCo', category: 'Beverages', dimensions: { width: 7, height: 22, depth: 7 }, weight: 550, createdAt: '2024-01-15' },
  { id: 'p2', brandOwnerId: 'b1', name: 'Lays Classic 50g', brand: 'PepsiCo', category: 'Snacks', dimensions: { width: 15, height: 22, depth: 5 }, weight: 55, createdAt: '2024-01-20' },
  { id: 'p3', brandOwnerId: 'b1', name: 'Pepsi Diet 330ml', brand: 'PepsiCo', category: 'Beverages', dimensions: { width: 6, height: 12, depth: 6 }, weight: 350, createdAt: '2024-02-01' },
];

export default function BrandProductsPage() {
  const [products, setProducts] = useState<BrandProduct[]>(INITIAL_PRODUCTS);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: BrandProduct = {
      id: `p-${Date.now()}`,
      brandOwnerId: localStorage.getItem('brandId') || 'b1',
      name,
      brand: localStorage.getItem('brandName') || 'Brand',
      category,
      dimensions: { width: Number(width), height: Number(height), depth: Number(depth) || undefined },
      createdAt: new Date().toISOString(),
    };
    setProducts([newProduct, ...products]);
    setShowForm(false);
    setName('');
    setCategory('');
    setWidth('');
    setHeight('');
    setDepth('');
  };

  return (
    <div className="page-container gradient-mesh">
      {/* Header */}
      <header className="p-4 pt-12 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {products.length} products in catalog
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ padding: '10px 16px', minHeight: 'auto', fontSize: '14px' }}
        >
          {showForm ? '✕ Cancel' : '+ Add'}
        </button>
      </header>

      {/* Add Product Form */}
      {showForm && (
        <section className="px-4 py-3 animate-fadeInUp">
          <form onSubmit={handleAdd} className="glass-card p-5 space-y-3">
            <h3 className="font-semibold text-base">Add New Product</h3>

            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Product name (e.g. Pepsi 500ml)" required
              className="w-full p-3 rounded-xl text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
            />

            <input
              type="text" value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. Beverages, Snacks)" required
              className="w-full p-3 rounded-xl text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
            />

            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                placeholder="Width (cm)" required
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                placeholder="Height (cm)" required
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <input type="number" value={depth} onChange={(e) => setDepth(e.target.value)}
                placeholder="Depth (cm)"
                className="w-full p-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-success w-full">
              ✅ Add Product
            </button>
          </form>
        </section>
      )}

      {/* Product List */}
      <section className="px-4 py-3">
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={product.id}
                 className="glass-card p-4 animate-fadeInUp"
                 style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(108, 99, 255, 0.15)', fontSize: '24px' }}>
                    📦
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {product.dimensions.width}×{product.dimensions.height}
                    {product.dimensions.depth ? `×${product.dimensions.depth}` : ''} cm
                  </p>
                  <span className="badge badge-info text-xs mt-1">Ready</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
