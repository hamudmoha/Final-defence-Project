const path = require('path');
const fs = require('fs');

const folders = ['models', 'controllers', 'routes', 'utils'];

folders.forEach(folder => {
    const dir = path.join(__dirname, '../src', folder);
    if (!fs.existsSync(dir)) return;
    
    console.log(`--- Checking ${folder} ---`);
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (!file.endsWith('.js')) return;
        try {
            require(path.join(dir, file));
            console.log(`✅ Loaded ${file}`);
        } catch (err) {
            console.error(`❌ Failed to load ${file}: ${err.message}`);
        }
    });
});
