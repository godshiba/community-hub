// Rebuild native modules for the packaged Electron binary after electron-builder packs the app.
// electron-builder calls this via the `afterPack` hook in electron-builder.yml.
const { execSync } = require('child_process')
const path = require('path')

exports.default = async function afterPack(context) {
  const { appOutDir, electronPlatformName, arch } = context

  console.log(`Rebuilding native modules for ${electronPlatformName} ${arch}...`)

  try {
    execSync(
      `npx @electron/rebuild -f -w better-sqlite3 --module-dir "${appOutDir}/resources/app"`,
      { stdio: 'inherit', cwd: path.resolve(__dirname, '..') }
    )
    console.log('Native modules rebuilt successfully.')
  } catch (err) {
    console.error('Failed to rebuild native modules:', err.message)
    throw err
  }
}
