
import React, { useState, useEffect, useRef } from "react";
import logo from '../../../assets/images/logo.png'; // <-- ADD THIS LINE
// other imports...
import { useQuery } from "@tanstack/react-query";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  ShoppingBag,
  Train,
  Store,
  Phone,
  Bell,
  Plus,
  Activity,
  IndianRupee,
  CheckCheck,
  X,
  Timer,
  Calendar,
  Share,
  Clock,
  MapPin,
  PlusCircle,
  Star,
} from "lucide-react";

import { olfService } from '@/utils/axiosInstance';
import { useNavigate } from '@tanstack/react-router';
import { Toaster, toast } from 'react-hot-toast';
import Approval from './Approval';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';

// Format display names
const formatDisplayName = (name: any) => {
  if (!name) return '';
  return name.split('_').map((word: any) =>
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

// Format date strings
const formatDate = (dateStr: any) => {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr.replace(' ', 'T'));

    // Format: May 14, 2023 • 13:45
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

// Interface for Order
interface Order {
  oid: number;
  menu_items: {
    items: Array<{
      name: string;
      item_id: number;
      quantity: number;
      descriptiom: string;
      SellingPrice: number;
      isVegetarian: boolean;
    }>;
  };
  customer_info: {
    customerDetails: {
      mobile: string;
      fullName: string;
      alternateMobile: string;
    };
  };
  mode: string;
  created_at: string;
  delivery_date: string;
  status: string;
  updated_at: string;
  discount_amount: number | null;
  irctc_discount: number | null;
  vendor_discount: number | null;
  delivery_details: {
    deliveryDetails: {
      pnr: string;
      berth: string;
      coach: string;
      station: string;
      trainNo: string;
      trainName: string;
      stationCode: string;
      passengerCount: number;
    };
  };
  comment: string | null;
  outlet_id: number;
  outlet_name: string;
  rating:number;
  gst: string;
  fssai: string;
  phone: string;
  fssai_valid: string;
  address: string;
  city: string;
  state: string;
  station_name: string;
  station_code: string;
  booked_from: string;
  pushed: number;
  updated_by: string;
}

interface OrdersProps {
  outletId?: number; // Optional prop to filter by outlet
}

const OrderDetailModal = ({ isOpen, onClose, order }: { isOpen: any, onClose: any, order: any }) => {
const receiptRef = useRef<HTMLDivElement>(null);
const [alternateMobile, setAlternateMobile] = useState<any>();
const [loader,setloader]=useState(false);
const handlesavealternateMobile = async(customer_info:any) => {
  customer_info.alternateMobile = alternateMobile;
  console.log(customer_info)
 setloader(true);
   await olfService.put(`/order/${order.oid}`, {
  customer_info:customer_info
  });
 setloader(false);

 }

 console.log()
  if (!order) return null;

  const calculateOrderTotal = () => {
    let total = 0;
    order.menu_items.items.forEach((item: any) => {
      total += item.SellingPrice * item.quantity;
    });

    // Apply discounts if any
    if (order.discount_amount) total -= order.discount_amount;
    if (order.irctc_discount) total -= order.irctc_discount;
    if (order.vendor_discount) total -= order.vendor_discount;

    return total;
  };

  const handleShareReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      // Create canvas from the receipt element
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: 400,
        height: receiptRef.current.scrollHeight,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        },
        onclone: (clonedDoc) => {
          // Remove any problematic CSS that html2canvas can't handle
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color: inherit !important;
              background-color: inherit !important;
              border-color: inherit !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Create file from blob
        const file = new File([blob], `order-${order.oid}-receipt.png`, { type: 'image/png' });

        // Check if Web Share API is supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Order Receipt #${order.oid}`,
              text: `Order receipt from ${order.outlet_name}`,
              files: [file]
            });
          } catch (error) {
            console.log('Share cancelled or failed');
            downloadImage(canvas);
          }
        } else {
          // Fallback: download the image
          downloadImage(canvas);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `order-${order.oid}-receipt.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Hidden receipt component for screenshot
interface MenuItem {
  name: string;
  quantity: number;
  SellingPrice: number;
}

// The new and improved receipt component
const ReceiptForShare = () => {
  const subtotal = order.menu_items.items.reduce((acc: number, item: MenuItem) => acc + item.SellingPrice * item.quantity, 0);
  const totalDiscounts = (order.discount_amount || 0) + (order.irctc_discount || 0) + (order.vendor_discount || 0);
  const primaryColor = '#667eea'; // A beautiful theme color from the gradient

  return (
    <div
      ref={receiptRef}
      className="fixed left-[-9999px] top-0"
      style={{
        width: '360px',
        backgroundColor: '#f0f2f5', // A neutral, professional background
        padding: '20px',
        fontFamily: "'Inter', sans-serif, system-ui",
        fontSize: '18px',
        lineHeight: '1.6',
        color: '#334155' // A softer, dark slate color
      }}
    >
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Header with Gradient */}
        <div style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <img
            src={logo}
            alt="Company Logo"
            style={{ height: '40px', margin: '0 auto 16px auto' }}
          />
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Order Confirmed!</h1>
          <p style={{ margin: '0', opacity: 0.9 }}>Thank you for your trust in us.</p>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Order & Date Details */}
          <div style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            textAlign: 'center', marginBottom: '24px', paddingBottom: '24px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order #</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{order.oid}</div>
            </div>
            <div style={{ height: '35px', borderLeft: '1px solid #cbd5e1' }}></div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ordered On</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{formatDate(order.created_at)}</div>
            </div>
          </div>

          {/* Billed From & Delivered To */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ width: '48%' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#475569' }}>From</h3>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>{order.outlet_name}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{order.station_name} ({order.station_code})</div>
            </div>
            <div style={{ width: '48%' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#475569' }}>To</h3>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>{order.customer_info?.customerDetails?.customerName}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Train: {order.delivery_details?.deliveryDetails?.trainName} ({order.delivery_details?.deliveryDetails?.trainNo})<br/>
                Coach: {order.delivery_details?.deliveryDetails?.coach}, Berth: {order.delivery_details?.deliveryDetails?.berth}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: primaryColor, borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Order Summary</h2>
            {order.menu_items.items.map((item: MenuItem, index: number) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#1e293b' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.quantity} × ₹{item.SellingPrice.toFixed(2)}</div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#334155' }}>₹{(item.SellingPrice * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px dashed #cbd5e1', margin: '16px 0' }}></div>

          {/* Financials */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <span style={{ color: '#334155' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscounts > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#16a34a' }}>
                <span>Discounts</span>
                <span>-₹{totalDiscounts.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Total Paid</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Payment Method</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: primaryColor }}>₹{calculateOrderTotal().toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{formatDisplayName(order.mode)}</div>
              </div>
            </div>
          </div>

          {/* Customer Comment */}
          {order.comment && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex' }}>
              <div style={{ width: '4px', backgroundColor: '#475569', marginRight: '12px', borderRadius: '2px' }}></div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Note from you:</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>"{order.comment}"</div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
            This is an auto-generated receipt.
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <div className="flex justify-center items-center">
                <span>Order #{order.oid}</span>
                <Badge variant={order.status === 'CANCELLED' ? 'destructive' : 'default'} className="ml-2">
                  {formatDisplayName(order.status)}
                </Badge>
              </div>
              <Button variant="outline" onClick={handleShareReceipt}>
                <Share className="w-4 h-4 mr-2" /> Share Receipt
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Customer & Order Info */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-slate-500 mb-2">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="font-medium">{order.customer_info?.customerDetails?.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-slate-400 mr-2" />
                    <span>{order.customer_info?.customerDetails?.mobile || 'N/A'}</span>
                  </div>
               
                       <div className="flex items-center">
                      <PlusCircle className="h-4 w-4 text-slate-400 mr-2" />
                      <div>
                        <Input
                        type="text"
                        placeholder='edit or add alternate mobile'
                        className={`border-2 border-amber-200 rounded-md focus:border-amber-400 focus:ring focus:ring-amber-200`}
                        value={alternateMobile}
                        onChange={(e) => setAlternateMobile(e.target.value)}
                        />  
                    <span className='text-xs'>{order.customer_info?.customerDetails?.alternateMobile || alternateMobile || 'N/A'}</span>
                        </div>

                    </div>
                    <Button onClick={()=>handlesavealternateMobile(order.customer_info?.customerDetails)}>{loader?"Saving":"Save"}</Button>
                 
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-slate-500 mb-2">Delivery Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Train className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="font-medium">{order.delivery_details?.deliveryDetails?.trainName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">Train No: {order.delivery_details?.deliveryDetails?.trainNo || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">Coach: {order.delivery_details?.deliveryDetails?.coach || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">Berth: {order.delivery_details?.deliveryDetails?.berth || 'N/A'}</span>
                  </div>
                  {/* <div className="flex items-center">
                    <span className="text-sm">PNR: {order.delivery_details?.deliveryDetails?.pnr || 'N/A'}</span>
                  </div> */}
                  <div className="flex items-center">
                      <Clock className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-sm">Delivery Time (ETA): {formatDate(order.delivery_date).split(' ')[1]} {formatDate(order.delivery_date).split(' ')[2]}</span>
                  </div>
                  <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-sm">Delivery Date: {formatDate(order.delivery_date).split(' ')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-slate-500 mb-2">Outlet Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Store className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="font-medium">{order.outlet_name || 'N/A'}</span>
                  </div>
                   <div className="flex items-center">
    <Star className="h-4 w-4 text-amber-400 mr-2" />
    <span className="text-sm">
      {/* Assuming order.rating is a number like 4.5 */}
      {order.rating ? `${order.rating.toFixed(1)} / 5.0` : "No rating"}
    </span>
  </div>
    <div className="flex items-start">
    <MapPin className="h-4 w-4 text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
    <span className="text-sm">
      {/* Assuming order.address is a string */}
      {order.address || "Address not available"}
    </span>
  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-slate-400 mr-2" />
                    <span>{order.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{order.station_name || 'N/A'} ({order.station_code || 'N/A'})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items & Payment */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-slate-500 mb-2">Order Items</h3>
                <ul className="divide-y divide-slate-200">
                  {order.menu_items.items.map((item: any, index: any) => (
                    <li key={index} className="py-2">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-2 text-sm text-slate-500">x{item.quantity}</span>
                        </div>
                        <span>₹{(item.SellingPrice * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.descriptiom}</p>
                    </li>
                  ))}
                </ul>

                {order.discount_amount || order.irctc_discount || order.vendor_discount ? (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <h4 className="text-sm font-medium">Discounts</h4>
                    <ul className="text-sm">
                      {order.discount_amount ? <li className="flex justify-between"><span>General Discount</span><span>-₹{order.discount_amount}</span></li> : null}
                      {order.irctc_discount ? <li className="flex justify-between"><span>IRCTC Discount</span><span>-₹{order.irctc_discount}</span></li> : null}
                      {order.vendor_discount ? <li className="flex justify-between"><span>Vendor Discount</span><span>-₹{order.vendor_discount}</span></li> : null}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{calculateOrderTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 mt-1">
                    <span>Payment Method</span>
                    <Badge variant="outline">{formatDisplayName(order.mode)}</Badge>
                  </div>
                </div>
              </div>

              {order.comment && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-medium text-sm text-amber-800 mb-2">Customer Comment</h3>
                  <p className="text-sm text-amber-700">{order.comment}</p>
                </div>
              )}

              {/* <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-slate-500 mb-2">Order Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Created</span>
                    <span className="text-sm">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm">{formatDate(order.updated_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Updated By</span>
                    <span className="text-sm">{order.updated_by || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Booked From</span>
                    <span className="text-sm">{order.booked_from || 'N/A'}</span>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden receipt component for sharing */}
      <ReceiptForShare />
    </>
  );
};

const StatCard = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) => (
  <div className="bg-white p-2 rounded-lg shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
    <div
      className="rounded-lg h-16 w-16 flex items-center justify-center"
      style={{ backgroundColor: color, color: "white" }}
    >
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-gray-600">{label}</span>
    </div>
  </div>
);

const OrderMobileCard = ({
  order,
  onViewDetails,
  onNotify,
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
  onNotify: (oid: number) => void;
}) => {
  const calculateOrderTotal = () => {
    let total = 0;
    order.menu_items.items.forEach(
      (item) => (total += item.SellingPrice * item.quantity)
    );
    if (order.discount_amount) total -= order.discount_amount;
    if (order.irctc_discount) total -= order.irctc_discount;
    if (order.vendor_discount) total -= order.vendor_discount;
    return total;
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ORDER_PLACED":
        return "secondary";
      case "CONFIRMED":
        return "default";
      case "PREPARING":
        return "warning";
      case "READY_FOR_PICKUP":
        return "success";
      case "OUT_FOR_DELIVERY":
        return "info";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "destructive";
      case "REFUNDED":
        return "outline";
      default:
        return "secondary";
    }
  };
  return (
    <Card className="mb-3">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">#{order.oid}</span>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {formatDisplayName(order.status)}
            </Badge>
          </div>
          <Badge variant="outline">{formatDisplayName(order.mode)}</Badge>
        </div>
        <CardDescription className="mt-1">
          {formatDate(order.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between mt-3 pt-2 border-t border-slate-200">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">
            ₹{calculateOrderTotal().toFixed(2)}
          </span>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails(order)}
          >
            View Details
          </Button>
          {order.pushed ? (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              <Bell className="h-3 w-3 mr-1" />
              Notified
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onNotify(order.oid)}
            >
              <Bell className="h-3 w-3 mr-1" />
              Notify
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Orders: React.FC<OrdersProps> = () => {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [orderData, setOrderData] = useState<any>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>("today");

  const {
    isPending,
    error: queryError,
    data: allOrders = [],
    refetch,
  } = useQuery<Order[], Error>({
    queryKey: ["orders"],
queryFn: () =>
      olfService.get("/orders").then((res) => {
        if (res.data.status !== 1)
          throw new Error("Unexpected response status");
        
        const rows = res.data.data.rows || [];
        
        // Filter out duplicates based on 'oid'
        const uniqueRows = rows.filter((value: any, index: number, self: any[]) =>
          index === self.findIndex((t) => (
            t.oid === value.oid
          ))
        );

        return uniqueRows.sort((a: any, b: any) => b.oid - a.oid);
      }),
 staleTime: 0, // Always fetch new data immediately
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (timeFilter === "custom") setShowFilters(true);
    else setShowFilters(false);
  }, [timeFilter]);
  const timeFilteredOrders = React.useMemo(() => {
    if (!allOrders) return [];
    if (timeFilter === "all") return allOrders;
    let startDate: Date, endDate: Date;
    const now = new Date();
    try {
      switch (timeFilter) {
        case "today":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "week":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "custom":
          if (!filterDateFrom || !filterDateTo) return allOrders;
          startDate = startOfDay(new Date(filterDateFrom));
          endDate = endOfDay(new Date(filterDateTo));
          break;
        default:
          return allOrders;
      }
      return allOrders.filter((order) => {
        const orderDate = new Date(order.created_at.replace(" ", "T"));
        return orderDate >= startDate && orderDate <= endDate;
      });
    } catch (e) {
      console.error("Date filtering error:", e);
      return allOrders;
    }
  }, [allOrders, timeFilter, filterDateFrom, filterDateTo]);
  const statusesInData = React.useMemo(() => {
    const statuses = new Set(["ALL"]);
    timeFilteredOrders.forEach((order) => {
      if (order.status) statuses.add(order.status);
    });
    return Array.from(statuses);
  }, [timeFilteredOrders]);
  const statusCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    timeFilteredOrders.forEach((order) => {
      if (order.status) counts[order.status] = (counts[order.status] || 0) + 1;
    });
    counts["ALL"] = timeFilteredOrders.length;
    return counts;
  }, [timeFilteredOrders]);
  const filteredOrders = React.useMemo(() => {
    if (!timeFilteredOrders) return [];
    return timeFilteredOrders.filter((order) => {
      const matchesStatus =
        activeTab === "ALL" ? true : order.status === activeTab;
      if (!matchesStatus) return false;
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();
      if (trimmedSearchTerm === "") return true;
      const searchableText = JSON.stringify(order).toLowerCase();
      return searchableText.includes(trimmedSearchTerm);
    });
  }, [timeFilteredOrders, activeTab, searchTerm]);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    itemsPerPage,
    timeFilter,
    filterDateFrom,
    filterDateTo,
  ]);
  const calculateOrderTotal = (order: Order) => {
    let total = 0;
    order.menu_items.items.forEach(
      (item) => (total += item.SellingPrice * item.quantity)
    );
    if (order.discount_amount) total -= order.discount_amount;
    if (order.irctc_discount) total -= order.irctc_discount;
    if (order.vendor_discount) total -= order.vendor_discount;
    return total;
  };
  const handleNotify = async (oid: number) => {
    await olfService.put(`/order/${oid}`, { pushed: 1 });
    toast.success("Order successfully pushed to vendor!");
    refetch();
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ORDER_PLACED":
        return "warning";
        
      case "ORDER_CONFIRMED":  // <--- ADD THIS LINE
    case "CONFIRMED":        // Keep this for older orders
      return "default";     
      case "ORDER_PREPARING":
        return "warning";
      case "READY_FOR_PICKUP":
        return "success";
      case "OUT_FOR_DELIVERY":
        return "info";
      case "ORDER_DELIVERED":
        return "success";
      case "ORDER_CANCELLED":
        return "destructive";
      case "REFUNDED":
        return "outline";
      default:
        return "secondary";
    }
  };
  const handleSetOrder = (
    status: string,
    mode: string,
    oid: number,
    outletid: number,
    order: Order
  ) => {
    setOrderData({ status, mode, oid, outletid, orderdata: order });
    setDialogOpen(true);
  };
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };
  const navigate = useNavigate();
  const deliveredOrdersCount = React.useMemo(
    () =>
      timeFilteredOrders.filter((o) => o.status === "ORDER_DELIVERED").length,
    [timeFilteredOrders]
  );
  const cancelledOrdersCount = React.useMemo(
    () =>
      timeFilteredOrders.filter((o) => o.status === "ORDER_CANCELLED").length,
    [timeFilteredOrders]
  );
  const pendingOrdersCount = React.useMemo(
    () =>
      timeFilteredOrders.filter(
        (o) => !["ORDER_DELIVERED", "ORDER_CANCELLED"].includes(o.status)
      ).length,
    [timeFilteredOrders]
  );
  const totalEarnings = React.useMemo(
    () =>
      timeFilteredOrders
        .filter((o) => o.status !== "ORDER_CANCELLED")
        .reduce((total, o) => total + calculateOrderTotal(o), 0),
    [timeFilteredOrders]
  );
  const handleUpdateSuccess = () => {
    refetch();
  };

  if (isPending)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  if (queryError)
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Unable to load orders: {queryError.message}</p>
            <Button className="mt-4" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-1">
      <Toaster position="top-right" />
      <OrderDetailModal
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
      />
      <Approval
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        orderData={orderData}
        onSuccess={handleUpdateSuccess}
      />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Orders Dashboard
        </h1>
        <Button
          className="bg-green-600 hover:bg-green-700 flex items-center gap-1 shadow-sm"
          onClick={() => navigate({ to: "/create-order" })}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">Create Order</span>
          <span className="inline md:hidden">New</span>
        </Button>
      </div>
      <div className="flex justify-end mb-4">
        <Tabs
          value={timeFilter}
          onValueChange={setTimeFilter}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="custom">
              <Calendar className="w-4 h-4 mr-2" />
              Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
        <StatCard
          icon={<Activity />}
          value={timeFilteredOrders.length}
          label="Total Orders"
          color="#4F46E5"
        />
        <StatCard
          icon={<IndianRupee />}
          value={`₹${totalEarnings.toFixed(2)}`}
          label="Total Earnings"
          color="#059669"
        />
        <StatCard
          icon={<CheckCheck />}
          value={deliveredOrdersCount}
          label="Delivered Orders"
          color="#0891B2"
        />
        <StatCard
          icon={<X />}
          value={cancelledOrdersCount}
          label="Cancelled Orders"
          color="#DC2626"
        />
        <StatCard
          icon={<Timer />}
          value={pendingOrdersCount}
          label="Pending Orders"
          color="#D97706"
        />
      </div>
      <div className="bg-white rounded-lg shadow-sm">
        <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab}>
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <TabsList className="bg-slate-100 h-auto p-1">
                {statusesInData.map((status) => (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white relative px-4 py-2"
                  >
                    {status === "ALL"
                      ? "All Orders"
                      : formatDisplayName(status)}
                    {statusCounts[status] > 0 && (
                      <span className="absolute -top-2 -right-2 bg-slate-200 text-slate-800 data-[state=active]:bg-green-700 data-[state=active]:text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {statusCounts[status]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search order ID, customer, phone, PNR, train..."
                  className="pl-10 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[110px] border-slate-200 bg-slate-50">
                    <SelectValue placeholder="10 per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showFilters && (
              <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Select Custom Date Range
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="border-slate-200"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setFilterDateFrom("");
                      setFilterDateTo("");
                      setTimeFilter("all");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="md:hidden">
            <div className="p-4">
              {paginatedOrders.map((order, index) => ( 
                <OrderMobileCard
                   key={`${order.oid}-${index}`} 
                  order={order}
                  onViewDetails={handleViewOrderDetails}
                  onNotify={handleNotify}
                />
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order, index) => ( 
                      <TableRow
                        key={`${order.oid}-${index}`}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleViewOrderDetails(order)}
                      >
                        <TableCell className="font-medium">
                          #{order.oid}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {order.customer_info?.customerDetails
                                ?.fullName || "N/A"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {order.customer_info?.customerDetails?.mobile ||
                                "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {order.delivery_details?.deliveryDetails
                                ?.trainNo || "N/A"}
                              -
                              {order.delivery_details?.deliveryDetails
                                ?.trainName || "N/A"}
                            </span>
                            <span className="font-medium">
                              {order.delivery_details?.deliveryDetails?.coach ||
                                "N/A"}{" "}
                              /{" "}
                              {order.delivery_details?.deliveryDetails?.berth?.toUpperCase() ||
                                "N/A"}
                            </span>
                            <span className="text-xs text-slate-500 uppercase font-medium">
                              {order.delivery_details?.deliveryDetails?.station?.toUpperCase() ||
                                "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {order.menu_items.items
                              .slice(0, 2)
                              .map((item, index) => (
                                <div key={index} className="text-sm">
                                  <span className="text-slate-500">
                                    {item.quantity}x{" "}
                                  </span>
                                  {item.name}{" "}
                                </div>
                              ))}
                            {order.menu_items.items.length > 2 && (
                              <span className="text-xs text-slate-500">
                                +{order.menu_items.items.length - 2} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ₹{calculateOrderTotal(order).toFixed(2)}
                          </span>
                          <div className="text-xs text-slate-500">
                            {formatDisplayName(order.mode)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                            >
                              {formatDisplayName(order.status)}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="py-0 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetOrder(
                                  order.status,
                                  order.mode,
                                  order.oid,
                                  order.outlet_id,
                                  order
                                );
                              }}
                            >
                              Update status
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>
                              {formatDate(order.created_at)?.split("•")[0]}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDate(order.created_at)?.split("•")[1]}
                            </span>
                            <span className="text-xs text-slate-500">
                              <b>FROM</b> {order.booked_from}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="text-xs text-slate-500">
                              <b className="text-black">By </b>
                              {order.updated_by}
                            </span>
                            <span>
                              <b>At </b>
                              {formatDate(order.updated_at)?.split("•")[0]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex space-x-2">
                            {order.pushed === 1 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-slate-600"
                                disabled
                              >
                                <Bell className="h-3 w-3 mr-1" />
                                Notified
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleNotify(order.oid)}
                              >
                                <Bell className="h-3 w-3 mr-1" />
                                Notify
                              </Button>
                            )}
                            {/* <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSetOrder(
                                      order.status,
                                      order.mode,
                                      order.oid,
                                      order.outlet_id,
                                      order
                                    )
                                  }
                                >
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleViewOrderDetails(order)}
                                >
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu> */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-slate-500">No orders found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {paginatedOrders.length > 0 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500 hidden md:block">
                Showing{" "}
                {Math.min(
                  filteredOrders.length,
                  (currentPage - 1) * itemsPerPage + 1
                )}{" "}
                to {Math.min(filteredOrders.length, currentPage * itemsPerPage)}{" "}
                of {filteredOrders.length} results
              </div>
              <div className="flex items-center space-x-2 mx-auto md:mx-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="hidden sm:flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-green-600 hover:bg-green-700"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
