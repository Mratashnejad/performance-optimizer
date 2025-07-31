const fs = require('fs');
const path = require('path');

// Get all component files
function getAllComponents() {
  const components = [];
  const componentsDir = path.join(__dirname, 'components');
  
  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, prefix + file + '/');
      } else if (file.endsWith('.tsx')) {
        const componentName = file.replace('.tsx', '');
        components.push({
          name: componentName,
          path: prefix + file,
          fullPath: fullPath,
          importPath: `components/${prefix}${componentName}`
        });
      }
    }
  }
  
  scanDirectory(componentsDir);
  return components;
}

// Search for component usage with more specific patterns
function findComponentUsage(component) {
  const usage = [];
  const appDir = path.join(__dirname, 'app');
  const componentsDir = path.join(__dirname, 'components');
  
  function searchInDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchInDirectory(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for import statements
            if (line.includes('import') && (
              line.includes(`from '@/components/${component.importPath}'`) ||
              line.includes(`from "@/components/${component.importPath}"`) ||
              line.includes(`from 'components/${component.importPath}'`) ||
              line.includes(`from "components/${component.importPath}"`) ||
              line.includes(`from '@/components/${component.path.replace('.tsx', '')}'`) ||
              line.includes(`from "@/components/${component.path.replace('.tsx', '')}"`)
            )) {
              usage.push({
                file: fullPath.replace(__dirname, ''),
                line: i + 1,
                type: 'import',
                content: line.trim()
              });
            }
            
            // Check for JSX usage
            if (line.includes(`<${component.name}`) || line.includes(`{${component.name}`)) {
              usage.push({
                file: fullPath.replace(__dirname, ''),
                line: i + 1,
                type: 'jsx',
                content: line.trim()
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  searchInDirectory(appDir);
  searchInDirectory(componentsDir);
  
  return usage;
}

// Main analysis
function analyzeComponents() {
  const components = getAllComponents();
  const results = {
    unused: [],
    usedOnce: [],
    usedMultiple: []
  };
  
  console.log('🔍 Analyzing component usage...\n');
  
  for (const component of components) {
    const usage = findComponentUsage(component);
    
    // Filter out self-references
    const filteredUsage = usage.filter(u => {
      const fileName = path.basename(u.file);
      return fileName !== component.path;
    });
    
    if (filteredUsage.length === 0) {
      results.unused.push({
        component: component.path,
        usage: []
      });
    } else if (filteredUsage.length === 1) {
      results.usedOnce.push({
        component: component.path,
        usage: filteredUsage
      });
    } else {
      results.usedMultiple.push({
        component: component.path,
        usage: filteredUsage
      });
    }
  }
  
  // Display results
  console.log('📊 COMPONENT USAGE ANALYSIS\n');
  
  console.log('❌ UNUSED COMPONENTS:');
  if (results.unused.length === 0) {
    console.log('  No unused components found!');
  } else {
    results.unused.forEach(item => {
      console.log(`  - ${item.component}`);
    });
  }
  
  console.log('\n🔸 USED ONLY ONCE:');
  if (results.usedOnce.length === 0) {
    console.log('  No single-use components found!');
  } else {
    results.usedOnce.forEach(item => {
      console.log(`  - ${item.component}`);
      console.log(`    Used in: ${item.usage[0].file}:${item.usage[0].line} (${item.usage[0].type})`);
    });
  }
  
  console.log('\n✅ MULTIPLE USAGE:');
  console.log(`  ${results.usedMultiple.length} components used multiple times`);
  
  console.log('\n📈 SUMMARY:');
  console.log(`  Total components: ${components.length}`);
  console.log(`  Unused: ${results.unused.length}`);
  console.log(`  Used once: ${results.usedOnce.length}`);
  console.log(`  Used multiple: ${results.usedMultiple.length}`);
  
  return results;
}

analyzeComponents(); 