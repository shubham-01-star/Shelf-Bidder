import { NextRequest, NextResponse } from 'next/server';

type ShelfType = 'eye-level' | 'counter-top' | 'entrance' | 'end-cap';

interface ImageSearchItem {
  id: string;
  title: string;
  location: string;
  shelfType: ShelfType;
  imageUrl: string;
  alt: string;
  estimatedDailyPrice: number;
  rating: number;
  isLive: boolean;
}

const MOCK_SHELF_IMAGES: ImageSearchItem[] = [
  {
    id: 'img-001',
    title: 'Main Counter Shelf',
    location: 'Gurgaon',
    shelfType: 'eye-level',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCs9EVgc1zjGCMnkbKQryhtphytgRAl_FGW6j00-Q6d6hyOQ3DbG7ytsEzEtxFvdpngYvLx11Nt6_CpPdy47Xx_gDSo0xDNiI3ZXbYGnM64YQngNUBk5ays4FRYu1xszc6QqfGjD9QDiqQjN5dBcRBOgiGjooRbPTz7_SfiLPVXj4JisFz-78fH3icYYQ2-tJONAqNCf0TnNeO4iQPzey_Eh8N7FWCWcxdfv29G4TJIbIUQP_my4ET95rZ0X8xb1hx_CO2mzkLQ-JI',
    alt: 'Organized retail shelf with beverages',
    estimatedDailyPrice: 450,
    rating: 4.9,
    isLive: true,
  },
  {
    id: 'img-002',
    title: 'Entrance Gondola',
    location: 'Gurgaon',
    shelfType: 'entrance',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBL4Na0Et4EpYjKjuOpwthz_yIsp3D_XT_9uivxOgLpGu2UQaT8j8xGGLTY-U8xLUqO8xDfqX1BFLxwk7O3v1PBKN4E_5D65uQVWEaiDIP3_cIgbhfnE7gEW1i3Vr-S-kVePTNzfQ6E5CdNEDtogP9bDxP512HpoQqN28Ai-ceFP6RSYbJjsp1jCgRjK8TpDe7XsgiPdj7Ti6lg8xaL6SaXwzjLDPvW77ZqtN8uX0Fb9BxFAeV9UgooJ_W0WGCTp42xp9VqZ66fyd0',
    alt: 'Grocery store aisle with snacks',
    estimatedDailyPrice: 1200,
    rating: 4.8,
    isLive: true,
  },
  {
    id: 'img-003',
    title: 'Beverage Cooler',
    location: 'Gurgaon',
    shelfType: 'eye-level',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYlSSPyaeSp3Yi3DG0gsCBwUnur18KvyPl4jiv6ZWDzR84fzQWocHYaaOILn4OvsZ8ObgrdsTYc1qkhZjAc9Ef6xrcOYmCjmTSfSmAxmUBxMXUvCK7xh0gXrH8fDz-70x6uD4VnrotFBM3gMIgxzD1UJy4hapcubEveRS63S-wX8kV53i8G_Nd0LHCEPmKhunUQ_Qu718tE1cYxwAM3O4BwmmHD-1jAlbkCFxIWx3JtiwFprLT6bFmV3vxHdeD3VSZRnU5cwvB33U',
    alt: 'Refrigerated display shelf in store',
    estimatedDailyPrice: 950,
    rating: 5.0,
    isLive: true,
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isValidShelfType(value: string): value is ShelfType {
  return ['eye-level', 'counter-top', 'entrance', 'end-cap'].includes(value);
}

function withCors(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = normalize(searchParams.get('location') || '');
  const shelfType = normalize(searchParams.get('shelfType') || 'eye-level');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  if (!location) {
    return withCors(NextResponse.json(
      { error: 'location is required' },
      { status: 400 }
    ));
  }

  if (!isValidShelfType(shelfType)) {
    return withCors(NextResponse.json(
      {
        error:
          "Invalid shelfType. Allowed values: eye-level, counter-top, entrance, end-cap",
      },
      { status: 400 }
    ));
  }

  const results = MOCK_SHELF_IMAGES.filter((item) => {
    const matchesLocation = normalize(item.location).includes(location);
    const matchesShelfType = item.shelfType === shelfType;
    return matchesLocation && matchesShelfType;
  }).slice(0, limit);

  return withCors(NextResponse.json({
    success: true,
    data: {
      filters: {
        location,
        shelfType,
        limit,
      },
      count: results.length,
      results,
    },
  }));
}
