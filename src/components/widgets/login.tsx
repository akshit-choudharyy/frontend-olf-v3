import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "@tanstack/react-router";
import { setAuthToken } from "@/store/auth/authSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signIn } from "@/utils/auth";
import { toast } from "sonner";
import { olfService } from "@/utils/axiosInstance";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  const [formErrors, setFormErrors] = useState({
    email: { error: false, message: "" },
    password: { error: false, message: "" }
  });

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => {
      return olfService.post('/auth/login', data);
    },
    onSuccess: (response: any) => {
      const token = response.data.data.token;
      if (token) {
        localStorage.setItem("authToken", token);
        dispatch(setAuthToken(token));
        signIn();
        router.navigate({ to: "/" })
      }
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(`Auth error: ${err}`)
    },
  });

  const validateInputs = (email: string, password: string) => {
    let isValid = true;
    const newErrors = { ...formErrors };

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = { 
        error: true, 
        message: 'Please enter a valid email address.' 
      };
      isValid = false;
    } else {
      newErrors.email = { error: false, message: '' };
    }

    if (!password || password.length < 6) {
      newErrors.password = { 
        error: true, 
        message: 'Password must be at least 6 characters long.' 
      };
      isValid = false;
    } else {
      newErrors.password = { error: false, message: '' };
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!validateInputs(email, password)) {
      return;
    }
    
    mutation.mutate({ email, password });
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Brand Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-8">
              <h2 className="text-xl font-bold text-white mb-2">OLF</h2>
              <p className="text-sm text-white/80">Your trusted platform for secure and simple connectivity.</p>
            </div>
          </div>
          
          <div className="flex flex-col justify-between">
            <div className="p-6 md:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                <CardDescription className="text-center">
                  Login to your OLF account
                </CardDescription>
              </CardHeader>
              
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className={cn("w-full", formErrors.email.error && "border-red-500")}
                    aria-invalid={formErrors.email.error}
                  />
                  {formErrors.email.error && (
                    <p className="text-sm text-red-500">{formErrors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {/* <a
                      href="#"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </a> */}
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className={cn("w-full", formErrors.password.error && "border-red-500")}
                    aria-invalid={formErrors.password.error}
                  />
                  {formErrors.password.error && (
                    <p className="text-sm text-red-500">{formErrors.password.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Signing in..." : "Login"}
                </Button>
              </form>
            </div>
            
            <CardFooter className="flex flex-col space-y-4 p-6 md:p-8 border-t">
              {/* <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="#" className="font-medium text-primary hover:underline">
                  Sign up
                </a>
              </div> */}
              
              <div className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <a href="#" className="hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="hover:underline">Privacy Policy</a>.
              </div>
            </CardFooter>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}