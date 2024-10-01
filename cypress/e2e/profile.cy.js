describe('Profile Page Test (Mobile View)', () => {
    // Set the viewport size to 360x800 before each test
    beforeEach(() => {
      cy.viewport(360, 800);
      cy.visit('http://localhost:5000/profile.html',{
        },
        );
    });

    it("Header visible",()=>{
      cy.get(".full-name").should("be.visible");
    });

    it('Fields should be visible', () => {
        cy.get('.rows').should('be.visible');
        cy.get('.rows .age').should('be.visible');
        cy.get('.rows .email').should('be.visible');
        cy.get('.rows .faculty').should('be.visible');
        cy.get('.rows .role').should('be.visible');
        cy.get('.rows .slider').should('be.visible');
      });


    it("Buttons should be visible",()=>{
      cy.get(".logout-delete-container #logout-button").should("be.visible")
      cy.get(".logout-delete-container #delete-button").should("be.visible")
    })
  
});
  