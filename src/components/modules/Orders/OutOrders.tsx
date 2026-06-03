import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
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
  MoreVertical,
  Share,
  Clock,
  PlusCircle,
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
      customerName: string;
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
  outletid?: any; // Optional prop to filter by outlet
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
  const ReceiptForShare = () => (
    <div
      ref={receiptRef}
      className="fixed left-[-9999px] top-0"
      style={{
        width: '400px',
        backgroundColor: '#ffffff',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#000000'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', marginBottom: '8px' }}>✓ Order Confirmed</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#000000' }}>Order #{order.oid}</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(order.created_at)}</div>
      </div>

      {/* Outlet Info */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '4px', color: '#000000' }}>{order.outlet_name}</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.station_name} ({order.station_code})</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.phone}</div>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontWeight: '500', marginBottom: '8px', color: '#000000' }}>Delivery Details</div>
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '4px' }}><strong>Name:</strong> {order.customer_info?.customerDetails?.customerName}</div>
          <div style={{ marginBottom: '4px' }}><strong>Phone:</strong> {order.customer_info?.customerDetails?.mobile}</div>
          <div style={{ marginBottom: '4px' }}><strong>Train:</strong> {order.delivery_details?.deliveryDetails?.trainName}</div>
          <div style={{ marginBottom: '4px' }}><strong>Train No:</strong> {order.delivery_details?.deliveryDetails?.trainNo}</div>
          <div style={{ marginBottom: '4px' }}><strong>Coach:</strong> {order.delivery_details?.deliveryDetails?.coach}, <strong>Berth:</strong> {order.delivery_details?.deliveryDetails?.berth}</div>
          {/* <div style={{ marginBottom: '4px' }}><strong>PNR:</strong> {order.delivery_details?.deliveryDetails?.pnr}</div> */}
          <div><strong>Delivery Date:</strong> {formatDate(order.delivery_date)}</div>
        </div>
      </div>

      {/* Order Items */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontWeight: '500', marginBottom: '12px', color: '#000000' }}>Order Items</div>
        <div>
          {order.menu_items.items.map((item: any, index: any) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: '#000000' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Qty: {item.quantity} × ₹{item.SellingPrice}</div>
              </div>
              <div style={{ fontWeight: '500', color: '#000000' }}>₹{(item.SellingPrice * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounts */}
      {(order.discount_amount || order.irctc_discount || order.vendor_discount) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: '500', marginBottom: '8px', color: '#000000' }}>Discounts</div>
          <div style={{ fontSize: '12px' }}>
            {order.discount_amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '4px' }}>
                <span>General Discount</span>
                <span>-₹{order.discount_amount}</span>
              </div>
            )}
            {order.irctc_discount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '4px' }}>
                <span>IRCTC Discount</span>
                <span>-₹{order.irctc_discount}</span>
              </div>
            )}
            {order.vendor_discount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Vendor Discount</span>
                <span>-₹{order.vendor_discount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total */}
      <div style={{ borderTop: '2px dashed #d1d5db', paddingTop: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '20px', fontWeight: 'bold' }}>
          <span style={{ color: '#000000' }}>Total Amount</span>
          <span style={{ color: '#16a34a' }}>₹{calculateOrderTotal().toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          <span>Payment Method</span>
          <span>{formatDisplayName(order.mode)}</span>
        </div>
      </div>

      {/* Customer Comment */}
      {order.comment && (
        <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '4px' }}>
          <div style={{ fontWeight: '500', fontSize: '12px', marginBottom: '4px', color: '#a16207' }}>Customer Note</div>
          <div style={{ fontSize: '12px', color: '#a16207' }}>{order.comment}</div>
        </div>
      )}

      {/* Status */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: order.status === 'CANCELLED' ? '#fee2e2' : '#dcfce7',
          color: order.status === 'CANCELLED' ? '#dc2626' : '#16a34a'
        }}>
          {formatDisplayName(order.status)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <div>Thank you for your order!</div>
        <div>Generated on {new Date().toLocaleString()}</div>
      </div>
    </div>
  );

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
                    <span className="font-medium">{order.customer_info?.customerDetails?.customerName || 'N/A'}</span>
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

