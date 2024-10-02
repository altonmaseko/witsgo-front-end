describe('Rental page', () => {
    // Set the viewport size to 360x800 before each test
    beforeEach(() => {
      cy.viewport(360, 800);
      cy.intercept('GET', `${Cypress.env('serverUrl')}/verifylogin`, {
        statusCode: 200,
        body: {
            isLoggedIn: true,
            user: {
                user: {
                    firstName: 'John',
                    lastName: 'Doe',
                    picture: 'https://example.com/profile.jpg',
                    onWheelChair: false,
                    email: 'john.doe@example.com',
                    role: 'student',
                    _id: '12345'
                }
            }
        }
    }).as('verifyLogin');
    

    
      cy.visit('http://localhost:5000/rental.html',{
        onBeforeLoad(win) {
          cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
            success({
              coords: {
                latitude: -26.1913581,
                longitude: 28.0267878,
              },
            });
          });
        },
        });
    });

    it('Elements loaded', () => {
        // Wait for a specific element that indicates the page is loaded
        cy.get("#map").should("be.visible");
      });

    it('should display the map container in mobile view', () => {
      cy.get('#map').should('be.visible');
    });
  
  
});
  