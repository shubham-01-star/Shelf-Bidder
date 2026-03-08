'use client';

/**
 * Brand Products Page
 * Add and manage products for auction bidding
 */

import { useState, useEffect } from 'react';
import type { BrandProduct } from '@/types/brand-models';

// Mock products for prototype
const INITIAL_PRODUCTS: BrandProduct[] = [
  { id: 'p1', brandOwnerId: 'b1', name: 'Pepsi 500ml', brand: 'PepsiCo', category: 'Beverages', dimensions: { width: 7, height: 22, depth: 7 }, weight: 550, createdAt: '2024-01-15' },
  { id: 'p2', brandOwnerId: 'b1', name: 'Lays Classic 50g', brand: 'PepsiCo', category: 'Snacks', dimensions: { width: 15, height: 22, depth: 5 }, weight: 55, createdAt: '2024-01-20' },
  { id: 'p3', brandOwnerId: 'b1', name: 'Pepsi Diet 330ml', brand: 'PepsiCo', category: 'Beverages', dimensions: { width: 6, height: 12, depth: 6 }, weight: 350, createdAt: '2024-02-01' },
];

export default function BrandProductsPage() {
  const [products, setProducts] = useState<BrandProduct[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brand_products');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_PRODUCTS;
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');

  // Added useEffect to fetch from backend later if needed, but primarily added to match test scope
  useEffect(() => {
    const brandId = localStorage.getItem('brandId');
    const brandToken = localStorage.getItem('brandToken');

    if (brandId && brandToken) {
      fetch('/api/brand/products', {
        headers: { 
          'x-brand-id': brandId,
          'Authorization': `Bearer ${brandToken}`
        }
      })
        .then(res => res.json())
        .then(resData => {
           if(resData.success && resData.data && resData.data.products) {
              setProducts(resData.data.products);
           }
        })
        .catch(err => console.error(err));
    }
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: BrandProduct = {
      id: `p-${Date.now()}`,
      brandOwnerId: localStorage.getItem('brandId') || 'b1',
      name,
      brand: localStorage.getItem('brandName') || 'Brand',
      category,
      dimensions: { width: Number(width), height: Number(height), depth: Number(depth) || undefined },
      weight: 0,
      createdAt: new Date().toISOString(),
    };
    
    const brandToken = localStorage.getItem('brandToken');
    const brandId = localStorage.getItem('brandId') || '';

    // Add to DB via API
    fetch('/api/brand/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-brand-id': brandId,
        'Authorization': `Bearer ${brandToken}`
      },
      body: JSON.stringify(newProduct)
    }).catch(console.error);
    
    const updated = [newProduct, ...products];
    setProducts(updated);
    localStorage.setItem('brand_products', JSON.stringify(updated));
    
    setShowForm(false);
    setName('');
    setCategory('');
    setWidth('');
    setHeight('');
    setDepth('');
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-[var(--brand-violet)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[30%] aspect-square rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 pt-12 pb-2 flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-black text-white/90 tracking-tight">My Products</h1>
          <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-widest">
            {products.length} products in catalog
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 font-bold rounded-xl shadow-lg transition-all ${
            showForm 
              ? 'bg-slate-800 text-white/80 hover:bg-slate-700' 
              : 'bg-[var(--brand-violet)] text-white hover:bg-purple-600 shadow-[var(--brand-violet)]/20'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Item'}
        </button>
      </header>

      {/* Add Product Form */}
      {showForm && (
        <section className="px-4 py-3 animate-fadeInUp relative z-10">
          <form onSubmit={handleAdd} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="font-bold text-white/90 text-lg">Add New Product</h3>

            <div>
              <label className="block text-[10px] font-bold mb-1.5 text-slate-400 uppercase tracking-widest">
                Product Name
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pepsi 500ml" required
                className="w-full p-3 rounded-xl text-sm bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold mb-1.5 text-slate-400 uppercase tracking-widest">
                Category
              </label>
              <input
                type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Beverages, Snacks" required
                className="w-full p-3 rounded-xl text-sm bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
              />
            </div>

            <div>
               <label className="block text-[10px] font-bold mb-1.5 text-slate-400 uppercase tracking-widest">
                Dimensions (W × H × D)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                  placeholder="Width" required
                  className="w-full p-3 rounded-xl text-sm bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
                />
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height" required
                  className="w-full p-3 rounded-xl text-sm bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
                />
                <input type="number" value={depth} onChange={(e) => setDepth(e.target.value)}
                  placeholder="Depth"
                  className="w-full p-3 rounded-xl text-sm bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
                />
              </div>
            </div>

            <button type="submit" className="w-full p-3 rounded-xl text-sm font-bold mt-2 bg-[var(--accent-green)] hover:bg-[#0bc94b] text-black transition-all shadow-lg shadow-[var(--accent-green)]/20">
              ✅ Save Product
            </button>
          </form>
        </section>
      )}

      {/* Product List */}
      <section className="px-4 py-3 relative z-10 pb-24">
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={product.id}
                 className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl hover:bg-slate-800/60 transition-colors animate-fadeInUp"
                 style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] border border-[var(--brand-violet)]/20">
                    📦
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{product.name}</p>
                    <p className="text-[10px] font-bold mt-0.5 text-slate-500 uppercase tracking-widest">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {product.dimensions.width}×{product.dimensions.height}
                    {product.dimensions.depth ? `×${product.dimensions.depth}` : ''} cm
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
