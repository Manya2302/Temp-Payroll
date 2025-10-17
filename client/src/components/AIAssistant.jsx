import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Send, MessageCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const faqData = {
  "Payroll Problems": [
    {
      question: "How do I process payroll for employees?",
      answer: "To process payroll: 1) Go to the Payroll section in your admin dashboard. 2) Select the employee or use bulk processing. 3) Review salary components (basic, HRA, allowances, deductions). 4) Click 'Process Payroll' and choose your payment method (PayPal, Razorpay, or Bank Transfer). The system will automatically calculate taxes and deductions."
    },
    {
      question: "How can I view payroll history?",
      answer: "Navigate to Payroll > Payroll List to view all processed payrolls. You can filter by month, year, employee name, or payment status. Click on any payslip to view details or download the PDF."
    },
    {
      question: "How do I download payslips?",
      answer: "Go to Payroll List, find the payslip you need, and click the 'Download' button. A professional PDF will be generated with all salary details, deductions, and company branding."
    },
    {
      question: "Can I bulk upload payroll data?",
      answer: "Yes! Go to Payroll > Add Payroll, and click 'Download Template' to get an Excel template. Fill in the employee data and upload it. The system will process all payrolls at once."
    },
    {
      question: "What payment methods are supported?",
      answer: "Loco supports multiple payment methods: PayPal for international payments, Razorpay for Indian payments, and manual bank transfer. You can configure payment gateways in your admin settings."
    },
    {
      question: "How are taxes and deductions calculated?",
      answer: "The system automatically calculates: 1) Basic salary components (Basic, HRA, Medical, Transport). 2) Professional Tax (PT). 3) Provident Fund (PF). 4) Tax Deducted at Source (TDS). You can customize these rates in Settings."
    }
  ],
  "Attendance": [
    {
      question: "How do employees mark attendance?",
      answer: "Employees can mark attendance from their dashboard by clicking 'Mark Attendance'. They select the date, status (Present/Absent/Half Day/Late), and optionally add a reason. Attendance is recorded instantly."
    },
    {
      question: "How can I view employee attendance records?",
      answer: "Go to Attendance section in admin dashboard. You'll see a calendar view with color-coded attendance status. You can filter by employee, date range, or status. Export reports to Excel for payroll processing."
    },
    {
      question: "Can I edit attendance records?",
      answer: "Yes, as an admin you can edit any attendance record. Go to Admin Attendance, find the record, and click Edit. You can change the status, date, and add notes for audit purposes."
    },
    {
      question: "How do I track late arrivals and early departures?",
      answer: "The attendance system supports 'Late' status for employees who arrive after scheduled time. You can view late arrival patterns in the Reports section under Attendance Analytics."
    },
    {
      question: "Can employees view their attendance history?",
      answer: "Yes, employees can view their complete attendance history from their dashboard. They can see monthly summaries, present days, absent days, and late arrivals."
    }
  ],
  "Loan": [
    {
      question: "How to apply for a loan?",
      answer: "To apply for a loan: 1) Go to Loans section in your employee dashboard. 2) Click 'Apply for Loan'. 3) Enter loan amount, repayment period (in months), and reason for the loan. 4) Submit the application. Your admin will review and approve it."
    },
    {
      question: "What is the maximum loan amount?",
      answer: "The maximum loan amount depends on your company policy and your salary. Typically, employees can request up to 3 months of their basic salary. Contact your HR admin for specific limits."
    },
    {
      question: "How long does loan approval take?",
      answer: "Loan applications are usually reviewed within 2-3 business days. You'll receive an email notification once your loan is approved or rejected. Check the Loans section for status updates."
    },
    {
      question: "How are loan repayments handled?",
      answer: "Once approved, your loan repayment is automatically deducted from your monthly salary in equal installments (EMIs) over the selected tenure. You can view EMI schedule in your loan details."
    },
    {
      question: "Can I prepay my loan?",
      answer: "Yes, you can prepay your loan at any time. Contact your admin through the Help section, and they can adjust the remaining EMIs accordingly."
    },
    {
      question: "What happens if my loan is rejected?",
      answer: "If your loan is rejected, you'll receive an email with the reason. You can reapply after addressing the concerns mentioned by the admin."
    },
    {
      question: "How do I provide a reason for loan creation?",
      answer: "When filling out the loan application form, there's a 'Reason' field where you should clearly explain why you need the loan (e.g., medical emergency, education, home renovation). This helps admins make informed decisions."
    }
  ],
  "EMI": [
    {
      question: "What is EMI and how does it work?",
      answer: "EMI (Equated Monthly Installment) is a fixed monthly payment for loan repayment. Your loan amount is divided equally over the selected tenure (in months) and automatically deducted from your salary each month."
    },
    {
      question: "How can I view my EMI schedule?",
      answer: "Go to Loans section and click on your active loan. You'll see the complete EMI schedule including: monthly EMI amount, remaining balance, payment dates, and completion date."
    },
    {
      question: "What if I miss an EMI payment?",
      answer: "EMI payments are automatically deducted from your salary, so missing a payment only happens if salary is not processed. In such cases, the pending amount will be carried forward to the next month."
    },
    {
      question: "Can I change my EMI amount?",
      answer: "EMI amounts are fixed when the loan is approved. However, you can prepay your loan or request a restructure by contacting your admin through the Help section."
    },
    {
      question: "How do I track my remaining loan balance?",
      answer: "Your current loan balance is always visible in the Loans section. It shows total loan amount, amount paid, remaining balance, and EMI details."
    }
  ],
  "Payment Related": [
    {
      question: "When will I receive my salary?",
      answer: "Salaries are typically processed on the last working day of the month or the 1st of the next month, depending on your company policy. Check with your admin for exact payment dates."
    },
    {
      question: "How do I update my payment details?",
      answer: "Go to Profile section and update your bank account details (Account Number, IFSC Code, Bank Name, Branch). Make sure to save changes. Your admin may need to verify before processing next payment."
    },
    {
      question: "What payment methods does Loco support?",
      answer: "Loco supports PayPal, Razorpay, and direct bank transfer. Your admin chooses the payment method when processing payroll. You'll receive payment notifications via email."
    },
    {
      question: "Why is my payment pending?",
      answer: "Payments may be pending due to: incomplete bank details, pending approvals, or payment gateway processing time. Contact your admin if payment is pending for more than 2 business days."
    },
    {
      question: "How do I check my payment status?",
      answer: "Go to Payroll section in your employee dashboard. You'll see all your payslips with status: Paid, Pending, or Failed. Click on any payslip for detailed payment information."
    },
    {
      question: "Can I receive payment in multiple accounts?",
      answer: "Currently, Loco supports one primary bank account per employee. If you need to split payments, contact your admin to discuss alternative arrangements."
    }
  ],
  "Others": [
    {
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page. Enter your registered email, and you'll receive a password reset link. Follow the link to create a new password."
    },
    {
      question: "How can I update my personal information?",
      answer: "Go to Profile section from your dashboard. You can update your phone number, address, emergency contact, and other personal details. Some fields may require admin approval."
    },
    {
      question: "How do I apply for leave?",
      answer: "Go to Leaves > Apply Leave. Select leave type (Casual, Sick, Earned), dates, and provide a reason. Your admin will review and approve/reject within 24-48 hours."
    },
    {
      question: "Can I download reports?",
      answer: "Yes! Both admins and employees can download reports. Admins can access comprehensive reports (payroll, attendance, employees) from the Reports section. Employees can download their payslips and attendance records."
    },
    {
      question: "How do I contact support?",
      answer: "You can contact support through: 1) This AI Assistant (click 'Need More Help?' to submit a query). 2) Help Us page from the main menu. 3) Email: support@loco-payroll.com. We respond within 24 hours."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely! Loco uses bank-level encryption (SSL/TLS) to protect your data. We follow industry best practices for security, including role-based access control, regular backups, and secure payment gateways."
    },
    {
      question: "How do I log out?",
      answer: "Click on your profile icon in the top-right corner and select 'Logout'. Always log out when using shared or public computers."
    }
  ]
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState("categories"); // categories, questions, chat, support
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const categories = [
    { name: "Payroll Problems", icon: "💰", color: "bg-green-500" },
    { name: "Attendance", icon: "📅", color: "bg-blue-500" },
    { name: "Loan", icon: "🏦", color: "bg-purple-500" },
    { name: "EMI", icon: "💳", color: "bg-orange-500" },
    { name: "Payment Related", icon: "💵", color: "bg-red-500" },
    { name: "Others", icon: "❓", color: "bg-gray-500" }
  ];

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setCurrentView("questions");
    setMessages([
      {
        type: "bot",
        text: `Great! I can help you with ${category.name}. Please select a question below or type your own.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleQuestionClick = (question, answer) => {
    setMessages([
      {
        type: "user",
        text: question,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          type: "bot",
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
    
    setCurrentView("chat");
  };

  const handleSendMessage = (customMessage = null) => {
    const messageText = customMessage || inputValue.trim();
    if (!messageText) return;

    const userMessage = {
      type: "user",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      
      let foundAnswer = false;
      
      for (const category in faqData) {
        const matchedQA = faqData[category].find(qa => 
          qa.question.toLowerCase().includes(messageText.toLowerCase()) ||
          messageText.toLowerCase().includes(qa.question.toLowerCase().substring(0, 15))
        );
        
        if (matchedQA) {
          setMessages(prev => [
            ...prev,
            {
              type: "bot",
              text: matchedQA.answer,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          foundAnswer = true;
          break;
        }
      }

      if (!foundAnswer) {
        setMessages(prev => [
          ...prev,
          {
            type: "bot",
            text: "I'm sorry, I couldn't find an answer to your question. Would you like to generate a support query? Our team will get back to you within 24 hours.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            showSupportOptions: true
          }
        ]);
      }
    }, 1500);
  };

  const handleSupportQuery = async (createQuery) => {
    if (createQuery) {
      setCurrentView("support");
      setMessages(prev => [
        ...prev,
        {
          type: "bot",
          text: "Please provide your contact details so our team can assist you.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          type: "bot",
          text: "No problem! Feel free to ask another question or select a category.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleSupportFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      mobile: formData.get("mobile"),
      message: messages.find(m => m.type === "user")?.text || "General Inquiry"
    };

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setMessages(prev => [
          ...prev,
          {
            type: "bot",
            text: "Thank you! Your query has been submitted successfully. Our support team will contact you within 24 hours.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setTimeout(() => {
          setCurrentView("chat");
        }, 2000);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, there was an error submitting your query. Please try again or email us at support@loco-payroll.com",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleBack = () => {
    if (currentView === "questions") {
      setCurrentView("categories");
      setSelectedCategory(null);
      setMessages([]);
    } else if (currentView === "chat" || currentView === "support") {
      setCurrentView("questions");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentView("categories");
      setSelectedCategory(null);
      setMessages([]);
    }, 300);
  };

  return (
    <>
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-md opacity-50 group-hover:opacity-75 animate-pulse"></div>
            <div className="relative">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>
          <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            LOCO Assistant
          </div>
        </motion.div>
      )}

      {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 w-[calc(100vw-1rem)] sm:w-[420px] h-[calc(100vh-1rem)] sm:h-[650px] max-h-[650px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">LOCO Assistant</h3>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white/80 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(currentView === "questions" || currentView === "chat" || currentView === "support") && (
                  <button
                    onClick={handleBack}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              {currentView === "categories" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-4"
                >
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">How can I help you today?</h4>
                    <p className="text-sm text-gray-600">Select a category to get started</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category, index) => (
                      <motion.button
                        key={category.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleCategoryClick(category)}
                        className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 group"
                      >
                        <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentView === "questions" && selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 space-y-3"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl mb-4">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <span className="text-2xl">{selectedCategory.icon}</span>
                      <span>{selectedCategory.name}</span>
                    </h4>
                  </div>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.type === "user" 
                          ? "bg-blue-600 text-white rounded-br-sm" 
                          : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <span className={`text-xs mt-1 block ${msg.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2 mt-4">
                    {faqData[selectedCategory.name].map((qa, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleQuestionClick(qa.question, qa.answer)}
                        className="w-full text-left p-3 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-blue-50 transition-all border border-gray-100 hover:border-blue-300"
                      >
                        <p className="text-sm text-gray-700 font-medium">{qa.question}</p>
                      </motion.button>
                    ))}
                    <button
                      onClick={() => setCurrentView("chat")}
                      className="w-full text-left p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      <p className="text-sm font-medium">📝 My query is not listed here</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {currentView === "chat" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, idx) => (
                      <div key={idx}>
                        <div className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.type === "user" 
                              ? "bg-blue-600 text-white rounded-br-sm" 
                              : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <span className={`text-xs mt-1 block ${msg.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                              {msg.time}
                            </span>
                          </div>
                        </div>
                        {msg.showSupportOptions && (
                          <div className="flex justify-start mt-2 space-x-2">
                            <button
                              onClick={() => handleSupportQuery(true)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Yes, Create Query
                            </button>
                            <button
                              onClick={() => handleSupportQuery(false)}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition-colors"
                            >
                              No, Thanks
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </motion.div>
              )}

              {currentView === "support" && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6"
                >
                  <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <h4 className="text-blue-900 font-semibold mb-2">Submit Support Query</h4>
                    <p className="text-sm text-blue-700">Our team will get back to you within 24 hours</p>
                  </div>
                  <form onSubmit={handleSupportFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input name="name" required placeholder="Your full name" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input name="email" type="email" required placeholder="your@email.com" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <Input name="mobile" required placeholder="+91 XXXXX XXXXX" className="w-full" />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Submit Query
                    </Button>
                  </form>
                </motion.div>
              )}
            </div>

            {currentView === "chat" && (
              <div className="p-4 bg-white border-t">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        )}
    </>
  );
}
