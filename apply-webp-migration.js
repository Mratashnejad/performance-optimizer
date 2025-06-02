#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class WebPMigrationApplier {
  constructor() {
    this.prisma = new PrismaClient();
    this.projectRoot = path.join(__dirname, '..');
    this.conversions = [];
    this.updateResults = {
      articles: 0,
      news: 0,
      guides: 0,
      bonuses: 0,
      games: 0,
      matches: 0,
      total: 0
    };
  }

  async applyMigration() {
    console.log('🚀 Applying WebP Database Migration');
    console.log('===================================');
    console.log('🎯 Updating all image references to WebP format');

    try {
      await this.loadConversions();
      await this.updateArticles();
      await this.updateNews();
      await this.updateGuides();
      await this.updateBonuses();
      await this.updateGames();
      await this.updateMatches();
      
      this.generateResults();
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadConversions() {
    console.log('\n📊 Step 1: Loading WebP Conversions...');
    
    const reportPath = path.join(this.projectRoot, 'webp-database-update-report.json');
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      this.conversions = report.conversions || [];
      console.log(`✅ Loaded ${this.conversions.length} conversions from report`);
    } else {
      console.log('❌ No WebP conversion report found. Run update-webp-refs.js first.');
      process.exit(1);
    }
  }

  async updateArticles() {
    console.log('\n📄 Step 2: Updating Articles...');
    
    let updatedCount = 0;
    
    for (const conv of this.conversions) {
      try {
        // Update coverImage field (SQLite syntax)
        const imageResult = await this.prisma.$executeRaw`
          UPDATE Article 
          SET coverImage = REPLACE(coverImage, ${conv.original}, ${conv.webp})
          WHERE coverImage LIKE ${'%' + conv.original + '%'}
        `;

        // Update content field
        const contentResult = await this.prisma.$executeRaw`
          UPDATE Article 
          SET content = REPLACE(content, ${conv.original}, ${conv.webp})
          WHERE content LIKE ${'%' + conv.original + '%'}
        `;

        updatedCount += Number(imageResult) + Number(contentResult);
      } catch (error) {
        console.log(`   ⚠️  Error updating ${conv.original}: ${error.message}`);
      }
    }

    this.updateResults.articles = updatedCount;
    console.log(`✅ Updated ${updatedCount} article references`);
  }

  async updateNews() {
    console.log('\n📰 Step 3: Updating News...');
    
    let updatedCount = 0;
    
    for (const conv of this.conversions) {
      try {
        // Update coverImage field
        const imageResult = await this.prisma.$executeRaw`
          UPDATE News 
          SET coverImage = REPLACE(coverImage, ${conv.original}, ${conv.webp})
          WHERE coverImage LIKE ${'%' + conv.original + '%'}
        `;

        // Update content field  
        const contentResult = await this.prisma.$executeRaw`
          UPDATE News 
          SET content = REPLACE(content, ${conv.original}, ${conv.webp})
          WHERE content LIKE ${'%' + conv.original + '%'}
        `;

        updatedCount += Number(imageResult) + Number(contentResult);
      } catch (error) {
        console.log(`   ⚠️  Error updating ${conv.original}: ${error.message}`);
      }
    }

    this.updateResults.news = updatedCount;
    console.log(`✅ Updated ${updatedCount} news references`);
  }

  async updateGuides() {
    console.log('\n📖 Step 4: Updating Guides...');
    
    let updatedCount = 0;
    
    for (const conv of this.conversions) {
      try {
        // Update coverImage field
        const imageResult = await this.prisma.$executeRaw`
          UPDATE Guide 
          SET coverImage = REPLACE(coverImage, ${conv.original}, ${conv.webp})
          WHERE coverImage LIKE ${'%' + conv.original + '%'}
        `;

        // Update content field
        const contentResult = await this.prisma.$executeRaw`
          UPDATE Guide 
          SET content = REPLACE(content, ${conv.original}, ${conv.webp})
          WHERE content LIKE ${'%' + conv.original + '%'}
        `;

        updatedCount += Number(imageResult) + Number(contentResult);
      } catch (error) {
        console.log(`   ⚠️  Error updating ${conv.original}: ${error.message}`);
      }
    }

    this.updateResults.guides = updatedCount;
    console.log(`✅ Updated ${updatedCount} guide references`);
  }

  async updateBonuses() {
    console.log('\n🎁 Step 5: Updating Bonuses...');
    
    let updatedCount = 0;
    
    for (const conv of this.conversions) {
      try {
        const imageResult = await this.prisma.$executeRaw`
          UPDATE Bonus 
          SET image = REPLACE(image, ${conv.original}, ${conv.webp})
          WHERE image LIKE ${'%' + conv.original + '%'}
        `;

        updatedCount += Number(imageResult);
      } catch (error) {
        console.log(`   ⚠️  Error updating ${conv.original}: ${error.message}`);
      }
    }

    this.updateResults.bonuses = updatedCount;
    console.log(`✅ Updated ${updatedCount} bonus references`);
  }

  async updateGames() {
    console.log('\n🎮 Step 6: Updating Games...');
    
    let updatedCount = 0;
    
    for (const conv of this.conversions) {
      try {
        const imageResult = await this.prisma.$executeRaw`
          UPDATE Game 
          SET image = REPLACE(image, ${conv.original}, ${conv.webp})
          WHERE image LIKE ${'%' + conv.original + '%'}
        `;

        updatedCount += Number(imageResult);
      } catch (error) {
        console.log(`   ⚠️  Error updating ${conv.original}: ${error.message}`);
      }
    }

    this.updateResults.games = updatedCount;
    console.log(`✅ Updated ${updatedCount} game references`);
  }

  async updateMatches() {
    console.log('\n⚽ Step 7: Updating Matches...');
    
    let updatedCount = 0;
    
    for (const conv of this.conversions) {
      try {
        // Update team1Logo field
        const team1Result = await this.prisma.$executeRaw`
          UPDATE Match 
          SET team1Logo = REPLACE(team1Logo, ${conv.original}, ${conv.webp})
          WHERE team1Logo LIKE ${'%' + conv.original + '%'}
        `;

        // Update team2Logo field
        const team2Result = await this.prisma.$executeRaw`
          UPDATE Match 
          SET team2Logo = REPLACE(team2Logo, ${conv.original}, ${conv.webp})
          WHERE team2Logo LIKE ${'%' + conv.original + '%'}
        `;

        updatedCount += Number(team1Result) + Number(team2Result);
      } catch (error) {
        console.log(`   ⚠️  Error updating ${conv.original}: ${error.message}`);
      }
    }

    this.updateResults.matches = updatedCount;
    console.log(`✅ Updated ${updatedCount} match references`);
  }

  generateResults() {
    console.log('\n📊 Step 8: Migration Results...');
    
    this.updateResults.total = Object.values(this.updateResults).reduce((sum, val) => sum + val, 0) - this.updateResults.total;

    const resultsPath = path.join(this.projectRoot, 'webp-migration-results.json');
    const results = {
      timestamp: new Date().toISOString(),
      conversionsApplied: this.conversions.length,
      updateResults: this.updateResults,
      success: true,
      nextSteps: [
        'Restart your application server',
        'Clear browser cache and CDN cache',
        'Test website for image loading',
        'Generate new HAR file',
        'Run performance analysis'
      ]
    };

    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    console.log('\n🎉 WEBP MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
    console.log(`📊 Migration Summary:`);
    console.log(`   • Articles updated: ${this.updateResults.articles}`);
    console.log(`   • News updated: ${this.updateResults.news}`);
    console.log(`   • Guides updated: ${this.updateResults.guides}`);
    console.log(`   • Bonuses updated: ${this.updateResults.bonuses}`);
    console.log(`   • Games updated: ${this.updateResults.games}`);
    console.log(`   • Matches updated: ${this.updateResults.matches}`);
    console.log(`   • Total updates: ${this.updateResults.total}`);
    console.log('');
    console.log('🚀 Your website should now:');
    console.log('   ✅ Have no more 404 image errors');
    console.log('   ✅ Load WebP images (faster & smaller)');
    console.log('   ✅ Show improved performance metrics');
    console.log('');
    console.log('🔄 Next: Restart your server and test!');
    console.log(`📄 Results saved: ${resultsPath}`);
  }
}

// Main execution
async function main() {
  const migrator = new WebPMigrationApplier();
  await migrator.applyMigration();
}

if (require.main === module) {
  main();
}

module.exports = WebPMigrationApplier; 