import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3001/api';

async function testProfilesEndpoint() {
  try {
    console.log('🧪 Testing Profiles API Endpoint...\n');
    
    // First, let's try without auth (should fail)
    console.log('1️⃣ Testing without authentication:');
    const noAuthResponse = await fetch(`${API_URL}/profiles`);
    console.log('   Status:', noAuthResponse.status);
    console.log('   Expected: 401 Unauthorized\n');
    
    // Create a test admin user or login
    console.log('2️⃣ Attempting to login as admin:');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mindsta.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('   ✅ Login successful!');
      console.log('   Token:', loginData.token ? 'Received' : 'Missing');
      
      if (loginData.token) {
        // Now test with auth
        console.log('\n3️⃣ Testing WITH authentication:');
        const authResponse = await fetch(`${API_URL}/profiles`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('   Status:', authResponse.status);
        
        if (authResponse.ok) {
          const profiles = await authResponse.json();
          console.log('   ✅ Success! Users found:', profiles.length);
          console.log('\n   Sample users:');
          profiles.slice(0, 3).forEach((user, i) => {
            console.log(`   ${i + 1}. ${user.fullName || 'No name'} (${user.email}) - ${user.userType}`);
          });
        } else {
          const error = await authResponse.text();
          console.log('   ❌ Failed:', error);
        }
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('   ❌ Login failed:', errorText);
      console.log('\n   💡 Tip: Create an admin user first:');
      console.log('      cd backend');
      console.log('      node scripts/create-admin.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm start)');
    console.log('   2. MongoDB is running');
    console.log('   3. Port 3001 is accessible');
  }
}

testProfilesEndpoint();
