#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class HARAnalyzer {
  constructor() {
    this.harFile = null;
    this.analysisReport = {
      totalLoadTime: 0,
      criticalPathItems: [],
      largestContentfulPaint: 0,
      firstContentfulPaint: 0,
      timeToInteractive: 0,
      performanceGaps: [],
      optimizations: [],
      resourceBreakdown: {},
      bottlenecks: [],
    };
    this.targetLoadTime = 2; // 2ms target
  }

  async analyzeHARFile(harFilePath) {
    try {
      console.log("🔍 Starting HAR file analysis...");
      console.log(`📁 Reading HAR file: ${harFilePath}`);

      if (!fs.existsSync(harFilePath)) {
        throw new Error(`HAR file not found: ${harFilePath}`);
      }

      const harContent = JSON.parse(fs.readFileSync(harFilePath, "utf8"));
      this.harFile = harContent;

      await this.performAnalysis();
      this.generateReport();
      this.generateOptimizationPlan();
    } catch (error) {
      console.error("❌ HAR analysis failed:", error.message);
      process.exit(1);
    }
  }

  async performAnalysis() {
    const entries = this.harFile.log.entries;

    console.log(`📊 Analyzing ${entries.length} network requests...`);

    // Calculate total load time
    const startTime = new Date(entries[0].startedDateTime).getTime();
    const endTime = Math.max(...entries.map((entry) => new Date(entry.startedDateTime).getTime() + entry.time));
    this.analysisReport.totalLoadTime = endTime - startTime;

    // Analyze each request
    entries.forEach((entry, index) => {
      this.analyzeRequest(entry, index, startTime);
    });

    // Identify critical path
    this.identifyCriticalPath(entries);

    // Find performance gaps
    this.findPerformanceGaps(entries, startTime);

    // Resource breakdown
    this.analyzeResourceBreakdown(entries);

    // Identify bottlenecks
    this.identifyBottlenecks(entries);
  }

  analyzeRequest(entry, index, startTime) {
    const url = entry.request.url;
    const method = entry.request.method;
    const status = entry.response.status;
    const contentType = entry.response.content.mimeType || "";
    const size = entry.response.content.size || 0;
    const time = entry.time;
    const relativeStartTime = new Date(entry.startedDateTime).getTime() - startTime;

    // Categorize resource types
    let resourceType = "other";
    if (contentType.includes("text/html")) resourceType = "html";
    else if (contentType.includes("text/css")) resourceType = "css";
    else if (contentType.includes("javascript")) resourceType = "js";
    else if (contentType.includes("image/")) resourceType = "image";
    else if (contentType.includes("font/")) resourceType = "font";

    // Check for performance issues
    if (time > 100) {
      // Requests taking more than 100ms
      this.analysisReport.bottlenecks.push({
        url: url.substring(0, 100) + (url.length > 100 ? "..." : ""),
        type: resourceType,
        time: time,
        size: this.formatBytes(size),
        startTime: relativeStartTime,
        issue: "Slow request",
      });
    }

    if (size > 500 * 1024) {
      // Files larger than 500KB
      this.analysisReport.bottlenecks.push({
        url: url.substring(0, 100) + (url.length > 100 ? "..." : ""),
        type: resourceType,
        time: time,
        size: this.formatBytes(size),
        startTime: relativeStartTime,
        issue: "Large file size",
      });
    }

    // Update resource breakdown
    if (!this.analysisReport.resourceBreakdown[resourceType]) {
      this.analysisReport.resourceBreakdown[resourceType] = {
        count: 0,
        totalSize: 0,
        totalTime: 0,
        avgTime: 0,
      };
    }

    this.analysisReport.resourceBreakdown[resourceType].count++;
    this.analysisReport.resourceBreakdown[resourceType].totalSize += size;
    this.analysisReport.resourceBreakdown[resourceType].totalTime += time;
    this.analysisReport.resourceBreakdown[resourceType].avgTime =
      this.analysisReport.resourceBreakdown[resourceType].totalTime /
      this.analysisReport.resourceBreakdown[resourceType].count;
  }

  identifyCriticalPath(entries) {
    // Find HTML document
    const htmlEntry = entries.find(
      (entry) => entry.response.content.mimeType && entry.response.content.mimeType.includes("text/html")
    );

    if (htmlEntry) {
      this.analysisReport.criticalPathItems.push({
        type: "HTML Document",
        url: htmlEntry.request.url.substring(0, 80) + "...",
        time: htmlEntry.time,
        size: this.formatBytes(htmlEntry.response.content.size || 0),
      });
    }

    // Find critical CSS and JS
    const criticalResources = entries
      .filter((entry) => {
        const url = entry.request.url;
        const contentType = entry.response.content.mimeType || "";
        return (
          (contentType.includes("text/css") || contentType.includes("javascript")) &&
          !url.includes("analytics") &&
          !url.includes("tracking")
        );
      })
      .sort((a, b) => a.time - b.time);

    criticalResources.slice(0, 5).forEach((entry) => {
      this.analysisReport.criticalPathItems.push({
        type: entry.response.content.mimeType.includes("css") ? "Critical CSS" : "Critical JS",
        url: entry.request.url.substring(0, 80) + "...",
        time: entry.time,
        size: this.formatBytes(entry.response.content.size || 0),
      });
    });
  }

  findPerformanceGaps(entries, startTime) {
    console.log("🔍 Identifying performance gaps...");

    const timeline = entries
      .map((entry) => ({
        start: new Date(entry.startedDateTime).getTime() - startTime,
        end: new Date(entry.startedDateTime).getTime() - startTime + entry.time,
        url: entry.request.url,
        time: entry.time,
      }))
      .sort((a, b) => a.start - b.start);

    // Find gaps in timeline
    for (let i = 1; i < timeline.length; i++) {
      const gap = timeline[i].start - timeline[i - 1].end;
      if (gap > 50) {
        // Gaps larger than 50ms
        this.analysisReport.performanceGaps.push({
          gapStart: timeline[i - 1].end,
          gapEnd: timeline[i].start,
          gapDuration: gap,
          beforeResource: timeline[i - 1].url.substring(0, 50) + "...",
          afterResource: timeline[i].url.substring(0, 50) + "...",
          suggestion: gap > 200 ? "Critical gap - investigate waterfall" : "Minor optimization opportunity",
        });
      }
    }

    // Check if total load time exceeds target
    if (this.analysisReport.totalLoadTime > this.targetLoadTime) {
      const excess = this.analysisReport.totalLoadTime - this.targetLoadTime;
      this.analysisReport.performanceGaps.push({
        type: "Target Exceeded",
        excess: excess,
        suggestion: `Total load time exceeds ${this.targetLoadTime}ms target by ${excess}ms`,
      });
    }
  }

  analyzeResourceBreakdown(entries) {
    console.log("📈 Analyzing resource breakdown...");

    Object.keys(this.analysisReport.resourceBreakdown).forEach((type) => {
      const breakdown = this.analysisReport.resourceBreakdown[type];
      breakdown.avgTime = Math.round(breakdown.avgTime);
      breakdown.totalSizeFormatted = this.formatBytes(breakdown.totalSize);
    });
  }

  identifyBottlenecks() {
    console.log("🚫 Identifying performance bottlenecks...");

    // Sort bottlenecks by severity
    this.analysisReport.bottlenecks.sort((a, b) => b.time - a.time);
  }

  generateOptimizationPlan() {
    console.log("💡 Generating optimization recommendations...");

    const optimizations = [];

    // Image optimization
    const imageBottlenecks = this.analysisReport.bottlenecks.filter((b) => b.type === "image");
    if (imageBottlenecks.length > 0) {
      optimizations.push({
        priority: "HIGH",
        category: "Images",
        suggestion: "Convert images to WebP format and implement responsive sizing",
        impact: "Could save 60-80% on image file sizes",
        action: "Run the WebP converter script",
      });
    }

    // Large files
    const largeFiles = this.analysisReport.bottlenecks.filter((b) => b.issue === "Large file size");
    if (largeFiles.length > 0) {
      optimizations.push({
        priority: "HIGH",
        category: "File Size",
        suggestion: "Compress and optimize large files",
        impact: "Reduce bandwidth usage by 50-70%",
        action: "Implement gzip/brotli compression",
      });
    }

    // Slow requests
    const slowRequests = this.analysisReport.bottlenecks.filter((b) => b.issue === "Slow request");
    if (slowRequests.length > 0) {
      optimizations.push({
        priority: "MEDIUM",
        category: "Network",
        suggestion: "Optimize slow requests with caching and CDN",
        impact: "Reduce request times by 40-60%",
        action: "Implement proper caching headers and CDN",
      });
    }

    // Performance gaps
    if (this.analysisReport.performanceGaps.length > 0) {
      optimizations.push({
        priority: "MEDIUM",
        category: "Loading Strategy",
        suggestion: "Optimize resource loading order and implement preloading",
        impact: "Reduce loading gaps and improve perceived performance",
        action: "Implement resource hints and optimize critical path",
      });
    }

    // Target time exceeded
    if (this.analysisReport.totalLoadTime > this.targetLoadTime) {
      optimizations.push({
        priority: "CRITICAL",
        category: "Overall Performance",
        suggestion: `Total load time is ${Math.round(this.analysisReport.totalLoadTime)}ms, target is ${this.targetLoadTime}ms`,
        impact: "Critical for user experience",
        action: "Implement all high-priority optimizations immediately",
      });
    }

    this.analysisReport.optimizations = optimizations;
  }

  generateReport() {
    console.log("\n📊 HAR ANALYSIS REPORT");
    console.log("=".repeat(60));
    console.log(`⏱️  Total Load Time: ${Math.round(this.analysisReport.totalLoadTime)}ms`);
    console.log(`🎯 Target Load Time: ${this.targetLoadTime}ms`);
    console.log(
      `📈 Performance Status: ${this.analysisReport.totalLoadTime <= this.targetLoadTime ? "✅ GOOD" : "❌ NEEDS OPTIMIZATION"}`
    );

    // Resource breakdown
    console.log("\n📋 RESOURCE BREAKDOWN:");
    console.log("-".repeat(80));
    console.log("Type".padEnd(12) + "Count".padEnd(8) + "Total Size".padEnd(15) + "Avg Time".padEnd(12) + "Total Time");
    console.log("-".repeat(80));

    Object.entries(this.analysisReport.resourceBreakdown).forEach(([type, data]) => {
      console.log(
        type.padEnd(12) +
          data.count.toString().padEnd(8) +
          data.totalSizeFormatted.padEnd(15) +
          `${data.avgTime}ms`.padEnd(12) +
          `${Math.round(data.totalTime)}ms`
      );
    });

    // Critical path
    if (this.analysisReport.criticalPathItems.length > 0) {
      console.log("\n🎯 CRITICAL PATH ANALYSIS:");
      console.log("-".repeat(80));
      this.analysisReport.criticalPathItems.forEach((item) => {
        console.log(`   ${item.type}: ${item.time}ms (${item.size})`);
        console.log(`   └─ ${item.url}`);
      });
    }

    // Performance gaps
    if (this.analysisReport.performanceGaps.length > 0) {
      console.log("\n⚠️  PERFORMANCE GAPS:");
      console.log("-".repeat(80));
      this.analysisReport.performanceGaps.slice(0, 5).forEach((gap) => {
        if (gap.type === "Target Exceeded") {
          console.log(`   🚨 ${gap.suggestion}`);
        } else {
          console.log(`   ⏳ ${Math.round(gap.gapDuration)}ms gap - ${gap.suggestion}`);
        }
      });
    }

    // Bottlenecks
    if (this.analysisReport.bottlenecks.length > 0) {
      console.log("\n🚫 TOP BOTTLENECKS:");
      console.log("-".repeat(80));
      this.analysisReport.bottlenecks.slice(0, 5).forEach((bottleneck, index) => {
        console.log(`   ${index + 1}. ${bottleneck.issue}: ${bottleneck.time}ms (${bottleneck.size})`);
        console.log(`      └─ ${bottleneck.url}`);
      });
    }

    // Optimizations
    if (this.analysisReport.optimizations.length > 0) {
      console.log("\n💡 OPTIMIZATION RECOMMENDATIONS:");
      console.log("-".repeat(80));
      this.analysisReport.optimizations.forEach((opt, index) => {
        console.log(`   ${index + 1}. [${opt.priority}] ${opt.category}`);
        console.log(`      💡 ${opt.suggestion}`);
        console.log(`      📈 ${opt.impact}`);
        console.log(`      🔧 ${opt.action}`);
        console.log("");
      });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, "..", "har-analysis-report.json");
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: {
            totalLoadTime: this.analysisReport.totalLoadTime,
            targetLoadTime: this.targetLoadTime,
            performanceStatus: this.analysisReport.totalLoadTime <= this.targetLoadTime ? "GOOD" : "NEEDS_OPTIMIZATION",
          },
          ...this.analysisReport,
        },
        null,
        2
      )
    );

    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static async createHARFile(url = "http://localhost:3000") {
    console.log("🌐 Creating HAR file from live website...");

    try {
      // Use Chrome to generate HAR file
      const harOutputPath = path.join(__dirname, "..", "website-performance.har");

      // This would require Chrome DevTools Protocol or Puppeteer
      console.log(`📝 To generate a HAR file:`);
      console.log(`   1. Open Chrome DevTools (F12)`);
      console.log(`   2. Go to Network tab`);
      console.log(`   3. Reload your page: ${url}`);
      console.log(`   4. Right-click in Network tab > Save all as HAR`);
      console.log(`   5. Save as: ${harOutputPath}`);
      console.log(`   6. Run: node scripts/har-analyzer.js ${harOutputPath}`);

      return harOutputPath;
    } catch (error) {
      console.error("❌ Failed to create HAR file:", error.message);
      return null;
    }
  }
}

// Main execution
async function main() {
  const harFilePath = process.argv[2];

  if (!harFilePath) {
    console.log("🔧 HAR File Analyzer - Performance Gap Detection");
    console.log("=".repeat(50));
    console.log("Usage: node scripts/har-analyzer.js <path-to-har-file>");
    console.log("");
    await HARAnalyzer.createHARFile();
    return;
  }

  const analyzer = new HARAnalyzer();
  await analyzer.analyzeHARFile(harFilePath);

  console.log("\n🎯 NEXT STEPS TO ACHIEVE <2MS LOAD TIME:");
  console.log("   1. Run WebP converter: node scripts/webp-converter-advanced.js");
  console.log("   2. Enable gzip/brotli compression in nginx.conf");
  console.log("   3. Implement CDN for static assets");
  console.log("   4. Add resource preloading for critical path");
  console.log("   5. Re-run this analyzer to measure improvements");
}

if (require.main === module) {
  main();
}

module.exports = HARAnalyzer;
