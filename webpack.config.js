const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const env = process.env;

module.exports = {
  entry: {
    popup: './src/popup',
    eventPage: './src/scripts/eventPage',
    injection: './src/scripts/injection',
  },
  output: {
    path: path.resolve(__dirname, `./build/${env.NODE_ENV}`),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          preLoaders: {
            html: 'html-minify-loader',
          },
          preserveWhitespace: false,
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]',
        },
      },
    ],
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.esm.js',
    },
    extensions: ['*', '.js', '.vue'],
  },
  plugins: [
    new webpack.EnvironmentPlugin([
      'NODE_ENV',
    ]),
    new CopyWebpackPlugin([
      './src/assets',
    ]),
  ],
  performance: {
    hints: false,
  },
};

switch (env.NODE_ENV) {
  case 'development': {
    module.exports.devServer = {
      historyApiFallback: true,
      noInfo: true,
      overlay: true,
    };
    module.exports.devtool = '#source-map';
    break;
  }
  case 'production': {
    module.exports.plugins = module.exports.plugins.concat([
      new UglifyJsPlugin({
        uglifyOptions: {
          ie8: true,
          ecma: 8,
          parse: {
            bare_returns: true,
          },
          mangle: {
            safari10: true,
            toplevel: true,
            eval: true,
          },
          compress: {
            warnings: false,
            // drop_console: true,
            unsafe: true,
          },
        },
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
      }),
      new webpack.optimize.OccurrenceOrderPlugin(true),
    ]);
    break;
  }
}
