import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();

function addFilesRecursively(dirPath, zipFolder) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'public' || entry.name === 'scripts') {
        continue;
      }
      const newZipFolder = zipFolder ? zipFolder.folder(entry.name) : zip.folder(entry.name);
      addFilesRecursively(fullPath, newZipFolder);
    } else {
      if (entry.name.endsWith('.zip') || entry.name === 'bun.lock') continue;
      const fileData = fs.readFileSync(fullPath);
      if (zipFolder) {
        zipFolder.file(entry.name, fileData);
      } else {
        zip.file(entry.name, fileData);
      }
    }
  }
}

async function makeZip() {
  const rootDir = process.cwd();
  console.log('Packaging source files from:', rootDir);

  // Files to include
  const individualFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
    'firestore.rules',
    'firebase-blueprint.json',
    'firebase-applet-config.json',
    '.env.example',
    '.gitignore'
  ];

  for (const file of individualFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      zip.file(file, fs.readFileSync(filePath));
    }
  }

  // Include src directory
  const srcDir = path.join(rootDir, 'src');
  if (fs.existsSync(srcDir)) {
    const srcFolder = zip.folder('src');
    addFilesRecursively(srcDir, srcFolder);
  }

  // Ensure public directory
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const zipPath = path.join(publicDir, 'documorph-source-code.zip');
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(zipPath, buffer);

  console.log('Successfully created:', zipPath, `(${buffer.length} bytes)`);
}

makeZip().catch(console.error);
