const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const { DefinePlugin } = require("webpack");

module.exports = async function (env, argv) {
  let config = await createExpoWebpackConfigAsync(env, argv);

  // pull in expo env variables
  const definitions = Object.entries(process.env).reduce((acc, [ky, vl]) => {
    if (ky.startsWith("EXPO_PUBLIC")) {
      acc[ky] = JSON.stringify(vl);
    }
    return acc;
  }, {});
  const dp = config.plugins.find((p) => !!p?.definitions);
  dp.definitions["process.env"] = {
    ...dp.definitions["process.env"],
    ...definitions,
  };

  // proxy api requests
  config.devServer.proxy = {
    "/api/shopping_list": {
      target: `https://${process.env.EXPO_PUBLIC_API_HOST}/`,
      changeOrigin: true,
      secure: true,
    },
  };

  return config;
};
