const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function getAllLargeImages(directories) {
  const images = [];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory ${dir} does not exist, skipping...`);
      return;
    }
    
    function scanDirectory(currentDir) {
      const files = fs.readdirSync(currentDir);
      
      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
          // Only process images larger than 200KB
          if (stat.size > 200 * 1024) {
            const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            // Only add if WebP doesn't already exist
            if (!fs.existsSync(webpPath)) {
              images.push({
                originalPath: filePath,
                webpPath: webpPath,
                size: stat.size,
                filename: file
              });
            }
          }
        }
      });
    }
    
    scanDirectory(dir);
  });
  
  return images;
}

async function optimizeUploads() {
  console.log('🖼️  Optimizing user-uploaded images...\n');

  // Directories to scan
  const directories = [
    'public/uploads',
    'public/images/articles',
    'public/images/news',
    'public/banners'
  ];

  // Find all large images
  const images = getAllLargeImages(directories);
  
  if (images.length === 0) {
    console.log('✅ No large unoptimized images found!');
    return;
  }

  console.log(`Found ${images.length} large images to optimize...\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;
  const batchSize = 5; // Process in batches to avoid memory issues

  // Sort by size (largest first) for better progress indication
  images.sort((a, b) => b.size - a.size);

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (image) => {
      try {
        totalOriginalSize += image.size;
        
        console.log(`📸 [${++processedCount}/${images.length}] Optimizing: ${path.basename(image.filename)}`);
        console.log(`   Original size: ${(image.size / 1024 / 1024).toFixed(2)} MB`);

        // Determine quality based on image size
        let quality = 85;
        if (image.size > 5 * 1024 * 1024) { // > 5MB
          quality = 75;
        } else if (image.size > 2 * 1024 * 1024) { // > 2MB
          quality = 80;
        }

        // Optimize image
        const outputBuffer = await sharp(image.originalPath)
          .webp({ 
            quality: quality,
            effort: 6,
            smartSubsample: true
          })
          .toBuffer();

        // Write optimized file
        fs.writeFileSync(image.webpPath, outputBuffer);

        totalOptimizedSize += outputBuffer.length;
        
        const savings = ((image.size - outputBuffer.length) / image.size * 100).toFixed(1);
        console.log(`   Optimized size: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Savings: ${savings}%\n`);

      } catch (error) {
        console.error(`❌ Error optimizing ${image.filename}:`, error.message);
      }
    }));

    // Small delay between batches to prevent memory issues
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Final summary
  const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
  const savedMB = (totalOriginalSize - totalOptimizedSize) / 1024 / 1024;
  
  console.log('📊 UPLOAD OPTIMIZATION SUMMARY');
  console.log('===============================');
  console.log(`Images processed: ${processedCount}`);
  console.log(`Total original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings: ${savedMB.toFixed(2)} MB (${totalSavings}%)`);
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('• Update your CMS to reference .webp files when available');
  console.log('• Consider implementing automatic WebP conversion on upload');
  console.log('• Set up a cron job to regularly optimize new uploads');
  
  console.log('\n✨ Upload optimization complete!');
}

optimizeUploads().catch(console.error); 