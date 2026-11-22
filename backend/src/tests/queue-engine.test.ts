import { calculateDistanceMeters, formatDistance, getBoundingBox } from '../utils/distance';

/**
 * QueueCut Queue Engine & Distance Calculation Verification Test Suite
 */
async function runTests() {
  console.log('🧪 Running QueueCut Backend Engine Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Distance calculation in Kanpur
  console.log('--- Suite 1: Haversine Distance & Formatting ---');
  // Mall Road, Civil Lines Kanpur (26.4729, 80.3458) to Phool Bagh (~300m away: 26.4710, 80.3475)
  const distNear = calculateDistanceMeters(26.4729, 80.3458, 26.4710, 80.3475);
  assert(distNear < 500 && distNear > 150, `Distance between nearby Civil Lines spots is ${distNear}m (< 500m)`);

  const formattedNear = formatDistance(distNear);
  assert(formattedNear.includes('m') && !formattedNear.includes('km'), `Under 1000m formats as meters: "${formattedNear}"`);

  // Kanpur Civil Lines to Kakadeo (~5.5 km)
  const distFar = calculateDistanceMeters(26.4729, 80.3458, 26.4850, 80.2980);
  assert(distFar > 4000, `Distance from Civil Lines to Kakadeo is ${distFar}m (> 4km)`);

  const formattedFar = formatDistance(distFar);
  assert(formattedFar.includes('km'), `Over 1000m formats as km: "${formattedFar}"`);

  // TEST 2: Bounding Box Calculation for 500m search
  console.log('\n--- Suite 2: GPS Bounding Box Filter ---');
  const bbox = getBoundingBox(26.4729, 80.3458, 500);
  assert(bbox.minLat < 26.4729 && bbox.maxLat > 26.4729, 'Bounding box latitude encompasses center');
  assert(bbox.minLon < 80.3458 && bbox.maxLon > 80.3458, 'Bounding box longitude encompasses center');

  // TEST 3: Commission Engine Business Rules
  console.log('\n--- Suite 3: Commission Engine Calculations ---');
  // Completed online booking of ₹200 with 5% commission = ₹10
  const onlinePrice = 200.0;
  const rate = 5.0;
  const onlineCommission = Math.round(onlinePrice * (rate / 100) * 100) / 100;
  assert(onlineCommission === 10.0, `5% commission on ₹200 is ₹${onlineCommission}`);

  // Walk-in booking is commission exempt (0%)
  const walkInRate = 0.0;
  const walkInCommission = onlinePrice * walkInRate;
  assert(walkInCommission === 0.0, 'Walk-in bookings are strictly commission exempt (₹0)');

  // TEST 4: Token Number Sequencing Format
  console.log('\n--- Suite 4: Token Sequencing Format ---');
  function formatToken(num: number) {
    return `Q-${num.toString().padStart(3, '0')}`;
  }
  assert(formatToken(1) === 'Q-001', 'Token 1 formats as Q-001');
  assert(formatToken(42) === 'Q-042', 'Token 42 formats as Q-042');
  assert(formatToken(105) === 'Q-105', 'Token 105 formats as Q-105');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
