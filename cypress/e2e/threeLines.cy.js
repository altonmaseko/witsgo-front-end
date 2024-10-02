import 'cypress-real-events/support';

describe('Top Navigation Test', () => {

    beforeEach(() => {
      // Visit the page where the navbar is located
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
    
    
      cy.visit('http://localhost:5000/buses'); // Replace with your actual page URL
    });
  
    it('Testing top nav thingy', () => {
        cy.get(".dropbtn").should("be.visible");
        cy.get('.dropbtn') // Replace with your actual selector
        .realHover();
        cy.get(".wheelchair-option").should("be.visible");
        cy.get(".dropdown-content a").should("be.visible");
        cy.get('#wheelchair-toggle').check();
        cy.get('#wheelchair-toggle').should('be.checked');
    })
});
  