const StatCard = ({ icon, value, label, color, className = "" }: { icon: any, value: any, label: any, color: any, className: any }) => {
  return (
    <div className="bg-white p-2 rounded-lg shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow duration-200 ">
      <div className={`rounded-lg h-16 w-16 flex items-center justify-center ${className}`} style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-gray-600">{label}</span>
      </div>
    </div>

  );
};

// Mobile order card component
const OrderMobileCard = ({ order, onViewDetails, onNotify }: { order: any, onViewDetails: any, onNotify: any }) => {
  const calculateOrderTotal = () => {
    let total = 0;
    order.menu_items.items.forEach((item: any) => {
      total += item.SellingPrice * item.quantity;
    });

    if (order.discount_amount) total -= order.discount_amount;
    if (order.irctc_discount) total -= order.irctc_discount;
    if (order.vendor_discount) total -= order.vendor_discount;

    return total;
  };

  const getStatusBadgeVariant = (status: any) => {
    switch (status) {
      case 'ORDER_PLACED': return 'secondary';
      case 'CONFIRMED': return 'default';
      case 'PREPARING': return 'warning';
      case 'READY_FOR_PICKUP': return 'success';
      case 'OUT_FOR_DELIVERY': return 'info';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'destructive';
      case 'REFUNDED': return 'outline';
      default: return 'secondary';
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
        <CardDescription className="mt-1">{formatDate(order.created_at)}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <h4 className="text-xs text-slate-500 mb-1">Customer</h4>
            <p className="text-sm font-medium">{order.customer_info?.customerDetails?.customerName || 'N/A'}</p>
            <p className="text-xs">{order.customer_info?.customerDetails?.mobile || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs text-slate-500 mb-1">Delivery</h4>
            <p className="text-sm font-medium">{order.delivery_details?.deliveryDetails?.trainName || 'N/A'}</p>
            <p className="text-xs">PNR: {order.delivery_details?.deliveryDetails?.pnr || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-xs text-slate-500 mb-1">Items</h4>
          <ul className="text-sm">
            {order.menu_items.items.slice(0, 2).map((item: any, index: any) => (
              <li key={index} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>₹{(item.SellingPrice * item.quantity).toFixed(2)}</span>
              </li>
            ))}
            {order.menu_items.items.length > 2 && (
              <li className="text-xs text-slate-500 mt-1">
                +{order.menu_items.items.length - 2} more items
              </li>
            )}
          </ul>
        </div>

        <div className="flex justify-between mt-3 pt-2 border-t border-slate-200">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">₹{calculateOrderTotal().toFixed(2)}</span>
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
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={true}
            >
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

const OutOrders: React.FC<OrdersProps> = (outletid) => {
  // Active tab for status filtering
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isDialogOpen, setDialogOpen] = useState<any>(false);

  // Order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  // Fetch orders data
  const {
    isPending,
    error: queryError,
    data: allOrders = [],
    refetch,
  } = useQuery({
    queryKey: ['orders',outletid],
    queryFn: () =>
      olfService.get('/orders',{params:{outlet_id:Number(outletid.outletid)}}).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        // Sort by oid in descending order (latest on top)
        const sortedOrders = [...(res.data.data.rows || [])].sort((a, b) => b.oid - a.oid);
        return sortedOrders;
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Get unique order statuses in data for tabs
  const statusesInData = React.useMemo(() => {
    const statuses = new Set(['ALL']);
    allOrders?.forEach((order: Order) => {
      if (order.status) {
        statuses.add(order.status);
      }
    });
    return Array.from(statuses);
  }, [allOrders]);

  // Status counts for badges
  const statusCounts = React.useMemo(() => {
    const counts: any = {};
    allOrders?.forEach((order: Order) => {
      if (order.status) {
        counts[order.status] = (counts[order.status] || 0) + 1;
      }
    });
    counts['ALL'] = allOrders?.length || 0;
    return counts;
  }, [allOrders]);

  // Apply filters to orders
 const filteredOrders = React.useMemo(() => {
  if (!allOrders || allOrders.length === 0) {
    return [];
  }

  return allOrders.filter((order) => {
    // Apply status filter from tabs
    const matchesStatus = activeTab === 'ALL' ? true : order.status === activeTab;

    // Apply search filter with improved logic
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    let matchesSearch = true;

    if (trimmedSearchTerm !== '') {
      // Extract search fields with better null handling
      const customerName = order.customer_info?.customerDetails?.customerName?.toString() || '';
      const customerMobile = order.customer_info?.customerDetails?.mobile?.toString() || '';
      const alternateMobile = order.customer_info?.customerDetails?.alternateMobile?.toString() || '';
      const pnr = order.delivery_details?.deliveryDetails?.pnr?.toString() || '';
      const trainNo = order.delivery_details?.deliveryDetails?.trainNo?.toString() || '';
      const trainName = order.delivery_details?.deliveryDetails?.trainName?.toString() || '';
      const coach = order.delivery_details?.deliveryDetails?.coach?.toString() || '';
      const berth = order.delivery_details?.deliveryDetails?.berth?.toString() || '';
      const orderId = order.oid?.toString() || '';
      const outletName = order.outlet_name?.toString() || '';
      const stationName = order.station_name?.toString() || '';

      const searchFields = [
        customerName,
        customerMobile,
        alternateMobile,
        pnr,
        trainNo,
        trainName,
        coach,
        berth,
        orderId,
        outletName,
        stationName
      ];

      // Check if any field contains the search term
      matchesSearch = searchFields.some(field => {
        if (!field) return false;
        return field.toLowerCase().includes(trimmedSearchTerm);
      });

      // Additional check for partial matches on order ID
      if (!matchesSearch && trimmedSearchTerm.match(/^\d+$/)) {
        matchesSearch = orderId.includes(trimmedSearchTerm);
      }
    }

    // Apply date filters
    let matchesDateFilter = true;

    if (filterDateFrom && filterDateTo) {
      try {
        const orderDate = new Date(order.created_at.replace(' ', 'T'));
        const fromDate = new Date(filterDateFrom);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);

        matchesDateFilter = orderDate >= fromDate && orderDate <= toDate;
      } catch (e) {
        console.warn('Date parsing error:', e);
        matchesDateFilter = true;
      }
    } else if (filterDateFrom) {
      try {
        const orderDate = new Date(order.created_at.replace(' ', 'T'));
        const fromDate = new Date(filterDateFrom);
        matchesDateFilter = orderDate >= fromDate;
      } catch (e) {
        console.warn('Date parsing error:', e);
        matchesDateFilter = true;
      }
    } else if (filterDateTo) {
      try {
        const orderDate = new Date(order.created_at.replace(' ', 'T'));
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDateFilter = orderDate <= toDate;
      } catch (e) {
        console.warn('Date parsing error:', e);
        matchesDateFilter = true;
      }
    }

    return matchesStatus && matchesSearch && matchesDateFilter;
  });
}, [allOrders, activeTab, searchTerm, filterDateFrom, filterDateTo]);

const filteredOrdersSimple = React.useMemo(() => {
  if (!allOrders) return [];
  
  if (!searchTerm.trim()) {
    return allOrders.filter(order => 
      activeTab === 'ALL' ? true : order.status === activeTab
    );
  }

  const search = searchTerm.trim().toLowerCase();
  
  return allOrders.filter((order) => {
    // Status filter
    const statusMatch = activeTab === 'ALL' ? true : order.status === activeTab;
    if (!statusMatch) return false;

    // Search filter - convert everything to string and search
    const searchableText = JSON.stringify(order).toLowerCase();
    return searchableText.includes(search);
  });
}, [allOrders, activeTab, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
 // Use filteredOrdersSimple instead of filteredOrders
const paginatedOrders = React.useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredOrdersSimple.slice(startIndex, startIndex + itemsPerPage);
}, [filteredOrdersSimple, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterDateFrom, filterDateTo, itemsPerPage]);

  // Calculate order total amount
  const calculateOrderTotal = (order: Order) => {
    let total = 0;
    order.menu_items.items.forEach(item => {
      total += item.SellingPrice * item.quantity;
    });

    // Apply discounts if any
    if (order.discount_amount) total -= order.discount_amount;
    if (order.irctc_discount) total -= order.irctc_discount;
    if (order.vendor_discount) total -= order.vendor_discount;

    return total;
  };

  const handleNotify = async (oid: number) => {
    await olfService.put(`/order/${oid}`, { "pushed": 1 });
    toast.success("Order successfully pushed to vendor!");
    refetch();
  };



  // Get status badge variant based on order status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ORDER_PLACED': return 'secondary';
      case 'CONFIRMED': return 'default';
      case 'ORDER_PREPARING': return 'warning';
      case 'READY_FOR_PICKUP': return 'success';
      case 'OUT_FOR_DELIVERY': return 'info';
      case 'ORDER_DELIVERED': return 'success';
      case 'ORDER_CANCELLED': return 'destructive';
      case 'REFUNDED': return 'outline';
      default: return 'secondary';
    }
  };

  const handleSearchDebug = (term:any) => {
  console.log('Search term:', term);
  console.log('All orders count:', allOrders?.length || 0);
  console.log('Filtered orders count:', filteredOrders?.length || 0);
  
  if (allOrders && allOrders.length > 0) {
    console.log('Sample order structure:', {
      oid: allOrders[0].oid,
      customerName: allOrders[0].customer_info?.customerDetails?.customerName,
      mobile: allOrders[0].customer_info?.customerDetails?.mobile,
      pnr: allOrders[0].delivery_details?.deliveryDetails?.pnr,
      trainNo: allOrders[0].delivery_details?.deliveryDetails?.trainNo
    });
  }
};

  const [orderdata, setorderdata] = useState<any>({});

  const handleSetOrder = async (status: string, mode: string, oid: any, outletid: any, orderdata: any) => {
    setorderdata({ status: status, mode: mode, oid: oid, outletid: outletid, orderdata: orderdata });
    setDialogOpen(true);
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const navigate = useNavigate();

  // Calculate stats
  const deliveredOrdersCount = React.useMemo(() => {
    return allOrders.filter((order: any) => order.status === 'ORDER_DELIVERED').length;
  }, [allOrders]);

  const cancelledOrdersCount = React.useMemo(() => {
    return allOrders.filter((order: any) => order.status === 'ORDER_CANCELLED').length;
  }, [allOrders]);

  const pendingOrdersCount = React.useMemo(() => {
    return allOrders.filter((order: any) => !['ORDER_DELIVERED', 'ORDER_CANCELLED'].includes(order.status)).length;
  }, [allOrders]);

  const totalEarnings = React.useMemo(() => {
    return allOrders
      .filter((order: any) => order.status !== 'ORDER_CANCELLED')
      .reduce((total: any, order: any) => total + calculateOrderTotal(order), 0);
  }, [allOrders]);

  if (isPending) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );

  if (queryError) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to load orders: {(queryError as Error).message}</p>
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Orders Dashboard</h1>
        <Button
          className="bg-green-600 hover:bg-green-700 flex items-center gap-1 shadow-sm"
          onClick={() => navigate({ "to": '/create-order' })}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">Create Order</span>
          <span className="inline md:hidden">New</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
        <StatCard
          icon={<Activity />}
          value={allOrders.length}
          label="Total Orders"
          color="#4F46E5"
          className="lg:col-span-1"
        />
        <StatCard
          icon={<IndianRupee />}
          value={`₹${totalEarnings.toFixed(2)}`}
          label="Total Earnings"
          color="#059669"
          className="lg:col-span-1"
        />
        <StatCard
          icon={<CheckCheck />}
          value={deliveredOrdersCount}
          label="Delivered Orders"
          color="#0891B2"
          className="lg:col-span-1"
        />
        <StatCard
          icon={<X />}
          value={cancelledOrdersCount}
          label="Cancelled Orders"
          color="#DC2626"
          className="lg:col-span-1"
        />
        <StatCard
          icon={<Timer />}
          value={pendingOrdersCount}
          label="Pending Orders"
          color="#D97706"
          className="lg:col-span-1"
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
                    {status === 'ALL' ? 'All Orders' : formatDisplayName(status)}
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

          {/* Search and filter controls */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input
  placeholder="Search order ID, customer, phone, PNR, train..."
  className="pl-10 bg-slate-50 border-slate-200"
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value);
    // Remove this debug call after fixing the issue
    if (e.target.value.length > 2) {
      handleSearchDebug(e.target.value);
    }
  }}
/>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>

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

            {/* Date Filters */}
            {showFilters && (
              <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Date Range</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">From Date</label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">To Date</label>
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
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            {paginatedOrders.length > 0 ? (
              <div className="p-4">
                {paginatedOrders.map((order: Order) => (
                  <OrderMobileCard
                    key={order.oid}
                    order={order}
                    onViewDetails={handleViewOrderDetails}
                    onNotify={handleNotify}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <ShoppingBag className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No orders found</h3>
                <p className="text-sm text-slate-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          {/* Desktop View - Orders Table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Order ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                    <TableHead className="font-semibold text-slate-700">Delivery</TableHead>
                    <TableHead className="font-semibold text-slate-700">Items</TableHead>
                    <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Updated By</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order: Order) => (
                      <TableRow
                        key={order.oid}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleViewOrderDetails(order)}
                      >
                        <TableCell className="font-medium">
                          #{order.oid}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.customer_info?.customerDetails?.customerName || 'N/A'}</span>
                            <span className="text-xs text-slate-500">{order.customer_info?.customerDetails?.mobile || 'N/A'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.delivery_details?.deliveryDetails?.trainName || 'N/A'}-{order.delivery_details?.deliveryDetails?.trainNo || 'N/A'}</span>
                            <span className="font-medium">{order.delivery_details?.deliveryDetails?.station || 'N/A'}</span>
                            <div className='flex gap-1'>
                            <span className="font-medium"><b>{order.delivery_details?.deliveryDetails?.coach || 'N/A'}/{order.delivery_details?.deliveryDetails?.berth|| 'N/A'}</b></span>
                            </div>
                            {/* <span className="text-xs text-slate-500">
                              PNR: {order.delivery_details?.deliveryDetails?.pnr || 'N/A'}
                            </span> */}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            {order.menu_items.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.name} <span className="text-slate-500">x{item.quantity}</span>
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
                          <span className="font-medium">₹{calculateOrderTotal(order).toFixed(2)}</span>
                          <div className="text-xs text-slate-500">{formatDisplayName(order.mode)}</div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status=="ORDER_PREPARING"?formatDisplayName("Order_Placed"):formatDisplayName(order.status)}
                            </Badge>
                            <Button variant="outline" size="sm" className='py-0 px-2' onClick={(e: any) => {
                              e.stopPropagation();
                              handleSetOrder(order.status, order.mode, order.oid, order.outlet_id, order)
                            }}>Update status</Button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{formatDate(order.created_at).split('•')[0]}</span>
                            <span className="text-xs text-slate-500">{formatDate(order.created_at).split('•')[1]}</span>
                            <span className="text-xs text-slate-500"><b>FROM</b> {order.booked_from}</span>
                          </div>
                        </TableCell>

                         <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="text-xs text-slate-500"><b className='text-black'>By </b>{order.updated_by}</span>
                            <span><b>At </b>{formatDate(order.updated_at).split('•')[0]}</span>
                            {/* <span className="text-xs text-slate-500">{formatDate(order.updated_at).split('•')[1]}</span> */}
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

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSetOrder(order.status, order.mode, order.oid, order.outlet_id, order)}>
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
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

          {/* Pagination */}
          {paginatedOrders.length > 0 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500 hidden md:block">
                Showing {Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredOrders.length, currentPage * itemsPerPage)} of {filteredOrders.length} results
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
                    // Show pages around current page
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
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum
                          ? "bg-green-600 hover:bg-green-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <div className="sm:hidden text-sm">
                  Page {currentPage} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      <Approval
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
        orderData={orderdata}
      />
    </div>
  );
};

export default OutOrders;