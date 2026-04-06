/**
 * Simple Dashboard Module Test
 * Tests that the dashboard module is properly integrated
 */

const { dashboardRoutes } = require('./dist/modules/dashboard/index.js');

console.log('🧪 Testing Dashboard Module Integration');
console.log('========================================\n');

// Test 1: Check if dashboardRoutes is defined
console.log('1. Checking if dashboardRoutes is exported...');
if (dashboardRoutes) {
  console.log('✅ dashboardRoutes is exported');
} else {
  console.log('❌ dashboardRoutes is NOT exported');
  process.exit(1);
}

// Test 2: Check if dashboardRoutes is a Router
console.log('\n2. Checking if dashboardRoutes is a Router...');
if (dashboardRoutes && dashboardRoutes.stack) {
  console.log('✅ dashboardRoutes is a valid Express Router');
  console.log(`   Routes registered: ${dashboardRoutes.stack.length}`);
} else {
  console.log('❌ dashboardRoutes is NOT a valid Express Router');
  process.exit(1);
}

// Test 3: List all registered routes
console.log('\n3. Listing registered routes:');
dashboardRoutes.stack.forEach((layer, index) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    console.log(`   ${index + 1}. ${methods} ${layer.route.path}`);
  }
});

console.log('\n========================================');
console.log('✅ Dashboard module integration test passed!');
console.log('\nNote: To test the actual endpoints, start the server with:');
console.log('  npm run dev');
console.log('\nThen use the test-dashboard.sh script or Postman.');
