const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeRemainingImages() {
  console.log('🖼️  Optimizing remaining large images...\n');

  const imagesToOptimize = [
    {
      input: 'public/authors/reza.png',
      output: 'public/authors/reza.webp',
      quality: 85,
      type: 'author photo'
    },
    {
      input: 'public/images/games/sweet-bonanza.png',
      output: 'public/images/games/sweet-bonanza.webp',
      quality: 85,
      type: 'game image'
    },
    {
      input: 'public/uploads/articles/logoBig-Text-Black-green.png',
      output: 'public/uploads/articles/logoBig-Text-Black-green.webp',
      quality: 90,
      type: 'logo'
    },
    {
      input: 'public/uploads/articles/gre@0.5x.png',
      output: 'public/uploads/articles/gre@0.5x.webp',
      quality: 85,
      type: 'article image'
    }
  ];

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const image of imagesToOptimize) {
    try {
      // Check if input file exists
      if (!fs.existsSync(image.input)) {
        console.log(`⚠️  Skipping ${image.input} - file not found`);
        continue;
      }

      // Get original file size
      const originalStats = fs.statSync(image.input);
      const originalSize = originalStats.size;
      totalOriginalSize += originalSize;

      console.log(`📸 Optimizing ${image.type}: ${path.basename(image.input)}`);

      // Optimize image
      const outputBuffer = await sharp(image.input)
        .webp({ 
          quality: image.quality,
          effort: 6 // Maximum compression effort
        })
        .toBuffer();

      // Write optimized file
      fs.writeFileSync(image.output, outputBuffer);

      // Get optimized file size
      const optimizedSize = outputBuffer.length;
      totalOptimizedSize += optimizedSize;

      // Calculate savings
      const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      
      console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
      console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(1)} KB`);
      console.log(`   Savings: ${savings}%\n`);

    } catch (error) {
      console.error(`❌ Error optimizing ${image.input}:`, error.message);
    }
  }

  // Summary
  if (totalOriginalSize > 0) {
    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('========================');
    console.log(`Total original size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
    console.log(`Total optimized size: ${(totalOptimizedSize / 1024).toFixed(1)} KB`);
    console.log(`Total savings: ${(totalOriginalSize - totalOptimizedSize) / 1024} KB (${totalSavings}%)`);
    console.log('\n✨ Additional image optimization complete!');
  } else {
    console.log('ℹ️  No images were optimized (files may not exist).');
  }
}

optimizeRemainingImages().catch(console.error); 