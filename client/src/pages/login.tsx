import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Login() {
  const [_, navigate] = useLocation();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Hardcoded validation for demo
      if (data.email === "hau" && data.password === "123") {
        await login({
          username: data.email, // Using email field as username
          password: data.password,
        });
        // Navigation is handled in the auth hook
      } else {
        // Simulate error for invalid credentials
        throw new Error("Email hoặc mật khẩu không đúng");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <CardTitle className="text-2xl text-center text-gray-700 mt-4">Đăng nhập</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Đăng nhập Smart Parking với tài khoản của bạn
          </p>
        </CardHeader>
        <CardContent>
          {/* Social login buttons */}
          <div className="space-y-3 mb-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 py-5"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-red-500">
                <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z" />
              </svg>
              <span>Tài khoản Google</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 py-5"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-600">
                <path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
              </svg>
              <span>Tài khoản Facebook</span>
            </Button>
          </div>
          
          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-4 text-sm text-gray-500">hoặc</span>
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/15 p-3 rounded-md mb-4 text-destructive text-sm">
              {error}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                          placeholder="Nhập email của bạn" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                          type="password" 
                          placeholder="Nhập mật khẩu" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Quên mật khẩu
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
