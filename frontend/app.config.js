module.exports = ({ config }) => {
  // This loads all the settings from your existing app.json
  // and essentially "copies" them here.
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          // This pulls the key from your .env file
          apiKey: process.env.GOOGLE_MAPS_API_KEY, 
        },
      },
    },
  };
};