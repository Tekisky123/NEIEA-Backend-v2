const donorAccountTemplate = (donation, password) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Donor Account Details</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 30px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    .header {
      text-align: center;
      padding: 10px 0;
      border-bottom: 1px solid #eaeaea;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #2c3e50;
      font-size: 24px;
      margin: 0;
    }
    .content {
      padding: 20px 0;
    }
    .content p {
      color: #555;
      margin-bottom: 15px;
    }
    .credentials {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .credentials p {
      margin: 5px 0;
    }
    .login-btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3498db;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #eaeaea;
      font-size: 14px;
      color: #7f8c8d;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Donor Account Has Been Created</h1>
    </div>
    <div class="content">
      <p>Dear ${donation.firstName} ${donation.lastName},</p>
      <p>Thank you for your recurring donation to NEIEA. We've created a donor account for you where you can track your donations and manage your profile.</p>
      
      <div class="credentials">
        <p><strong>Your login credentials:</strong></p>
        <p>Email: ${donation.email}</p>
        <p>Password: ${password}</p>
        <p><em>(We recommend changing your password after first login)</em></p>
      </div>
      
      <p>You can now login to your donor dashboard using the button below:</p>
      <a href="${process.env.FRONTEND_URL}/donor/login" class="login-btn">Login to Your Account</a>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,</p>
      <p><strong>The NEIEA Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} NEIEA. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export default donorAccountTemplate;