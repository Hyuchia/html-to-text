// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const webpack = require('@cypress/webpack-preprocessor');

module.exports = (on) => {
  on('file:preprocessor', webpack((env) => {
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
  }));
};
