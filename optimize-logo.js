const sharp = require('sharp');
const fs = require('fs');

async function optimizeLogo() {
  try {
    const inputPath = 'public/logo/logoBig-Text-Black-green.png';
    const outputPath = 'public/logo/logoBig-Text-Black-green.webp';
    
    await sharp(inputPath)
      .resize(320, 52, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 95, 
        effort: 6 
      })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log('✅ Logo optimized successfully!');
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(1)}KB`);
    console.log(`   Savings: ${savings}%`);
    
  } catch (error) {
    console.error('❌ Error optimizing logo:', error.message);
  }
}

optimizeLogo(); 