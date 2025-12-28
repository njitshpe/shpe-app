const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolve: metroResolve } = require('metro-resolver');

const config = getDefaultConfig(__dirname);

const defaultResolve = (context, moduleName, platform) =>
  metroResolve(context, moduleName, platform);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force worklets to use the compiled JS entry so Metro doesn't need to resolve TS sources.
  if (moduleName === 'react-native-worklets') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native-worklets/lib/module/index.js'
      ),
    };
  }
  return defaultResolve(context, moduleName, platform);
};

module.exports = config;
