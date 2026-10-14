describe("Acesso público", () => {
  it("mostra o login e permite abrir recuperação e cadastro", () => {
    cy.visit("/");
    cy.contains("h2", "Login").should("be.visible");
    cy.contains("button", "Esqueci minha senha").click();
    cy.contains("h2", "Recuperar senha").should("be.visible");
    cy.get('input[type="password"]').should("not.exist");
    cy.contains("button", "Voltar para o login").click();
    cy.contains("button", "Criar uma conta").click();
    cy.get('input[type="password"]').should("have.length", 2);
  });
});
