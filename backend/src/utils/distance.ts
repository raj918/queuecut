/**
 * Haversine formula to calculate great-circle distance between two coordinates in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format distance cleanly:
 * Below 1000m -> "450 m"
 * Above 1000m -> "1.4 km"
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Calculate bounding box (minLat, maxLat, minLon, maxLon) for a given radius in meters.
 * Used for pre-filtering database queries using standard B-Tree indexes on lat/lng.
 */
export function getBoundingBox(lat: number, lon: number, radiusMeters: number) {
  const earthRadius = 6371e3; // meters
  const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
  const dLon = (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLon: lon - dLon,
    maxLon: lon + dLon,
  };
}
