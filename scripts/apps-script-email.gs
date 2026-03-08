/**
 * Google Apps Script — Blog Email Notification Webhook
 *
 * Deploy this as a Google Apps Script Web App.
 * Set it to execute as your account, accessible by "Anyone".
 *
 * Then set the deployed URL as the APPS_SCRIPT_EMAIL_URL
 * environment variable on Render.
 *
 * HOW TO SET UP:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code into Code.gs
 * 4. Click Deploy → New deployment → Web app
 * 5. Execute as: Me, Who has access: Anyone
 * 6. Copy the URL and set it as APPS_SCRIPT_EMAIL_URL env var
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var subject = payload.subject;
    var htmlBody = payload.htmlBody;
    var recipients = payload.recipients; // array of email strings

    if (!subject || !htmlBody || !recipients || recipients.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: "Missing required fields" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Send to each recipient individually to avoid exposing emails
    var sent = 0;
    var errors = [];

    for (var i = 0; i < recipients.length; i++) {
      try {
        MailApp.sendEmail({
          to: recipients[i],
          subject: subject,
          htmlBody: htmlBody,
          name: "Quit 9 to 5", // Sender display name
        });
        sent++;
      } catch (err) {
        errors.push(recipients[i] + ": " + err.toString());
      }

      // Avoid rate limiting — small pause between emails
      if (i < recipients.length - 1) {
        Utilities.sleep(100);
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        sent: sent,
        total: recipients.length,
        errors: errors,
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run manually to verify the script works
function testDoPost() {
  var testPayload = {
    postData: {
      contents: JSON.stringify({
        subject: "Test Blog Notification",
        htmlBody: "<h1>Hello!</h1><p>This is a test email from Quit 9 to 5.</p>",
        recipients: ["your-test-email@example.com"],
      }),
    },
  };

  var result = doPost(testPayload);
  Logger.log(result.getContent());
}
