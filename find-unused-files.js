// find-unused-files.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, 'src')
const sourceExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.json']
const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.webm', '.ico']

// Recursively get all files in a folder by extensions
function getAllFiles(dirPath, exts, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, exts, arrayOfFiles)
    } else if (exts.includes(path.extname(fullPath).toLowerCase())) {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

// Generate possible import patterns for a file
function generateImportPatterns(file) {
  const fileName = path.basename(file)
  const fileNameNoExt = path.basename(file, path.extname(file))
  const relPath = path.relative(projectRoot, file)
  const relPathNoExt = relPath.replace(path.extname(file), '')
  
  // Normalize to forward slashes for cross-platform compatibility
  const normalizedRelPath = relPathNoExt.replace(/\\/g, '/')
  
  // Generate variations (case-insensitive, with/without extension)
  const patterns = [
    fileName.toLowerCase(),
    fileNameNoExt.toLowerCase(),
    normalizedRelPath.toLowerCase(),
    `/${normalizedRelPath}`.toLowerCase(),
    `./${normalizedRelPath}`.toLowerCase(),
    `../${normalizedRelPath}`.toLowerCase(),
    `@/${normalizedRelPath}`.toLowerCase(),
    `/src/${normalizedRelPath}`.toLowerCase(),
  ]
  
  return patterns
}

// Check if a file is referenced anywhere (smarter matching)
function fileIsReferencedInCode(allFiles, file) {
  const patterns = generateImportPatterns(file)
  
  return allFiles.some(f => {
    if (f === file) return false
    
    try {
      const content = fs.readFileSync(f, 'utf8').toLowerCase() // Case-insensitive
      
      // Check if any pattern exists in the content
      return patterns.some(pattern => content.includes(pattern))
    } catch (err) {
      // Skip files that can't be read
      return false
    }
  })
}

// Check if an asset file is referenced anywhere (in code or CSS)
function assetIsReferenced(allSourceFiles, allCssFiles, assetFile) {
  const fileName = path.basename(assetFile)
  const assetRelPath = path.relative(projectRoot, assetFile).replace(/\\/g, '/')
  
  const patterns = [
    fileName.toLowerCase(),
    assetRelPath.toLowerCase(),
    `./${assetRelPath}`.toLowerCase(),
    `../${assetRelPath}`.toLowerCase(),
    `@/${assetRelPath}`.toLowerCase(),
    `/src/${assetRelPath}`.toLowerCase(),
  ]

  const checkFiles = allSourceFiles.concat(allCssFiles)
  return checkFiles.some(f => {
    try {
      const content = fs.readFileSync(f, 'utf8').toLowerCase()
      return patterns.some(pattern => content.includes(pattern))
    } catch (err) {
      return false
    }
  })
}

console.log('🔍 Scanning project for unused files...\n')

const allSourceFiles = getAllFiles(projectRoot, sourceExtensions)
const allAssetFiles = getAllFiles(projectRoot, assetExtensions)
const allCssFiles = getAllFiles(projectRoot, ['.css'])

console.log(`📊 Found ${allSourceFiles.length} source files and ${allAssetFiles.length} asset files\n`)

const unusedSourceFiles = allSourceFiles.filter(file => !fileIsReferencedInCode(allSourceFiles, file))
const unusedAssetFiles = allAssetFiles.filter(file => !assetIsReferenced(allSourceFiles, allCssFiles, file))

console.log(`\n=== ❌ Unused Source Files ===`)
if (unusedSourceFiles.length === 0) {
  console.log('✅ None found!')
} else {
  unusedSourceFiles.forEach(f => console.log(`  - ${path.relative(__dirname, f)}`))
}

console.log(`\n=== ❌ Unused Asset Files (Images/Videos) ===`)
if (unusedAssetFiles.length === 0) {
  console.log('✅ None found!')
} else {
  unusedAssetFiles.forEach(f => console.log(`  - ${path.relative(__dirname, f)}`))
}

console.log(`\n=== 📊 Summary ===`)
console.log(`Total source files: ${allSourceFiles.length}`)
console.log(`Unused source files: ${unusedSourceFiles.length}`)
console.log(`Total asset files: ${allAssetFiles.length}`)
console.log(`Unused asset files: ${unusedAssetFiles.length}`)
console.log(`\n💡 Tip: Always manually verify before deleting files!`)
