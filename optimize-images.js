const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImage(inputPath, outputPath, quality = 80, width = null) {
  try {
    let pipeline = sharp(inputPath);
    
    if (width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Convert to WebP with optimization
    await pipeline
      .webp({ 
        quality,
        effort: 6, // Maximum compression effort
        smartSubsample: true
      })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Savings: ${savings}%\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');

  const imagesToOptimize = [
    // Hero images - reduce to reasonable sizes for web
    {
      input: 'public/slides/casino-hero.jpg',
      output: 'public/slides/casino-hero.webp',
      quality: 85,
      width: 1920 // Max width for hero images
    },
    {
      input: 'public/slides/sports-hero.jpg',
      output: 'public/slides/sports-hero.webp',
      quality: 85,
      width: 1920
    },
    {
      input: 'public/slides/bonus-hero.jpg',
      output: 'public/slides/bonus-hero.webp',
      quality: 85,
      width: 1920
    },
    // Bonus welcome image
    {
      input: 'public/images/bouns-100-welcome.jpg',
      output: 'public/images/bouns-100-welcome.webp',
      quality: 85,
      width: 800 // Smaller size for this image
    }
  ];

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let successCount = 0;

  for (const config of imagesToOptimize) {
    if (fs.existsSync(config.input)) {
      const success = await optimizeImage(config.input, config.output, config.quality, config.width);
      if (success) {
        successCount++;
        totalOriginalSize += fs.statSync(config.input).size;
        totalOptimizedSize += fs.statSync(config.output).size;
      }
    } else {
      console.log(`⚠️  File not found: ${config.input}`);
    }
  }

  if (successCount > 0) {
    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    console.log('📊 Total Results:');
    console.log(`   Images optimized: ${successCount}`);
    console.log(`   Total original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Total optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Total savings: ${totalSavings}%`);
  }

  console.log('\n✨ Image optimization complete!');
}

main().catch(console.error); 