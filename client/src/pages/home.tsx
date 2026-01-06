import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertWaitlistEntrySchema, type InsertWaitlistEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface WaitlistResponse {
  message: string;
  entry: { id: number; email: string };
  count: number;
}

interface CountResponse {
  count: number;
}

export default function Home() {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch waitlist count
  const { data: countData, refetch: refetchCount } = useQuery<CountResponse>({
    queryKey: ["/api/waitlist/count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const form = useForm<InsertWaitlistEntry>({
    resolver: zodResolver(insertWaitlistEntrySchema),
    defaultValues: {
      email: "",
    },
  });

  const addToWaitlistMutation = useMutation({
    mutationFn: async (data: InsertWaitlistEntry): Promise<WaitlistResponse> => {
      const response = await apiRequest("POST", "/api/waitlist", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      form.reset();
      // Update the count in cache
      queryClient.setQueryData(["/api/waitlist/count"], { count: data.count });
      refetchCount();
      
      // Track waitlist signup event
      trackEvent('waitlist_signup', 'engagement', 'book_waitlist', data.count);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      toast({
        title: "Welcome to the waitlist!",
        description: "We'll notify you when the book launches.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to join waitlist",
        description: error.message || "Please try again later.",
      });
    },
  });

  const onSubmit = (data: InsertWaitlistEntry) => {
    addToWaitlistMutation.mutate(data);
  };

  const waitlistCount = countData?.count || 0;
  const isLoading = addToWaitlistMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-black text-white">
      {/* Book-like container with border */}
      <div className="w-80 h-[500px] md:w-96 md:h-[600px] border-2 border-neutral-700 p-8 md:p-10 bg-gradient-to-b from-neutral-900/20 to-black/50 backdrop-blur-sm shadow-2xl animate-fadeIn flex flex-col justify-between">
        
        {/* Top tagline */}
        <div className="text-center">
          <p className="text-neutral-400 text-xs font-light">First principles from an IITian who chose freedom</p>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-6">
          {/* Book Title Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight w-full whitespace-nowrap">
              Quit 9 to 5
            </h1>
            <div className="w-16 h-0.5 bg-white mx-auto"></div>
            <h2 className="text-sm md:text-base text-neutral-300 font-light leading-relaxed w-full">
              Redesign your career<br />without taking a financial hit
            </h2>
          </div>

          {/* Waitlist Counter & Coming Soon */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 bg-neutral-900/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-neutral-800">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse-slow"></div>
              <span className="text-xs text-neutral-400">
                {waitlistCount} people waiting
              </span>
            </div>
            <div className="inline-flex items-center bg-blue-900/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-blue-800/50">
              <span className="text-xs text-blue-300 font-medium">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Waitlist Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email Input */}
            <div className="relative">
              <Input
                {...form.register("email")}
                type="email"
                id="email"
                placeholder=" "
                className="peer w-full px-3 py-3 bg-neutral-900/80 backdrop-blur-sm border border-neutral-700 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm h-auto"
              />
              <label 
                htmlFor="email" 
                className="absolute left-3 top-3 text-neutral-400 transition-all duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:text-xs peer-focus:top-1 peer-focus:text-blue-400 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-blue-400 pointer-events-none"
              >
                Enter your email
              </label>
            </div>

            {/* Error Message */}
            {form.formState.errors.email && (
              <div className="text-red-400 text-xs text-center">
                {form.formState.errors.email.message}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm h-auto"
            >
              <span className="flex items-center justify-center space-x-2">
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>{isLoading ? 'Joining...' : 'Join Waitlist'}</span>
              </span>
            </Button>

            {/* Success Message */}
            {showSuccess && (
              <div className="text-blue-500 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">You're on the list! We'll notify you when the book launches.</span>
                </div>
              </div>
            )}
          </form>

          
        </div>

        {/* Author Footer */}
        <div className="text-center">
          <p className="text-neutral-400 text-xs">
            A book by{" "}
            <a 
              href="https://www.linkedin.com/in/pallavkulhari/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
            >
              Pallav Kulhari
            </a>
          </p>
        </div>

      </div>
      {/* 1:1 Call CTA outside the book */}
      <div className="mt-4 text-center">
        <p className="text-neutral-400 text-xs">
          Can't wait?{" "}
          <a 
            href="https://topmate.io/pallavkulhari" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
          >
            Book a 1:1 call here
          </a>
        </p>
      </div>
    </div>
  );
}
