module.exports = {
  // publicPath: "/chat-ea-web/",
  publicPath: "/",
  devServer: {
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8082, // CHANGE YOUR PORT HERE!
    https: false,
    hotOnly: false,
  },
};
