describe('Splash Screen Mobile Redirect Test', () => {
  context('Mobile Test', () => {
    beforeEach(() => {
      // Set the viewport for mobile devices
      cy.viewport(320, 800);
    });

    it('should redirect to the navigation page after 2 seconds', () => {
      // Visit the splash screen page
      cy.visit('http://localhost:5500/public/');

      // Wait for 2 seconds for the redirect
      cy.wait(2000);

      // Check if the URL has changed to 'navigation.html'
      cy.url().should('include', '/navigation.html');
    });
  });
});
