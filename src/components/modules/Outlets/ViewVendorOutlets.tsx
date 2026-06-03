import  { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { olfService } from '@/utils/axiosInstance';
import { Building, MapPin, Phone, Train, Store, Ban, Clock } from "lucide-react";

interface ViewVendorOutletsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number | null;
  vendorName: string;
}

interface Outlet {
  id: number;
  outlet_id: number;
  outlet_name: string;
  address: string;
  city: string;
  phone: string;
  vendor_id: string | number; 
  station_name: string;
  status: number; // 0 = Inactive, 1 = Active, 2 = Closed
  verified: number;
}

const ViewVendorOutlets = ({ open, onOpenChange, vendorId, vendorName }: ViewVendorOutletsProps) => {
  
  // 1. Fetch Data
  const { 
    isPending, 
    error, 
    data: vendorOutlets = [] 
  } = useQuery({
    queryKey: ['all-outlets', vendorId],
    queryFn: () => 
      // Using your existing API
      olfService.get('/restraunts?verified=1').then((res) => {
        if (!res.data || res.data.status !== 1) {
            throw new Error('Failed to fetch outlets');
        }
        const allOutlets = res.data.data.rows || [];
        
        // Filter specifically for this vendor
        return allOutlets.filter((outlet: Outlet) => 
          String(outlet.vendor_id) === String(vendorId)
        );
      }),
    enabled: !!vendorId && open,
  });

  // 2. Calculate Statistics
  const stats = useMemo(() => {
    return {
      total: vendorOutlets.length,
      active: vendorOutlets.filter((o: Outlet) => o.status === 1).length,
      closed: vendorOutlets.filter((o: Outlet) => o.status === 2).length,
      inactive: vendorOutlets.filter((o: Outlet) => o.status === 0).length,
    };
  }, [vendorOutlets]);

  // 3. Helper to render status badge
  const renderStatusBadge = (status: number) => {
    switch(status) {
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Active
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            Closed
          </span>
        );
      case 0:
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            Inactive
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-2 border-b bg-green-50/50">
          <DialogTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
            <Building className="h-6 w-6 text-green-700" />
            <span>Outlets for <span className="underline decoration-green-300">{vendorName}</span></span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {isPending ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mb-4"></div>
              <p className="text-green-600 font-medium">Loading outlets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-600 font-medium">Error loading data</p>
            </div>
          ) : vendorOutlets.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Store className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium">No outlets found</p>
              <p className="text-sm">This vendor has no outlets linked to ID: {vendorId}</p>
            </div>
          ) : (
            <>
              {/* Summary Statistics Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  </div>
                  <Store className="h-8 w-8 text-gray-200" />
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-semibold">Active</p>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
                    <span className="h-3 w-3 rounded-full bg-green-600 animate-pulse"></span>
                  </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-600 uppercase font-semibold">Closed</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.closed}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-300" />
                </div>

                <div className="bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600 uppercase font-semibold">Inactive</p>
                    <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
                  </div>
                  <Ban className="h-8 w-8 text-red-300" />
                </div>
              </div>

              {/* Table Data */}
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">Outlet Details</TableHead>
                      <TableHead className="font-bold text-gray-700">Location</TableHead>
                      <TableHead className="font-bold text-gray-700">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorOutlets.map((outlet: Outlet) => (
                      <TableRow key={outlet.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="w-[120px]">
                          {renderStatusBadge(outlet.status)}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-base">{outlet.outlet_name}</span>
                            <span className="text-xs text-gray-500 font-mono mt-1">ID: {outlet.outlet_id}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center text-sm font-medium text-gray-700">
                                  <Train className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                  {outlet.station_name || "N/A"}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                  {outlet.city}, {outlet.address?.substring(0, 20)}...
                              </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm bg-gray-50 w-fit px-2 py-1 rounded border">
                             <Phone className="h-3 w-3 text-gray-600" />
                             <span className="font-mono text-gray-700">{outlet.phone || 'N/A'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewVendorOutlets;