const path = require('path');

module.exports = env => {
  let minimize = false;

  if (env) {
    minimize = env.min;
  }

  return {
    entry: './src/index.js',
    mode: 'production',
    output: {
      filename: `html-to-text.${minimize ? 'min.' : ''}js`,
      path: path.resolve(__dirname, 'dist'),
      library: {
        root: 'HTMLToText',
        amd: 'html-to-text',
        commonjs: 'html-to-text',
      },
      libraryTarget: 'umd',
    },
    devtool: 'source-map',
    optimization: {
      minimize,
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: '> 5%',
                  },
                ],
              ],
              plugins: ['@babel/plugin-syntax-object-rest-spread', '@babel/plugin-proposal-class-properties'],
            },
          },
        },
      ],
    },
  };
};
