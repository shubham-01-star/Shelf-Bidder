/**
 * Brand Products API
 * GET  /api/brand/products — List brand's products
 * POST /api/brand/products — Add new product
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for prototype
const products = new Map<string, Record<string, unknown>[]>();

export async function GET(request: NextRequest) {
  const brandId = request.headers.get('x-brand-id') || 'default';
  const brandProducts = products.get(brandId) || [];

  return NextResponse.json({
    success: true,
    data: { products: brandProducts, count: brandProducts.length },
  });
}

export async function POST(request: NextRequest) {
  try {
    const brandId = request.headers.get('x-brand-id') || 'default';
    const body = await request.json();
    const { name, category, dimensions } = body;

    if (!name || !category || !dimensions) {
      return NextResponse.json(
        { error: 'name, category, and dimensions are required' },
        { status: 400 }
      );
    }

    const product = {
      id: `prod-${Date.now()}`,
      brandOwnerId: brandId,
      name,
      brand: body.brand || 'Unknown',
      category,
      dimensions,
      weight: body.weight,
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString(),
    };

    const existing = products.get(brandId) || [];
    existing.push(product);
    products.set(brandId, existing);

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
