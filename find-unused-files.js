const fs = require('fs')
const path = require('path')

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

// Check if a file path is referenced anywhere (for source files)
function fileIsReferencedInCode(allFiles, file) {
  const fileName = path.basename(file)
  const fileRelPathWithoutExt = path.relative(projectRoot, file).replace(path.extname(file), '')

  return allFiles.some(f => {
    if (f === file) return false
    const content = fs.readFileSync(f, 'utf8')
    return (
      content.includes(fileName) ||
      content.includes(fileRelPathWithoutExt) ||
      content.includes(`./${fileRelPathWithoutExt}`) ||
      content.includes(`../${fileRelPathWithoutExt}`) ||
      content.includes(`/src/${fileRelPathWithoutExt}`)
    )
  })
}

// Check if an asset file is referenced anywhere (in code or CSS)
function assetIsReferenced(allSourceFiles, allCssFiles, assetFile) {
  const fileName = path.basename(assetFile)
  const assetRelPath = path.relative(projectRoot, assetFile).replace(/\\/g, '/') // Normalize slashes

  // Check in source files and CSS files
  const checkFiles = allSourceFiles.concat(allCssFiles)
  return checkFiles.some(f => {
    const content = fs.readFileSync(f, 'utf8')
    return (
      content.includes(fileName) ||
      content.includes(assetRelPath) ||
      content.includes(`./${assetRelPath}`) ||
      content.includes(`../${assetRelPath}`)
    )
  })
}

const allSourceFiles = getAllFiles(projectRoot, sourceExtensions)
const allAssetFiles = getAllFiles(projectRoot, assetExtensions)
const allCssFiles = getAllFiles(projectRoot, ['.css'])

const unusedSourceFiles = allSourceFiles.filter(file => !fileIsReferencedInCode(allSourceFiles, file))
const unusedAssetFiles = allAssetFiles.filter(file => !assetIsReferenced(allSourceFiles, allCssFiles, file))

console.log(`=== Unused Source Files ===`)
unusedSourceFiles.forEach(f => console.log(f))

console.log(`\n=== Unused Asset Files (Images/Videos) ===`)
unusedAssetFiles.forEach(f => console.log(f))
