const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function findFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findFiles(fullPath, files);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }
    return files;
}

const allFiles = findFiles(srcDir);
const hardcodedString = "'http://localhost:3001/api";
const hardcodedAvatar1 = "`http://localhost:3001${";
const hardcodedAvatar2 = "`http://localhost:3001/api/admin";

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    // For services using strict string
    if (content.includes(hardcodedString)) {
        content = content.replace(/'http:\/\/localhost:3001\/api/g, "import.meta.env.VITE_API_URL + '/api");
        changed = true;
    }

    // For avatars or other template literals
    if (content.includes(hardcodedAvatar1)) {
        content = content.replace(/`http:\/\/localhost:3001\$\{/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$\{");
        changed = true;
    }

    // Admin post report
    if (content.includes(hardcodedAvatar2)) {
        content = content.replace(/`http:\/\/localhost:3001\/api/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api");
        changed = true;
    }

    // Single fetch call
    if (content.includes("'http://localhost:3001/api/admin/post-reports/batch'")) {
        content = content.replace(/'http:\/\/localhost:3001\/api\/admin\/post-reports\/batch'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/post-reports/batch`");
        changed = true;
    }

    if (changed) {
        // If we used import.meta.env in a file that didn't have it, we might want to make sure the syntax is correct.
        // In our case, the replacements above handle it.
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`Updated: ${file}`);
    }
});
console.log('Update complete.');
