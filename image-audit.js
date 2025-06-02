const fs = require('fs');
const path = require('path');

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllImages(filePath, fileList);
    } else if (/\.(jpg|jpeg|png|gif|bmp|tiff|svg)$/i.test(file)) {
      fileList.push({
        path: filePath,
        name: file,
        size: stat.size,
        extension: path.extname(file).toLowerCase()
      });
    }
  });
  
  return fileList;
}

function auditImages() {
  console.log('🔍 COMPREHENSIVE IMAGE AUDIT');
  console.log('==============================\n');

  // Get all images
  const allImages = getAllImages('public');
  
  // Categorize images
  const largeImages = allImages.filter(img => img.size > 500 * 1024); // > 500KB
  const mediumImages = allImages.filter(img => img.size > 100 * 1024 && img.size <= 500 * 1024); // 100KB - 500KB
  const smallImages = allImages.filter(img => img.size <= 100 * 1024); // <= 100KB
  
  const unoptimizedImages = allImages.filter(img => 
    ['.jpg', '.jpeg', '.png'].includes(img.extension) && 
    !allImages.some(other => 
      other.path === img.path.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    )
  );

  // Summary statistics
  const totalSize = allImages.reduce((sum, img) => sum + img.size, 0);
  const totalImages = allImages.length;

  console.log('📊 SUMMARY STATISTICS');
  console.log('=====================');
  console.log(`Total images: ${totalImages}`);
  console.log(`Total size: ${formatSize(totalSize)}`);
  console.log(`Average size: ${formatSize(totalSize / totalImages)}\n`);

  // Size breakdown
  console.log('📏 SIZE BREAKDOWN');
  console.log('=================');
  console.log(`Large images (>500KB): ${largeImages.length}`);
  console.log(`Medium images (100-500KB): ${mediumImages.length}`);
  console.log(`Small images (<100KB): ${smallImages.length}\n`);

  // Extension breakdown
  const extensionStats = {};
  allImages.forEach(img => {
    const ext = img.extension;
    if (!extensionStats[ext]) {
      extensionStats[ext] = { count: 0, totalSize: 0 };
    }
    extensionStats[ext].count++;
    extensionStats[ext].totalSize += img.size;
  });

  console.log('📄 FORMAT BREAKDOWN');
  console.log('===================');
  Object.entries(extensionStats).forEach(([ext, stats]) => {
    console.log(`${ext.padEnd(6)}: ${stats.count.toString().padStart(3)} files, ${formatSize(stats.totalSize)}`);
  });
  console.log();

  // Large images that need attention
  if (largeImages.length > 0) {
    console.log('🚨 LARGE IMAGES REQUIRING ATTENTION');
    console.log('===================================');
    largeImages
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(img => {
        const webpExists = fs.existsSync(img.path.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
        const status = webpExists ? '✅ WebP exists' : '❌ Needs optimization';
        console.log(`${formatSize(img.size).padStart(8)} - ${img.path} ${status}`);
      });
    console.log();
  }

  // Unoptimized images
  if (unoptimizedImages.length > 0) {
    console.log('⚠️  UNOPTIMIZED IMAGES');
    console.log('======================');
    unoptimizedImages
      .filter(img => img.size > 50 * 1024) // Only show images > 50KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 15)
      .forEach(img => {
        console.log(`${formatSize(img.size).padStart(8)} - ${img.path}`);
      });
    console.log();
  }

  // Optimization recommendations
  console.log('💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('===============================');
  
  const potentialSavings = unoptimizedImages
    .filter(img => img.size > 50 * 1024)
    .reduce((sum, img) => sum + (img.size * 0.8), 0); // Estimate 80% savings
  
  if (unoptimizedImages.length > 0) {
    console.log(`• Convert ${unoptimizedImages.length} unoptimized images to WebP`);
    console.log(`• Estimated savings: ${formatSize(potentialSavings)}`);
  }
  
  if (largeImages.length > 0) {
    console.log(`• Review ${largeImages.length} large images for further compression`);
  }
  
  const svgCount = extensionStats['.svg']?.count || 0;
  if (svgCount > 0) {
    console.log(`• Optimize ${svgCount} SVG files for better compression`);
  }

  console.log('\n🛠️  NEXT STEPS');
  console.log('==============');
  console.log('• Run "npm run optimize:all" to optimize all images');
  console.log('• Consider lazy loading for images below the fold');
  console.log('• Use responsive images with different sizes');
  console.log('• Implement proper caching headers for static assets');
  
  console.log('\n✨ Image audit complete!');
}

auditImages(); 