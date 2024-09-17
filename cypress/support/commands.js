// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })


Cypress.Commands.add('mockGeolocation', () => {
    cy.window().then((win) => {
      const geolocation = {
        getCurrentPosition: (success, error) => {
          // Mock a successful geolocation response
          success({
            coords: {
              latitude: -26.1913581, // Example latitude
              longitude: 28.0267878, // Example longitude
            },
          });
        },
        watchPosition: () => {},
        clearWatch: () => {},
      };
      Object.defineProperty(win.navigator, 'geolocation', {
        value: geolocation,
        configurable: true,
      });
    });
  });
