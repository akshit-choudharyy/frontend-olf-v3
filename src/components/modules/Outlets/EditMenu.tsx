import React, { useState, useEffect } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';

// Define food types and cuisines
const FOOD_TYPES = [
  "SNACKS",
  "BREAKFAST",
  "STARTERS",
  "MAINS",
  "MAINS_GRAVY",
  "BREADS",
  "THALI",
  "COMBO",
  "DESSERTS",
  "SOUP",
  "BEVERAGE",
  "NAVRATRI_SPECIAL",
  "DIET",
  "BAKERY_CONFECTIONERY",
  "HEALTHY_DIET",
  "SWEETS",
  "DIWALI_SPECIAL",
  "BIRYANI",
  "BULK",
  "SPECIALITY_ITEM",
  "CHAATS",
  "NAMKEENS",
  "SALADS",
  "MOUTH_FRESHENER_DIGESTIVE",
  "PIZZA",
  "BURGER",
  "HOLI_SPECIAL",
  "PASTAS",
  "TACOS",
  "QUESADILLAS",
  "SIDES",
  "JAIN_FOOD"
];

const CUISINES = [
  "SOUTH_INDIAN",
  "PUNJABI",
  "NORTH_INDIAN",
  "MUGHALAI",
  "BENGALI",
  "GOAN",
  "TAMIL",
  "ANDHRA",
  "KERALA",
  "INDIAN_CHINESE",
  "CHINESE",
  "AWADHI",
  "MALAYSIAN",
  "MAHARASHTRIAN",
  "TIBETAN",
  "SRI_LANKAN",
  "SIKKIMESE",
  "TASTE_OF_BIHAR",
  "ASSAMESE",
  "BAKERY_CONFECTIONERY",
  "CONTINENTAL",
  "ITALIAN",
  "MEXICAN",
  "LEBANESE",
  "MONGOLIAN",
  "MALABARI",
  "HYDERABADI",
  "ODIYA",
  "MARATHI",
  "GUJRATI",
  "RAJASTHANI",
  "AMERICAN"
];

