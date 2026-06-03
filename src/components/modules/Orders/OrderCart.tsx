import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import eatingImg from "@/assets/images/eating.png";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MinusCircle,
  PlusCircle,
  ShoppingCart,
  Search,
  Leaf,
  ArrowLeft,
} from "lucide-react";
import { olfService } from "@/utils/axiosInstance";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

// Define types
interface DishItem {
  item_id: number;
  item_name: string;
  base_price: number;
  status: number;
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
  tax: number; // We'll ignore this and use hardcoded tax
}

interface CartItem extends DishItem {
  quantity: number;
}

// Extract all unique food types from menu items
const getFoodTypes = (items: DishItem[]): string[] => {
  const typesSet = new Set<string>();
  items.forEach((item) => typesSet.add(item.food_type));
  return Array.from(typesSet);
};

// Component props
interface FoodCartProps {
  outletdata: any;
  setshowCart: any;
  trainNumber: any;
  selectedStation: any;
  coachNumber: any;
  berthNumber: any;
  pnrdetails: any;
  selectedStationName: any;
  date: any;
  time: any;
  pnrNumber: any;
  selectstationdata: any;
  trainName: any;
}

// Hardcoded tax rate (5%)
const TAX_RATE = 5;
const OrderCart: React.FC<FoodCartProps> = ({
  outletdata,
  setshowCart,
  trainNumber,
  selectedStation,
  coachNumber,
  berthNumber,
  pnrdetails,
  date,
  time,
  pnrNumber,
  selectedStationName,
  selectstationdata,
  trainName,
}) => {
  // State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string>("all"); // Changed to 'all' instead of empty string
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dietFilter, setDietFilter] = useState<string>("all"); // 'all', 'veg', 'nonveg'
  const [isConfirming, setIsConfirming] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    mobile: "",
    customerName: "",
    alternateMobile: "",
  });

  console.log(pnrdetails);
  const [comment, setcomment] = useState("");
  // Query to fetch menu items
  const {
    isPending,
    error: queryError,
    data: menuItems,
  } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () =>
      olfService
        .get("/dishes", { params: { outlet_id: outletdata?.outlet_id } })
        .then((res: any) => {
          return res.data.data.rows;
        }),
  });

  console.log(outletdata);
  console.log(cartItems);

  console.log(date);

  function formatDate(date: any) {
    if (!date) return null;
    // Convert input to Date object
    const dated = new Date(date);

    // Check if the date is valid
    if (isNaN(dated.getTime())) {
      return "Invalid date";
    }

    // Get year, month, and day
    const year = dated.getFullYear();
    const month = String(dated.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const day = String(dated.getDate()).padStart(2, "0");

    // Return formatted date
    return `${year}-${month}-${day}`;
  }
  function generateRandom10DigitNumber() {
    // Start with 1-9 to ensure we get a full 10 digits
    const firstDigit = Math.floor(Math.random() * 9) + 1;

    // Generate the remaining 9 digits (0-9)
    let remainingDigits = "";
    for (let i = 0; i < 9; i++) {
      remainingDigits += Math.floor(Math.random() * 10);
    }

    // Combine and return the result
    return parseInt(firstDigit + remainingDigits);
  }

  console.log(selectstationdata);
  const handleSubmitOrder = async (orderid: any) => {
    // Validate mobile number (basic validation)
    if (!customerDetails.mobile || customerDetails.mobile.length < 10) {
      // You can add more sophisticated validation if needed
      alert("Please enter a valid mobile number");
      return;
    }

    if (!customerDetails.customerName) {
      alert("Please enter your name");
      return;
    }
    function formatCurrentDateTime() {
      const now = new Date();

      // Get components
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const year = now.getFullYear();

      // Get time
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      // Format as "MM-DD-YYYY HH:MM IST"
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    // Function to format delivery date and time
    function formatDeliveryDateTime(dateStr: any, timeStr: any) {
      if (!dateStr || !timeStr) return "";

      const deliveryDate = new Date(dateStr);

      // Get components
      const month = String(deliveryDate.getMonth() + 1).padStart(2, "0");
      const day = String(deliveryDate.getDate()).padStart(2, "0");
      const year = deliveryDate.getFullYear();

      // Format as "MM-DD-YYYY HH:MM"
      return `${month}-${day}-${year} ${timeStr}`;
    }
    const userdata = localStorage.getItem("persist:root");
    const parsedData = userdata ? JSON.parse(userdata) : null;
    const user = JSON.parse(parsedData.auth).user;

    const formattedOrderData = {
      gross_value: calculateTotal(),
      tax: calculateTax(),
      outlet_id: outletdata?.outlet_id,
      oid: orderid,
      updated_by: user?.name,
      mode: "PRE_PAID",
      status: "ORDER_PREPARING",
      booked_from: "OLF Panel",
       pushed: 0, 
      delivery_date:
        formatDeliveryDateTime(date, time) ||
        `${selectstationdata?.schArrivalDate} + ${selectstationdata?.schArrivalTime}`,
      created_at: formatCurrentDateTime(),
      updated_at: formatCurrentDateTime(),
      menu_items: {
        items: cartItems.map((item) => ({
          name: item.item_name,
          item_id: item.item_id,
          quantity: item.quantity, // This comes from cartItems, not menuItems
          descriptiom: item.description || "",
          SellingPrice: item.base_price + item.tax,
          isVegetarian: item.is_vegeterian === 1,
        })),
      },
      customer_info: JSON.stringify({
        customerDetails: customerDetails,
      }),
      delivery_details: JSON.stringify({
        deliveryDetails: {
          pnr: pnrNumber || generateRandom10DigitNumber(),
          berth: berthNumber || pnrdetails?.result?.seatInfo?.berth,
          coach: coachNumber || pnrdetails?.result?.seatInfo?.coach,
          station: selectedStationName || pnrdetails?.result?.stations[0]?.name,
          trainNo: trainNumber || pnrdetails?.result?.trainInfo?.trainNo,
          trainName: pnrdetails?.result?.trainInfo?.name || trainName,
          stationCode: selectedStation || outletdata?.station_code,
          passengerCount: pnrdetails?.passengers || 1,
        },
      }),
      discount_amount: null,
      station_code: selectedStation || outletdata?.station_code,
      irctc_discount: null,
      vendor_discount: null,
      comment: comment,
    };

    console.log(formattedOrderData);
    const res = await olfService.post("/order", formattedOrderData);
    if (res?.data?.data?.status == 1) {
      navigate({ to: "/orders" });
    } else {
      alert("fill all details!");
    }
  };
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;

  const handlePushOrderIRCTC = async () => {
    // 1. Prevent execution if already confirming
    if (isConfirming) return;

    // 2. Set loading state
    setIsConfirming(true);

    try {
      const totalSellingAmount = calculateTotalSellingAmount(cartItems);
      const gst = +(totalSellingAmount * 0.05).toFixed(2);

      // --- DATE & TIME LOGIC ---
      let finalDeliveryDate = "";
      if (date && time && !time.includes("--")) {
        finalDeliveryDate = `${formatDate(date)} ${time}`;
      } else {
        finalDeliveryDate = getStationArrival();
      }

      const cleanFssaiDate = formatFssaiDate(outletdata?.fssai_valid);

      const payload = {
        isAdmin: true, 
        alternateMobileNumber: customerDetails?.alternateMobile || "",
        comment: comment || "",
        customer: {
          fullName: customerDetails?.customerName,
          email: "customer@gmail.com",
          mobile: customerDetails?.mobile,
        },
        outlet: {
          id: outletdata?.outlet_id,
          name: outletdata?.outlet_name,
          address: outletdata?.address,
          city: outletdata?.city,
          state: outletdata?.state,
          pinCode: "",
          contactNumbers: outletdata?.rlphone || outletdata?.phone,
          relationshipManagerName: outletdata?.rlname,
          relationshipManagerPhone: outletdata?.rlphone,
          relationshipManagerEmail: outletdata?.rlemail,
          fssaiNumber: outletdata?.fssai,
          fssaiCutOffDate: `${cleanFssaiDate} 00:00 IST`,
          gstNumber: getValidGST(outletdata?.gst),
        },
        bookingDate: `${formattedDateTime} IST`,
        deliveryDate: `${finalDeliveryDate} IST`,
        pnr: pnrNumber?.toString() || generateRandom10DigitNumber().toString(),
        trainNo: trainNumber || pnrdetails?.result?.trainInfo?.trainNo,
        trainName: pnrdetails?.result?.trainInfo?.name || trainName,
        stationCode: selectedStation || outletdata?.station_code || "PNBE",
        stationName: selectedStationName || outletdata?.station_name,
        coach: coachNumber || pnrdetails?.result?.seatInfo?.coach,
        berth: berthNumber || pnrdetails?.result?.seatInfo?.berth,
        totalAmount: +totalSellingAmount.toFixed(2),
        gst: gst,
        deliveryCharge: 0,
        discountAmount: 0,
        amountPayable: +totalSellingAmount.toFixed(2),
        paymentType: outletdata?.prepaid ? "PRE_PAID" : "CASH_ON_DELIVERY",
        orderItems: cartItems?.map((item: any) => {
          const taxRate = (Number(item?.base_price) * 0.05).toFixed(2);
          return {
            itemId: item.item_id,
            itemName: item.item_name,
            description: item.description || "",
            basePrice: item?.base_price,
            sellingPrice: Number(item.base_price) + Number(taxRate),
            taxRate: Number(taxRate),
            isVegetarian: item.is_vegeterian === 1,
            quantity: item.quantity,
            option: "",
          };
        }),
      };

      console.log("Generated Payload:", payload);

      // 3. Call API
      const response = await olfService.post(
        `/create-order-irctc`,
        JSON.stringify(payload)
      );

      if (response?.data?.resdata?.result?.id) {
        // 4. If successful, save to local DB
        await handleSubmitOrder(response?.data?.resdata?.result?.id);
        toast("Order Pushed to IRCTC Successfully!", {
          style: { borderRadius: "10px", background: "black", color: "white" },
          duration: 4000,
        });
        setIsCheckoutOpen(false);
      } else {
        console.error("IRCTC Error:", response);
        toast(response?.data?.message || "Order Pushed to IRCTC Failed!", {
          style: { borderRadius: "10px", background: "black", color: "white" },
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error("API Error:", error);
      toast(`Order Push Failed: ${error.message}`, {
        style: { borderRadius: "10px", background: "wheat", color: "red" },
        duration: 4000,
      });
    } finally {
      // 5. CRITICAL: Reset loading state only when everything is done
      // Note: If handleSubmitOrder navigates away, this might not run, which is fine.
      setIsConfirming(false);
    }
  };

  // Helper function to calculate total selling amount
  const calculateTotalSellingAmount = (items: any[]) => {
    return items.reduce(
      (total, item) =>
        total + (item.base_price + item?.base_price * 0.05) * item.quantity,
      0
    );
  };

  // Set the default to show all menu items
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      // Set the default food type to 'all' to show all items
      setSelectedFoodType("all");
    }
  }, [menuItems]);

  console.log(cartItems);

  // Filter menu items based on selected food type, diet preference, and search query
  const filteredMenuItems =
    menuItems && menuItems.length > 0
      ? menuItems
          .filter(
            (item: any) =>
              selectedFoodType === "all" || item.food_type === selectedFoodType
          )
          .filter((item: any) => {
            if (dietFilter === "all") return true;
            if (dietFilter === "veg") return item.is_vegeterian === 1;
            if (dietFilter === "nonveg") return item.is_vegeterian === 0;
            return true;
          })
          .filter(
            (item: any) =>
              !searchQuery ||
              item.item_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              (item.description &&
                item.description
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()))
          )
      : [];

  // Get quantity of an item in cart
  const getItemQuantityInCart = (itemId: number) => {
    const cartItem = cartItems.find((item) => item.item_id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // helper function
  const formatFssaiDate = (dateString: string) => {
    if (!dateString) return formatDate(new Date()); // Fallback to today

    // If it's already in ISO format, return it
    if (dateString.includes("-")) return dateString.split(" ")[0];

    // Handle "MM/DD/YY" format (e.g., "5/16/27")
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      let year = parts[2];
      // If year is 2 digits (e.g., "27"), make it "2027"
      if (year.length === 2) year = "20" + year;
      // Remove any time parts if present
      year = year.split(" ")[0];

      return `${year}-${month}-${day}`;
    }

    return formatDate(new Date()); // Fallback
  };

  const getValidGST = (gst: string) => {
    if (!gst) return "";

    // --- FIX START ---
    // Explicitly block the known invalid GST from the database
    // This forces it to send "" so the order doesn't fail.
    if (gst === "10ANZOK2367A3Z4") {
      return "";
    }
    // --- FIX END ---

    // Standard GST Regex
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (gstRegex.test(gst)) {
      return gst;
    }

    return "";
  };

  // 2. Helper to extract Date/Time from Station Data (e.g., "2025-11-24 16:50 UTC")
  const getStationArrival = () => {
    // Try to get arrival from the first station in the list or the selectstationdata
    const arrivalStr =
      selectstationdata?.arrival || pnrdetails?.result?.stations?.[0]?.arrival;

    if (arrivalStr) {
      // Extract "2025-11-24 16:50" and remove "UTC"
      return arrivalStr.replace(" UTC", "").replace(" IST", "");
    }

    // Fallback: Current time + 2 hours
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Add an item to the cart
  const addToCart = (item: DishItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find(
        (cartItem) => cartItem.item_id === item.item_id
      );

      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.item_id === item.item_id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Update the quantity of an item in the cart
  const updateCartItemQuantity = (itemId: number, change: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.item_id === itemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0); // Remove items with quantity 0
    });
  };

  // Calculate subtotal for an item
  const getItemSubtotal = (item: CartItem) => {
    return item.base_price * item.quantity;
  };

  // Calculate the cart subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + getItemSubtotal(item), 0);
  };

  // Calculate tax amount (using the hardcoded 5% tax rate)
  const calculateTax = () => {
    return calculateSubtotal() * (TAX_RATE / 100);
  };

  // Calculate the total amount
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Customer details state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Proceed to checkout
  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  // Submit order

  if (isPending)
    return (
      <div className="flex items-center justify-center min-h-32 w-full">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200"></div>
          <div className="text-gray-500">Loading menu items...</div>
        </div>
      </div>
    );

  if (queryError)
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg">
        Error loading menu items. Please try again later.
      </div>
    );

  const foodTypes = getFoodTypes(menuItems || []);

  return (
    <>
      <ArrowLeft size={32} className="m-2" onClick={() => setshowCart(false)} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Menu Section - Takes 2/3 of the space on larger screens */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Menu</CardTitle>
              <CardDescription>
                Browse our delicious selection of dishes
              </CardDescription>

              <div className="pt-4 space-y-4">
                {/* Veg/Non-Veg Filter */}
                <Tabs
                  value={dietFilter}
                  onValueChange={setDietFilter}
                  className="w-full"
                >
                  <TabsList className="w-full md:w-auto grid grid-cols-3">
                    <TabsTrigger value="all" className="px-4">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="veg" className="px-4">
                      <Leaf size={16} className="mr-1 text-green-600" />
                      Veg
                    </TabsTrigger>
                    <TabsTrigger value="nonveg" className="px-4">
                      <span className="mr-1 text-red-600">•</span>
                      Non-Veg
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex flex-col md:flex-row gap-4">
                  {/* Food Type Dropdown */}
                  <Select
                    value={selectedFoodType}
                    onValueChange={setSelectedFoodType}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All food types</SelectItem>
                      {foodTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search Input */}
                  <div className="relative w-full md:max-w-md">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      placeholder="Search dishes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No dishes found. Try changing your filters.
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 py-3 px-4 font-medium text-gray-600 border-b">
                    <div className="col-span-6 md:col-span-5">Description</div>
                    <div className="col-span-2 text-center hidden md:block">
                      Price
                    </div>
                    <div className="col-span-2 text-center hidden md:block">
                      Quantity
                    </div>
                    <div className="col-span-3 text-right md:col-span-3">
                      Subtotal
                    </div>
                  </div>
                  {filteredMenuItems.map((item: any) => {
                    const itemQty = getItemQuantityInCart(item.item_id);
                    const itemSubtotal = itemQty * item.base_price;

                    return (
                      <div
                        key={item.item_id}
                        className="grid grid-cols-12 py-4 px-4 items-center border-b hover:bg-gray-50"
                      >
                        {/* Item details with image */}
                        <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                          <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden shrink-0">
                            <img
                              src={
                                // Check if image exists and isn't the string "NULL"
                                item.image &&
                                item.image !== "NULL" &&
                                item.image !== ""
                                  ? item.image
                                  : eatingImg
                              }
                              alt={item.item_name}
                              className="w-full h-full object-cover"
                              // Fallback: If the URL exists but is broken (404), switch to dummy image
                              onError={(e) => {
                                e.currentTarget.src = eatingImg;
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">
                                {item.item_name}
                              </h3>
                              <Badge
                                className={`h-5 ${item.is_vegeterian ? "bg-green-600" : "bg-red-600"}`}
                              >
                                {item.is_vegeterian ? "Veg" : "Non-veg"}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                                {item.description}
                              </p>
                            )}
                            {/* Mobile price */}
                            <p className="text-sm font-medium mt-1 md:hidden">
                              ₹{item.base_price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Price - Desktop only */}
                        <div className="col-span-2 text-center hidden md:block">
                          <span className="font-medium">
                            ₹{item.base_price.toFixed(2)}
                          </span>
                          <p className="text-xs text-gray-500">
                            +{TAX_RATE}% tax
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="col-span-2 text-center hidden md:flex justify-center">
                          {itemQty > 0 ? (
                            <div className="flex items-center gap-2 border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateCartItemQuantity(item.item_id, -1)
                                }
                              >
                                <MinusCircle size={16} />
                              </Button>
                              <span className="w-6 text-center font-medium">
                                {itemQty}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateCartItemQuantity(item.item_id, 1)
                                }
                              >
                                <PlusCircle size={16} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>

                        {/* Subtotal/Add to cart */}
                        <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-3">
                          {itemQty > 0 && (
                            <span className="font-medium text-primary">
                              ₹{itemSubtotal.toFixed(2)}
                            </span>
                          )}

                          {/* Mobile quantity controls */}
                          <div className="md:hidden">
                            {itemQty > 0 ? (
                              <div className="flex items-center gap-2 border rounded-md">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateCartItemQuantity(item.item_id, -1)
                                  }
                                >
                                  <MinusCircle size={16} />
                                </Button>
                                <span className="w-6 text-center font-medium">
                                  {itemQty}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateCartItemQuantity(item.item_id, 1)
                                  }
                                >
                                  <PlusCircle size={16} />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                Add
                              </Button>
                            )}
                          </div>

                          {/* Desktop add button */}
                          <div className="hidden md:block">
                            {itemQty === 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                Add to Cart
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section - Takes 1/3 of the space on larger screens */}
        <div className="md:col-span-1">
          <Card className="sticky top-6 shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShoppingCart size={20} />
                Your Cart
              </CardTitle>
              <CardDescription>
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in
                your cart
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart
                    size={40}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  Your cart is empty. Add some dishes to get started!
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center justify-between pb-3 border-b"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-gray-500">
                            ₹{item.base_price.toFixed(2)} × {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            ₹{getItemSubtotal(item).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 border rounded-md p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateCartItemQuantity(item.item_id, -1)
                            }
                          >
                            <MinusCircle size={16} />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateCartItemQuantity(item.item_id, 1)
                            }
                          >
                            <PlusCircle size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Payment Breakdown */}
                  <div className="space-y-3 p-2 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({TAX_RATE}%)</span>
                      <span>₹{calculateTax().toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                className="w-full py-6 text-base font-semibold"
                disabled={cartItems.length === 0}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Checkout Dialog */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Order</DialogTitle>
              <DialogDescription>
                Please provide your contact details to proceed with the order.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customerName" className="text-right">
                  Name
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="Your full name"
                  value={customerDetails.customerName}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="flex justify-between gap-2">
                <div className="flex gap-1">
                  <Label className="text-right">Train</Label>
                  <Input
                    value={
                      trainNumber || pnrdetails?.result?.trainInfo?.trainNo
                    }
                    readOnly={true}
                  />
                </div>

                <div className="flex gap-1">
                  <Label className="">Coach</Label>
                  <Input
                    value={coachNumber || pnrdetails?.result?.seatInfo?.coach}
                    readOnly={true}
                  />
                </div>
                <div className="flex gap-1">
                  <Label className="">Berth</Label>
                  <Input
                    value={berthNumber || pnrdetails?.result?.seatInfo?.berth}
                    readOnly={true}
                  />
                </div>
              </div>
              <div className="flex gap-1">
                <Label className="">Station</Label>
                <Input
                  value={
                    selectedStationName || pnrdetails?.result?.stations[0]?.name
                  }
                  readOnly={true}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">
                  Mobile *
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  placeholder="Your contact number"
                  value={customerDetails.mobile}
                  onChange={handleInputChange}
                  className="col-span-3"
                  type="tel"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="alternateMobile" className="text-right">
                  Alt. Mobile
                </Label>
                <Input
                  id="alternateMobile"
                  name="alternateMobile"
                  placeholder="Alternative number (optional)"
                  value={customerDetails.alternateMobile}
                  onChange={handleInputChange}
                  className="col-span-3"
                  type="tel"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">
                  Comments
                </Label>
                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="Special instructions or comments"
                  value={comment}
                  onChange={(e) => setcomment(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-md mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({TAX_RATE}%):</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  ₹{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isConfirming}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handlePushOrderIRCTC}
                className="bg-primary"
                disabled={isConfirming} // Disable button when loading
              >
                {isConfirming ? (
                  <>
                    {/* Optional: Add a small spinner here */}
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default OrderCart;
