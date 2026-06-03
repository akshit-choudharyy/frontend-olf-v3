import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { olfService } from "@/utils/axiosInstance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Clock,
  Plus,
  Trash2,
  X,
  Edit,
  Save,
  ChevronsUpDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Offer-related constants
const REQUIREMENT_TYPES = ["AMOUNT", "PAYMENT_TYPE"];
const PAYMENT_TYPES = ["PRE_PAID", "POST_PAID"];
const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"];

// Define types for promotion structure
interface DiscountRequirement {
  type: "AMOUNT" | "PAYMENT_TYPE" | string;
  minimumOrderAmount?: number;
  paymentType?: "PRE_PAID" | "POST_PAID" | string;
}
interface Vendor {
  vendor_id: number;
  vendor_name: string;
  vendor_phone: string;
  vendor_email: string;
}
interface VendorMap {
  [key: number]: Vendor;
}

interface DiscountDetails {
  type: "PERCENTAGE" | "FIXED" | string;
  value: number;
  maxDiscount: number;
}

interface Promotion {
  requirement: DiscountRequirement;
  discount: DiscountDetails;
}

// Initial promotion state
const initialPromotionState: Promotion = {
  requirement: {
    type: "AMOUNT",
    minimumOrderAmount: 0,
  },
  discount: {
    type: "PERCENTAGE",
    value: 0,
    maxDiscount: 0,
  },
};

// Define interface for outlet data
interface Outlet {
  outlet_id: number;
  outlet_name: string;
  order_timing: string;
  min_order_amount: number;
  opening_time: string;
  closing_time: string;
  delivery_charges: Array<{ deliveryFee: number; amountMoreThan: number }>;
  prepaid: boolean;
  delivery_by: number;
  address: string;
  city: string;
  state: string;
  company_name: string;
  vendor_pan_number: string;
  gst: string;
  fssai: string;
  fssai_valid: string;
  logo_image: string;
  email: string;
  phone: string;
  tags: string;
  station_name: string;
  station_code: string;
  vendor_id: number;
  rlemail: string;
  rlphone: string;
  alternative_phones?: string | null; 
  promotions?: { promotions: Promotion[] };
}

// Form validation schema
const formSchema = z.object({
  outlet_name: z.string().min(2, "Outlet name must be at least 2 characters."),
  order_timing: z.coerce.string().min(1, "Preparation time is required."),
  min_order_amount: z.coerce.number().min(0, "Amount must be non-negative"),
  opening_time: z.string(),
  closing_time: z.string(),
  prepaid: z.boolean(),
  delivery_by: z.boolean(),
  address: z.string().min(5, "Address must be at least 5 characters."),
  city: z.string().min(2, "City must be at least 2 characters."),
  state: z.string().min(2, "State must be at least 2 characters."),
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters."),
  vendor_pan_number: z.string().optional(),
  gst: z.string(),
  fssai: z.string(),
  fssai_valid: z.string(),
  logo_image: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isVeg: z.boolean().default(false),
  isNonVeg: z.boolean().default(false),
  station_name: z.string(),
  station_code: z.string(),
  vendor_id: z.coerce.number().min(1, "Please select a vendor."),
  rlemail: z
    .string()
    .email({ message: "Invalid email format." })
    .or(z.literal(""))
    .optional(),
  rlphone: z
    .string()
    .min(10, { message: "Phone must be at least 10 digits." })
    .or(z.literal(""))
    .optional(),
  alternative_phones: z.array(z.string()).optional(),
});

interface EditOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletData: Outlet | null;
  onSave: () => void;
  defaultTab?: string;
}

const createVendorMap = (vendors: Vendor[]): VendorMap => {
  return vendors.reduce((acc, vendor) => {
    acc[vendor.vendor_id] = vendor;
    return acc;
  }, {} as VendorMap);
};

