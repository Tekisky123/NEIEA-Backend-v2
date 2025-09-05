const donorDonationTemplate = (donation) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Donation</title>
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
    .highlight {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .highlight p {
      margin: 0;
      color: #2c3e50;
      font-weight: bold;
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
      <h1>Thank You for Your Donation!</h1>
    </div>
    <div class="content">
      <p>Dear ${donation.firstName} ${donation.lastName},</p>
      <p>Thank you for your generous donation of <span class="highlight">$${donation.amount}</span>. Your support is greatly appreciated and will make a significant impact on our mission.</p>
      <p>We are committed to using your donation effectively to further our cause and create meaningful change.</p>
      <p>If you have any questions or need further information, please feel free to contact us.</p>
      <p>Best regards,</p>
      <p><strong>The NEIEA Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; 2023 NEIEA. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

  `;
};


export default donorDonationTemplate;
