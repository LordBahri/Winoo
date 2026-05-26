const { withGradleProperties } = require('@expo/config-plugins');
const appJson = require('./app.json');

const withReducedBuildParallelism = (config) =>
  withGradleProperties(config, (cfg) => {
    const keysToRemove = new Set([
      'org.gradle.jvmargs',
      'org.gradle.parallel',
      'org.gradle.daemon',
      'org.gradle.workers.max',
    ]);
    cfg.modResults = cfg.modResults.filter((item) => !keysToRemove.has(item.key));
    cfg.modResults.push(
      { type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx2g -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8' },
      { type: 'property', key: 'org.gradle.parallel', value: 'false' },
      { type: 'property', key: 'org.gradle.daemon', value: 'false' },
      { type: 'property', key: 'org.gradle.workers.max', value: '2' },
    );
    return cfg;
  });

module.exports = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins || []),
    withReducedBuildParallelism,
  ],
};
