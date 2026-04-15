const fs = require('fs');
const path = require('path');

// Blueprint <=0.33.1 assumes fs.Dirent has `.path` when using readdir({recursive:true, withFileTypes:true})
// but Node.js 24 provides `.parentPath` instead. This patch keeps local dev/deploy working on Node 24.
const file = path.join(__dirname, '..', 'node_modules', '@ton', 'blueprint', 'dist', 'utils', 'selection.utils.js');

if (!fs.existsSync(file)) {
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8');
if (src.includes('script.parentPath') || src.includes('parentPath ??')) {
  process.exit(0);
}

src = src.replaceAll('script.path.slice', '(script.parentPath ?? script.path).slice');
src = src.replaceAll('path_1.default.join(script.path, script.name)', 'path_1.default.join((script.parentPath ?? script.path), script.name)');

fs.writeFileSync(file, src, 'utf8');
console.log('Patched @ton/blueprint for Node 24 Dirent.parentPath');

