module.exports = ({ config }) => {
  const mapsKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  // Avoid console output here: expo-doctor treats it as an error.
  // For diagnostics, run with EXPO_CONFIG_DEBUG=1
  if (!mapsKey && process.env.EXPO_CONFIG_DEBUG === '1') {
    // eslint-disable-next-line no-console
    console.log(
      '[app.config.js] Missing GOOGLE_MAPS_API_KEY / EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.'
    );
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: mapsKey,
        },
      },
    },
  };
};