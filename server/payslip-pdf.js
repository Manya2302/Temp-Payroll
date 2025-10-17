import PDFDocument from 'pdfkit';

export function generatePayslipPDF(payslip, res) {
  const doc = new PDFDocument({ 
    size: 'A4',
    margin: 50,
    bufferPages: true
  });

  doc.pipe(res);

  const primaryColor = '#2563eb';
  const secondaryColor = '#64748b';
  const accentColor = '#f1f5f9';
  const darkGray = '#1e293b';

  doc.fontSize(28)
     .fillColor(primaryColor)
     .text('LOCO', 50, 50);
  
  doc.fontSize(10)
     .fillColor(secondaryColor)
     .text('Payroll Management System', 50, 85);

  doc.fontSize(20)
     .fillColor(darkGray)
     .text('SALARY SLIP', 400, 50, { align: 'right' });

  doc.moveTo(50, 120)
     .lineTo(545, 120)
     .strokeColor(primaryColor)
     .lineWidth(2)
     .stroke();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[payslip.month - 1];

  doc.fontSize(12)
     .fillColor(darkGray)
     .text(`Pay Period: ${monthName} ${payslip.year}`, 50, 140);
  
  doc.fontSize(10)
     .fillColor(secondaryColor)
     .text(`Payment Date: ${new Date(payslip.paidDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 160);

  if (payslip.transactionId) {
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .text(`Transaction ID: ${payslip.transactionId}`, 50, 175);
  }

  doc.rect(50, 200, 495, 100)
     .fillAndStroke(accentColor, secondaryColor);

  doc.fontSize(11)
     .fillColor(darkGray)
     .text('Employee Name:', 60, 215)
     .text(payslip.employeeName, 180, 215);

  doc.text('Employee ID:', 60, 235)
     .text(payslip.employeeId.toString().substring(0, 8).toUpperCase(), 180, 235);

  doc.text('Email:', 60, 255)
     .fillColor(primaryColor)
     .text(payslip.email, 180, 255);

  doc.fillColor(darkGray)
     .text('Payment Status:', 60, 275)
     .fillColor(payslip.paymentStatus === 'paid' ? '#10b981' : '#ef4444')
     .text(payslip.paymentStatus.toUpperCase(), 180, 275);

  doc.fontSize(14)
     .fillColor(primaryColor)
     .text('EARNINGS', 50, 330);

  doc.moveTo(50, 350)
     .lineTo(545, 350)
     .strokeColor(secondaryColor)
     .lineWidth(1)
     .stroke();

  let yPos = 370;
  doc.fontSize(10)
     .fillColor(darkGray);

  const earnings = [
    { label: 'Basic Salary', value: payslip.basicSalary },
    { label: 'HRA', value: payslip.hraAmount },
    { label: 'Travel Allowance', value: payslip.travelAllowance },
    { label: 'Overtime Pay', value: payslip.overtimePay || 0 }
  ];

  earnings.forEach(item => {
    doc.text(item.label, 60, yPos);
    doc.text(`₹${item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, yPos, { align: 'right' });
    yPos += 25;
  });

  doc.moveTo(50, yPos)
     .lineTo(545, yPos)
     .strokeColor(secondaryColor)
     .lineWidth(1)
     .stroke();

  yPos += 15;
  doc.fontSize(11)
     .fillColor(primaryColor)
     .text('Gross Salary', 60, yPos)
     .text(`₹${payslip.grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, yPos, { align: 'right' });

  yPos += 40;
  doc.fontSize(14)
     .fillColor(primaryColor)
     .text('DEDUCTIONS', 50, yPos);

  yPos += 20;
  doc.moveTo(50, yPos)
     .lineTo(545, yPos)
     .strokeColor(secondaryColor)
     .lineWidth(1)
     .stroke();

  yPos += 20;
  doc.fontSize(10)
     .fillColor(darkGray);

  const deductions = [
    { label: 'Late Coming Penalty', value: payslip.latePenalty || 0 },
    { label: 'Other Deductions', value: payslip.deductions || 0 }
  ];

  deductions.forEach(item => {
    doc.text(item.label, 60, yPos);
    doc.text(`₹${item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, yPos, { align: 'right' });
    yPos += 25;
  });

  const totalDeductions = (payslip.latePenalty || 0) + (payslip.deductions || 0);
  
  doc.moveTo(50, yPos)
     .lineTo(545, yPos)
     .strokeColor(secondaryColor)
     .lineWidth(1)
     .stroke();

  yPos += 15;
  doc.fontSize(11)
     .fillColor(primaryColor)
     .text('Total Deductions', 60, yPos)
     .text(`₹${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, yPos, { align: 'right' });

  yPos += 40;
  doc.rect(50, yPos, 495, 50)
     .fillAndStroke(primaryColor, primaryColor);

  doc.fontSize(16)
     .fillColor('#ffffff')
     .text('NET SALARY', 60, yPos + 15)
     .fontSize(18)
     .text(`₹${payslip.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, yPos + 15, { align: 'right' });

  yPos += 80;
  doc.fontSize(12)
     .fillColor(primaryColor)
     .text('ATTENDANCE SUMMARY', 50, yPos);

  yPos += 20;
  doc.fontSize(10)
     .fillColor(darkGray);

  const attendance = [
    { label: 'Payable Days', value: payslip.payableDays },
    { label: 'Present Days', value: payslip.presentDays },
    { label: 'Leave Days', value: payslip.leaveDays || 0 },
    { label: 'Absent Days', value: payslip.absentDays || 0 },
    { label: 'Late Coming Days', value: payslip.lateComingDays || 0 },
    { label: 'Overtime Hours', value: payslip.overtimeHours || 0 }
  ];

  let xPos = 60;
  let columnWidth = 160;

  attendance.forEach((item, index) => {
    if (index % 3 === 0 && index !== 0) {
      yPos += 25;
      xPos = 60;
    }
    
    doc.text(`${item.label}:`, xPos, yPos);
    doc.fontSize(11)
       .fillColor(primaryColor)
       .text(item.value.toString(), xPos + 100, yPos);
    doc.fontSize(10)
       .fillColor(darkGray);
    
    xPos += columnWidth;
  });

  yPos += 60;
  doc.moveTo(50, yPos)
     .lineTo(545, yPos)
     .strokeColor(secondaryColor)
     .lineWidth(1)
     .stroke();

  yPos += 20;
  doc.fontSize(9)
     .fillColor(secondaryColor)
     .text('This is a computer-generated payslip and does not require a signature.', 50, yPos, { align: 'center', width: 495 });

  yPos += 20;
  doc.fontSize(8)
     .fillColor(secondaryColor)
     .text('© 2025 Loco Payroll Management System. All rights reserved.', 50, yPos, { align: 'center', width: 495 });

  doc.fontSize(8)
     .fillColor(secondaryColor)
     .text('For any queries, please contact HR department.', 50, yPos + 15, { align: 'center', width: 495 });

  doc.end();
}
