const puppeteer = require('puppeteer');
const fs = require('fs');

async function testPerformance() {
  console.log('🔍 Starting performance test...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable network tracking
    await page.setViewport({ width: 1920, height: 1080 });
    
    const performanceData = {};
    const imageErrors = [];
    const imageLoads = [];
    
    // Track network requests
    page.on('response', async response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('/images/games/')) {
        if (status === 404) {
          imageErrors.push(url);
        } else if (status === 200) {
          const contentType = response.headers()['content-type'] || '';
          imageLoads.push({
            url,
            contentType,
            size: response.headers()['content-length'] || 'unknown'
          });
        }
      }
    });
    
    console.log('📊 Loading homepage...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`⚡ Page loaded in: ${loadTime}ms`);
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Check for 404 image errors
    if (imageErrors.length > 0) {
      console.log('\n❌ Image 404 Errors:');
      imageErrors.forEach(url => {
        console.log(`   - ${url}`);
      });
    } else {
      console.log('\n✅ No image 404 errors found!');
    }
    
    // Show successful image loads
    if (imageLoads.length > 0) {
      console.log('\n📸 Successfully loaded images:');
      imageLoads.forEach(img => {
        console.log(`   ✓ ${img.url.split('/').pop()} (${img.contentType}) - ${img.size} bytes`);
      });
    }
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domComplete: navigation.domComplete - navigation.domInteractive,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.navigationStart
      };
    });
    
    console.log('\n📈 Performance Metrics:');
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   DOM Complete: ${metrics.domComplete.toFixed(2)}ms`);
    console.log(`   Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`   Total Time: ${metrics.totalTime.toFixed(2)}ms`);
    
    // Test WebP support
    const webpSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    });
    
    console.log(`\n🖼️  WebP Support: ${webpSupport ? '✅ Enabled' : '❌ Disabled'}`);
    
    // Check for lazy loading
    const imageElements = await page.$$eval('img', imgs => {
      return imgs.map(img => ({
        src: img.src,
        loading: img.loading,
        width: img.naturalWidth,
        height: img.naturalHeight
      }));
    });
    
    console.log(`\n📝 Image Summary:`);
    console.log(`   Total images: ${imageElements.length}`);
    console.log(`   Lazy loaded: ${imageElements.filter(img => img.loading === 'lazy').length}`);
    console.log(`   WebP images: ${imageElements.filter(img => img.src.includes('.webp')).length}`);
    
    const results = {
      timestamp: new Date().toISOString(),
      loadTime,
      metrics,
      imageErrors,
      imageLoads,
      webpSupport,
      imageSummary: {
        total: imageElements.length,
        lazyLoaded: imageElements.filter(img => img.loading === 'lazy').length,
        webpImages: imageElements.filter(img => img.src.includes('.webp')).length
      }
    };
    
    // Save results
    fs.writeFileSync('performance-test-results.json', JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: performance-test-results.json`);
    
    // Performance rating
    if (loadTime < 2000 && imageErrors.length === 0) {
      console.log('\n🎉 EXCELLENT PERFORMANCE! 🚀');
      console.log('   ✅ Load time under 2 seconds');
      console.log('   ✅ No image errors');
    } else if (loadTime < 5000 && imageErrors.length < 3) {
      console.log('\n👍 GOOD PERFORMANCE!');
      if (loadTime >= 2000) console.log('   ⚠️  Load time could be improved');
      if (imageErrors.length > 0) console.log(`   ⚠️  ${imageErrors.length} image error(s) found`);
    } else {
      console.log('\n⚠️  PERFORMANCE NEEDS IMPROVEMENT');
      if (loadTime >= 5000) console.log('   ❌ Load time too slow');
      if (imageErrors.length >= 3) console.log(`   ❌ Too many image errors (${imageErrors.length})`);
    }
    
  } catch (error) {
    console.error('❌ Error during performance test:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  testPerformance().catch(console.error);
}

module.exports = { testPerformance }; 