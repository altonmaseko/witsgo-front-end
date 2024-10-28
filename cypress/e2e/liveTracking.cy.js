describe('Live tracking', () => {
    beforeEach(() => {
      cy.viewport(360, 800);
      // Setting up localStorage before visiting the page
      cy.window().then((window) => {
        window.localStorage.setItem('role', 'student'); // Example role
      });
      cy.intercept('GET', `${Cypress.env('serverUrl')}/verifylogin?token=null`, {
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
    
      cy.visit('http://localhost:5000/realTimeTracking.html',{
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
  
    it('Checking elements', () => {
      // Retrieve the role from localStorage and check its value
      cy.window().then((window) => {
        const role = window.localStorage.getItem('role');
        expect(role).to.equal('student'); // Verify that the role is set correctly
      });

      cy.get(".check-and-vehicle-container").should("be.visible");

      cy.get(".check-and-vehicle").eq(0).should("be.visible")
      cy.get(".vehicle").eq(0).contains("Wits Bus")

      cy.get(".check-and-vehicle").eq(1).should("be.visible")
      cy.get(".vehicle").eq(1).contains("Campus Control Shuttle")

      cy.get(".check-and-vehicle").eq(2).should("be.visible")
      cy.get(".vehicle").eq(2).contains("Campus Security")

    });


});
  