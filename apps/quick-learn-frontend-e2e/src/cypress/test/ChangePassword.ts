export class ChangePassword {
  visitProfilePage() {
    return cy.get('button.flex.items-center').click();
  }
  getChangePassword() {
    cy.get('button.flex.items-center').click();
    cy.get('[href="/dashboard/profile-settings"]').click();
    cy.get('[href="/dashboard/profile-settings/change-password"]').click();
  }
  getOldPassword() {
    return cy.get('#changePasswordForm_input_passwordoldPassword');
  }
  getNewPassword() {
    return cy.get('#changePasswordForm_input_passwordnewPassword');
  }
  getConfirmPassword() {
    return cy.get('#changePasswordForm_input_passwordconfirmPassword');
  }
  getSaveButton() {
    return cy.get('[type="submit"]');
  }
  getErrorMessage() {
    return cy.get('.mt-1');
  }
  getSuccessMessage() {
    return cy.get('.Toastify__toast-container');
  }

  UpdatePasswordWithSameOldAndNewPassword() {
    cy.contains('Please change your password.').should('be.visible');
    this.getOldPassword().type('password@123P');
    this.getNewPassword().type('password@123P');
    this.getConfirmPassword().type('password@123P');
    this.getErrorMessage().contains(
      'Current and new passwords cannot be the same.',
    );
    this.getNewPassword().clear();
    this.getNewPassword().type('Password@123');
    this.getConfirmPassword().clear();
    this.getConfirmPassword().type('Password@123');
    this.getOldPassword().clear();
    this.getOldPassword().type('Password@123');
    this.getErrorMessage().contains(
      'Current and new passwords cannot be the same.',
    );
    this.getSaveButton().should('be.disabled');
  }
  UpdatePasswordWithDifferentNewAndConfirmPassword() {
    cy.contains('Please change your password.').should('be.visible');
    this.getOldPassword().type('password@123P');
    this.getNewPassword().type('Password@923P');
    this.getConfirmPassword().type('password@123P');
    this.getErrorMessage().contains("Passwords don't match");
  }
  UpdatePasswordWithLesserLength() {
    cy.contains('Please change your password.').should('be.visible');
    this.getOldPassword().type('password@123P');
    this.getNewPassword().type('Pass');
    this.getConfirmPassword().type('Pass');
    this.getErrorMessage().contains(
      'Password must be at least 8 characters long',
    );
  }

  UpdatePasswordWithLimitExceed() {
    cy.contains('Please change your password.').should('be.visible');
    this.getOldPassword().type('password@123P');
    this.getNewPassword().type('Password@123PasswordPasswordPassword');
    this.getErrorMessage().contains('Password cannot exceed 32 characters');
    this.getSaveButton().should('be.disabled');
  }

  SetInvalidPassword() {
    cy.contains('Please change your password.').should('be.visible');
    this.getOldPassword().type('password@123P');
    this.getNewPassword().type('pass@12w');
    this.getErrorMessage().contains(
      'Password must contain at least one uppercase letter',
    );
    this.getNewPassword().clear();
    this.getNewPassword().type('PASSWORD');
    this.getErrorMessage().contains(
      'Password must contain at least one lowercase letter',
    );
    this.getNewPassword().clear();
    this.getNewPassword().type('Pass@word');
    this.getErrorMessage().contains(
      'Password must contain at least one number',
    );
    this.getNewPassword().clear();
    this.getNewPassword().type('Pass1234');
    this.getErrorMessage().contains(
      'Password must contain at least one special character',
    );
  }
  UpdatePasswordWithEmptySpaces() {
    cy.contains('Change Password').should('be.visible');
    this.getOldPassword().clear();
    this.getOldPassword().type(' ');
    this.getErrorMessage().contains('This field is required');
    this.getNewPassword().clear();
    this.getNewPassword().type(' ');
    this.getErrorMessage().contains('This field is required');
    this.getConfirmPassword().clear();
    this.getConfirmPassword().type(' ');
    this.getErrorMessage().contains('This field is required');
  }

  UpdatePasswordWithValidData() {
    cy.contains('Change Password').should('be.visible');
    this.getOldPassword().type('Password@123');
    this.getNewPassword().type('Password@123P');
    this.getConfirmPassword().type('Password@123P');
    this.getSaveButton().click();
    this.getSuccessMessage().contains('Password updated successfully');
    //Update the new password under credential.ts file after running the script and update the Old password here too if you want to run the script again.
  }
}
