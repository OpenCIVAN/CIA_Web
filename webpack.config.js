// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src', 'index.js'),
  },

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/', // serve from root
  },

  // 🔹 Allow WebAssembly modules
  experiments: {
    asyncWebAssembly: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.glsl$/,
        use: 'webpack-glsl-loader',
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      // Optional: if later you import .wasm directly
      {
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          // keep the original file name (vtkWasmApp.wasm)
          filename: '[name][ext]',
        },
      },
    ],
  },

  // 🔹 Stop Webpack from trying to bundle Node's 'crypto' module
  resolve: {
    extensions: ['.js'],
    fallback: {
      crypto: false,
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),

    // 🔹 Copy vtkWasmApp.wasm to dist root so the Emscripten JS can fetch it
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/wasm/vtkWasmApp.wasm'),
          to: path.resolve(__dirname, 'dist/vtkWasmApp.wasm'),
        },
      ],
    }),
  ],

  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    open: true,
    hot: true,
  },

  mode: 'development',
};
