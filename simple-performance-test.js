const http = require('http');
const https = require('https');
const fs = require('fs');

// Test configuration
const baseUrl = 'http://localhost:3000';
const testImages = [
  '/images/games/gates-of-olympus.webp',
  '/images/games/live-roulette.webp', 
  '/images/games/sweet-bonanza.webp',
  '/images/games/wisdom-of-atlanta.webp',
  '/images/games/Blackjack.webp',
  '/images/games/sun-of-egypt.webp',
  '/images/games/poker.webp',
  '/images/games/enfejar.webp'
];

// Function to make HTTP request and measure time
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          responseTime,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length'] || data.length
        });
      });
    });
    
    req.on('error', (err) => {
      reject({ url, error: err.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({ url, error: 'Timeout' });
    });
  });
}

async function runTests() {
  console.log('🚀 Starting Simple Performance Tests...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    homepage: null,
    images: [],
    errors: [],
    summary: {}
  };
  
  try {
    // Test homepage
    console.log('📊 Testing homepage...');
    const homepageResult = await makeRequest(baseUrl);
    results.homepage = homepageResult;
    
    if (homepageResult.statusCode === 200) {
      console.log(`✅ Homepage: ${homepageResult.responseTime}ms (${homepageResult.statusCode})`);
    } else {
      console.log(`❌ Homepage: ${homepageResult.responseTime}ms (${homepageResult.statusCode})`);
      results.errors.push(homepageResult);
    }
    
    // Test images
    console.log('\n📸 Testing game images...');
    for (const imagePath of testImages) {
      try {
        const imageResult = await makeRequest(baseUrl + imagePath);
        results.images.push(imageResult);
        
        if (imageResult.statusCode === 200) {
          console.log(`✅ ${imagePath.split('/').pop()}: ${imageResult.responseTime}ms (${Math.round(imageResult.contentLength/1024)}KB)`);
        } else {
          console.log(`❌ ${imagePath.split('/').pop()}: ${imageResult.responseTime}ms (${imageResult.statusCode})`);
          results.errors.push(imageResult);
        }
      } catch (error) {
        console.log(`❌ ${imagePath.split('/').pop()}: ${error.error}`);
        results.errors.push(error);
      }
    }
    
    // Test Next.js image optimization
    console.log('\n🔧 Testing Next.js image optimization...');
    const optimizedImageTests = [
      '/_next/image?url=%2Fimages%2Fgames%2Fgates-of-olympus.webp&w=640&q=75',
      '/_next/image?url=%2Fimages%2Fgames%2Fwisdom-of-atlanta.webp&w=1200&q=75'
    ];
    
    for (const optimizedPath of optimizedImageTests) {
      try {
        const result = await makeRequest(baseUrl + optimizedPath);
        const imageName = optimizedPath.match(/games%2F([^&]+)\.webp/)?.[1] || 'unknown';
        
        if (result.statusCode === 200) {
          console.log(`✅ Optimized ${imageName}: ${result.responseTime}ms (${result.contentType})`);
        } else {
          console.log(`❌ Optimized ${imageName}: ${result.responseTime}ms (${result.statusCode})`);
          results.errors.push(result);
        }
      } catch (error) {
        console.log(`❌ Optimized image: ${error.error}`);
        results.errors.push(error);
      }
    }
    
    // Calculate summary
    const successfulImages = results.images.filter(img => img.statusCode === 200);
    const failedImages = results.images.filter(img => img.statusCode !== 200);
    const avgResponseTime = successfulImages.length > 0 
      ? successfulImages.reduce((sum, img) => sum + img.responseTime, 0) / successfulImages.length 
      : 0;
    
    results.summary = {
      totalImages: testImages.length,
      successfulImages: successfulImages.length,
      failedImages: failedImages.length,
      averageResponseTime: Math.round(avgResponseTime),
      totalErrors: results.errors.length,
      homepageTime: results.homepage?.responseTime || 0
    };
    
    console.log('\n📊 Summary:');
    console.log(`   Homepage load time: ${results.summary.homepageTime}ms`);
    console.log(`   Images tested: ${results.summary.totalImages}`);
    console.log(`   Successful: ${results.summary.successfulImages}`);
    console.log(`   Failed: ${results.summary.failedImages}`);
    console.log(`   Average image load time: ${results.summary.averageResponseTime}ms`);
    console.log(`   Total errors: ${results.summary.totalErrors}`);
    
    // Performance rating
    if (results.summary.failedImages === 0 && results.summary.homepageTime < 2000) {
      console.log('\n🎉 EXCELLENT PERFORMANCE! 🚀');
      console.log('   ✅ All images loading successfully');
      console.log('   ✅ Homepage under 2 seconds');
    } else if (results.summary.failedImages < 2 && results.summary.homepageTime < 5000) {
      console.log('\n👍 GOOD PERFORMANCE!');
      if (results.summary.failedImages > 0) {
        console.log(`   ⚠️  ${results.summary.failedImages} image(s) failing`);
      }
      if (results.summary.homepageTime >= 2000) {
        console.log('   ⚠️  Homepage could be faster');
      }
    } else {
      console.log('\n⚠️  PERFORMANCE NEEDS IMPROVEMENT');
      if (results.summary.failedImages >= 2) {
        console.log(`   ❌ ${results.summary.failedImages} images failing`);
      }
      if (results.summary.homepageTime >= 5000) {
        console.log('   ❌ Homepage too slow');
      }
    }
    
    // Save results
    fs.writeFileSync('simple-performance-results.json', JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: simple-performance-results.json`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    results.errors.push({ error: error.message });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 