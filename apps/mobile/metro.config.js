const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch workspace packages but block temp dirs and other apps' node_modules
config.watchFolders = [workspaceRoot];
config.resolver.blockList = [
  // Block temp files created during pnpm installs
  /node_modules\/.*_tmp_.*/,
  // Block other apps to avoid cross-app module collisions
  new RegExp(`${path.resolve(workspaceRoot, 'apps/api').replace(/\\/g, '/')}.*`),
  new RegExp(`${path.resolve(workspaceRoot, 'apps/web').replace(/\\/g, '/')}.*`),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './src/global.css' });
