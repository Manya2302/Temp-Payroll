import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Key, Save } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const profileSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(1, "Contact number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  department: z.string().min(1, "Department is required"),
  // Salary is optional for non-admins; admins must supply a value via runtime check
  salary: z.union([z.string(), z.number()]).optional(),
  bankAccount: z.string().min(1, "Bank account number is required"),
  taxId: z.string().min(1, "Tax ID / PAN / SSN is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  bankName: z.string().min(1, "Bank name is required"),
  bankBranch: z.string().min(1, "Bank branch is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Add these helper functions for profile API calls
async function fetchProfile() {
  return await apiRequest("GET", "/api/profile");
}

async function updateProfile(data) {
  // PUT to /api/profile/:employeeId for update
  return await apiRequest("PUT", `/api/profile/${data.employeeId}`, data);
}

async function createProfile(data) {
  // POST to /api/profile for create
  return await apiRequest("POST", "/api/profile", data);
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch profile data from API
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: fetchProfile,
  });

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      department: "",
      salary: "",
      bankAccount: "",
      taxId: "",
      employmentType: "",
      bankName: "",
      bankBranch: "",
    },
  });

  // Password form
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fill form with profile data from DB
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        employeeId: profile.employeeId || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        phone: profile.phone || "",
    email: profile.email || "",
    address: profile.address || "",
        department: profile.department || "",
        // Initialize salary from profile; don't force zero for non-admins so updates won't overwrite admin value
        salary: profile.salary ?? "",
    bankAccount: profile.bankAccount || "",
        taxId: profile.taxId || "",
        employmentType: profile.employmentType || "",
        bankName: profile.bankName || "",
        bankBranch: profile.bankBranch || "",
      });
    }
  }, [profile, profileForm]);

  // Update or create profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      // If profile exists, update; else, create
      if (profile && profile.employeeId) {
        return await updateProfile(data);
      } else {
        return await createProfile(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest("PUT", "/api/profile/password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data) => {
    
    const payload = {
      ...data,
      dob: data.dob ? new Date(data.dob) : undefined,
    };

    // Only include salary when the current user is admin. For non-admins omit salary so it isn't overwritten.
    if (user?.role === 'admin') {
      if (data.salary !== undefined && data.salary !== "") {
        payload.salary = Number(data.salary);
      } else {
        // allow server to decide if salary is required on create
        delete payload.salary;
      }
    } else {
      // For non-admins: if creating a new profile (no existing profile), send salary: 0 so server validation passes.
      if (!profile || !profile.employeeId) {
        payload.salary = 0;
      } else {
        delete payload.salary;
      }
    }
    saveProfileMutation.mutate(payload);
  };

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Change Password
            </button>
          </nav>
        </div>

        {/* Profile Information Tab */}
        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-generated or manual" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Input placeholder="Gender" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {user?.role === 'admin' ? (
                      <FormField
                        control={profileForm.control}
                        name="salary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Basic Salary</FormLabel>
                            <FormControl>
                              <Input placeholder="Basic Salary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}

                    <FormField
                      control={profileForm.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank Account Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID / PAN / SSN</FormLabel>
                          <FormControl>
                            <Input placeholder="Tax ID / PAN / SSN" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Full-time / Part-time / Contract" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="bankBranch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Branch</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank Branch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={saveProfileMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}