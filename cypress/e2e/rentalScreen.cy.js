describe('Navigation Page Test (Mobile View)', () => {
    // Set the viewport size to 360x800 before each test
    beforeEach(() => {
      cy.viewport(360, 800);
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

    it('should load the navigation page in mobile view', () => {
        // Wait for a specific element that indicates the page is loaded
        cy.get('.container').should('be.visible');
        cy.get('title').should('contain', 'Navigate Screen'); // Verify the page title
      });

  
    it('should display the map container in mobile view', () => {
      cy.get('#map').should('be.visible');
      cy.get('.map-container').should('exist');
    });
  
    it('should toggle profile picture and cancel button in the search bar (mobile)', () => {
      cy.get('#search-input').should('be.enabled').type('wits biology building');
    });
  
});
  