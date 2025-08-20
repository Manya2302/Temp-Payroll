import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect based on user role
  if (user) {
    if (user.role === 'admin') {
      setLocation("/admin");
    } else {
      setLocation("/employee");
    }
  } else {
    setLocation("/auth");
  }

  return null;
}