// Format food type and cuisine display names
const formatDisplayName = (name: any) => {
  return name.split('_').map((word: any) => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

// Capitalize first letter of each word
const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Define the menu item type
interface MenuItem {
  item_id: number;
  item_name: string;
  base_price: number;
  outlet_id: number;
  description: string;
  vendor_price: number;
  opening_time: string;
  closing_time: string;
  is_vegeterian: number;
  image: string;
  cuisine: string;
  food_type: string;
  bulk_only: number;
  customisations: any;
  customisation_defaultBasePrice: any;
  tax: number;
  tax_percentage?: number; // Optional for backward compatibility
}

// Define form validation schema
const menuItemSchema = z.object({
  item_name: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  description: z.string().min(2, { message: "Description is required." }),
  vendor_price: z.coerce.number().min(1, { message: "Vendor price must be at least 1." }),
  tax_percentage: z.coerce.number().min(0).max(100, { message: "Tax percentage must be between 0 and 100." }).optional(),
  base_price: z.coerce.number().min(1, { message: "Base price must be at least 1." }),
  cuisine: z.string().min(1, { message: "Please select a cuisine." }),
  food_type: z.string().min(1, { message: "Please select a food type." }),
  opening_time: z.string().min(1, { message: "Opening time is required." }),
  closing_time: z.string().min(1, { message: "Closing time is required." }),
  image: z.string().optional().or(z.literal("")),
  is_vegeterian: z.boolean().default(true),
  bulk_only: z.boolean().default(false),
});

// Define props for the component
interface EditMenuItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemData: MenuItem;
  onSuccess: () => void;
}

const EditMenu: React.FC<EditMenuItemProps> = ({ 
  open, 
  onOpenChange, 
  menuItemData,
  onSuccess 
}) => {
  // Time picker state
  const [openingTime, setOpeningTime] = useState(menuItemData?.opening_time || "10:00");
  const [closingTime, setClosingTime] = useState(menuItemData?.closing_time || "22:00");
  
  // Pricing calculation states
  const [vendorPrice, setVendorPrice] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [isAutoCalculating, setIsAutoCalculating] = useState<boolean>(false);

  // Image handling states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [hasExistingImage, setHasExistingImage] = useState<boolean>(false);

  // Initialize the form
  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      item_name: "",
      description: "",
      vendor_price: 0,
      tax_percentage: 0,
      base_price: 0,
      cuisine: "",
      food_type: "",
      opening_time: openingTime,
      closing_time: closingTime,
      image: "",
      is_vegeterian: true,
      bulk_only: false,
    },
  });

  // Function to convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle image file selection
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      setSelectedImage(null);
      setImagePreview("");
      setImageBase64("");
      setHasExistingImage(false);
      form.setValue("image", "");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 4000,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 4000,
      });
      return;
    }

    try {
      setIsUploading(true);
      setSelectedImage(file);
      setHasExistingImage(false);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Convert to base64
      const base64String = await convertToBase64(file);
      setImageBase64(base64String);
      form.setValue("image", base64String);
      
      toast.success('Image uploaded successfully!', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'white',
        },
        duration: 2000,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 4000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setImageBase64("");
    setHasExistingImage(false);
    form.setValue("image", "");
    
    // Clear the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Set form values when menu item data changes
  useEffect(() => {
    if (menuItemData) {
      setOpeningTime(menuItemData.opening_time);
      setClosingTime(menuItemData.closing_time);
      setBasePrice(menuItemData.base_price);
      setVendorPrice(menuItemData.vendor_price);
      setTaxPercentage(menuItemData.tax_percentage || 0);
      
      // Handle existing image
      if (menuItemData.image) {
        setImageBase64(menuItemData.image);
        setImagePreview(menuItemData.image);
        setHasExistingImage(true);
      } else {
        setImageBase64("");
        setImagePreview("");
        setHasExistingImage(false);
      }
      
      // Set initial tax amount and selling price based on menu item data
      const tax = Math.round(menuItemData.base_price * 0.05 * 100) / 100;
      setTaxAmount(tax);
      setSellingPrice(menuItemData.base_price + tax);
      
      form.reset({
        item_name: menuItemData.item_name,
        description: menuItemData.description,
        vendor_price: menuItemData.vendor_price,
        tax_percentage: menuItemData.tax_percentage || 0,
        base_price: menuItemData.base_price,
        cuisine: menuItemData.cuisine,
        food_type: menuItemData.food_type,
        opening_time: menuItemData.opening_time,
        closing_time: menuItemData.closing_time,
        image: menuItemData.image || "",
        is_vegeterian: menuItemData.is_vegeterian === 1,
        bulk_only: menuItemData.bulk_only === 1,
      });
    }
  }, [menuItemData, form]);

  // Auto-calculate base price when vendor price and tax percentage change
  useEffect(() => {
    if (vendorPrice > 0 && taxPercentage > 0) {
      setIsAutoCalculating(true);
      const calculatedBasePrice = Math.round(vendorPrice * (1 + taxPercentage / 100) * 100) / 100;
      setBasePrice(calculatedBasePrice);
      form.setValue("base_price", calculatedBasePrice);
    } else {
      setIsAutoCalculating(false);
    }
  }, [vendorPrice, taxPercentage, form]);

  // Calculate tax and selling price when base price changes
  useEffect(() => {
    const tax = Math.round(basePrice * 0.05 * 100) / 100; // 5% of base price, rounded to 2 decimal places
    setTaxAmount(tax);
    setSellingPrice(basePrice + tax);
  }, [basePrice]);

  // Update form values when time changes
  useEffect(() => {
    form.setValue("opening_time", openingTime);
    form.setValue("closing_time", closingTime);
  }, [openingTime, closingTime, form]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && !hasExistingImage) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, hasExistingImage]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof menuItemSchema>) => {
    try {
      // Prepare the payload
      const payload = {
        ...values,
        outlet_id: menuItemData.outlet_id,
        is_vegeterian: values.is_vegeterian ? 1 : 0, // Convert boolean to number
        bulk_only: values.bulk_only ? 1 : 0, // Convert boolean to number
        tax: taxAmount, // Use calculated tax amount
        tax_percentage: values.tax_percentage || 0, // Include tax percentage (default to 0 if not provided)
        image: imageBase64 || values.image || "", // Use base64 string or existing image
      };

      const response = await olfService.put(`/dish/${menuItemData.item_id}`, payload);
      
      if (response.data && response.data.status === 1) {
        toast.success('Menu item updated successfully!', {
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
        throw new Error(response.data?.message || 'Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error(`Failed to update menu item! ${error instanceof Error ? error.message : 'Unknown error'}`, {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-800">Edit Menu Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {/* Item Name */}
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Item Name*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter item name" 
                      {...field}
                      onChange={(e) => {
                        const capitalizedValue = capitalizeWords(e.target.value);
                        field.onChange(capitalizedValue);
                      }}
                      className="border-green-200 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description (e.g., quantity, ingredients)" 
                      {...field}
                      onChange={(e) => {
                        const capitalizedValue = capitalizeWords(e.target.value);
                        field.onChange(capitalizedValue);
                      }}
                      className="border-green-200 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-green-700 font-medium">Pricing Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Price */}
                <FormField
                  control={form.control}
                  name="vendor_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-700">Vendor Price (₹)*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          step="0.01"
                          {...field} 
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setVendorPrice(isNaN(value) ? 0 : value);
                            field.onChange(e);
                          }}
                          className="border-green-200 focus:border-green-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-green-600">
                        Price you pay to the vendor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Tax Percentage */}
                <FormField
                  control={form.control}
                  name="tax_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-700">Margin Percentage (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="e.g., 5, 10, 12"
                          {...field} 
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setTaxPercentage(isNaN(value) ? 0 : value);
                            field.onChange(e);
                          }}
                          className="border-green-200 focus:border-green-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-green-600">
                        Optional: Auto-calculates base price if entered
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Base Price */}
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">
                      Base Price (₹)*
                      {isAutoCalculating && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          (Auto-calculated)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        {...field} 
                        disabled={isAutoCalculating}
                        onChange={(e) => {
                          if (!isAutoCalculating) {
                            const value = parseFloat(e.target.value);
                            setBasePrice(isNaN(value) ? 0 : value);
                          }
                          field.onChange(e);
                        }}
                        className={`border-green-200 focus:border-green-500 ${
                          isAutoCalculating ? 'bg-gray-100 text-gray-600' : ''
                        }`}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-green-600">
                      {isAutoCalculating 
                        ? `Calculated: ₹${vendorPrice} + ${taxPercentage}% = ₹${basePrice.toFixed(2)}`
                        : 'Price before tax (manual entry if no tax % provided)'
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax and Selling Price (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-green-200 p-3">
                  <h4 className="text-green-700 font-medium">Tax Amount (₹)</h4>
                  <p className="text-lg font-semibold">{taxAmount.toFixed(2)}</p>
                  <p className="text-xs text-green-600">Fixed at 5% of base price</p>
                </div>
                
                <div className="rounded-lg border border-green-200 p-3">
                  <h4 className="text-green-700 font-medium">Selling Price (₹)</h4>
                  <p className="text-lg font-semibold">{sellingPrice.toFixed(2)}</p>
                  <p className="text-xs text-green-600">Base price + tax</p>
                </div>
              </div>
            </div>
            
            {/* Category Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Food Type */}
              <FormField
                control={form.control}
                name="food_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Food Type*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-green-200">
                          <SelectValue placeholder="Select food type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FOOD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatDisplayName(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cuisine */}
              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Cuisine*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-green-200">
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CUISINES.map((cuisine) => (
                          <SelectItem key={cuisine} value={cuisine}>
                            {formatDisplayName(cuisine)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Availability Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opening Time */}
              <FormField
                control={form.control}
                name="opening_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Opening Time*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="time" 
                          value={openingTime}
                          onChange={(e) => {
                            setOpeningTime(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          onClick={(e) => {
                            // Ensure the time picker opens when clicking anywhere on the input
                            const input = e.target as HTMLInputElement;
                            input.showPicker?.();
                          }}
                          className="border-green-200 focus:border-green-500 cursor-pointer"
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Closing Time */}
              <FormField
                control={form.control}
                name="closing_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Closing Time*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="time" 
                          value={closingTime}
                          onChange={(e) => {
                            setClosingTime(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          onClick={(e) => {
                            // Ensure the time picker opens when clicking anywhere on the input
                            const input = e.target as HTMLInputElement;
                            input.showPicker?.();
                          }}
                          className="border-green-200 focus:border-green-500 cursor-pointer"
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Image Upload Section */}
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel className="text-green-700">Menu Item Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* File Input */}
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploading}
                        className="border-green-200 focus:border-green-500 cursor-pointer"
                      />
                      
                      {/* Upload Status */}
                      {isUploading && (
                        <div className="text-blue-600 text-sm">
                          Processing image...
                        </div>
                      )}
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative">
                          <div className="border-2 border-green-200 rounded-lg p-4">
                            <div className="text-center">
                              {hasExistingImage && (
                                <p className="text-xs text-green-600 mb-2">Current Image:</p>
                              )}
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="max-w-full h-32 object-cover rounded-md mx-auto"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+Image';
                                }}
                              />
                            </div>
                            <div className="mt-2 text-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeImage}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Remove Image
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-green-600">
                    Select an image file (JPEG, PNG, GIF, or WebP). Maximum size: 5MB
                    {hasExistingImage && !selectedImage && " • Click 'Choose File' to replace current image"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Toggle Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vegetarian Toggle */}
              <FormField
                control={form.control}
                name="is_vegeterian"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-green-200 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-green-700">Vegetarian</FormLabel>
                      <FormDescription className="text-xs text-green-600">
                        Toggle if this item is vegetarian
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Bulk Only Toggle */}
              <FormField
                control={form.control}
                name="bulk_only"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-green-200 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-green-700">Bulk Only</FormLabel>
                      <FormDescription className="text-xs text-green-600">
                        Toggle if this item is available for bulk orders only
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
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
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUploading ? 'Processing...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMenu;