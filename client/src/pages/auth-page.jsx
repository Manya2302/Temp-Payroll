/**
 * 🔹 Frontend (React) - Auth Redirect Page
 * MERN Concepts Used:
 * ✅ Components - Simple redirect component
 * ✅ useEffect - Automatic navigation on component mount
 * ✅ Event Handling - Programmatic navigation
 * ✅ React Router (Routes) - Route redirection logic
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation('/login'); }, [setLocation]);
  return null;
}