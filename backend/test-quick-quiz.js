import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testQuickQuiz() {
  try {
    // You need to replace this with a valid JWT token from your app
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    console.log('Testing Quick Quiz API...\n');
    
    const response = await axios.get(`${API_BASE_URL}/api/gamification/quick-quiz`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('\n📝 Quiz Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.quizzes && response.data.quizzes.length > 0) {
      console.log('\n✅ SUCCESS: Retrieved', response.data.quizzes.length, 'quiz questions');
      
      // Display first question
      const firstQ = response.data.quizzes[0];
      console.log('\n📌 First Question:');
      console.log('Question:', firstQ.question);
      console.log('Options:', firstQ.options);
      console.log('Correct Answer:', firstQ.correctAnswer);
      console.log('Explanation:', firstQ.explanation);
    } else {
      console.log('\n⚠️ No quiz questions found. Make sure you have:');
      console.log('1. Enrolled in courses');
      console.log('2. Courses have quizzes with questions');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testQuickQuiz();
