
const webpack = require('webpack');

module.exports = {
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        vm: false,
        path: require.resolve('path-browserify'),
        child_process: false,
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }
    return config;
  },
};
