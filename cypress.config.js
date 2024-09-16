const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        mockGeolocation() {
          return new Promise((resolve) => {
            resolve({
              coords: {
                latitude: -26.1913581,
                longitude: 28.0267878,
              },
            });
          });
        },
      });
      // Implement other node event listeners here if needed
    },
    excludeSpecPattern: [
      '*/**/1-getting-started',
      '*/**/2-advanced-examples',
    ],
  },
});
