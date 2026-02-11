/**
 * API Testing Script
 * Run this script to test all API endpoints
 * Usage: node test-api.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;
let testLessonId = null;
let testSubjectId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, requiresAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (requiresAuth && authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    log(`\n📡 Testing: ${method} ${endpoint}`, 'cyan');
    const response = await fetch(url, options);
    const result = await response.json();

    if (response.ok) {
      log(`✅ SUCCESS: ${response.status}`, 'green');
      return { success: true, data: result, status: response.status };
    } else {
      log(`❌ FAILED: ${response.status} - ${result.error || result.message}`, 'red');
      return { success: false, error: result, status: response.status };
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Starting API Tests...\n', 'blue');
  log('='.repeat(60), 'blue');

  // 1. Health Check
  log('\n📋 1. HEALTH CHECK', 'yellow');
  await testEndpoint('GET', '/health');

  // 2. Auth - Register (if needed) or Login
  log('\n📋 2. AUTHENTICATION', 'yellow');
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'Test123!@#',
  });

  if (loginResult.success) {
    authToken = loginResult.data.token;
    testUserId = loginResult.data.user?.id || loginResult.data.user?._id;
    log(`🔑 Auth Token: ${authToken.substring(0, 20)}...`, 'green');
  } else {
    log('⚠️  Authentication failed. Some tests will be skipped.', 'yellow');
  }

  // 3. Students
  log('\n📋 3. STUDENTS API', 'yellow');
  if (authToken && testUserId) {
    await testEndpoint('GET', `/students/user/${testUserId}`, null, true);
    await testEndpoint('GET', '/students', null, true);
  }

  // 4. Subjects
  log('\n📋 4. SUBJECTS API', 'yellow');
  const subjectsResult = await testEndpoint('GET', '/subjects');
  if (subjectsResult.success && subjectsResult.data.length > 0) {
    testSubjectId = subjectsResult.data[0]._id || subjectsResult.data[0].id;
  }

  // 5. Lessons
  log('\n📋 5. LESSONS API', 'yellow');
  const lessonsResult = await testEndpoint('GET', '/lessons');
  if (lessonsResult.success && lessonsResult.data.length > 0) {
    testLessonId = lessonsResult.data[0]._id || lessonsResult.data[0].id;
    await testEndpoint('GET', `/lessons/${testLessonId}`);
  }

  // 6. Quizzes
  log('\n📋 6. QUIZZES API', 'yellow');
  await testEndpoint('GET', '/quizzes');
  if (testLessonId) {
    await testEndpoint('GET', `/quizzes/lesson/${testLessonId}`);
  }

  // 7. Progress (requires auth)
  log('\n📋 7. PROGRESS API', 'yellow');
  if (authToken && testUserId) {
    await testEndpoint('GET', `/progress/user/${testUserId}`, null, true);
  }

  // 8. Enrollments (requires auth)
  log('\n📋 8. ENROLLMENTS API', 'yellow');
  if (authToken) {
    await testEndpoint('GET', '/enrollments', null, true);
  }

  // 9. Cart (requires auth)
  log('\n📋 9. CART API', 'yellow');
  if (authToken) {
    await testEndpoint('GET', '/cart', null, true);
  }

  // 10. Wishlist (requires auth)
  log('\n📋 10. WISHLIST API', 'yellow');
  if (authToken) {
    await testEndpoint('GET', '/wishlist', null, true);
  }

  // 11. Suggestions (requires auth)
  log('\n📋 11. SUGGESTIONS API', 'yellow');
  if (authToken) {
    await testEndpoint('POST', '/suggestions', {
      topic: 'Test Topic for API Testing',
      description: 'This is a test suggestion',
      grade: '5',
      subject: 'Mathematics',
    }, true);
    await testEndpoint('GET', '/suggestions/my', null, true);
  }

  // 12. Notifications (requires auth)
  log('\n📋 12. NOTIFICATIONS API', 'yellow');
  if (authToken) {
    await testEndpoint('GET', '/notifications', null, true);
  }

  // 13. Reviews
  log('\n📋 13. REVIEWS API', 'yellow');
  if (testLessonId) {
    await testEndpoint('GET', `/reviews/lesson/${testLessonId}`);
  }

  // 14. Settings
  log('\n📋 14. SETTINGS API', 'yellow');
  await testEndpoint('GET', '/settings');

  // Final Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n✅ API Testing Complete!', 'green');
  log('\nNote: Some endpoints require authentication or specific data to be present.', 'yellow');
  log('Failed tests may be expected if data doesn\'t exist yet.\n', 'yellow');
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
