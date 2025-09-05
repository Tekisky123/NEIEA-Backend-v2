
const adminDonationTemplate = (donation) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Donation Received</title>
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
      margin-bottom: 20px;
    }
    .content ul {
      list-style-type: none;
      padding: 0;
      margin: 20px 0;
    }
    .content ul li {
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      color: #333;
    }
    .content ul li:last-child {
      border-bottom: none;
    }
    .content ul li strong {
      color: #2c3e50;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #eaeaea;
      font-size: 14px;
      color: #7f8c8d;
      margin-top: 20px;
    }
    .highlight {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .highlight p {
      margin: 0;
      color: #2c3e50;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Donation Received</h1>
    </div>
    <div class="content">
      <p>Dear Admin,</p>
      <p>A new donation has been made with the following details:</p>
      <div class="highlight">
        <ul>
          <li><strong>Name:</strong> ${donation.firstName} ${donation.lastName}</li>
          <li><strong>Email:</strong> ${donation.email}</li>
          <li><strong>Phone:</strong> ${donation.phone}</li>
          <li><strong>Amount:</strong> $${donation.amount}</li>
          <li><strong>Address:</strong> ${donation.address}, ${donation.city}, ${donation.state}, ${donation.zipCode}, ${donation.country}</li>
        </ul>
      </div>
      <p>Please review the donation details and ensure everything is in order.</p>
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

export default adminDonationTemplate;