const EditOutlet: React.FC<EditOutletDialogProps> = ({
  open,
  onOpenChange,
  outletData,
  onSave,
  defaultTab = "basic",
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outlet_name: "",
      order_timing: "",
      min_order_amount: 0,
      opening_time: "",
      closing_time: "",
      prepaid: false,
      delivery_by: false,
      address: "",
      city: "",
      state: "",
      company_name: "",
      vendor_pan_number: "",
      gst: "",
      fssai: "",
      fssai_valid: "",
      logo_image: "",
      email: "",
      phone: "",
      isVeg: false,
      isNonVeg: false,
      station_name: "",
      station_code: "",
      vendor_id: 0,
      rlemail: "",
      rlphone: "",
      alternative_phones: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState<any>(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [originalData, setOriginalData] = useState<z.infer<
    typeof formSchema
  > | null>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);

  // Delivery fee limits state
  const [limits, setLimits] = useState<any>([]);
  const [originalLimits, setOriginalLimits] = useState<any>([]);
  const [newAmount, setNewAmount] = useState<any>("");
  const [newFee, setNewFee] = useState<any>("");
  const [error, setError] = useState<string | null>(null);

  // Offers/Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [originalPromotions, setOriginalPromotions] = useState<Promotion[]>([]);
  const [newPromotion, setNewPromotion] = useState<Promotion>(
    initialPromotionState
  );
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isVendorPopoverOpen, setIsVendorPopoverOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");


  const addPhoneNumber = () => {
    if (phoneInput && phoneInput.trim().length >= 10) {
      const currentPhones = form.getValues("alternative_phones") || [];
      const newPhone = phoneInput.trim();
      
      if (!currentPhones.includes(newPhone)) {
        const updatedPhones = [...currentPhones, newPhone];
        form.setValue("alternative_phones", updatedPhones, { 
          shouldValidate: true, 
          shouldDirty: true 
        });
        setPhoneInput("");
      } else {
        toast.error("Phone number already added");
      }
    } else {
      toast.error("Please enter a valid phone number (min 10 digits)");
    }
  };

  const removePhoneNumber = (phoneToRemove: string) => {
    const currentPhones = form.getValues("alternative_phones") || [];
    const updatedPhones = currentPhones.filter((p) => p !== phoneToRemove);
    form.setValue("alternative_phones", updatedPhones, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
  };

  // Fetch vendors for dropdown
  const { data: allVendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: (): Promise<Vendor[]> =>
      olfService.get("/rest-vendor").then((res) => {
        if (!res.data || res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return res.data.data.rows || [];
      }),
  });


  const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return ""; // Return empty if the date is null or undefined
  }

  // Attempt to create a Date object. This is flexible and can parse many formats.
  const date = new Date(dateString);

  // Check if the parsed date is valid
  if (isNaN(date.getTime())) {
    console.warn("Could not parse invalid date string:", dateString);
    return ""; // Return empty for invalid dates to avoid crashing
  }

  // Extract year, month, and day
  const year = date.getFullYear();
  // getMonth() is 0-indexed, so we add 1. padStart ensures it's two digits (e.g., 04 for April).
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Return the correctly formatted string
  return `${year}-${month}-${day}`;
};

  const onInvalid = (errors: any) => {
    console.error("Form validation failed!", errors);
    toast.error("Please check all fields for errors before saving.");

    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      if (
        ["vendor_id", "outlet_name", "company_name"].includes(firstErrorField)
      ) {
        setActiveTab("basic");
      } else if (["gst", "fssai", "fssai_valid"].includes(firstErrorField)) {
        setActiveTab("business");
      } else if (
        ["opening_time", "closing_time", "order_timing"].includes(
          firstErrorField
        )
      ) {
        setActiveTab("orders");
      }
    }
  };

  // Convert isVeg and isNonVeg booleans to tags string
  const convertFoodTypeToTags = (isVeg: boolean, isNonVeg: boolean) => {
    if (isVeg && isNonVeg) {
      return "VEG,NON VEG";
    } else if (isVeg) {
      return "VEG";
    } else if (isNonVeg) {
      return "NON VEG";
    }
    return "";
  };

  // Parse delivery charges
  const parseDeliveryCharges = (
    deliveryChargesArray:
      | Array<{ deliveryFee: number; amountMoreThan: number }>
      | null
      | undefined
  ) => {
    if (!deliveryChargesArray || !Array.isArray(deliveryChargesArray)) {
      return [];
    }
    return deliveryChargesArray;
  };

  const parsePromotions = (promotionsInput: any): Promotion[] => {
    if (!promotionsInput) {
      return [];
    }

    let promotionsContainer;
    if (typeof promotionsInput === "string") {
      try {
        if (promotionsInput.toUpperCase() === "NULL") {
          return [];
        }
        promotionsContainer = JSON.parse(promotionsInput);
      } catch (error) {
        console.error(
          "Failed to parse promotions JSON string:",
          promotionsInput,
          error
        );
        return [];
      }
    } else {
      promotionsContainer = promotionsInput;
    }
    if (promotionsContainer && Array.isArray(promotionsContainer.promotions)) {
      return promotionsContainer.promotions;
    }
    return [];
  };

  // Check if tab has changes
  const hasTabChanged = (tabName: string): boolean => {
    const currentFormValues = form.getValues();

    if (tabName === "basic") {
      return (
        JSON.stringify({
          outlet_name: currentFormValues.outlet_name,
          company_name: currentFormValues.company_name,
          logo_image: currentFormValues.logo_image,
          isVeg: currentFormValues.isVeg,
          isNonVeg: currentFormValues.isNonVeg,
          address: currentFormValues.address,
          city: currentFormValues.city,
          state: currentFormValues.state,
          rlemail: currentFormValues.rlemail,
          rlphone: currentFormValues.rlphone,
          vendor_id: currentFormValues.vendor_id,
          alternative_phones: currentFormValues.alternative_phones,
        }) !==
        JSON.stringify({
          outlet_name: originalData?.outlet_name || "",
          company_name: originalData?.company_name || "",
          logo_image: originalData?.logo_image || "",
          isVeg: originalData?.isVeg || false,
          isNonVeg: originalData?.isNonVeg || false,
          address: originalData?.address || "",
          city: originalData?.city || "",
          state: originalData?.state || "",
          rlemail: originalData?.rlemail || "",
          rlphone: originalData?.rlphone || "",
          vendor_id: originalData?.vendor_id || 0,
            alternative_phones: originalData?.alternative_phones || [],
        })
      );
    } else if (tabName === "business") {
      return (
        JSON.stringify({
          vendor_pan_number: currentFormValues.vendor_pan_number,
          gst: currentFormValues.gst,
          fssai: currentFormValues.fssai,
          fssai_valid: currentFormValues.fssai_valid,
        }) !==
        JSON.stringify({
          vendor_pan_number: originalData?.vendor_pan_number || "",
          gst: originalData?.gst || "",
          fssai: originalData?.fssai || "",
          fssai_valid: originalData?.fssai_valid || "",
        })
      );
    } else if (tabName === "orders") {
      return (
        JSON.stringify({
          opening_time: currentFormValues.opening_time,
          closing_time: currentFormValues.closing_time,
          order_timing: currentFormValues.order_timing,
          min_order_amount: currentFormValues.min_order_amount,
          prepaid: currentFormValues.prepaid,
          delivery_by: currentFormValues.delivery_by,
          limits: limits,
        }) !==
        JSON.stringify({
          opening_time: originalData?.opening_time || "08:00",
          closing_time: originalData?.closing_time || "22:00",
          order_timing: originalData?.order_timing || "",
          min_order_amount: originalData?.min_order_amount || 0,
          prepaid: originalData?.prepaid || false,
          delivery_by: originalData?.delivery_by || false,
          limits: originalLimits,
        })
      );
    } else if (tabName === "offers") {
      return JSON.stringify(promotions) !== JSON.stringify(originalPromotions);
    }

    return false;
  };

  // Validate specific tab before saving
  const validateTabFields = async (tabName: string): Promise<boolean> => {
    try {
      if (tabName === "basic") {
        await form.trigger([
          "vendor_id",
          "outlet_name",
          "company_name",
          "address",
          "city",
          "state",
        ]);
      } else if (tabName === "business") {
        await form.trigger(["gst", "fssai", "fssai_valid"]);
      } else if (tabName === "orders") {
        await form.trigger([
          "opening_time",
          "closing_time",
          "order_timing",
          "min_order_amount",
        ]);
      }

      // Check if there are any errors in the form
      const errors = form.formState.errors;
if (Object.keys(errors).length > 0) {
  // Now we are using the onInvalid function!
  onInvalid(errors); 
  return false;
}
      return true;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  };

  // Save tab changes
  const saveTabChanges = async (tabName: string) => {
    // Validate tab fields first
    const isValid = await validateTabFields(tabName);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    if (!outletData || !originalData) {
      setIsSubmitting(false);
      return;
    }

    const updatedFields: any = {};
    const currentFormValues = form.getValues();

    try {
      if (tabName === "basic") {
        if (currentFormValues.outlet_name !== originalData.outlet_name)
          updatedFields.outlet_name = currentFormValues.outlet_name;
        if (currentFormValues.company_name !== originalData.company_name)
          updatedFields.company_name = currentFormValues.company_name;
        if (currentFormValues.logo_image !== originalData.logo_image)
          updatedFields.logo_image = currentFormValues.logo_image;
        if (currentFormValues.address !== originalData.address)
          updatedFields.address = currentFormValues.address;
        if (currentFormValues.city !== originalData.city)
          updatedFields.city = currentFormValues.city;
        if (currentFormValues.state !== originalData.state)
          updatedFields.state = currentFormValues.state;
           if (JSON.stringify(currentFormValues.alternative_phones) !== JSON.stringify(originalData.alternative_phones)) {
          const phonesArray = currentFormValues.alternative_phones || [];
          // Join array ["123", "456"] into string "123,456"
          updatedFields.alternative_phones = phonesArray.join(','); 
        }
        if (currentFormValues.rlemail !== originalData.rlemail)
          updatedFields.rlemail = currentFormValues.rlemail;
        if (currentFormValues.rlphone !== originalData.rlphone)
          updatedFields.rlphone = currentFormValues.rlphone;
        if (currentFormValues.vendor_id !== originalData.vendor_id)
          updatedFields.vendor_id = currentFormValues.vendor_id;

        const tags = convertFoodTypeToTags(
          currentFormValues.isVeg,
          currentFormValues.isNonVeg
        );
        const originalTags = convertFoodTypeToTags(
          originalData.isVeg,
          originalData.isNonVeg
        );
        if (tags !== originalTags) updatedFields.tags = tags;
      } else if (tabName === "business") {
        if (
          currentFormValues.vendor_pan_number !== originalData.vendor_pan_number
        )
          updatedFields.vendor_pan_number = currentFormValues.vendor_pan_number;
        if (currentFormValues.gst !== originalData.gst)
          updatedFields.gst = currentFormValues.gst;
        if (currentFormValues.fssai !== originalData.fssai)
          updatedFields.fssai = currentFormValues.fssai;
        if (currentFormValues.fssai_valid !== originalData.fssai_valid)
          updatedFields.fssai_valid = currentFormValues.fssai_valid;
      } else if (tabName === "orders") {
        if (currentFormValues.opening_time !== originalData.opening_time)
          updatedFields.opening_time = currentFormValues.opening_time;
        if (currentFormValues.closing_time !== originalData.closing_time)
          updatedFields.closing_time = currentFormValues.closing_time;
        if (currentFormValues.order_timing !== originalData.order_timing)
          updatedFields.order_timing = currentFormValues.order_timing;
        if (
          currentFormValues.min_order_amount !== originalData.min_order_amount
        )
          updatedFields.min_order_amount = currentFormValues.min_order_amount;
        if (currentFormValues.prepaid !== originalData.prepaid)
          updatedFields.prepaid = currentFormValues.prepaid;

        const newDeliveryBy = currentFormValues.delivery_by ? 1 : 0;
        const originalDeliveryBy = originalData.delivery_by ? 1 : 0;
        if (newDeliveryBy !== originalDeliveryBy)
          updatedFields.delivery_by = newDeliveryBy;

        if (JSON.stringify(limits) !== JSON.stringify(originalLimits))
          updatedFields.delivery_charges = JSON.stringify(limits);
      } else if (tabName === "offers") {
        if (JSON.stringify(promotions) !== JSON.stringify(originalPromotions))
          updatedFields.promotions = { promotions };
      }

      if (Object.keys(updatedFields).length > 0) {
        console.log(`Saving ${tabName} tab with:`, updatedFields);
        await olfService.put(
          `/restraunt/${outletData.outlet_id}`,
          updatedFields
        );

        if (tabName === "basic") {
          setOriginalData({
            ...originalData,
            outlet_name: currentFormValues.outlet_name,
            company_name: currentFormValues.company_name,
            logo_image: currentFormValues.logo_image,
            address: currentFormValues.address,
            city: currentFormValues.city,
            state: currentFormValues.state,
            rlemail: currentFormValues.rlemail,
            rlphone: currentFormValues.rlphone,
            vendor_id: currentFormValues.vendor_id,
            isVeg: currentFormValues.isVeg,
            isNonVeg: currentFormValues.isNonVeg,
             alternative_phones: currentFormValues.alternative_phones,
          });
        } else if (tabName === "business") {
          setOriginalData({
            ...originalData,
            vendor_pan_number: currentFormValues.vendor_pan_number,
            gst: currentFormValues.gst,
            fssai: currentFormValues.fssai,
            fssai_valid: currentFormValues.fssai_valid,
          });
        } else if (tabName === "orders") {
          setOriginalData({
            ...originalData,
            opening_time: currentFormValues.opening_time,
            closing_time: currentFormValues.closing_time,
            order_timing: currentFormValues.order_timing,
            min_order_amount: currentFormValues.min_order_amount,
            prepaid: currentFormValues.prepaid,
            delivery_by: currentFormValues.delivery_by,
          });
          setOriginalLimits(limits);
        } else if (tabName === "offers") {
          setOriginalPromotions(promotions);
        }

        toast.success(
          `${tabName.charAt(0).toUpperCase() + tabName.slice(1)} tab saved successfully!`
        );
      } else {
        toast("No changes in this tab.", { icon: "ℹ️" });
      }

      setEditingTab(null);
      onSave();
    } catch (error) {
      console.error(`Error saving ${tabName} tab:`, error);
      toast.error(`Failed to save ${tabName} tab`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab Edit Button Component
  const TabEditButton = ({ tabName }: { tabName: string }) => {
    const isEditing = editingTab === tabName;
    const hasChanges = hasTabChanged(tabName);

    return (
      <div className="flex gap-2 items-center">
        {isEditing ? (
          <>
            <Button
              type="button"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                saveTabChanges(tabName);
              }}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Tab
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingTab(null);
                if (originalData) {
                  form.reset(originalData);
                }
                if (tabName === "orders") {
                  setLimits(originalLimits);
                } else if (tabName === "offers") {
                  setPromotions(originalPromotions);
                }
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setEditingTab(tabName)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {hasChanges && !isEditing && (
          <Badge variant="destructive" className="ml-2">
            Unsaved
          </Badge>
        )}
      </div>
    );
  };

  // Delivery fee limits functions
  const addLimit = (e: any) => {
    e.preventDefault();
    if (!newAmount || !newFee) {
      setError("Both fields required");
      return;
    }

    const amount = parseFloat(newAmount);
    const fee = parseFloat(newFee);

    if (isNaN(amount) || isNaN(fee)) {
      setError("Enter valid numbers");
      return;
    }

    if (limits.some((limit: any) => limit.amountMoreThan === amount)) {
      setError("Threshold exists");
      return;
    }

    const newLimits = [...limits, { amountMoreThan: amount, deliveryFee: fee }];
    newLimits.sort((a, b) => a.amountMoreThan - b.amountMoreThan);

    setLimits(newLimits);
    setNewAmount("");
    setNewFee("");
    setError(null);
  };

  const removeLimit = (index: number) => {
    const newLimits = [...limits];
    newLimits.splice(index, 1);
    setLimits(newLimits);
  };

  // Promotion handling functions
  const handleRequirementTypeChange = (value: string) => {
    if (value === "AMOUNT") {
      setNewPromotion({
        ...newPromotion,
        requirement: {
          type: value,
          minimumOrderAmount: 0,
        },
      });
    } else if (value === "PAYMENT_TYPE") {
      setNewPromotion({
        ...newPromotion,
        requirement: {
          type: value,
          paymentType: "PRE_PAID",
          minimumOrderAmount: 0,
        },
      });
    }
  };

  const handlePromotionFieldChange = (field: string, value: any) => {
    if (field.startsWith("requirement.")) {
      const reqField = field.split(".")[1];
      setNewPromotion({
        ...newPromotion,
        requirement: {
          ...newPromotion.requirement,
          [reqField]: value,
        },
      });
    } else if (field.startsWith("discount.")) {
      const discField = field.split(".")[1];
      setNewPromotion({
        ...newPromotion,
        discount: {
          ...newPromotion.discount,
          [discField]: value,
        },
      });
    }
  };

  const resetPromotionForm = () => {
    setNewPromotion(initialPromotionState);
  };

  const addPromotion = () => {
    if (
      newPromotion.requirement.type === "AMOUNT" &&
      (newPromotion.requirement.minimumOrderAmount === undefined ||
        newPromotion.requirement.minimumOrderAmount <= 0)
    ) {
      toast.error("Minimum order amount must be greater than 0");
      return;
    }

    if (
      newPromotion.requirement.type === "PAYMENT_TYPE" &&
      (!newPromotion.requirement.paymentType ||
        newPromotion.requirement.minimumOrderAmount === undefined ||
        newPromotion.requirement.minimumOrderAmount <= 0)
    ) {
      toast.error(
        "Please select a payment type and enter a minimum order amount greater than 0"
      );
      return;
    }

    if (newPromotion.discount.value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    const updatedPromotions = [...promotions, newPromotion];
    setPromotions(updatedPromotions);

    toast.success("Promotion added successfully!");
    resetPromotionForm();
  };

  const deletePromotion = (index: number) => {
    const updatedPromotions = [...promotions];
    updatedPromotions.splice(index, 1);
    setPromotions(updatedPromotions);
    toast.success("Promotion removed!");
  };

  const startEditPromotion = (index: number) => {
    setEditingIndex(index);
    setEditingPromotion(JSON.parse(JSON.stringify(promotions[index])));
  };

  const saveEditedPromotion = () => {
    if (!editingPromotion || editingIndex === null) return;

    if (
      editingPromotion.requirement.type === "AMOUNT" &&
      (editingPromotion.requirement.minimumOrderAmount === undefined ||
        editingPromotion.requirement.minimumOrderAmount <= 0)
    ) {
      toast.error("Minimum order amount must be greater than 0");
      return;
    }

    if (
      editingPromotion.requirement.type === "PAYMENT_TYPE" &&
      (!editingPromotion.requirement.paymentType ||
        editingPromotion.requirement.minimumOrderAmount === undefined ||
        editingPromotion.requirement.minimumOrderAmount <= 0)
    ) {
      toast.error(
        "Please select a payment type and enter a minimum order amount greater than 0"
      );
      return;
    }

    if (editingPromotion.discount.value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    const updatedPromotions = [...promotions];
    updatedPromotions[editingIndex] = editingPromotion;
    setPromotions(updatedPromotions);

    toast.success("Promotion updated successfully!");
    setEditingPromotion(null);
    setEditingIndex(null);
  };

  const cancelEditPromotion = () => {
    setEditingPromotion(null);
    setEditingIndex(null);
  };

  const formatPromotionText = (promotion: Promotion) => {
    let requirementText = "";

    if (promotion.requirement.type === "AMOUNT") {
      requirementText = `Min. Order: ₹${promotion.requirement.minimumOrderAmount}`;
    } else if (promotion.requirement.type === "PAYMENT_TYPE") {
      requirementText = `Payment: ${promotion.requirement.paymentType}, Min. Order: ₹${promotion.requirement.minimumOrderAmount}`;
    }

    let discountText = "";
    if (promotion.discount.type === "PERCENTAGE") {
      discountText = `${promotion.discount.value}% off`;
      if (promotion.discount.maxDiscount > 0) {
        discountText += ` (up to ₹${promotion.discount.maxDiscount})`;
      } else if (promotion.discount.maxDiscount === -1) {
        discountText += " (no cap)";
      }
    } else if (promotion.discount.type === "FIXED") {
      discountText = `₹${promotion.discount.value} off`;
    }

    return { requirementText, discountText };
  };

  // Image handling functions
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        form.setValue("logo_image", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue("logo_image", "");

    const fileInput = document.getElementById("logo_image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Update form values when outlet data changes
// Update form values when outlet data changes
  useEffect(() => {
    if (outletData) {
      console.log("--- useEffect DEBUG ---");
      
      // 1. Parse Alternative Phones from String to Array
      let parsedAltPhones: string[] = [];
      if (outletData.alternative_phones) {
        const rawVal = outletData.alternative_phones;
        if (Array.isArray(rawVal)) {
          // In case API sends an array
          parsedAltPhones = rawVal;
        } else if (typeof rawVal === "string" && rawVal.trim() !== "") {
          // Split string "123,456" into array ["123", "456"]
          parsedAltPhones = rawVal.split(",");
        }
      }

      const cleanDataForForm = {
        outlet_name: outletData.outlet_name || "",
        order_timing: String(outletData.order_timing || "30"),
        min_order_amount: outletData.min_order_amount || 0,
        opening_time: outletData.opening_time || "08:00",
        closing_time: outletData.closing_time || "22:00",
        prepaid: outletData.prepaid || false,
        delivery_by: outletData.delivery_by === 1,
        address: outletData.address || "",
        city: outletData.city || "",
        state: outletData.state || "",
        company_name: outletData.company_name || "",
        vendor_pan_number: outletData.vendor_pan_number || "",
        gst: outletData.gst || "",
        fssai: outletData.fssai || "",
        fssai_valid: formatDateForInput(outletData.fssai_valid),
        logo_image: outletData.logo_image || "",
        email: String(outletData.email || ""),
        phone: String(outletData.phone || ""),
        isVeg: outletData.tags?.toUpperCase().includes("VEG") || false,
        isNonVeg: outletData.tags?.toUpperCase().includes("NON VEG") || false,
        station_name: outletData.station_name || "",
        station_code: outletData.station_code || "",
        vendor_id: outletData.vendor_id || 0,
        rlemail: String(outletData.rlemail || ""),
        rlphone: String(outletData.rlphone || ""),
        // 2. Assign the parsed array here (fixes the type error)
        alternative_phones: parsedAltPhones, 
      };

      setActiveTab(defaultTab);
      form.reset(cleanDataForForm);
      
      // 3. Set original data with the clean array structure
      setOriginalData(cleanDataForForm);

      const parsedLimits = parseDeliveryCharges(outletData.delivery_charges);
      setLimits(parsedLimits);
      setOriginalLimits(parsedLimits);

      const parsedPromotions = parsePromotions(outletData.promotions);
      setPromotions(parsedPromotions);
      setOriginalPromotions(parsedPromotions);
    }
  }, [outletData, allVendors, form, defaultTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-800">
            Edit Outlet
          </DialogTitle>
          <DialogDescription>
            Update the outlet information. Click edit to modify each tab, then
            save when done.
          </DialogDescription>
        </DialogHeader>
<Toaster 
  position="top-right"
  containerStyle={{
    visibility: 'hidden'
  }}
/>

        <Form {...form}>
          <form>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="business">Business Details</TabsTrigger>
                <TabsTrigger value="orders">Order Settings</TabsTrigger>
                <TabsTrigger value="offers">Offers & Promotions</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <TabEditButton tabName="basic" />
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div
                      className="flex flex-col gap-4"
                      style={
                        editingTab !== "basic"
                          ? { pointerEvents: "none", opacity: 0.6 }
                          : {}
                      }
                    >
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <FormField
  control={form.control}
  name="vendor_id"
  render={({ field }) => {
    const vendorMap = createVendorMap(allVendors);
    const selectedVendor = vendorMap[field.value];
    
    return (
      <FormItem>
        <FormLabel>Select Vendor*</FormLabel>
        <Popover
          open={isVendorPopoverOpen}
          onOpenChange={setIsVendorPopoverOpen}
        >
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedVendor 
                  ? `${selectedVendor.vendor_name}` 
                  : "Select Vendor"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Search vendor..." />
              <CommandEmpty>
                No vendor found.
              </CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                {allVendors.map((vendor) => (
                  <CommandItem
                    value={`${vendor.vendor_name} ${vendor.vendor_phone} ${vendor.vendor_email}`}
                    key={vendor.vendor_id}
                    onSelect={() => {
                      field.onChange(vendor.vendor_id);
                      form.setValue(
                        "phone",
                        String(vendor.vendor_phone || "")
                      );
                      form.setValue(
                        "email",
                        String(vendor.vendor_email || "")
                      );
                      setIsVendorPopoverOpen(false);
                    }}
                  >
                    {vendor.vendor_name} (
                    {vendor.vendor_phone || "No Phone"})
                    {vendor.vendor_email
                      ? ` - ${vendor.vendor_email}`
                      : ""}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    );
  }}
/>
                        </div>
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name="outlet_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Outlet Name*</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter outlet name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name*</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter company name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logo_image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo Image</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <Input
                                  id="logo_image"
                                  name="logo_image"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="cursor-pointer"
                                />
                                {field.value && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">
                                        Preview:
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={removeImage}
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                    <div className="border rounded-md p-2 bg-gray-50">
                                      <img
                                        src={field.value}
                                        alt="Logo preview"
                                        className="max-w-32 max-h-32 object-contain mx-auto rounded"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="">
                        <FormLabel className="block mb-2">Food Type*</FormLabel>
                        <div className="flex space-x-6 mt-2">
                          <FormField
                            control={form.control}
                            name="isVeg"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer">
                                  VEG
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isNonVeg"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer">
                                  NON VEG
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormDescription className="mt-1">
                          Select at least one food type for your outlet
                        </FormDescription>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                      style={
                        editingTab !== "basic"
                          ? { pointerEvents: "none", opacity: 0.6 }
                          : {}
                      }
                    >
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Address*</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter full address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="col-span-2 mt-4">
                        <h3 className="text-lg font-medium mb-4">
                          Relationship Manager Information
                        </h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="rlemail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship Manager Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter relationship manager email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

 <FormField
  control={form.control}
  name="rlphone"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Relationship Manager Phone</FormLabel>
      <FormControl>
        <Input {...field} placeholder="Enter relationship manager phone" />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* --- NEW SECTION STARTS HERE --- */}
<div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t">
  <FormLabel className="block mb-3">Alternative Phones</FormLabel>
  
  {/* Watch the form value to render the list */}
  <div className="flex flex-wrap gap-2 mb-3">
    {form.watch("alternative_phones")?.map((phone: string) => (
      <Badge
        key={phone}
        variant="secondary"
        className="flex items-center gap-1 px-3 py-1 text-sm"
      >
        {phone}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-0 h-4 w-4 ml-1 rounded-full hover:bg-gray-200"
          onClick={() => removePhoneNumber(phone)}
          // Disable delete button if not in edit mode
          disabled={editingTab !== "basic"}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    ))}
    {(!form.watch("alternative_phones") || form.watch("alternative_phones")?.length === 0) && (
      <span className="text-sm text-gray-400 italic">No alternative numbers added</span>
    )}
  </div>

  <div className="flex gap-2">
    <Input
      value={phoneInput}
      onChange={(e) => setPhoneInput(e.target.value)}
      placeholder="Enter phone number"
      className="flex-1"
      type="number" // Restrict to numbers
    />
    <Button
      type="button"
      onClick={addPhoneNumber}
      variant="secondary"
      className="bg-gray-100 hover:bg-gray-200 border"
    >
      <Plus className="h-4 w-4 mr-1" /> Add
    </Button>
  </div>
  <p className="text-xs text-gray-500 mt-2">
    Add multiple backup contact numbers for this outlet.
  </p>
</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Details Tab */}
              <TabsContent value="business">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Business Details</h3>
                  <TabEditButton tabName="business" />
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      style={
                        editingTab !== "business"
                          ? { pointerEvents: "none", opacity: 0.6 }
                          : {}
                      }
                    >
                      <FormField
                        control={form.control}
                        name="vendor_pan_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter PAN number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gst"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number*</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter GST number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fssai"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>FSSAI License*</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter FSSAI license number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fssai_valid"
                        render={({ field }) => (
                         <FormItem>
      <FormLabel>FSSAI Valid Till*</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            {...field}
            type="date" // This should be "date"
            placeholder="Select date"
          />
          <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Order Settings Tab */}
              <TabsContent value="orders">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Order Settings</h3>
                  <TabEditButton tabName="orders" />
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      style={
                        editingTab !== "orders"
                          ? { pointerEvents: "none", opacity: 0.6 }
                          : {}
                      }
                    >
                      <FormField
                        control={form.control}
                        name="opening_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Time*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type="time"
                                  placeholder="Select time"
                                />
                                <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="closing_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Closing Time*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type="time"
                                  placeholder="Select time"
                                />
                                <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="order_timing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Order Preparation Time (minutes)*
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Enter preparation time in minutes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="min_order_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Order Amount (₹)*</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Enter minimum order amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Delivery Fee Limits */}
                      <div className="col-span-2">
                        <Card className="max-w-md">
                          <CardHeader className="pb-2">
                            <CardTitle>Delivery Fee Limits</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {limits.length > 0 ? (
                              <div className="mb-4 border rounded-md">
                                <div className="grid grid-cols-12 border-b p-2 bg-muted">
                                  <div className="col-span-5 font-medium">
                                    Amount
                                  </div>
                                  <div className="col-span-5 font-medium">
                                    Fee
                                  </div>
                                  <div className="col-span-2"></div>
                                </div>
                                <div className="divide-y">
                                  {limits.map((limit: any, index: any) => (
                                    <div
                                      key={index}
                                      className="grid grid-cols-12 p-2 items-center"
                                    >
                                      <div className="col-span-5">
                                        ₹{limit.amountMoreThan}
                                      </div>
                                      <div className="col-span-5">
                                        ₹{limit.deliveryFee}
                                      </div>
                                      <div className="col-span-2 flex justify-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeLimit(index)}
                                          type="button"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mb-4 p-4 text-center text-gray-500 border rounded-md">
                                No delivery fee limits set. Add delivery charges
                                based on order amounts.
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Order Amount"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                placeholder="Delivery Fee"
                                value={newFee}
                                onChange={(e) => setNewFee(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                onClick={addLimit}
                                size="icon"
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {error && (
                              <div className="mt-2 text-red-500 text-sm">
                                {error}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <FormField
                        control={form.control}
                        name="prepaid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Accept Prepaid Orders
                              </FormLabel>
                              <FormDescription>
                                Allow customers to pay online during order
                                placement
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="delivery_by"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Charged by OLF
                              </FormLabel>
                              <FormDescription>
                                When enabled, delivery charges are handled by
                                OLF. When disabled, charges are handled by the
                                outlet.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Offers & Promotions Tab */}
              <TabsContent value="offers">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Offers & Promotions</h3>
                  <TabEditButton tabName="offers" />
                </div>
                <div
                  className="space-y-6"
                  style={
                    editingTab !== "offers"
                      ? { pointerEvents: "none", opacity: 0.6 }
                      : {}
                  }
                >
                  {/* Add New Promotion Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-green-800">
                        Create New Promotion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Requirement Section */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Requirement
                        </Label>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="requirement-type">
                              Requirement Type
                            </Label>
                            <Select
                              value={newPromotion.requirement.type}
                              onValueChange={handleRequirementTypeChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select requirement type" />
                              </SelectTrigger>
                              <SelectContent>
                                {REQUIREMENT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type === "AMOUNT"
                                      ? "Minimum Order Amount"
                                      : "Payment Type"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {newPromotion.requirement.type === "PAYMENT_TYPE" && (
                            <div>
                              <Label htmlFor="payment-type">Payment Type</Label>
                              <Select
                                value={
                                  newPromotion.requirement.paymentType || ""
                                }
                                onValueChange={(value) =>
                                  handlePromotionFieldChange(
                                    "requirement.paymentType",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAYMENT_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type === "PRE_PAID"
                                        ? "PRE_PAID"
                                        : "CASH_ON_DELIVERY"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="min-amount">
                              Minimum Order Amount (₹)
                            </Label>
                            <Input
                              id="min-amount"
                              type="number"
                              value={
                                newPromotion.requirement.minimumOrderAmount
                              }
                              onChange={(e) =>
                                handlePromotionFieldChange(
                                  "requirement.minimumOrderAmount",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="Enter minimum order amount"
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Discount Section */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Discount
                        </Label>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="discount-type">Discount Type</Label>
                            <Select
                              value={newPromotion.discount.type}
                              onValueChange={(value) =>
                                handlePromotionFieldChange(
                                  "discount.type",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                              <SelectContent>
                                {DISCOUNT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type === "PERCENTAGE"
                                      ? "Percentage Discount"
                                      : "Fixed Amount Discount"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="discount-value">
                              Discount Value{" "}
                              {newPromotion.discount.type === "PERCENTAGE"
                                ? "(%)"
                                : "(₹)"}
                            </Label>
                            <Input
                              id="discount-value"
                              type="number"
                              value={newPromotion.discount.value}
                              onChange={(e) =>
                                handlePromotionFieldChange(
                                  "discount.value",
                                  Number(e.target.value)
                                )
                              }
                              placeholder={`Enter discount ${newPromotion.discount.type === "PERCENTAGE" ? "percentage" : "amount"}`}
                              onFocus={(e) => e.target.select()}
                            />
                          </div>

                          {newPromotion.discount.type === "PERCENTAGE" && (
                            <div>
                              <Label htmlFor="max-discount">
                                Maximum Discount Amount (₹)
                              </Label>
                              <Input
                                id="max-discount"
                                type="number"
                                value={newPromotion.discount.maxDiscount}
                                onChange={(e) =>
                                  handlePromotionFieldChange(
                                    "discount.maxDiscount",
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="Enter maximum discount (-1 for no cap)"
                                onFocus={(e) => e.target.select()}
                              />
                              <p className="text-sm text-gray-500 mt-1">
                                Enter -1 for no maximum cap
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetPromotionForm}
                        >
                          Reset
                        </Button>
                        <Button
                          type="button"
                          onClick={addPromotion}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Promotion
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Existing Promotions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-green-800">
                        Current Promotions ({promotions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {promotions.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                          <p>
                            No promotions created yet. Add your first promotion
                            above.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {promotions.map((promotion, index) => {
                            const { requirementText, discountText } =
                              formatPromotionText(promotion);
                            const isEditing = editingIndex === index;

                            return (
                              <Card
                                key={index}
                                className="border border-gray-200"
                              >
                                <CardContent className="p-4">
                                  {isEditing ? (
                                    // Edit Mode
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>Requirement Type</Label>
                                        <Select
                                          value={
                                            editingPromotion?.requirement.type
                                          }
                                          onValueChange={(value) => {
                                            if (editingPromotion) {
                                              if (value === "AMOUNT") {
                                                setEditingPromotion({
                                                  ...editingPromotion,
                                                  requirement: {
                                                    type: value,
                                                    paymentType:
                                                      editingPromotion
                                                        .requirement
                                                        .paymentType ||
                                                      "PRE_PAID",
                                                    minimumOrderAmount:
                                                      editingPromotion
                                                        .requirement
                                                        .minimumOrderAmount ||
                                                      0,
                                                  },
                                                });
                                              }
                                            }
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {REQUIREMENT_TYPES.map((type) => (
                                              <SelectItem
                                                key={type}
                                                value={type}
                                              >
                                                {type === "AMOUNT"
                                                  ? "Minimum Order Amount"
                                                  : "Payment Type"}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {editingPromotion?.requirement.type ===
                                        "PAYMENT_TYPE" && (
                                        <div className="space-y-2">
                                          <Label>Payment Type</Label>
                                          <Select
                                            value={
                                              editingPromotion.requirement
                                                .paymentType || ""
                                            }
                                            onValueChange={(value) => {
                                              if (editingPromotion) {
                                                setEditingPromotion({
                                                  ...editingPromotion,
                                                  requirement: {
                                                    ...editingPromotion.requirement,
                                                    paymentType: value,
                                                  },
                                                });
                                              }
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {PAYMENT_TYPES.map((type) => (
                                                <SelectItem
                                                  key={type}
                                                  value={type}
                                                >
                                                  {type === "PRE_PAID"
                                                    ? "PRE_PAID"
                                                    : "CASH_ON_DELIVERY"}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        <Label>Minimum Order Amount (₹)</Label>
                                        <Input
                                          type="number"
                                          value={
                                            editingPromotion?.requirement
                                              .minimumOrderAmount
                                          }
                                          onChange={(e) => {
                                            if (editingPromotion) {
                                              setEditingPromotion({
                                                ...editingPromotion,
                                                requirement: {
                                                  ...editingPromotion.requirement,
                                                  minimumOrderAmount: Number(
                                                    e.target.value
                                                  ),
                                                },
                                              });
                                            }
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Discount Type</Label>
                                        <Select
                                          value={
                                            editingPromotion?.discount.type
                                          }
                                          onValueChange={(value) => {
                                            if (editingPromotion) {
                                              setEditingPromotion({
                                                ...editingPromotion,
                                                discount: {
                                                  ...editingPromotion.discount,
                                                  type: value,
                                                },
                                              });
                                            }
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {DISCOUNT_TYPES.map((type) => (
                                              <SelectItem
                                                key={type}
                                                value={type}
                                              >
                                                {type === "PERCENTAGE"
                                                  ? "Percentage Discount"
                                                  : "Fixed Amount Discount"}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>
                                          Discount Value{" "}
                                          {editingPromotion?.discount.type ===
                                          "PERCENTAGE"
                                            ? "(%)"
                                            : "(₹)"}
                                        </Label>
                                        <Input
                                          type="number"
                                          value={
                                            editingPromotion?.discount.value
                                          }
                                          onChange={(e) => {
                                            if (editingPromotion) {
                                              setEditingPromotion({
                                                ...editingPromotion,
                                                discount: {
                                                  ...editingPromotion.discount,
                                                  value: Number(e.target.value),
                                                },
                                              });
                                            }
                                          }}
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </div>

                                      {editingPromotion?.discount.type ===
                                        "PERCENTAGE" && (
                                        <div className="space-y-2">
                                          <Label>
                                            Maximum Discount Amount (₹)
                                          </Label>
                                          <Input
                                            type="number"
                                            value={
                                              editingPromotion.discount
                                                .maxDiscount
                                            }
                                            onChange={(e) => {
                                              if (editingPromotion) {
                                                setEditingPromotion({
                                                  ...editingPromotion,
                                                  discount: {
                                                    ...editingPromotion.discount,
                                                    maxDiscount: Number(
                                                      e.target.value
                                                    ),
                                                  },
                                                });
                                              }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                          />
                                        </div>
                                      )}

                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={saveEditedPromotion}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <Save className="mr-2 h-3 w-3" />
                                          Save
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={cancelEditPromotion}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    // View Mode
                                    <div>
                                      <div className="flex justify-between items-start mb-3">
                                        <Badge
                                          variant="secondary"
                                          className="bg-blue-100 text-blue-800"
                                        >
                                          {promotion.requirement.type}
                                        </Badge>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              startEditPromotion(index)
                                            }
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() =>
                                              deletePromotion(index)
                                            }
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <p className="font-semibold text-red-600 text-lg">
                                          {discountText}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {requirementText}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Close
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOutlet;
