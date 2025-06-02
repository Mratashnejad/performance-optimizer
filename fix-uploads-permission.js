const fs = require('fs');
const path = require('path');

async function fixUploadsPermissions() {
    console.log('🔧 Fixing uploads directory permissions...');
    
    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
            console.log('✅ Created uploads directory');
        }
        
        // Create subdirectories
        const subdirs = ['articles', 'users', 'categories', 'temp'];
        subdirs.forEach(subdir => {
            const subdirPath = path.join(uploadsDir, subdir);
            if (!fs.existsSync(subdirPath)) {
                fs.mkdirSync(subdirPath, { recursive: true, mode: 0o755 });
                console.log(`✅ Created ${subdir} directory`);
            }
        });
        
        // Test write access
        const testFile = path.join(uploadsDir, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('✅ Write access confirmed');
        
        console.log('🎉 Uploads directory setup complete!');
        
    } catch (error) {
        console.error('❌ Error fixing uploads permissions:', error);
        process.exit(1);
    }
}

fixUploadsPermissions(); 