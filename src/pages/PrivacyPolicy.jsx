import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-page">
      <div className="privacy-card">
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: March 14, 2026</p>

        <p>Alice's Fantastic ("we", "us", "our") is a website with fun games for kids and families. We take your privacy seriously, especially the privacy of children under 13.</p>

        <h2>COPPA Compliance</h2>
        <p>We comply with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13 without verifiable parental consent.</p>

        <h2>What We Collect</h2>
        <p>When you create an account, we collect:</p>
        <ul>
          <li><strong>Username</strong> — chosen by you, used to identify your account</li>
          <li><strong>Email address</strong> — used for account recovery</li>
          <li><strong>Password</strong> — stored securely using encryption (bcrypt), we cannot see your password</li>
          <li><strong>Age group</strong> — whether you are under 13 or 13+, used to determine if parental consent is needed</li>
          <li><strong>Parent/guardian email</strong> — only collected for users under 13, used solely to get parental consent</li>
        </ul>

        <h2>For Users Under 13</h2>
        <p>If you are under 13:</p>
        <ul>
          <li>We require a parent or guardian's email address during signup</li>
          <li>Your account will not be activated until your parent or guardian approves it</li>
          <li>Your parent can deny consent and your account and all data will be deleted</li>
          <li>Your parent can request deletion of your account and data at any time</li>
        </ul>

        <h2>What We Do NOT Do</h2>
        <ul>
          <li>We do NOT sell or share your personal information with anyone</li>
          <li>We do NOT use advertising or tracking cookies</li>
          <li>We do NOT send marketing emails</li>
          <li>We do NOT use your data for advertising</li>
          <li>We do NOT allow children to make their personal information public</li>
        </ul>

        <h2>How We Use Your Data</h2>
        <p>We only use your data to:</p>
        <ul>
          <li>Let you log in and play games on our site</li>
          <li>Save your game progress</li>
          <li>Keep our site safe (banning accounts that break rules)</li>
        </ul>

        <h2>Data Storage</h2>
        <p>Your data is stored securely on our servers. Passwords are encrypted and cannot be read by anyone, including us.</p>

        <h2>Your Rights</h2>
        <p>You (or your parent/guardian) can:</p>
        <ul>
          <li><strong>Delete your account</strong> — from your account settings, or by contacting us</li>
          <li><strong>Request your data</strong> — contact us and we'll tell you what data we have</li>
          <li><strong>Withdraw consent</strong> — parents can withdraw consent at any time, and the account will be deleted</li>
        </ul>

        <h2>Contact Us</h2>
        <p>If you have questions about this privacy policy, or if a parent wants to review, delete, or withdraw consent for their child's data, please contact us at: <strong>info@alicesfantastic.com</strong></p>
      </div>
    </div>
  );
}
