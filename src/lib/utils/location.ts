/**
 * Location Utility Functions
 * 
 * Task 3.1: Create location utility functions for campaign matching
 * 
 * These utilities handle:
 * - Extracting city names from full addresses
 * - Normalizing city names for consistent matching
 * - Flexible location matching including regional support
 */

/**
 * Extract city from a full address string
 * 
 * Handles common Indian address formats:
 * - "Shop 123, Main Market, Delhi" → "Delhi"
 * - "Sector 18, Noida" → "Noida"
 * - "DLF Phase 3, Gurgaon" → "Gurgaon"
 * 
 * @param address - Full address string
 * @returns Extracted city name or 'Unknown' if extraction fails
 */
export function extractCityFromAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return 'Unknown';
  }

  // Split by commas and trim whitespace
  const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);
  
  if (parts.length === 0) {
    return 'Unknown';
  }

  // City is typically the last component in Indian addresses
  // e.g., "Shop 123, Main Market, Delhi" → "Delhi"
  const lastPart = parts[parts.length - 1];
  
  // If last part looks like a pincode (6 digits), use second-to-last
  if (/^\d{6}$/.test(lastPart) && parts.length > 1) {
    return parts[parts.length - 2];
  }

  return lastPart;
}

/**
 * Normalize city name for consistent matching
 * 
 * Handles:
 * - Spelling variations (Gurgaon ↔ Gurugram)
 * - Case normalization (lowercase)
 * - Whitespace trimming
 * 
 * @param city - City name to normalize
 * @returns Normalized city name
 */
export function normalizeCityName(city: string): string {
  if (!city || typeof city !== 'string') {
    return '';
  }

  let normalized = city.trim().toLowerCase();

  // Handle common spelling variations
  const variations: Record<string, string> = {
    'gurgaon': 'gurugram',
    'gurugram': 'gurugram',
    'bombay': 'mumbai',
    'calcutta': 'kolkata',
    'madras': 'chennai',
    'bangalore': 'bengaluru',
    'bengaluru': 'bengaluru',
  };

  return variations[normalized] || normalized;
}

/**
 * Check if shopkeeper location matches campaign target location
 * 
 * Supports:
 * - Exact matches (case-insensitive)
 * - Regional matches (Delhi NCR includes Delhi, Gurgaon, Noida, Faridabad, Ghaziabad)
 * - Partial matches (substring matching)
 * 
 * @param shopkeeperCity - Shopkeeper's city
 * @param targetLocation - Campaign's target location
 * @returns true if locations match, false otherwise
 */
export function isLocationMatch(shopkeeperCity: string, targetLocation: string): boolean {
  if (!shopkeeperCity || !targetLocation) {
    return false;
  }

  const normalizedShopkeeper = normalizeCityName(shopkeeperCity);
  const normalizedTarget = normalizeCityName(targetLocation);

  // Exact match
  if (normalizedShopkeeper === normalizedTarget) {
    return true;
  }

  // Regional matching: Delhi NCR
  const delhiNCRCities = ['delhi', 'gurugram', 'noida', 'faridabad', 'ghaziabad'];
  const isDelhiNCRTarget = normalizedTarget.includes('delhi ncr') || normalizedTarget.includes('ncr');
  const isShopkeeperInDelhiNCR = delhiNCRCities.includes(normalizedShopkeeper);

  if (isDelhiNCRTarget && isShopkeeperInDelhiNCR) {
    return true;
  }

  // If shopkeeper is in Delhi NCR and target is one of the NCR cities
  if (normalizedShopkeeper === 'delhi ncr' || normalizedShopkeeper === 'ncr') {
    if (delhiNCRCities.includes(normalizedTarget)) {
      return true;
    }
  }

  // Partial match (substring)
  if (normalizedShopkeeper.includes(normalizedTarget) || normalizedTarget.includes(normalizedShopkeeper)) {
    return true;
  }

  return false;
}
