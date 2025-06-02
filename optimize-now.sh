#!/bin/bash

# Performance Optimization Script for <2ms Load Time
# Based on Lighthouse audit findings showing 4,755 KB potential savings

echo "🚀 Starting Website Performance Optimization"
echo "=============================================="
echo "🎯 Target: <2ms load time"
echo "📊 Current LCP: 4.3s → Target: <2ms"
echo ""

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to check if node modules are installed
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        echo "📦 Installing Node.js dependencies..."
        cd "$PROJECT_ROOT"
        npm install
    fi
    
    # Check for required packages
    if ! npm list sharp >/dev/null 2>&1; then
        echo "📷 Installing Sharp for image processing..."
        npm install sharp
    fi
    
    if ! npm list glob >/dev/null 2>&1; then
        echo "🔍 Installing Glob for file search..."
        npm install glob
    fi
    
    echo "✅ Dependencies ready"
}

# Function to backup original files
backup_files() {
    echo "💾 Creating backup of original files..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/pre-optimization-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup nginx config if exists
    if [ -f "$PROJECT_ROOT/nginx.conf" ]; then
        cp "$PROJECT_ROOT/nginx.conf" "$BACKUP_DIR/nginx.conf.backup"
    fi
    
    # Backup next config
    if [ -f "$PROJECT_ROOT/next.config.js" ]; then
        cp "$PROJECT_ROOT/next.config.js" "$BACKUP_DIR/next.config.js.backup"
    fi
    
    # Create image inventory before conversion
    find "$PROJECT_ROOT/public" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) > "$BACKUP_DIR/original-images-list.txt" 2>/dev/null || true
    
    echo "✅ Backup created at: $BACKUP_DIR"
}

# Function to run WebP conversion
run_webp_conversion() {
    echo ""
    echo "📸 Step 1: Converting all images to WebP format..."
    echo "   This will significantly reduce image file sizes (60-80% reduction)"
    echo "   Original files will be removed after successful conversion"
    echo ""
    
    cd "$SCRIPT_DIR"
    if node webp-converter-advanced.js; then
        echo "✅ WebP conversion completed successfully"
    else
        echo "❌ WebP conversion failed - check the logs above"
        exit 1
    fi
}

# Function to run full optimization
run_full_optimization() {
    echo ""
    echo "🔧 Step 2: Running full performance optimization..."
    echo "   This includes nginx optimization, Next.js config, and CDN setup"
    echo ""
    
    cd "$SCRIPT_DIR"
    if node performance-optimizer.js; then
        echo "✅ Full optimization completed successfully"
    else
        echo "❌ Optimization failed - check the logs above"
        exit 1
    fi
}

# Function to analyze current performance
analyze_performance() {
    echo ""
    echo "📊 Step 3: Performance Analysis Instructions"
    echo "=========================================="
    echo ""
    echo "To analyze your website's performance gaps:"
    echo ""
    echo "1. 🌐 Open Chrome and navigate to your website"
    echo "2. 🔧 Open DevTools (F12) and go to Network tab"
    echo "3. 🔄 Reload the page to capture all network requests"
    echo "4. 💾 Right-click in Network tab → 'Save all as HAR'"
    echo "5. 📁 Save as: $PROJECT_ROOT/website-performance.har"
    echo "6. 🔍 Run: node scripts/har-analyzer.js website-performance.har"
    echo ""
    echo "This will identify specific performance gaps and bottlenecks."
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "🎯 NEXT STEPS FOR <2MS LOAD TIME"
    echo "================================"
    echo ""
    echo "1. 🚀 Deploy the optimized nginx configuration:"
    echo "   - Use the generated nginx-optimized.conf"
    echo "   - Enable Brotli compression module"
    echo "   - Restart nginx service"
    echo ""
    echo "2. 🌐 Set up CDN (CloudFlare recommended):"
    echo "   - Use the generated cdn-config.json as reference"
    echo "   - Enable auto-minification"
    echo "   - Configure image optimization at edge"
    echo ""
    echo "3. 📈 Monitor and verify improvements:"
    echo "   - Run Lighthouse audit again"
    echo "   - Use HAR analyzer to check loading gaps"
    echo "   - Monitor real user metrics"
    echo ""
    echo "4. 🔧 Additional optimizations if needed:"
    echo "   - Implement critical CSS inlining"
    echo "   - Add resource preloading hints"
    echo "   - Consider server-side rendering optimization"
    echo ""
    
    if [ -f "$PROJECT_ROOT/performance-optimization-report.json" ]; then
        echo "📄 Check the detailed report: performance-optimization-report.json"
    fi
}

# Main execution
main() {
    echo "Starting optimization process..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo "❌ Error: Please run this script from the project root or scripts directory"
        exit 1
    fi
    
    # Run optimization steps
    check_dependencies
    backup_files
    run_webp_conversion
    run_full_optimization
    analyze_performance
    show_next_steps
    
    echo ""
    echo "🎉 OPTIMIZATION COMPLETE!"
    echo "========================"
    echo ""
    echo "🏃‍♂️ Quick verification checklist:"
    echo "   □ Test website functionality (especially images)"
    echo "   □ Check console for any errors"
    echo "   □ Verify image loading works correctly"
    echo "   □ Deploy nginx configuration"
    echo "   □ Set up CDN"
    echo "   □ Re-run performance tests"
    echo ""
    echo "💡 Estimated improvements based on your Lighthouse audit:"
    echo "   • ~4,755 KB file size reduction"
    echo "   • 60-80% smaller image files"
    echo "   • Significant LCP improvement"
    echo "   • Better caching and compression"
    echo ""
    echo "🎯 If target of <2ms is not achieved, run additional optimizations!"
}

# Handle script arguments
case "${1:-}" in
    "webp-only")
        echo "🔄 Running WebP conversion only..."
        check_dependencies
        backup_files
        run_webp_conversion
        ;;
    "analyze-only")
        echo "📊 Showing analysis instructions only..."
        analyze_performance
        ;;
    "full"|"")
        main
        ;;
    *)
        echo "Usage: $0 [webp-only|analyze-only|full]"
        echo ""
        echo "  webp-only    - Convert images to WebP only"
        echo "  analyze-only - Show HAR analysis instructions only" 
        echo "  full         - Run complete optimization (default)"
        exit 1
        ;;
esac 