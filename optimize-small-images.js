const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeSmallImage(inputPath, outputPath, width, quality = 90) {
  try {
    await sharp(inputPath)
      .resize(width, width, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ 
        quality,
        effort: 6
      })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    console.log(`   ${(originalSize / 1024).toFixed(1)}KB -> ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% saved)\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    return false;
  }
}

async function optimizeDirectory(dirPath, maxWidth, quality = 90) {
  console.log(`\n📁 Optimizing images in ${dirPath} (max width: ${maxWidth}px)...`);
  
  const files = fs.readdirSync(dirPath);
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let count = 0;

  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const inputPath = path.join(dirPath, file);
      const outputPath = path.join(dirPath, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
      
      const success = await optimizeSmallImage(inputPath, outputPath, maxWidth, quality);
      if (success) {
        count++;
        totalOriginalSize += fs.statSync(inputPath).size;
        totalOptimizedSize += fs.statSync(outputPath).size;
      }
    }
  }

  if (count > 0) {
    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    console.log(`📊 ${dirPath} Results: ${count} images, ${(totalOriginalSize / 1024).toFixed(1)}KB -> ${(totalOptimizedSize / 1024).toFixed(1)}KB (${totalSavings}% saved)`);
  }
}

async function main() {
  console.log('🚀 Starting small image optimization...');

  // Optimize team logos (displayed at 48x48px)
  await optimizeDirectory('public/teams', 96); // 2x for retina displays

  // Optimize league logos (displayed at 24x24px)  
  await optimizeDirectory('public/leagues', 48); // 2x for retina displays

  console.log('\n✨ Small image optimization complete!');
}

main().catch(console.error); 