describe('Navbar Test', () => {

  beforeEach(() => {
    // Visit the page where the navbar is located
    cy.viewport(360, 800);
    cy.visit('http://localhost:5000/navigation.html'); // Replace with your actual page URL
  });

  it('Should display the navbar with correct links and text', () => {
    // Check if the navbar section exists
    cy.get('.navbar').should('exist');

    // Check for the second navigation link (Renting)
    cy.get('.navbar a').eq(1)
      .should('have.attr', 'href', 'rental')
      .find('img')
      .should('have.attr', 'src', 'icons/rent-grey.png')
      .next('.text')
      .should('contain', 'Renting');

    // Check for the third navigation link (Schedule)
    cy.get('.navbar a').eq(2)
      .should('have.attr', 'href', 'buses')
      .find('img')
      .should('have.attr', 'src', 'icons/schedule-grey.png')
      .next('.text')
      .should('contain', 'Schedule');

    // Check for the fourth navigation link (Tracking)
    cy.get('.navbar a').eq(3)
      .should('have.attr', 'href', 'tracktransport')
      .find('img')
      .should('have.attr', 'src', 'icons/tracking-grey.png')
      .next('.text')
      .should('contain', 'Tracking');
  });

  it('Should navigate to correct pages when navbar links are clicked', () => {
    // Click the "Navigation" link and verify the URL changes
    // cy.get('.navbar a').eq(0).click();
    // cy.url().should('include', '/navigation');

    // Click the "Renting" link and verify the URL changes
    cy.get('.navbar a').eq(1).click();
    cy.url().should('include', '/rental');

    // Click the "Schedule" link and verify the URL changes
    // cy.get('.navbar a').eq(2).click();
    // cy.url().should('include', '/buses');

    // Click the "Tracking" link and verify the URL changes
    // cy.get('.navbar a').eq(3).click();
    // cy.url().should('include', '/tracktransport');
  });

});
