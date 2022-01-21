const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    index: "./src/index.js",
    levelMaker: "./src/LevelMaker.js",
    trainer: "./src/train model.js",
    tester: "./src/use model.js",
  },
  mode: "production",
  output: {
    filename: "[name].[hash:5].js",
    path: __dirname + "/dist",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  performance: {
    hints: false,
  },
  optimization: {
    moduleIds: 'deterministic',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: true,
      chunks: ["index"],
      filename: "index.html",
    }),
    new HtmlWebpackPlugin({
      template: "./src/editor.html",
      inject: true,
      chunks: ["levelMaker"],
      filename: "editor.html",
    }),
    new HtmlWebpackPlugin({
      template: "./src/train.html",
      inject: true,
      chunks: ["trainer"],
      filename: "train.html",
    }),
    new HtmlWebpackPlugin({
      template: "./src/test.html",
      inject: true,
      chunks: ["tester"],
      filename: "test.html",
    }),
  ],
};
