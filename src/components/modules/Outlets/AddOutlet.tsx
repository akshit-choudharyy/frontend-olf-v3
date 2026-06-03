import React, { useState, useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { olfService } from "@/utils/axiosInstance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, X, Edit, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster, toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

// Weekday options for weekly closure
const weekdays = [
  { id: "SUN", label: "Sunday" },
  { id: "MON", label: "Monday" },
  { id: "TUE", label: "Tuesday" },
  { id: "WED", label: "Wednesday" },
  { id: "THU", label: "Thursday" },
  { id: "FRI", label: "Friday" },
  { id: "SAT", label: "Saturday" },
];

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

interface DiscountDetails {
  type: "PERCENTAGE" | "FIXED" | string;
  value: number;
  maxDiscount: number;
}

interface Promotion {
  requirement: DiscountRequirement;
  discount: DiscountDetails;
}

// Initial form state
const initialFormState = {
  outlet_name: "",
  order_timing: "30", // Default 30 minutes
  min_order_amount: 0,
  opening_time: "08:00",
  closing_time: "22:00",
  delivery_charges: null,
  prepaid: true,
  address: "",
  city: "",
  state: "",
  company_name: "",
  vendor_pan_number: "",
  gst: "",
  fssai: "",
  fssai_valid: "",
  closing_period: null,
  logo_image: "",
  email: "",
  phone: "",
  rlname: "olf stores",
  rlemail: "contact@olfstores.com",
  rlphone: "9522996999",
  alternative_phones: [] as string[],
  tags: "",
  station_name: "",
  station_code: "",
  station_id: null,
  vendor_name: "",
  vendor_id: 0,
  status: 1, // Default to active
  verified: 0,
  updated_by: null,
  updated_at: null,
  promotions: [] as Promotion[], // Add promotions to form state
};

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

interface AddOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationCode: string; // Station code passed from route (e.g. "ANG")
  vendorId: number;
  onSuccess?: () => void;
}

// Button component to open the dialog
export const AddOutletButton: React.FC<{
  stationId: string;
  vendorId: number;
  onSuccess?: () => void;
  className?: string;
}> = ({ stationId, vendorId, onSuccess, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={`bg-green-600 hover:bg-green-700 text-white ${className || ""}`}
      >
        <Plus className="mr-2 h-4 w-4" /> Add New Outlet
      </Button>

      <AddOutlet
        open={open}
        onOpenChange={setOpen}
        stationCode={stationId}
        vendorId={vendorId}
        onSuccess={onSuccess}
      />
    </>
  );
};

