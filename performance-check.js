const fs = require('fs');
const path = require('path');

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function checkImageOptimization() {
  console.log('📸 Image Optimization Status:');
  console.log('================================');
  
  const imageChecks = [
    {
      original: 'public/slides/casino-hero.jpg',
      optimized: 'public/slides/casino-hero.webp',
      name: 'Casino Hero'
    },
    {
      original: 'public/slides/sports-hero.jpg',
      optimized: 'public/slides/sports-hero.webp',
      name: 'Sports Hero'
    },
    {
      original: 'public/slides/bonus-hero.jpg',
      optimized: 'public/slides/bonus-hero.webp',
      name: 'Bonus Hero'
    },
    {
      original: 'public/images/bouns-100-welcome.jpg',
      optimized: 'public/images/bouns-100-welcome.webp',
      name: 'Welcome Bonus'
    },
    {
      original: 'public/logo/logoBig-Text-Black-green.png',
      optimized: 'public/logo/logoBig-Text-Black-green.webp',
      name: 'Logo'
    }
  ];

  let totalOriginal = 0;
  let totalOptimized = 0;

  imageChecks.forEach(check => {
    const originalSize = getFileSize(check.original);
    const optimizedSize = getFileSize(check.optimized);
    
    if (originalSize > 0 && optimizedSize > 0) {
      const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      console.log(`✅ ${check.name}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings}% saved)`);
      totalOriginal += originalSize;
      totalOptimized += optimizedSize;
    } else if (originalSize > 0) {
      console.log(`⚠️  ${check.name}: Original exists but no WebP version found`);
      totalOriginal += originalSize;
    } else {
      console.log(`❌ ${check.name}: Original file not found`);
    }
  });

  if (totalOriginal > 0) {
    const totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
    console.log('\n📊 Total Image Optimization:');
    console.log(`   Original: ${formatBytes(totalOriginal)}`);
    console.log(`   Optimized: ${formatBytes(totalOptimized)}`);
    console.log(`   Total Savings: ${formatBytes(totalOriginal - totalOptimized)} (${totalSavings}%)`);
  }
}

function checkBuildOutputs() {
  console.log('\n🏗️  Build Output Analysis:');
  console.log('============================');
  
  const buildDir = '.next';
  if (!fs.existsSync(buildDir)) {
    console.log('❌ No build output found. Run "npm run build" first.');
    return;
  }

  // Check build manifest for bundle sizes
  const buildManifest = path.join(buildDir, 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      console.log('✅ Build manifest found');
      
      if (manifest.pages) {
        Object.keys(manifest.pages).forEach(page => {
          const pageFiles = manifest.pages[page];
          let totalSize = 0;
          pageFiles.forEach(file => {
            const filePath = path.join(buildDir, file);
            totalSize += getFileSize(filePath);
          });
          console.log(`   ${page}: ${formatBytes(totalSize)}`);
        });
      }
    } catch (error) {
      console.log('❌ Error reading build manifest:', error.message);
    }
  }
}

function checkPerformanceOptimizations() {
  console.log('\n⚡ Performance Optimizations:');
  console.log('===============================');
  
  // Check if optimized images exist
  const optimizedImages = [
    'public/slides/casino-hero.webp',
    'public/slides/sports-hero.webp',
    'public/slides/bonus-hero.webp',
    'public/images/bouns-100-welcome.webp'
  ];

  const webpCount = optimizedImages.filter(img => fs.existsSync(img)).length;
  console.log(`✅ WebP Images: ${webpCount}/${optimizedImages.length} converted`);

  // Check for modern CSS
  const cssDir = '.next/static/css/';
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.css'))
      .map(dirent => dirent.name);
    
    console.log(`✅ CSS Files: ${cssFiles.length} optimized bundles`);
  } else {
    console.log('⚠️  CSS bundles: Not built yet (run "npm run build" first)');
  }

  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('=================================');
  
  if (webpCount < optimizedImages.length) {
    console.log('📸 Run "npm run optimize:all" to convert remaining images to WebP');
  }
  
  console.log('🗜️  Use "npm run analyze" to analyze bundle sizes');
  console.log('📊 Monitor Core Web Vitals in production');
  console.log('🚀 Consider implementing service worker for caching');
}

function main() {
  console.log('🔍 Performance Check Report');
  console.log('===========================\n');
  
  checkImageOptimization();
  checkBuildOutputs();
  checkPerformanceOptimizations();
  
  console.log('\n✨ Performance check complete!');
}

main(); 