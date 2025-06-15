/**
 * Configuración de webpack para compilar la extensión para web
 * Autor: trystan4861
 */

const path = require('path');
const webpack = require('webpack');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const webExtensionConfig = {
  mode: 'none', // esto mantiene el código fuente lo más cercano posible al original
  target: 'webworker', // las extensiones se ejecutan en un contexto webworker
  entry: {
    'extension': './src/extension.ts', // punto de entrada principal de la extensión web
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './dist/web'),
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'], // buscar punto de entrada 'browser' en módulos node importados
    extensions: ['.ts', '.js'], // soporte para archivos ts y js
    alias: {
      // proporciona implementación alternativa para módulos node y archivos fuente
    },
    fallback: {
      // Webpack 5 ya no incluye polyfills automáticamente para módulos core de Node.js
      // ver https://webpack.js.org/configuration/resolve/#resolvefallback
      'assert': require.resolve('assert'),
      'path': require.resolve('path-browserify')
    }
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.web.json'
        }
      }]
    }]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser', // proporciona un shim para la variable global 'process'
    }),
  ],
  externals: {
    'vscode': 'commonjs vscode', // ignorado porque no existe
  },
  performance: {
    hints: false
  },
  devtool: 'nosources-source-map' // crear un source map que apunte al archivo fuente original
};

module.exports = [webExtensionConfig];