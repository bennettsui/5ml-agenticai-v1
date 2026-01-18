/**
 * Simple DeepSeek API Connection Test
 * Run with: node test-deepseek.js
 */

require('dotenv').config();
const axios = require('axios');

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY not found in environment variables');
    return;
  }

  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  console.log('🌐 Testing DeepSeek API connection...\n');

  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-reasoner',
        messages: [
          { role: 'user', content: '9.11 and 9.8, which is greater?' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ SUCCESS! DeepSeek API is working\n');
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.choices && response.data.choices[0]) {
      console.log('\n💬 Answer:', response.data.choices[0].message.content);
    }

    if (response.data.usage) {
      console.log('\n📈 Token Usage:');
      console.log('  - Prompt tokens:', response.data.usage.prompt_tokens);
      console.log('  - Completion tokens:', response.data.usage.completion_tokens);
      console.log('  - Total tokens:', response.data.usage.total_tokens);
    }

  } catch (error) {
    console.error('❌ FAILED! DeepSeek API error\n');

    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('📊 Status:', error.response.status);
      console.error('📄 Status Text:', error.response.statusText);
      console.error('📦 Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('🔗 Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('📡 No response received');
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('⚠️ Error:', error.message);
    }

    console.error('\n🔍 Full error:', error);
  }
}

// Run the test
testDeepSeek();
