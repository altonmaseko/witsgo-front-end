describe('Splash Screen Tests', () => {
    context('Mobile Test', () => {
        beforeEach(()=>{
            cy.viewport(320, 800)
        });

        it('should load the splash page', () => {
        // Visit the splash screen page
        cy.visit('http://localhost:5000/')
    
        // Check if the H1 element contains the text "Wits Go"
        cy.contains("h1", "Wits Go").should('be.visible')
    
        // Check if the logo image is visible
        cy.get('img[alt="Wits Go Logo"]').should('be.visible')
        })
    })

});
  