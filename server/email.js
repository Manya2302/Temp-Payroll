import nodemailer from "nodemailer";

export async function sendSalaryNotification(email, employeeName, month, year, netSalary, transactionId) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(netSalary);

  await transporter.sendMail({
    from: `"Loco Payroll" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Salary Credited for ${monthName} ${year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
        <h2 style="color: #2d3748; margin-bottom: 16px;">Salary Credit Notification</h2>
        <p>Dear ${employeeName},</p>
        <p>We are pleased to inform you that your salary for <strong>${monthName} ${year}</strong> has been successfully credited to your account.</p>
        
        <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Period:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${monthName} ${year}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Net Amount:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #2563eb; font-size: 1.25rem; font-weight: bold;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Transaction ID:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 0.875rem;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Payment Date:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>
        
        <p>You can view your detailed payslip by logging into your employee portal.</p>
        
        <p style="color: #718096; font-size: 0.875rem; margin-top: 20px;">
          If you have any questions or concerns regarding your salary, please contact the HR department.
        </p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 0.875rem; color: #888;">
          Best regards,<br>
          <strong>Loco Payroll Team</strong>
        </p>
      </div>
    `,
    text: `
Dear ${employeeName},

We are pleased to inform you that your salary for ${monthName} ${year} has been successfully credited to your account.

Payment Details:
- Period: ${monthName} ${year}
- Net Amount: ${formattedAmount}
- Transaction ID: ${transactionId}
- Payment Date: ${new Date().toLocaleDateString()}

You can view your detailed payslip by logging into your employee portal.

If you have any questions or concerns regarding your salary, please contact the HR department.

Best regards,
Loco Payroll Team
    `,
  });
}

export async function sendProjectAssignmentEmail(email, employeeName, projectTitle, projectDescription, startDate, daysCount, priority) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const priorityColors = {
    'Low': '#3b82f6',
    'Medium': '#f59e0b',
    'High': '#f97316',
    'Critical': '#ef4444'
  };

  const priorityColor = priorityColors[priority] || '#3b82f6';

  await transporter.sendMail({
    from: `"Loco Project Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Project Assigned: ${projectTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
        <h2 style="color: #2d3748; margin-bottom: 16px;">🚀 New Project Assignment</h2>
        <p>Dear ${employeeName},</p>
        <p>You have been assigned to a new project. Here are the details:</p>
        
        <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0;">${projectTitle}</h3>
          <p style="color: #4a5568; margin: 12px 0;">${projectDescription}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Start Date:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${formattedStartDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Duration:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${daysCount} days</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568;"><strong>Priority:</strong></td>
              <td style="padding: 8px 0; text-align: right;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background-color: ${priorityColor}20; color: ${priorityColor}; font-weight: bold;">
                  ${priority}
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        <p>Your daily tasks have been automatically generated using AI to ensure optimal task distribution and project completion.</p>
        
        <div style="margin: 24px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/tasks" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View My Tasks
          </a>
        </div>
        
        <p style="color: #718096; font-size: 0.875rem; margin-top: 20px;">
          If you have any questions about this project, please contact your project manager or admin.
        </p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 0.875rem; color: #888;">
          Best regards,<br>
          <strong>Loco Project Management Team</strong>
        </p>
      </div>
    `,
    text: `
Dear ${employeeName},

You have been assigned to a new project.

Project: ${projectTitle}
Description: ${projectDescription}

Project Details:
- Start Date: ${formattedStartDate}
- Duration: ${daysCount} days
- Priority: ${priority}

Your daily tasks have been automatically generated using AI to ensure optimal task distribution and project completion.

Please log in to your dashboard to view your assigned tasks.

If you have any questions about this project, please contact your project manager or admin.

Best regards,
Loco Project Management Team
    `,
  });
}
