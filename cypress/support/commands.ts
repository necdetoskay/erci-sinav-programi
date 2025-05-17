// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Admin login command
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@kentkonut.com.tr', 'password123');
});

// Create exam command
Cypress.Commands.add('createExam', (title: string, description: string, duration: number) => {
  cy.visit('/admin/exams/create');
  cy.get('input[name="title"]').type(title);
  cy.get('textarea[name="description"]').type(description);
  cy.get('input[name="duration_minutes"]').clear().type(duration.toString());
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin/exams');
});

// Add question to exam command
Cypress.Commands.add('addQuestionToExam', (examId: string, questionText: string, options: string[], correctOptionIndex: number) => {
  cy.visit(`/admin/exams/${examId}/questions`);
  cy.get('button').contains('Soru Ekle').click();
  cy.get('textarea[name="question_text"]').type(questionText);
  
  options.forEach((option, index) => {
    cy.get(`input[name="options.${index}.text"]`).type(option);
    if (index === correctOptionIndex) {
      cy.get(`input[name="options.${index}.isCorrect"]`).check();
    }
  });
  
  cy.get('button[type="submit"]').click();
});

// Declare global Cypress namespace to add custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      createExam(title: string, description: string, duration: number): Chainable<void>;
      addQuestionToExam(examId: string, questionText: string, options: string[], correctOptionIndex: number): Chainable<void>;
    }
  }
}
