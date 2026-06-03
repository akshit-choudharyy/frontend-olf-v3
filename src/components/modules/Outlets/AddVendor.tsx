import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';

// Define the form validation schema
const vendorFormSchema = z.object({
  vendor_name: z.string().min(2, { message: "Vendor name must be at least 2 characters." }),
  vendor_phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  vendor_email: z.string().email({ message: "Please enter a valid email address." }),
  vendor_address: z.string().min(5, { message: "Address must be at least 5 characters." }),
});

// Define props for the component
interface AddVendorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddVendor: React.FC<AddVendorProps> = ({ open, onOpenChange, onSuccess }) => {
  // Initialize the form
  const form = useForm<z.infer<typeof vendorFormSchema>>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendor_name: "",
      vendor_phone: "",
      vendor_email: "",
      vendor_address: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof vendorFormSchema>) => {
    try {
      const response = await olfService.post('/rest-vendor', values);
      
      if (response.data && response.data.status === 1) {
        toast.success('Vendor added successfully!', {
          style: {
            borderRadius: '10px',
            background: 'black',
            color: 'white',
          },
          duration: 3000,
        });
        
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response.data?.message || 'Failed to add vendor');
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error(`Failed to add vendor! ${error instanceof Error ? error.message : 'Unknown error'}`, {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 4000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-800">Add New Vendor</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="vendor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Vendor Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter vendor name" 
                      {...field} 
                      className="border-green-200 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendor_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter phone number" 
                      {...field} 
                      className="border-green-200 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendor_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter email address" 
                      type="email"
                      {...field} 
                      className="border-green-200 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendor_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Street, City, State" 
                      {...field} 
                      className="border-green-200 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
              >
                Add Vendor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendor;