const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: './src/main.ts',
  target: ['web', 'es2020'],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript' },
              target: 'es2020',
              transform: { useDefineForClassFields: false },
            },
            module: { type: 'commonjs' },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
};
