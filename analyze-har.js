const fs = require('fs');

function analyzeHAR(harFilePath) {
  console.log('🔍 Analyzing HAR file performance data...\n');
  
  try {
    const harData = JSON.parse(fs.readFileSync(harFilePath, 'utf8'));
    const entries = harData.log.entries;
    
    console.log(`📊 Total HTTP requests: ${entries.length}`);
    console.log(`🕐 Test started: ${harData.log.pages[0].startedDateTime}`);
    
    // Analyze main page load
    const mainPage = entries.find(entry => 
      entry.request.url === 'http://localhost:3000/' || 
      entry.request.url.endsWith('localhost:3000/')
    );
    
    if (mainPage) {
      console.log(`\n🏠 Main Page Performance:`);
      console.log(`   URL: ${mainPage.request.url}`);
      console.log(`   Status: ${mainPage.response.status}`);
      console.log(`   Total Time: ${mainPage.time.toFixed(2)}ms`);
      console.log(`   Content Size: ${(mainPage.response.content.size / 1024).toFixed(2)}KB`);
    }
    
    // Analyze image requests
    const imageRequests = entries.filter(entry => 
      entry.request.url.includes('/images/games/') ||
      entry.request.url.includes('/_next/image')
    );
    
    console.log(`\n📸 Image Performance Analysis:`);
    console.log(`   Total image requests: ${imageRequests.length}`);
    
    const imageStats = {
      webp: [],
      optimized: [],
      errors: [],
      successful: []
    };
    
    imageRequests.forEach(entry => {
      const url = entry.request.url;
      const status = entry.response.status;
      const time = entry.time;
      const size = entry.response.content.size;
      const contentType = entry.response.headers.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
      
      if (status === 404) {
        imageStats.errors.push({ url, status, time });
      } else if (status === 200) {
        imageStats.successful.push({ url, status, time, size, contentType });
        
        if (url.includes('.webp')) {
          imageStats.webp.push({ url, time, size, contentType });
        }
        
        if (url.includes('/_next/image')) {
          imageStats.optimized.push({ url, time, size, contentType });
        }
      }
    });
    
    // Display image statistics
    console.log(`   ✅ Successful: ${imageStats.successful.length}`);
    console.log(`   ❌ Failed (404): ${imageStats.errors.length}`);
    console.log(`   🖼️  WebP images: ${imageStats.webp.length}`);
    console.log(`   🔧 Next.js optimized: ${imageStats.optimized.length}`);
    
    if (imageStats.errors.length > 0) {
      console.log(`\n❌ Image Errors Found:`);
      imageStats.errors.forEach(img => {
        const filename = img.url.split('/').pop();
        console.log(`   - ${filename}: ${img.status} (${img.time.toFixed(2)}ms)`);
      });
    } else {
      console.log(`\n✅ No image errors - Perfect!`);
    }
    
    if (imageStats.webp.length > 0) {
      console.log(`\n🖼️  WebP Image Performance:`);
      const avgWebpTime = imageStats.webp.reduce((sum, img) => sum + img.time, 0) / imageStats.webp.length;
      const totalWebpSize = imageStats.webp.reduce((sum, img) => sum + img.size, 0);
      
      console.log(`   Average load time: ${avgWebpTime.toFixed(2)}ms`);
      console.log(`   Total size: ${(totalWebpSize / 1024).toFixed(2)}KB`);
      
      imageStats.webp.forEach(img => {
        const filename = img.url.split('/').pop();
        console.log(`   ✓ ${filename}: ${img.time.toFixed(2)}ms (${(img.size / 1024).toFixed(1)}KB)`);
      });
    }
    
    if (imageStats.optimized.length > 0) {
      console.log(`\n🔧 Next.js Optimized Images:`);
      const avgOptimizedTime = imageStats.optimized.reduce((sum, img) => sum + img.time, 0) / imageStats.optimized.length;
      
      console.log(`   Average optimization time: ${avgOptimizedTime.toFixed(2)}ms`);
      
      imageStats.optimized.forEach(img => {
        const match = img.url.match(/games%2F([^&]+)\./);
        const filename = match ? match[1] : 'unknown';
        console.log(`   ⚡ ${filename}: ${img.time.toFixed(2)}ms (${img.contentType})`);
      });
    }
    
    // Overall performance analysis
    const totalTime = entries.length > 0 ? Math.max(...entries.map(e => new Date(e.startedDateTime).getTime() + e.time)) - Math.min(...entries.map(e => new Date(e.startedDateTime).getTime())) : 0;
    
    console.log(`\n📊 Overall Performance Summary:`);
    console.log(`   Total load time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Successful requests: ${entries.filter(e => e.response.status >= 200 && e.response.status < 300).length}`);
    console.log(`   Failed requests: ${entries.filter(e => e.response.status >= 400).length}`);
    console.log(`   Image success rate: ${imageStats.successful.length}/${imageRequests.length} (${((imageStats.successful.length / imageRequests.length) * 100).toFixed(1)}%)`);
    
    // Performance grade
    const pageLoadTime = mainPage ? mainPage.time : totalTime;
    const imageErrorCount = imageStats.errors.length;
    const imageSuccessRate = imageRequests.length > 0 ? (imageStats.successful.length / imageRequests.length) * 100 : 100;
    
    console.log(`\n🏆 Performance Grade:`);
    
    if (pageLoadTime < 2000 && imageErrorCount === 0 && imageSuccessRate === 100) {
      console.log(`   Grade: A+ 🥇`);
      console.log(`   ✅ Page load under 2 seconds`);
      console.log(`   ✅ No image errors`);
      console.log(`   ✅ 100% image success rate`);
    } else if (pageLoadTime < 5000 && imageErrorCount < 3 && imageSuccessRate > 90) {
      console.log(`   Grade: B+ 🥈`);
      if (pageLoadTime >= 2000) console.log(`   ⚠️  Page load could be faster`);
      if (imageErrorCount > 0) console.log(`   ⚠️  ${imageErrorCount} image error(s)`);
      if (imageSuccessRate < 100) console.log(`   ⚠️  ${imageSuccessRate.toFixed(1)}% image success rate`);
    } else {
      console.log(`   Grade: C 🥉`);
      console.log(`   ❌ Performance needs improvement`);
      if (pageLoadTime >= 5000) console.log(`   ❌ Page load too slow (${pageLoadTime.toFixed(2)}ms)`);
      if (imageErrorCount >= 3) console.log(`   ❌ Too many image errors (${imageErrorCount})`);
      if (imageSuccessRate <= 90) console.log(`   ❌ Low image success rate (${imageSuccessRate.toFixed(1)}%)`);
    }
    
    // Save analysis results
    const analysis = {
      timestamp: new Date().toISOString(),
      mainPage: mainPage ? {
        url: mainPage.request.url,
        status: mainPage.response.status,
        time: mainPage.time,
        size: mainPage.response.content.size
      } : null,
      images: {
        total: imageRequests.length,
        successful: imageStats.successful.length,
        errors: imageStats.errors.length,
        webp: imageStats.webp.length,
        optimized: imageStats.optimized.length,
        successRate: imageSuccessRate
      },
      performance: {
        totalTime,
        pageLoadTime,
        grade: pageLoadTime < 2000 && imageErrorCount === 0 && imageSuccessRate === 100 ? 'A+' :
               pageLoadTime < 5000 && imageErrorCount < 3 && imageSuccessRate > 90 ? 'B+' : 'C'
      }
    };
    
    fs.writeFileSync('har-analysis-results.json', JSON.stringify(analysis, null, 2));
    console.log(`\n💾 Analysis saved to: har-analysis-results.json`);
    
  } catch (error) {
    console.error('❌ Error analyzing HAR file:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const harFile = process.argv[2] || 'last-performance.har';
  analyzeHAR(harFile);
}

module.exports = { analyzeHAR }; 