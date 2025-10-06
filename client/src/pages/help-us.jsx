import React, { useState } from "react";
    import { Link } from "wouter";
    import { Button } from "@/components/ui/button";
    import { Calculator } from "lucide-react"; // Or your icon library

    const initialForm = { name: "", email: "", mobile: "", message: "" };

    export default function HelpUs() {
    const [form, setForm] = useState(initialForm);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        const response = await fetch("http://localhost:5000/api/query", { // <-- Use your backend port
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (response.ok) {
            setSubmitted(true);
            setForm(initialForm);
        } else {
            alert("Failed to submit query");
        }
        } catch (err) {
        alert("Failed to submit query");
        }
    };

    return (
        <>
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                <Link href="/">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer">
                    <Calculator className="text-white h-6 w-6" />
                    </div>
                </Link>
                <Link href="/">
                    <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">Loco</h1>
                </Link>
                </div>
                <div className="flex items-center space-x-4">
                <Link href="/help">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Help Us
                    </Button>
                </Link>
                <Link href="/login">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Sign In
                    </Button>
                </Link>
                <Link href="/register">
                    <Button className="bg-primary hover:bg-primary/90">
                    Get Started
                    </Button>
                </Link>
                </div>
            </div>
            </div>
        </nav>

        {/* Rest of your page */}
        <div style={{ background: "#fff4f0", minHeight: "100vh", padding: 0 }}>
            {/* Header Section */}
            <div
            style={{
                background: "#ffffffff",
                padding: "48px 0 24px 0",
                textAlign: "center",
                backgroundImage:
                "url('https://www.transparenttextures.com/patterns/geometry.png')",
            }}
            >
            <h1 style={{ fontSize: "64px", fontWeight: 800, margin: 0, color: "#1a2a32" }}>
                Contact Us
            </h1>
            <h2 style={{ fontSize: "32px", fontWeight: 500, margin: "16px 0 0 0", color: "#1a2a32" }}>
                Not finding what you are looking for?
            </h2>
            <p style={{ fontSize: "20px", color: "#444", marginTop: 8 }}>
                Reach out to us and we will help you out.
            </p>
            </div>

            {/* Main Content */}
            <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: 48,
                maxWidth: 1200,
                margin: "40px auto",
                background: "#ffffffff",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                padding: 32,
            }}
            >
            {/* Left Info Section */}
            <div style={{ flex: 1, minWidth: 320 }}>
                <div>
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
                    Monday to Friday (9:00 AM to 7:00 PM)
                </h3>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                    <span style={iconBoxStyle}>
                    <span role="img" aria-label="mail">📧</span>
                    </span>
                    <span style={{ marginLeft: 12, fontSize: 16 }}>support@locopayroll.com</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                    <span style={iconBoxStyle}>
                    <span role="img" aria-label="phone">📞</span>
                    </span>
                    <span style={{ marginLeft: 12, fontSize: 16 }}>1234567890</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
                    <span style={iconBoxStyle}>
                    <span role="img" aria-label="forum">💬</span>
                    </span>
                    <span style={{ marginLeft: 12, fontSize: 16 }}>Forum</span>
                </div>
                </div>
                <div>
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Other resources</h3>
                <div style={{ display: "flex", gap: 32, marginBottom: 32 }}>
                    <span style={{ fontSize: 16 }}>Help</span>
                    <span style={{ fontSize: 16 }}>FAQs</span>
                    <span style={{ fontSize: 16 }}>Webinar</span>
                </div>
                </div>
                <div>
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>We're social too</h3>
                <div style={{ display: "flex", gap: 24 }}>
                    <span style={{ fontSize: 32 }}><i className="fa-brands fa-instagram"></i></span>
                    <span style={{ fontSize: 32 }}><i className="fa-brands fa-facebook"></i></span>
                    <span style={{ fontSize: 32 }}><i className="fa-brands fa-x-twitter"></i></span>
                    <span style={{ fontSize: 32 }}><i className="fa-brands fa-linkedin"></i></span>
                </div>
                </div>
            </div>

            {/* Right Form Section */}
            <div style={{ flex: 1, minWidth: 340 }}>
                <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    padding: 32,
                }}
                >
                <h2 style={{ textAlign: "center", marginBottom: 8, fontWeight: 700, fontSize: 28 }}>
                    Get in touch with us
                </h2>
                <p style={{ textAlign: "center", marginBottom: 24, color: "#666" }}>
                    Send us your questions and suggestions. We will get back to you at the earliest.
                </p>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input
                    name="name"
                    placeholder="Name *"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    />
                    <input
                    name="email"
                    placeholder="Email *"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    />
                    <input
                    name="mobile"
                    placeholder="Mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    style={inputStyle}
                    />
                    <textarea
                    name="message"
                    placeholder="Message *"
                    value={form.message}
                    onChange={handleChange}
                    required
                    style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                    />
                    <button
                    type="submit"
                    style={{
                        background: "#366dc0ff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: 12,
                        fontWeight: "bold",
                        fontSize: 16,
                        cursor: "pointer",
                        marginTop: 8,
                    }}
                    >
                    SUBMIT
                    </button>
                </form>
                {submitted && (
                    <div style={{ color: "green", marginTop: 16, textAlign: "center" }}>
                    Query submitted successfully!
                    </div>
                )}
                </div>
            </div>
            </div>
        </div>
        </>
    );
    }

    // Styles
    const iconBoxStyle = {
    width: 40,
    height: 40,
    background: "#f7f7fa",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    border: "1px solid #e0e0e0",
    };

    const inputStyle = {
    padding: 10,
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: 16,
    outline: "none",
    background: "#fafbfc",
    };