import { EmailPreference } from '../test/EmailPreference';
import { LoginPage } from '../test/Login';
import { EditorValidCredentials } from '../fixtures/credential';

describe('Email Preference', () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    loginPage.initialize(
      EditorValidCredentials.EditorMail,
      EditorValidCredentials.EditorPassword,
    );
  });

  it('Verify that user able to navigate to Email preference page', () => {
    const Email = new EmailPreference();
    Email.getEmailPreferenceButton();
  });

  it('Verify that Email is marked checked initially', () => {
    const Email = new EmailPreference();
    Email.getEmailPreferenceButton();
    Email.ensureEmailAlertChecked();
  });

  it('Verify that user able to Disable the Email Alert', () => {
    const Email = new EmailPreference();
    Email.DisableEmailAlert();
  });

  it('Verify that user is able to Enable the Email alert', () => {
    const Email = new EmailPreference();
    Email.EnableEmailAlert();
  });
});
