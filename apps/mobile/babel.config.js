module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@hooks': './src/hooks',
          '@stores': './src/stores',
          '@services': './src/services',
          '@theme': './src/theme',
          '@lib': './src/lib',
          '@types': './src/types',
        },
      }],
      'react-native-reanimated/plugin',
    ],
  };
};
