import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { olfService } from '@/utils/axiosInstance';

const ORDER_STATUS = {
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_PREPARING: "ORDER_PREPARING",
  ORDER_PREPARED: "ORDER_PREPARED",
  ORDER_OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_PARTIALLY_DELIVERED: "ORDER_PARTIALLY_DELIVERED",
  ORDER_UNDELIVERED: "ORDER_UNDELIVERED",
  ORDER_CANCELLED: "ORDER_CANCELLED"
};

const modeS = {
  PRE_PAID: "PRE_PAID",
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY"
};

const UNDELIVERED_REMARKS = {
  CUSTOMER_NOT_AVAILABLE: "CUSTOMER_NOT_AVAILABLE",
  OTP_MISMATCH: "OTP_MISMATCH",
  VENDOR_INABILITY: "VENDOR_INABILITY",
  VENDOR_CLOSED: "VENDOR_CLOSED",
  CUSTOMER_DENIED: "CUSTOMER_DENIED"
};

const CANCELLED_REMARKS = {
  BEYOND_SERVICE_HOUR: "BEYOND_SERVICE_HOUR",
  TRAIN_DELAYED: "TRAIN_DELAYED",
  LAW_N_ORDER: "LAW_N_ORDER",
  NATURAL_CALAMITY: "NATURAL_CALAMITY",
  PASSENGER_JOURNEY_CANCELLED: "PASSENGER_JOURNEY_CANCELLED"
};

interface OrderStatusPaymentUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  orderData: {
    oid: string;
    status: string;
    mode: string;
    [key: string]: any;
  };
  user?: {
    name: string;
    [key: string]: any;
  };
}