const AddOutlet: React.FC<AddOutletDialogProps> = ({
  open,
  onOpenChange,
  stationCode,
  vendorId,
  onSuccess,
}) => {
  // State for form data
   const queryClient = useQueryClient(); 
  const { data: stationdata } = useQuery({
    queryKey: ["station", stationCode],
    queryFn: () =>
      olfService
        .get("/stations", { params: { station_code: stationCode } })
        .then((res) => {
          console.log("RAW API RESPONSE for station:", res);
          if (!res.data || res.data.status !== 1) {
            throw new Error("Unexpected response status");
          }
          const station = res?.data?.data?.rows?.[0] || res?.data?.data;
          return station || null;
        }),
    enabled: !!stationCode,
  });

  const userdata = localStorage.getItem("persist:root");
  const parsedData = userdata ? JSON.parse(userdata) : null;
  const user = JSON.parse(parsedData.auth).user;

  const [formData, setFormData] = useState<any>({
    ...initialFormState,
    station_code: stationCode,
    vendor_id: vendorId,
    updated_by: user?.name,
    updated_at: format(new Date(), "yyyy-MM-dd HH:mm"),
  });

  useEffect(() => {
    if (stationdata) {
      setFormData((prevFormData: any) => ({
        ...prevFormData,
        station_name: stationdata.station_name,
        station_code: stationdata.station_code,
        station_id: stationdata.station_id,
      }));
    }
  }, [stationdata]);

  // Form error state
  const [errors, setErrors] = useState<any>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneInput, setPhoneInput] = useState<any>("");

  // Delivery charges state
  const [limits, setLimits] = useState<any>([]);
  const [newAmount, setNewAmount] = useState<any>("");
  const [newFee, setNewFee] = useState<any>("");
  const [error, setError] = useState<string | null>(null);

  // Offers/Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [newPromotion, setNewPromotion] = useState<Promotion>(
    initialPromotionState
  );
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [vendorSelectionMode, setVendorSelectionMode] = useState<
    "select" | "create"
  >("select");
  // const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [isVendorPopoverOpen, setIsVendorPopoverOpen] = useState(false);

  const handleVendorModeChange = (mode: "select" | "create") => {
    setVendorSelectionMode(mode);
    if (mode === "create") {
      // If switching to create, clear the selected vendor
      setFormData((prev: any) => ({ ...prev, vendor_id: 0 }));
    } else {
      // If switching to select, clear the new vendor form
      setvendorform({
        vendor_name: "",
        vendor_phone: "",
        vendor_email: "",
        vendor_address: "",
      });
    }
  };

  const { data: allVendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: () =>
      olfService.get("/rest-vendor").then((res) => {
        if (!res.data || res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return res.data.data.rows || [];
      }),
  });

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

  // Define steps for our multi-step form (added "offers")
  const steps = ["vendor", "basic", "business", "orders", "offers"];

  // Function to go to next step
  const goToNextStep = () => {
    const currentTabIndex = steps.indexOf(steps[currentStep]);
    if (currentTabIndex < steps.length - 1) {
      setCurrentStep(currentTabIndex + 1);
    }
  };

  // Function to go to previous step
  const goToPreviousStep = () => {
    const currentTabIndex = steps.indexOf(steps[currentStep]);
    if (currentTabIndex > 0) {
      setCurrentStep(currentTabIndex - 1);
    }
  };

  const [selectedTags, setSelectedTags] = useState<any>({
    VEG: formData.tags.includes("VEG"),
    "NON VEG": formData.tags.includes("NON VEG"),
  });

  const handleTagChange = (tagName: any) => {
    const updatedSelectedTags = {
      ...selectedTags,
      [tagName]: !selectedTags[tagName],
    };

    setSelectedTags(updatedSelectedTags);

    // Update the formData.tags to be comma-separated
    const newTags = Object.keys(updatedSelectedTags)
      .filter((tag) => updatedSelectedTags[tag])
      .join(",");

    setFormData({
      ...formData,
      tags: newTags,
    });

    // Clear error
    if (errors.tags) {
      setErrors({
        ...errors,
        tags: null,
      });
    }
  };

  // Image handling functions

  // Image handling functions
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData({
          ...formData,
          logo_image: base64String,
        });

        // Clear error if exists
        if (errors.logo_image) {
          setErrors({
            ...errors,
            logo_image: null,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      logo_image: "",
    });

    // Clear the file input
    const fileInput = document.getElementById("logo_image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle form field changes
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    const newValue =
      type === "checkbox"
        ? checked
        : type === "number"
          ? parseFloat(value)
          : value;

    // Use the functional update form
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      [name]: newValue,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Handle select change
  const handleSelectChange = (name: any, value: any) => {
    if (name === "vendor_id") {
      const selectedVendor = allVendors.find((v: any) => v.vendor_id === value);

      setFormData({
        ...formData,
        vendor_id: value,
        vendor_name: selectedVendor ? selectedVendor.vendor_name || "" : "",
        phone: selectedVendor ? selectedVendor.vendor_phone || "" : "",
        email: selectedVendor ? selectedVendor.vendor_email || "" : "",
      });

      if (errors.vendor_id || errors.phone || errors.email) {
        setErrors({
          ...errors,
          vendor_id: null,
          phone: null,
          email: null,
        });
      }
    } else {
      setFormData((prevData: any) => ({
        ...prevData,
        [name]: name === "status" ? parseInt(value) : value,
      }));

      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: null,
        });
      }
    }
  };

  // Function to add phone number
  const addPhoneNumber = () => {
    if (phoneInput && phoneInput?.trim().length >= 10) {
      const currentPhones: any = formData.alternative_phones || [];
      if (!currentPhones?.includes(phoneInput?.trim())) {
        setFormData({
          ...formData,
          alternative_phones: [...currentPhones, phoneInput?.trim()],
        });
        setPhoneInput("");
      }
    }
  };

  // Function to remove phone number
  const removePhoneNumber = (phone: any) => {
    setFormData({
      ...formData,
      alternative_phones: formData.alternative_phones.filter(
        (p: any) => p !== phone
      ),
    });
  };

  // Handle weekly closed days toggle
  const handleWeekdayToggle = (day: any, checked: any) => {
    const currentweeklyclosed: any = formData?.weeklyclosed || [];

    setFormData({
      ...formData,
      weeklyclosed: checked
        ? [...currentweeklyclosed, day]
        : currentweeklyclosed.filter((d: any) => d !== day),
    });
  };

  // Promotion/Offer handling functions
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
    // Validation
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

    // Add promotion
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

    // Validation for edited promotion
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

  // Validate current step
  const validateStep = (e: any) => {
    e.preventDefault();
    const newErrors: any = {};
    let isValid: any = true;

    switch (steps[currentStep]) {
      // ADD THIS NEW VALIDATION CASE
      case "vendor":
        if (!formData.vendor_id || formData.vendor_id <= 0) {
          toast.error("Please select or create a vendor before continuing.");
          isValid = false;
        }
        break;

      case "basic":
        if (!formData.outlet_name || formData.outlet_name.length < 2) {
          newErrors.outlet_name = "Outlet name must be at least 2 characters.";
          isValid = false;
        }
        if (!formData.company_name || formData.company_name.length < 2) {
          newErrors.company_name =
            "Company name must be at least 2 characters.";
          isValid = false;
        }
        if (!formData.address || formData.address.length < 5) {
          newErrors.address = "Address must be at least 5 characters.";
          isValid = false;
        }
        if (!formData.city || formData.city.length < 2) {
          newErrors.city = "City must be at least 2 characters.";
          isValid = false;
        }
        if (!formData.state || formData.state.length < 2) {
          newErrors.state = "State must be at least 2 characters.";
          isValid = false;
        }

        if (!formData.rlphone || formData.rlphone.length < 10) {
          newErrors.admin_phone =
            "Relationship manager phone number must be at least 10 digits.";
          isValid = false;
        }
        if (
          !formData.rlemail ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.rlemail)
        ) {
          newErrors.rlemail = "Please enter a valid email address.";
          isValid = false;
        }
        break;

      case "business":
        if (!formData.gst) {
          newErrors.gst = "GST number is required.";
          isValid = false;
        }
        if (!formData.fssai) {
          newErrors.fssai = "FSSAI license is required.";
          isValid = false;
        }
        if (!formData.fssai_valid) {
          newErrors.fssai_valid = "FSSAI validity date is required.";
          isValid = false;
        }
        break;

      case "orders":
        if (!formData.opening_time) {
          newErrors.opening_time = "Opening time is required.";
          isValid = false;
        }
        if (!formData.closing_time) {
          newErrors.closing_time = "Closing time is required.";
          isValid = false;
        }
        if (formData.min_order_amount < 0) {
          newErrors.min_order_amount = "Amount must be non-negative.";
          isValid = false;
        }
        if (formData.delivery_charges < 0) {
          newErrors.delivery_charges = "Charges must be non-negative.";
          isValid = false;
        }
        break;

      case "offers":
        // Offers are optional, so no validation needed
        break;
    }

    setErrors(newErrors);

    if (isValid) {
      goToNextStep();
    }

    return isValid;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a copy of the form data to clean it before sending.
      const cleanPayload = { ...formData };

      // --- FINAL SANITIZATION LOGIC ---
      // This block ensures every field matches the database schema.

      // 1. Handle fields that are NUMERIC in the database.
      // If they are empty strings, they MUST be sent as `null`.
      // Otherwise, convert them to numbers.
      const numericFields = [
        "fssai",
        "phone",
        "rlphone",
        "min_order_amount",
        "order_timing",
        "status",
        "station_id",
      ];
      numericFields.forEach((field) => {
        if (cleanPayload[field] === "" || cleanPayload[field] === undefined) {
          cleanPayload[field] = null;
        } else {
          cleanPayload[field] = Number(cleanPayload[field]);
        }
      });

      // --- ADD THIS FIX FOR alternative_phones ---
      // Since the DB column is a single numeric, we cannot send an array.
      // We will send the first number in the array, or null if it's empty.
      if (
        cleanPayload.alternative_phones &&
        cleanPayload.alternative_phones.length > 0
      ) {
        cleanPayload.alternative_phones = Number(
          cleanPayload.alternative_phones[0]
        );
      } else {
        cleanPayload.alternative_phones = null;
      }

      // 4. Prepare the final object to be sent to the API.
      const submitData = {
        ...cleanPayload,
        delivery_charges: JSON.stringify(limits),
        promotions: { promotions },
      };

      // --- END OF FINAL SANITIZATION ---

      await olfService.post("/restraunt", submitData);

      toast("Outlet added successfully!", {
        style: { borderRadius: "10px", background: "black", color: "white" },
        duration: 4000,
      });

      // Reset form and close dialog
      setFormData({
        ...initialFormState,
        station_code: stationCode,
        vendor_id: vendorId,
      });
      setLimits([]);
      setPromotions([]);
      setCurrentStep(0);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding outlet:", error);
      toast(`Error adding outlet!`, {
        style: { borderRadius: "10px", background: "wheat", color: "red" },
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display error message
  const ErrorMessage: React.FC<{ name: string }> = ({ name }) => {
    return errors[name] ? (
      <p className="text-sm font-medium text-red-500 mt-1">{errors[name]}</p>
    ) : null;
  };

  const [vendorform, setvendorform] = useState<any>({
    vendor_name: "",
    vendor_phone: "",
    vendor_email: "",
    vendor_address: "",
  });

  // Handle form submission
  // Inside your AddOutlet component

  const handlevendorsubmit = async (e: any) => {
    e.preventDefault();
    if (!vendorform.vendor_name || !vendorform.vendor_phone) {
      toast.error("Vendor Name and Phone are required.");
      return;
    }

    try {
      const payload = {
        vendor_name: vendorform.vendor_name,
        vendor_phone: vendorform.vendor_phone,
        vendor_email: vendorform.vendor_email,
        vendor_address: vendorform.vendor_address,
      };

      const response = await olfService.post("/rest-vendor", payload);

      if (response.data && response.data.status === 1) {
        // --- THIS IS THE FINAL FIX ---

        // 1. Correctly extract the new ID from the response path.
        const newVendorId = response.data?.data?.rows?.[0]?.id;

        // 2. Validate that we actually received an ID.
        if (!newVendorId) {
          throw new Error(
            "API reported success but did not return the new vendor ID."
          );
        }
        await queryClient.invalidateQueries({ queryKey: ["vendors"] }); 

        // 3. Update the main form state using the new ID from the response
        //    and the vendor details we already have in the `vendorform` state.
        setFormData((prevFormData: any) => ({
          ...prevFormData,
          vendor_id: newVendorId,
          vendor_name: vendorform.vendor_name, // Use the name from the form
          phone: vendorform.vendor_phone, // Use the phone from the form
          email: vendorform.vendor_email, // Use the email from the form
        }));

        toast.success("Vendor added successfully!");
        setCurrentStep(1); // Move to the next tab
      } else {
        const errorInfo = response.data?.info || "An unknown error occurred.";
        throw new Error(errorInfo);
      }
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error(
        `Failed to add vendor: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          style: {
            borderRadius: "10px",
            background: "black",
            color: "red",
          },
          duration: 5000,
        }
      );
    }
  };

  console.log(formData.vendor_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-800">
            Add New Outlet
          </DialogTitle>
          <DialogDescription>
            Fill in the outlet information across all tabs. All fields marked
            with * are required.
          </DialogDescription>
        </DialogHeader>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "green",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: "red",
              },
            },
          }}
        />
        <form onSubmit={handleSubmit}>
          <Tabs
            value={steps[currentStep]}
            onValueChange={(value) => setCurrentStep(steps.indexOf(value))}
          >
            <TabsList className="w-full">
              <TabsTrigger value="vendor">Vendor Info</TabsTrigger>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="orders">Order Settings</TabsTrigger>
              <TabsTrigger value="offers">Offers & Promotions</TabsTrigger>
            </TabsList>

            <TabsContent value="vendor">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* STEP 3.1: Add Radio Buttons to choose the mode */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="selectVendor"
                        name="vendorMode"
                        value="select"
                        checked={vendorSelectionMode === "select"}
                        onChange={() => handleVendorModeChange("select")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="selectVendor" className="font-semibold">
                        Select Existing Vendor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="createVendor"
                        name="vendorMode"
                        value="create"
                        checked={vendorSelectionMode === "create"}
                        onChange={() => handleVendorModeChange("create")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="createVendor" className="font-semibold">
                        Create New Vendor
                      </Label>
                    </div>
                  </div>

                  {/* STEP 3.2: Conditionally enable the Select dropdown */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="vendor">
                      Select Vendor*
                    </label>
                    <Popover
                      open={isVendorPopoverOpen}
                      onOpenChange={setIsVendorPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isVendorPopoverOpen}
                          className="w-full justify-between"
                          disabled={vendorSelectionMode !== "select"}
                        >
                          Select Vendor
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search vendor by name or phone..." />
                          <CommandEmpty>No vendor found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {allVendors.map((vendor: any) => (
                              <CommandItem
                                key={vendor.vendor_id}
                                value={`${vendor.vendor_name} ${vendor.vendor_phone}`} // This value is used for searching
                                onSelect={() => {
                                  handleSelectChange(
                                    "vendor_id",
                                    vendor.vendor_id
                                  );
                                  setIsVendorPopoverOpen(false);
                                }}
                              >
                                  {vendor.vendor_name} ({vendor.vendor_phone || 'No Phone'})
  {vendor.vendor_email ? ` - ${vendor.vendor_email}` : ''}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* A visual separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  {/* STEP 3.3: Conditionally render the New Vendor form */}
                  {vendorSelectionMode === "create" && (
                    <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
                      <h3 className="text-lg font-semibold text-gray-700">
                        New Vendor Details
                      </h3>
                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="vendor_name"
                        >
                          Vendor Name*
                        </label>
                        <Input
                          id="vendor_name"
                          name="vendor_name"
                          value={vendorform.vendor_name}
                          onChange={(e) =>
                            setvendorform({
                              ...vendorform,
                              vendor_name: e.target.value,
                            })
                          }
                          placeholder="Enter vendor name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="vendor_phone"
                        >
                          Vendor Phone*
                        </label>
                        <Input
                          id="vendor_phone"
                          name="vendor_phone"
                          value={vendorform.vendor_phone}
                          onChange={(e) =>
                            setvendorform({
                              ...vendorform,
                              vendor_phone: e.target.value,
                            })
                          }
                          placeholder="Enter vendor phone number"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="vendor_email"
                        >
                          Vendor Email*
                        </label>
                        <Input
                          id="vendor_email"
                          name="vendor_email"
                          type="email"
                          value={vendorform.vendor_email} // Corrected from vendorform.email
                          onChange={(e) =>
                            setvendorform({
                              ...vendorform,
                              vendor_email: e.target.value,
                            })
                          }
                          placeholder="Enter vendor email"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="vendor_address"
                        >
                          Vendor Address*
                        </label>
                        <Input
                          id="vendor_address"
                          name="vendor_address"
                          value={vendorform.vendor_address} // Corrected from vendorform.address
                          onChange={(e) =>
                            setvendorform({
                              ...vendorform,
                              vendor_address: e.target.value,
                            })
                          }
                          placeholder="Enter vendor address"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={(e) => handlevendorsubmit(e)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Create Vendor & Proceed
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        After creating the vendor, you will be moved to the next
                        step.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="outlet_name"
                      >
                        Outlet Name*
                      </label>
                      <Input
                        id="outlet_name"
                        name="outlet_name"
                        value={formData.outlet_name}
                        onChange={handleChange}
                        placeholder="Enter outlet name"
                      />
                      <ErrorMessage name="outlet_name" />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="company_name"
                      >
                        Company Name*
                      </label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Enter company name"
                      />
                      <ErrorMessage name="company_name" />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="logo_image"
                      >
                        Logo Image
                      </label>
                      <div className="space-y-3">
                        <Input
                          id="logo_image"
                          name="logo_image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                        {formData.logo_image && (
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
                                src={formData.logo_image}
                                alt="Logo preview"
                                className="max-w-32 max-h-32 object-contain mx-auto rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <ErrorMessage name="logo_image" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="tag-veg"
                            checked={selectedTags.VEG}
                            onChange={() => handleTagChange("VEG")}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="tag-veg"
                            className="ml-2 text-sm text-gray-700"
                          >
                            VEG
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="tag-nonveg"
                            checked={selectedTags["NON VEG"]}
                            onChange={() => handleTagChange("NON VEG")}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="tag-nonveg"
                            className="ml-2 text-sm text-gray-700"
                          >
                            NON VEG
                          </label>
                        </div>
                      </div>
                      <ErrorMessage name="tags" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium" htmlFor="address">
                        Address*
                      </label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter full address"
                      />
                      <ErrorMessage name="address" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="city">
                        City*
                      </label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter city"
                      />
                      <ErrorMessage name="city" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="state">
                        State*
                      </label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Enter state"
                      />
                      <ErrorMessage name="state" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="rlemail">
                        Relationship Manager Email*
                      </label>
                      <Input
                        id="rlemail"
                        name="rlemail"
                        value={formData.rlemail}
                        onChange={handleChange}
                        placeholder="Enter relationship manager's email"
                      />
                      <ErrorMessage name="rlemail" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="rlphone">
                        Relationship Manager Phone*
                      </label>
                      <Input
                        id="rlphone"
                        name="rlphone"
                        value={formData.rlphone}
                        onChange={handleChange}
                        placeholder="Enter relationship manager's phone number"
                      />
                      <ErrorMessage name="rlphone" />
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-medium">
                        Alternative Phones
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.alternative_phones?.map((phone: any) => (
                          <Badge
                            key={phone}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {phone}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="p-0 h-4 w-4"
                              onClick={() => removePhoneNumber(phone)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="Enter phone number"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addPhoneNumber}
                          variant="secondary"
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Add multiple phone numbers
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Details Tab */}
            <TabsContent value="business">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="vendor_pan_number"
                      >
                        PAN Number
                      </label>
                      <Input
                        id="vendor_pan_number"
                        name="vendor_pan_number"
                        value={formData.vendor_pan_number}
                        onChange={handleChange}
                        placeholder="Enter PAN number"
                      />
                      <ErrorMessage name="vendor_pan_number" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="gst">
                        GST Number*
                      </label>
                      <Input
                        id="gst"
                        name="gst"
                        value={formData.gst}
                        onChange={handleChange}
                        placeholder="Enter GST number"
                      />
                      <ErrorMessage name="gst" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="fssai">
                        FSSAI License*
                      </label>
                      <Input
                        id="fssai"
                        name="fssai"
                        value={formData.fssai}
                        onChange={handleChange}
                        placeholder="Enter FSSAI license number"
                      />
                      <ErrorMessage name="fssai" />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="fssai_valid"
                      >
                        FSSAI Valid Till*
                      </label>
                      <div
                        className="relative cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById(
                            "fssai_valid"
                          ) as HTMLInputElement | null;
                          if (input && typeof input.showPicker === "function") {
                            input.showPicker();
                          }
                        }}
                      >
                        <Input
                          id="fssai_valid"
                          name="fssai_valid"
                          type="date"
                          value={formData.fssai_valid}
                          onChange={handleChange}
                          placeholder="Select date"
                          className="cursor-pointer"
                        />
                      </div>
                      <ErrorMessage name="fssai_valid" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order Settings Tab */}
            <TabsContent value="orders">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="opening_time"
                      >
                        Opening Time*
                      </label>
                      <div
                        className="relative cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById(
                            "opening_time"
                          ) as HTMLInputElement | null;
                          if (input && typeof input.showPicker === "function") {
                            input.showPicker();
                          }
                        }}
                      >
                        <Input
                          id="opening_time"
                          name="opening_time"
                          type="time"
                          value={formData.opening_time}
                          onChange={handleChange}
                          placeholder="Select time"
                          className="cursor-pointer"
                        />
                      </div>
                      <ErrorMessage name="opening_time" />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="closing_time"
                      >
                        Closing Time*
                      </label>
                      <div
                        className="relative cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById(
                            "closing_time"
                          ) as HTMLInputElement | null;
                          if (input && typeof input.showPicker === "function") {
                            input.showPicker();
                          }
                        }}
                      >
                        <Input
                          id="closing_time"
                          name="closing_time"
                          type="time"
                          value={formData.closing_time}
                          onChange={handleChange}
                          placeholder="Select time"
                          className="cursor-pointer"
                        />
                      </div>
                      <ErrorMessage name="closing_time" />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="order_timing"
                      >
                        Order Preparation Time (minutes)*
                      </label>
                      <Input
                        id="order_timing"
                        name="order_timing"
                        type="number"
                        value={formData.order_timing}
                        onChange={handleChange}
                        placeholder="Enter preparation time in minutes"
                      />
                      <ErrorMessage name="order_timing" />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="min_order_amount"
                      >
                        Minimum Order Amount (₹)*
                      </label>
                      <Input
                        id="min_order_amount"
                        name="min_order_amount"
                        type="number"
                        value={formData.min_order_amount}
                        onChange={handleChange}
                        placeholder="Enter minimum order amount"
                      />
                      <ErrorMessage name="min_order_amount" />
                    </div>

                    <Card className="max-w-md mx-auto">
                      <CardHeader className="pb-2">
                        <CardTitle>Delivery Fee Limits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {limits.length > 0 && (
                          <div className="mb-4 border rounded-md">
                            <div className="grid grid-cols-12 border-b p-2 bg-muted">
                              <div className="col-span-5 font-medium">
                                Amount
                              </div>
                              <div className="col-span-5 font-medium">Fee</div>
                              <div className="col-span-2"></div>
                            </div>
                            <div className="divide-y">
                              {limits.map((limit: any, index: any) => (
                                <div
                                  key={index}
                                  className="grid grid-cols-12 p-2 items-center"
                                >
                                  <div className="col-span-5">
                                    {limit.amountMoreThan}
                                  </div>
                                  <div className="col-span-5">
                                    {limit.deliveryFee}
                                  </div>
                                  <div className="col-span-2 flex justify-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeLimit(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Fee"
                            value={newFee}
                            onChange={(e) => setNewFee(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={(e) => addLimit(e)} size="icon">
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

                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <label className="text-base">
                          Accept Prepaid Orders
                        </label>
                        <p className="text-sm text-gray-500">
                          Allow customers to pay online during order placement
                        </p>
                      </div>
                      <Switch
                        id="prepaid"
                        name="prepaid"
                        checked={formData.prepaid}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            prepaid: checked,
                          });
                        }}
                      />
                    </div>

                    <div className="col-span-2 border rounded-lg p-4">
                      <label className="text-base font-medium">
                        Weekly Closing Days
                      </label>
                      <p className="text-sm text-gray-500 mb-3">
                        Select days when the outlet is closed
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {weekdays.map((day) => (
                          <div
                            key={day.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <Checkbox
                              id={`day-${day.id}`}
                              checked={formData.weeklyclosed?.includes(day.id)}
                              onCheckedChange={(checked) =>
                                handleWeekdayToggle(day.id, checked)
                              }
                            />
                            <label
                              htmlFor={`day-${day.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {day.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Offers & Promotions Tab */}
            <TabsContent value="offers">
              <div className="space-y-6">
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
                              value={newPromotion.requirement.paymentType || ""}
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
                            value={newPromotion.requirement.minimumOrderAmount}
                            onChange={(e) =>
                              handlePromotionFieldChange(
                                "requirement.minimumOrderAmount",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Enter minimum order amount"
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
                              handlePromotionFieldChange("discount.type", value)
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
                                                  minimumOrderAmount:
                                                    editingPromotion.requirement
                                                      .minimumOrderAmount || 0,
                                                },
                                              });
                                            } else if (
                                              value === "PAYMENT_TYPE"
                                            ) {
                                              setEditingPromotion({
                                                ...editingPromotion,
                                                requirement: {
                                                  type: value,
                                                  paymentType:
                                                    editingPromotion.requirement
                                                      .paymentType ||
                                                    "PRE_PAID",
                                                  minimumOrderAmount:
                                                    editingPromotion.requirement
                                                      .minimumOrderAmount || 0,
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
                                            <SelectItem key={type} value={type}>
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
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Discount Type</Label>
                                      <Select
                                        value={editingPromotion?.discount.type}
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
                                            <SelectItem key={type} value={type}>
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
                                        value={editingPromotion?.discount.value}
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
                                          onClick={() => deletePromotion(index)}
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
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                className="mr-auto"
              >
                Previous
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={(e) => validateStep(e)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Outlet"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOutlet;
