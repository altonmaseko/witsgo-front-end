describe('Navigation Page Test (Mobile View)', () => {
  // Set the viewport size to 360x800 before each test
  beforeEach(() => {
      cy.viewport(360, 800);
      
      // Intercept the verifylogin API call
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

      // Visit the navigation page with geolocation stubbing
      cy.visit('http://localhost:5000/navigation.html', {
          onBeforeLoad(win) {
              cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
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
      cy.wait('@verifyLogin'); // Wait for the login verification
      cy.get('.container').should('be.visible'); // Check if the main container is visible
      cy.title().should('contain', 'Navigate Screen'); // Verify the page title
  });

  it('should display the map container in mobile view', () => {
      cy.wait('@verifyLogin'); // Wait for the login verification
      cy.get('#map').should('be.visible'); // Check if the map is visible
      cy.get('.map-container').should('exist'); // Ensure the map container exists
  });

  it('Testing search and navigate', () => {
      cy.wait('@verifyLogin'); // Wait for the login verification
      cy.get('#search-input').should('be.enabled').type('wits biology building'); // Type into the search input
      cy.get('.pac-item', { timeout: 10000 }).should('be.visible').click(); // Wait for the PAC item and click

      cy.get('.RIFvHW-maps-pin-view-background').should('be.visible'); // Check if the map pin is visible
      cy.get("#nav-btn").click(); // Click the navigation button
  });

  it("Testing markers",()=>{
    cy.wait('@verifyLogin');

    //testing markings appear
    cy.get(".custom-marker").should("be.visible");
    cy.get(".building-marker").should("be.visible");
    cy.get(".library-marker").should("be.visible")
    cy.get(".wheelchair-marker").should("be.visible");
    cy.get(".gatehouse-marker").should("be.visible");

    //testing zoomout and seeing that markers disappear
    cy.get('button[title="Zoom out"].gm-control-active').click();
    cy.get('button[title="Zoom out"].gm-control-active').click();

    cy.get(".custom-marker").should("be.visible");
    cy.get(".library-marker").should("not.exist")
    cy.get(".building-marker").should("not.exist");
    cy.get(".wheelchair-marker").should("not.exist");
    cy.get(".gatehouse-marker").should("not.exist");


    //testing zoomin
    cy.get('button[title="Zoom in"].gm-control-active').click();
    cy.get('button[title="Zoom in"].gm-control-active').click();

    cy.get(".custom-marker").should("be.visible");
    cy.get(".building-marker").should("be.visible");
    cy.get(".wheelchair-marker").should("be.visible");
    cy.get(".gatehouse-marker").should("be.visible");
  })

  it("Testing filter",()=>{
    let notExist = "not.exist"
    let exist = "be.visible"

    cy.get('#filterType').select('all');
    cy.get(".building-marker").should(exist);
    cy.get(".library-marker").should(exist)
    cy.get(".wheelchair-marker").should(exist);
    cy.get(".gatehouse-marker").should(exist);


    cy.get('#filterType').select('library');
    cy.get(".building-marker").should(notExist);
    cy.get(".library-marker").should(exist)
    cy.get(".wheelchair-marker").should(notExist);
    cy.get(".gatehouse-marker").should(notExist);


    cy.get('#filterType').select('building');
    cy.get(".building-marker").should(exist);
    cy.get(".library-marker").should(notExist)
    cy.get(".wheelchair-marker").should(notExist);
    cy.get(".gatehouse-marker").should(notExist);


    cy.get('#filterType').select('Gate houses');
    cy.get(".building-marker").should(notExist);
    cy.get(".library-marker").should(notExist)
    cy.get(".wheelchair-marker").should(notExist);
    cy.get(".gatehouse-marker").should(exist);


    cy.get('#filterType').select('Wheelchair');
    cy.get(".building-marker").should(notExist);
    cy.get(".library-marker").should(notExist)
    cy.get(".wheelchair-marker").should(exist);
    cy.get(".gatehouse-marker").should(notExist);
    

    cy.get('#filterType').select('None');
    cy.get(".building-marker").should(notExist);
    cy.get(".library-marker").should(notExist)

    cy.get(".wheelchair-marker").should(notExist);
    cy.get(".gatehouse-marker").should(notExist);


  })


});