const Approval: React.FC<OrderStatusPaymentUpdateProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  orderData,
  
}) => {
  const [status, setStatus] = useState(orderData?.status || "");
  const [paymentMode, setPaymentMode] = useState(orderData?.mode || "");
  const [remarks, setRemarks] = useState("");
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryPersonContactNo, setDeliveryPersonContactNo] = useState("");
  const [otp, setOtp] = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [bypassOtp, setBypassOtp] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<string>>([]);
  const userdata = localStorage.getItem("persist:root");
        const parsedData = userdata ? JSON.parse(userdata) : null;
        const user  = JSON.parse(parsedData.auth).user;
  useEffect(() => {
    if (orderData) {
      setStatus(orderData.status || "");
      setPaymentMode(orderData.mode || "");
    }
  }, [orderData]);

  const calculateOrderTotal = (order: any) => {
    let total = 0;
    order.menu_items.items.forEach((item :any)=> {
      total += item.SellingPrice * item.quantity;
    });
    
    // Apply discounts if any
    if (order.discount_amount) total -= order.discount_amount;
    if (order.irctc_discount) total -= order.irctc_discount;
    if (order.vendor_discount) total -= order.vendor_discount;
    
    return total;
  };

  const showRemarksField = status === ORDER_STATUS.ORDER_UNDELIVERED || status === ORDER_STATUS.ORDER_CANCELLED;
  const showDeliveryPersonFields = status === ORDER_STATUS.ORDER_OUT_FOR_DELIVERY;
  const showOtpField = status === ORDER_STATUS.ORDER_PARTIALLY_DELIVERED;
  const showItemSelectionField = status === ORDER_STATUS.ORDER_PARTIALLY_DELIVERED;
  const showDeliveryOtpField = status === ORDER_STATUS.ORDER_DELIVERED;
  
  const validateForm = () => {
    if (!status) {
      toast.error("Please select an order status");
      return false;
    }
    
    if (!paymentMode) {
      toast.error("Please select a payment mode");
      return false;
    }
    
    if ((status === ORDER_STATUS.ORDER_UNDELIVERED || status === ORDER_STATUS.ORDER_CANCELLED) && !remarks) {
      toast.error("Remarks are required for undelivered or cancelled orders");
      return false;
    }
    
    if (status === ORDER_STATUS.ORDER_PARTIALLY_DELIVERED) {
      if (!otp) {
        toast.error("OTP is required for partially delivered orders");
        return false;
      }
      
      if (selectedItems.length === 0) {
        toast.error("Please select items that were delivered");
        return false;
      }
    }

    if (status === ORDER_STATUS.ORDER_DELIVERED && !bypassOtp) {
      if (!deliveryOtp) {
        toast.error("Please enter delivery OTP or check 'Bypass OTP'");
        return false;
      }
      
      if (deliveryOtp.length !== 4) {
        toast.error("OTP must be 4 digits");
        return false;
      }
      
      if (!/^\d{4}$/.test(deliveryOtp)) {
        toast.error("OTP must contain only numbers");
        return false;
      }
    }
    
    return true;
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setDeliveryOtp(value);
    }
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;
  
  // DB payload - strictly limited to only the 4 required fields
  const payload = {
    status: status,
    mode: paymentMode,
    updated_by: user?.name || "System",
    updated_at: format(new Date(), 'yyyy-MM-dd HH:mm')
  };
  
  // Create separate dynamic payload for IRCTC with all conditional fields
  const irctcPayload: any = {
    status: status
  };
  
  // Add conditional fields ONLY to IRCTC payload
  if (showRemarksField) {
    irctcPayload.remarks = remarks;
  }
  
  if (showDeliveryPersonFields) {
    if (deliveryPersonName) irctcPayload.deliveryPersonName = deliveryPersonName;
    if (deliveryPersonContactNo) irctcPayload.deliveryPersonContactNo = deliveryPersonContactNo;
  }
  
  if (status === ORDER_STATUS.ORDER_PARTIALLY_DELIVERED) {
    irctcPayload.otp = otp;
    irctcPayload.orderItems = selectedItems;
  }

  // Add delivery OTP for delivered orders
  if (status === ORDER_STATUS.ORDER_DELIVERED && !bypassOtp) {
    irctcPayload.deliveryOtp = deliveryOtp;
  }
  
  // Additional IRCTC payload conditions remain the same
  if (status === ORDER_STATUS.ORDER_UNDELIVERED || status === ORDER_STATUS.ORDER_CANCELLED) {
    irctcPayload.remarks = remarks;
  }
  
  if (status === ORDER_STATUS.ORDER_OUT_FOR_DELIVERY) {
    if (deliveryPersonName) irctcPayload.deliveryPersonName = deliveryPersonName;
    if (deliveryPersonContactNo) irctcPayload.deliveryPersonContactNo = deliveryPersonContactNo;
  }
  
  if (status === ORDER_STATUS.ORDER_PARTIALLY_DELIVERED) {
    irctcPayload.otp = otp;
    
    // Use all items from orderData without filtering
    if (orderData?.menu_items?.items) {
      irctcPayload.orderItems = orderData.menu_items.items.map((item:any)=> ({
        itemId: item.item_id,
        quantity: item.quantity
      }));
    }
  }
  
  try {
    // First update the order in your DB (with only the 4 required fields)
    
    
    // Then push the status to IRCTC (with all the conditional fields)
    const res =  await olfService.post(`/push-status/${orderData?.oid}`, irctcPayload);
    if(res?.data?.status)
    {
toast.success(`Order status updated successfully`, {
      style: {
        borderRadius: '10px',
        background: 'white',
        color: 'green',
      },
      duration: 4000,
    });

    await olfService.put(`/order/${orderData?.oid}`, payload);
    if(irctcPayload.status=="ORDER_DELIVERED")
    {
      if(paymentMode=="PRE_PAID"){
await olfService.post("/payment",{"order_id":orderData?.oid,"outlet_id":orderData.outletid,"updated_by":user?.name || "System","credit":calculateOrderTotal(orderData.orderdata),"debit":0});
      }
      else{
        await olfService.post("/payment",{"order_id":orderData?.oid,"outlet_id":orderData.outletid,"updated_by":user?.name || "System","credit":0,"debit":calculateOrderTotal(orderData.orderdata)});
      }
      
    }
    onSuccess();
    onOpenChange(false);
    }
    else{
      toast.success(`Order status Failed! ${res?.data?.errorDetails?.data?.message}`, {
      style: {
        borderRadius: '10px',
        background: 'white',
        color: 'green',
      },
      duration: 4000,
    });
    }
    
  } catch (error) {
    console.error("Error updating order:", error);
    toast.error(`Failed to update order! ${error instanceof Error ? error.message : 'Unknown error'}`, {
      style: {
        borderRadius: '10px',
        background: 'white',
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
          <DialogTitle className="text-xl font-bold text-blue-800">
            Update Order Status & Payment Mode
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="font-medium">Order ID: <span className="font-bold text-blue-700">{orderData?.oid}</span></p>
            <p className="font-medium">Current Status: <span className="font-bold text-blue-700">{orderData?.status}</span></p>
            <p className="font-medium">Current Payment Mode: <span className="font-bold text-blue-700">{orderData?.mode}</span></p>
          </div>

          <div>
            <Label className="text-blue-700">Order Status</Label>
            <Select 
              value={status} 
              onValueChange={setStatus}
            >
              <SelectTrigger className="w-full border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Select order status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ORDER_STATUS).map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-blue-700">Payment Mode</Label>
            <Select 
              value={paymentMode} 
              onValueChange={setPaymentMode}
            >
              <SelectTrigger className="w-full border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(modeS).map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional fields based on selected status */}
          {showRemarksField && (
            <div>
              <Label className="text-blue-700">Remarks</Label>
              <Select 
                value={remarks} 
                onValueChange={setRemarks}
              >
                <SelectTrigger className="w-full border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(status === ORDER_STATUS.ORDER_UNDELIVERED ? UNDELIVERED_REMARKS : CANCELLED_REMARKS).map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showDeliveryPersonFields && (
            <>
              <div>
                <Label className="text-blue-700">Delivery Person Name</Label>
                <Input
                  placeholder="Enter delivery person name"
                  value={deliveryPersonName}
                  onChange={(e) => setDeliveryPersonName(e.target.value)}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-blue-700">Delivery Person Contact</Label>
                <Input
                  placeholder="Enter delivery person contact number"
                  value={deliveryPersonContactNo}
                  onChange={(e) => setDeliveryPersonContactNo(e.target.value)}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {showOtpField && (
            <div>
              <Label className="text-blue-700">OTP</Label>
              <Input
                placeholder="Enter delivery OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
          )}

          {showDeliveryOtpField && (
            <div className="space-y-3">
              <Label className="text-blue-700">Delivery OTP</Label>
              <Input
                placeholder="Enter 4-digit OTP"
                value={deliveryOtp}
                onChange={handleOtpChange}
                disabled={bypassOtp}
                maxLength={4}
                className={`border-blue-200 focus:border-blue-500 ${bypassOtp ? 'bg-gray-100' : ''}`}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bypass-otp"
                  checked={bypassOtp}
                  onCheckedChange={(checked) => {
                    setBypassOtp(checked as boolean);
                    if (checked) {
                      setDeliveryOtp("");
                    }
                  }}
                />
                <Label htmlFor="bypass-otp" className="text-sm text-gray-600">
                  Bypass OTP verification
                </Label>
              </div>
            </div>
          )}

          {showItemSelectionField && orderData?.items && (
            <div>
              <Label className="text-blue-700">Select Delivered Items</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`item-${item.id}`}>{item.name}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Approval;