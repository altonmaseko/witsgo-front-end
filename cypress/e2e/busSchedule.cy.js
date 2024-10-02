describe('Bus Schedule Page', () => {
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
  
    cy.visit('http://localhost:5000/buses'); 
    
  });

  it('should have the correct page title', () => {
    cy.title().should('eq', 'Bus Schedule');
  });

  it('should have correct options in the "Days" dropdown', () => {
    cy.get('#days')
      .should('exist')
      .find('option')
      .should(($options) => {
        expect($options).to.have.length(2); // Monday-Friday, Saturday-Sunday
        expect($options.eq(0)).to.have.text('Monday-Friday');
        expect($options.eq(1)).to.have.text('Saturday-Sunday and Public Holidays');
      });
  });

  it('should have correct options in the "Destination" dropdown', () => {
    cy.get('#destination')
      .should('exist')
      .find('option')
      .then(($options) => {
        const destinations = [
          'Destinations:',
          'AMIC DECK- AMIC',
          'ERNST OPPENHEIMER HALL OF RESIDENCE- EOH',
          'KNOCKANDO HALLS OF RESIDENCE- KNK',
          'NOSWAL HALL (1 STIEMENS STREET, BRAAMFONTEIN)- NSW',
          'ROSEBANK MALL- ROSEBANK',
          'WITS EDUCATION CAMPUS- WEC',
          'WITS JUNCTION RESIDENCE- WJ',
        ];
        $options.each((i, option) => {
          expect(option.text).to.equal(destinations[i]);
        });
      });
  });

  it('should toggle schedule between weekdays and weekends', () => {
    // Verify weekday schedule is visible by default
    cy.get('#weekday-schedule').should('be.visible');
    cy.get('#weekend-schedule').should('not.be.visible');

    cy.get('#days').select('Weekend');
    cy.get('#weekend-schedule').should('be.visible');
    cy.get('#weekday-schedule').should('not.be.visible');
  });

  it('should toggle route details when clicking on route headers', () => {
    cy.get('tbody tr.route-header').first().as('firstRouteHeader');
    cy.get('tbody tr.route-details').first().as('firstRouteDetails');


    cy.get('@firstRouteDetails').should('not.be.visible');


    cy.get('@firstRouteHeader').click();
    cy.get('@firstRouteDetails').should('be.visible');

    
    cy.get('@firstRouteHeader').click();
    cy.get('@firstRouteDetails').should('not.be.visible');
  });

  // it('should filter routes based on selected destination', () => {
  //   cy.get('#destination').select('AMIC');
  //   cy.get('tbody tr').each(($row) => {
  //   if ($row.text().includes('AMIC')) {
  //     cy.wrap($row).should('not.have.class', 'hidden').and('be.visible');
  //   } else {
  //     cy.wrap($row).should('have.class', 'hidden');
  //   }
  //   });
  // });

  
  // it('should highlight the selected destination in route details', () => {
  //   cy.get('#destination').select('WJ');

  //   cy.get('tbody tr').contains('WJ').then(($cell) => {
  //     expect($cell.html()).to.contain('<span class="highlight">WJ</span>');
  //   });
  // });
});
