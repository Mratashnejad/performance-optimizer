#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');
const { execSync } = require('child_process');

class WebPConverter {
  constructor() {
    this.publicDir = path.join(__dirname, '..', 'public');
    this.totalSavings = 0;
    this.processedFiles = 0;
    this.skippedFiles = 0;
    this.errors = [];
    this.conversionReport = [];
  }

  async convertToWebP() {
    console.log('🚀 Starting comprehensive WebP conversion...');
    console.log(`📁 Scanning directory: ${this.publicDir}`);

    // Find all image files
    const imageExtensions = ['jpg', 'jpeg', 'png', 'tiff', 'bmp'];
    const patterns = imageExtensions.map(ext => 
      path.join(this.publicDir, '**', `*.${ext}`)
    );

    let allImages = [];
    for (const pattern of patterns) {
      const files = glob.sync(pattern, { nocase: true });
      allImages = allImages.concat(files);
    }

    console.log(`📊 Found ${allImages.length} images to process`);

    for (const imagePath of allImages) {
      await this.processImage(imagePath);
    }

    this.generateReport();
  }

  async processImage(imagePath) {
    try {
      const relativePath = path.relative(this.publicDir, imagePath);
      console.log(`🔄 Processing: ${relativePath}`);

      // Get original file stats
      const originalStats = fs.statSync(imagePath);
      const originalSize = originalStats.size;

      // Generate WebP path
      const parsedPath = path.parse(imagePath);
      const webpPath = path.join(parsedPath.dir, parsedPath.name + '.webp');

      // Check if WebP already exists
      if (fs.existsSync(webpPath)) {
        console.log(`⚠️  WebP already exists for ${relativePath}, skipping...`);
        this.skippedFiles++;
        return;
      }

      // Convert to WebP with high quality
      await sharp(imagePath)
        .webp({ 
          quality: 85, 
          effort: 6,
          lossless: false
        })
        .toFile(webpPath);

      // Get WebP file stats
      const webpStats = fs.statSync(webpPath);
      const webpSize = webpStats.size;
      const savings = originalSize - webpSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(2);

      // Update totals
      this.totalSavings += savings;
      this.processedFiles++;

      // Add to report
      this.conversionReport.push({
        original: relativePath,
        webp: path.relative(this.publicDir, webpPath),
        originalSize: this.formatBytes(originalSize),
        webpSize: this.formatBytes(webpSize),
        savings: this.formatBytes(savings),
        savingsPercent: savingsPercent
      });

      console.log(`✅ Converted: ${relativePath} (${savingsPercent}% smaller)`);

      // Remove original file
      fs.unlinkSync(imagePath);
      console.log(`🗑️  Removed original: ${relativePath}`);

    } catch (error) {
      console.error(`❌ Error processing ${imagePath}:`, error.message);
      this.errors.push({ file: imagePath, error: error.message });
    }
  }

  generateReport() {
    console.log('\n📈 CONVERSION REPORT');
    console.log('='.repeat(50));
    console.log(`📊 Total files processed: ${this.processedFiles}`);
    console.log(`⏭️  Files skipped: ${this.skippedFiles}`);
    console.log(`💾 Total space saved: ${this.formatBytes(this.totalSavings)}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.conversionReport.length > 0) {
      console.log('\n📋 DETAILED CONVERSION LOG:');
      console.log('-'.repeat(100));
      console.log('Original'.padEnd(40) + 'WebP'.padEnd(40) + 'Savings'.padEnd(20));
      console.log('-'.repeat(100));
      
      this.conversionReport.forEach(item => {
        console.log(
          item.original.padEnd(40) + 
          item.webp.padEnd(40) + 
          `${item.savings} (${item.savingsPercent}%)`.padEnd(20)
        );
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`   ${error.file}: ${error.error}`);
      });
    }

    // Save report to file
    const reportPath = path.join(__dirname, '..', 'webp-conversion-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      processed: this.processedFiles,
      skipped: this.skippedFiles,
      totalSavings: this.totalSavings,
      totalSavingsFormatted: this.formatBytes(this.totalSavings),
      errors: this.errors,
      conversions: this.conversionReport
    }, null, 2));

    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async checkDependencies() {
    try {
      require('sharp');
      require('glob');
    } catch (error) {
      console.error('❌ Missing dependencies. Installing...');
      try {
        execSync('npm install sharp glob', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
      } catch (installError) {
        console.error('❌ Failed to install dependencies:', installError.message);
        process.exit(1);
      }
    }
  }
}

// Update Next.js config to handle WebP images
function updateNextConfig() {
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  
  if (fs.existsSync(nextConfigPath)) {
    console.log('🔧 Updating Next.js config for WebP optimization...');
    
    let content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Add image optimization config if not present
    if (!content.includes('formats:') && !content.includes('webp')) {
      const imageOptimization = `
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['cannonbet.info'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },`;
      
      // Insert before the closing brace
      content = content.replace(/};?\s*$/, `${imageOptimization}\n};`);
      fs.writeFileSync(nextConfigPath, content);
      console.log('✅ Next.js config updated for WebP optimization');
    }
  }
}

// Main execution
async function main() {
  const converter = new WebPConverter();
  
  try {
    await converter.checkDependencies();
    updateNextConfig();
    await converter.convertToWebP();
    
    console.log('\n🎉 WebP conversion completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Update your image imports to use .webp extensions');
    console.log('   2. Add fallback support for older browsers');
    console.log('   3. Test your application thoroughly');
    console.log('   4. Run the performance analyzer to measure improvements');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = WebPConverter; 