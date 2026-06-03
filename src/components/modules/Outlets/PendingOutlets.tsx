import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query'; // useMutation is key
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Phone,
  FileText,
  IndianRupee,
  CheckCircle,
  X,
  Calendar,
  CreditCard,
  Tag,
  Mail,
  Building,
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ExportOutlet from './ExportOutlet';

const PendingOutlets = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  
  // Dialog state
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Selection state for bulk actions
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Query to fetch all outlets
  const { 
    isPending, 
    error: queryError, 
    data: allOutlets = [],
    refetch
  } = useQuery({
    queryKey: ['all-outlets'],
    queryFn: () =>
      olfService.get('/restraunts', { params: { verified: 0 } }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res?.data?.data?.rows || [];
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: false,
  });
  
  // Apply filters to outlets
  const filteredOutlets = React.useMemo(() => {
    return allOutlets?.filter((outlet:any) => {
      const isPending = outlet.verified === 0;
      if (!isPending) return false;
      
      const matchesSearch = 
        outlet.outlet_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        outlet.gst?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        outlet.phone?.includes(searchTerm);
      
      const matchesCity = filterCity === 'all' ? true : outlet.city?.toLowerCase() === filterCity?.toLowerCase();
      const matchesState = filterState === 'all' ? true : outlet.state?.toLowerCase() === filterState?.toLowerCase();
      
      return matchesSearch && matchesCity && matchesState;
    });
  }, [allOutlets, searchTerm, filterCity, filterState]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOutlets.length / itemsPerPage);
  const paginatedOutlets = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOutlets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOutlets, currentPage, itemsPerPage]);

  // Reset to first page and clear selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [searchTerm, filterCity, filterState, itemsPerPage]);

  // *** UPDATED MUTATION HOOK ***
  // Use a single, efficient bulk update endpoint
  const bulkApproveMutation = useMutation({
    mutationFn: (outletIds: string[]) => {
      // This now makes a single API call instead of many
      return olfService.put('/restraunt/bulk-update', {
          outletIds: outletIds,
          payload: { verified: 1 }
      });
    },
    onSuccess: () => {
      toast.success(`${selectedRows.length} outlets approved successfully!`);
      refetch(); // Refetch the data to update the UI
      setSelectedRows([]); // Clear the selection
    },
    onError: (error: any) => {
      toast.error(`Bulk approval failed! ${error.message || 'An unknown error occurred.'}`);
    }
  });

  // Handle bulk approve button click
  const handleBulkApprove = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one outlet to approve.");
      return;
    }
    if (window.confirm(`Are you sure you want to approve these ${selectedRows.length} outlets?`)) {
      bulkApproveMutation.mutate(selectedRows);
    }
  };


  // Get unique values for filter options
  const cities = React.useMemo(() => [...new Set(allOutlets.map((outlet:any) => outlet.city))], [allOutlets]);
  const states = React.useMemo(() => [...new Set(allOutlets.map((outlet:any) => outlet.state))], [allOutlets]);

  // Handle single approve outlet
  const handleApproveOutlet = async (outletId:any, event:React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to approve this outlet?")) {
      try {
        await olfService.put(`/restraunt/${outletId}`, { verified: 1 });
        toast.success('Outlet approved successfully!');
        refetch();
      } catch (error) {
        toast.error(`Outlet approval failed! ${error}`);
      }
    }
  };

  // Handle row click to open dialog
  const handleRowClick = (outlet:any) => {
    setSelectedOutlet(outlet);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString:any) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return dateString; }
  };

  const handleCloseDialog = () => setIsDialogOpen(false);

  const handleApproveFromDialog = async () => {
    if (!selectedOutlet) return;
    try {
      await olfService.put(`/restraunt/${selectedOutlet.outlet_id}`, { verified: 1 });
      refetch();
      setIsDialogOpen(false);
      toast.success('Outlet approved successfully!');
    } catch (error) {
      toast.error(`Outlet approval failed! ${error}`);
    }
  };

  // Selection logic for checkboxes (no changes needed here)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedOutlets.map((outlet: any) => outlet.outlet_id);
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = paginatedOutlets.map((outlet: any) => outlet.outlet_id);
      setSelectedRows(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (outletId: string, checked: boolean) => {
    setSelectedRows(prev => 
      checked ? [...prev, outletId] : prev.filter(id => id !== outletId)
    );
  };
  
  const selectedOnPageCount = paginatedOutlets.filter((o: any) => selectedRows.includes(o.outlet_id)).length;
  const headerCheckboxState = selectedOnPageCount === 0 ? false : selectedOnPageCount === paginatedOutlets.length ? true : 'indeterminate';


  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading outlets: {queryError.message}</div>;

  return (
    <div className="mx-4">
      <Toaster position="top-right" reverseOrder={false} />
      
      <Card className="border-none">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-2xl font-bold text-amber-800">Pending Outlets</CardTitle>
        </CardHeader>
        <CardContent className="p-1">
          <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
            <div className="flex flex-grow items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-amber-500" />
                <Input
                  placeholder="Search pending outlets..."
                  className="pl-8 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {selectedRows.length > 0 && (
                <Button 
                  onClick={handleBulkApprove} 
                  disabled={bulkApproveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {bulkApproveMutation.isPending ? 'Approving...' : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve ({selectedRows.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            <ExportOutlet data={allOutlets} isLoading={isPending}/>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" />
              </Button>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-[120px] border-amber-200"><SelectValue placeholder="Show" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFilters && (
            <div className="mb-2 p-2 bg-amber-50 rounded-md border border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-2">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                
                <div>
                  <label className="text-sm font-medium text-amber-700">City</label>
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="border-amber-200"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((city:any) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-700">State</label>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger className="border-amber-200"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state:any) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="border border-amber-200 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-amber-100">
                  <TableRow className="hover:bg-amber-100/80">
                    <TableHead className="w-[50px] border border-amber-200">
                       <Checkbox
                        checked={headerCheckboxState}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all on this page"
                      />
                    </TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">OUTLET NAME</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">STATION</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">TIMING</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">ORDER INFO</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">CONTACT</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">DOCUMENTS</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200">TAGS</TableHead>
                    <TableHead className="font-bold text-amber-800 border border-amber-200 text-center">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOutlets.length > 0 ? (  
                    paginatedOutlets.map((outlet:any) => (
                      <TableRow 
                        key={outlet.outlet_id} 
                        className="hover:bg-amber-50"
                        data-state={selectedRows.includes(outlet.outlet_id) && "selected"}
                      >
                        <TableCell className="border border-amber-200" onClick={(e) => e.stopPropagation()}>
                           <Checkbox
                            checked={selectedRows.includes(outlet.outlet_id)}
                            onCheckedChange={(checked) => handleSelectRow(outlet.outlet_id, Boolean(checked))}
                            aria-label={`Select row ${outlet.outlet_name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-amber-900 border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                          <div className="flex items-center gap-2">
                            {outlet.logo_image && (
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-50 flex-shrink-0">
                                <img src={outlet.logo_image} alt={outlet.outlet_name} className="w-full h-full object-cover"/>
                              </div>
                            )}
                            <div>
                              <div className="font-semibold">{outlet.outlet_name}</div>
                              <div className="text-xs text-amber-600">{outlet.company_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 text-amber-600 mr-1" />
                            <div>
                              <div className="font-medium">{outlet.station_name}</div>
                              <div className="text-xs text-amber-600">{outlet.station_code}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm"><Clock className="h-3 w-3 text-amber-600 mr-1" /><span>{outlet.opening_time} - {outlet.closing_time}</span></div>
                            <div className="text-xs text-amber-600 mt-1">Order prep: {outlet.order_timing} mins</div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                           <div className="flex flex-col text-sm">
                            <div className="flex items-center"><IndianRupee className="h-3 w-3 text-amber-600 mr-1" /><span>Min: ₹{outlet.min_order_amount}</span></div>
                           <div className="flex items-center mt-1">
  {Array.isArray(outlet?.delivery_charges) ? (
    outlet.delivery_charges.map((data: any, index: any) => (
      <div key={index}>
        <span>Delivery: <span>₹{data.deliveryFee} for ₹{data.amountMoreThan}</span></span>
      </div>
    ))
  ) : (
    <span className="text-xs italic">No delivery info</span>
  )}
</div>
                            <div className="text-xs text-amber-600 mt-1">{outlet.prepaid ? "Prepaid accepted" : "COD only"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center"><Phone className="h-3 w-3 text-amber-600 mr-1" /><span className="font-medium">{outlet.phone}</span></div>
                            <div className="flex items-center mt-1"><Phone className="h-3 w-3 text-amber-600 mr-1" /><span>Admin: {outlet.admin_phone}</span></div>
                            <div className="text-xs text-amber-600 mt-1">{outlet.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center"><FileText className="h-3 w-3 text-amber-600 mr-1" /><span>GST: {outlet.gst}</span></div>
                            <div className="flex items-center mt-1"><FileText className="h-3 w-3 text-amber-600 mr-1" /><span>FSSAI: {outlet.fssai}</span></div>
                            <div className="text-xs text-amber-600 mt-1">Valid till: {String(formatDate(outlet.fssai_valid))}</div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 cursor-pointer" onClick={() => handleRowClick(outlet)}>
                          <div className="flex flex-wrap gap-1">
                            {outlet.tags && outlet.tags.split(',').map((tag:any, idx:any) => (<span key={idx} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">{tag.trim()}</span>))}
                          </div>
                        </TableCell>
                        <TableCell className="border border-amber-200 text-center">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={(e) => handleApproveOutlet(outlet.outlet_id, e)}>
                            <CheckCircle className="mr-1 h-3 w-3" /> Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={9} className="h-24 text-center border border-amber-200">No pending outlets found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-amber-700">
              Showing {Math.min(filteredOutlets.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredOutlets.length, currentPage * itemsPerPage)} of {filteredOutlets.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p:any) => Math.max(1, p - 1))} disabled={currentPage === 1} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (<Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className={currentPage === pageNum ? "bg-amber-600 hover:bg-amber-700" : "border-amber-200 text-amber-700 hover:bg-amber-50"}>{pageNum}</Button>);
              })}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p:any) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog remains unchanged */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOutlet && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedOutlet.logo_image && (<div className="w-10 h-10 rounded-full overflow-hidden bg-amber-50 flex-shrink-0"><img src={selectedOutlet.logo_image} alt={selectedOutlet.outlet_name} className="w-full h-full object-cover"/></div>)}
                  <span>{selectedOutlet.outlet_name}</span>
                </DialogTitle>
                <DialogDescription>Outlet ID: {selectedOutlet.outlet_id} | Status: <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending Approval</Badge></DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Business Information */}
                <div className="space-y-3 border border-amber-200 rounded-md p-3">
                  <h3 className="font-bold text-amber-800">Business Information</h3>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Building className="h-4 w-4 text-amber-600" />
                    <span className="font-medium">{selectedOutlet.company_name}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>PAN: {selectedOutlet.vendor_pan_number}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>GST: {selectedOutlet.gst}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>FSSAI: {selectedOutlet.fssai}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span>FSSAI Valid till: {formatDate(selectedOutlet.fssai_valid)}</span>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-3 border border-amber-200 rounded-md p-3">
                  <h3 className="font-bold text-amber-800">Location Information</h3>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>{selectedOutlet.address}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>{selectedOutlet.city}, {selectedOutlet.state}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>Station: {selectedOutlet.station_name} ({selectedOutlet.station_code})</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 border border-amber-200 rounded-md p-3">
                  <h3 className="font-bold text-amber-800">Contact Information</h3>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-600" />
                    <span>Primary: {selectedOutlet.phone}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-600" />
                    <span>Admin: {selectedOutlet.alternative_phones[0]}</span>
                  </div>
                  
                  {selectedOutlet.alternative_phones && selectedOutlet.alternative_phones.length > 0 && (
                    <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                      <Phone className="h-4 w-4 text-amber-600" />
                      <span>Alternative: {selectedOutlet.alternative_phones.join(', ')}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span>{selectedOutlet.email}</span>
                  </div>

                  {/* Representative Info if available */}
                  {selectedOutlet.rlname && (
                    <>
                      <Separator />
                      <h4 className="font-semibold text-amber-700">Representative</h4>
                      <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                        <Building className="h-4 w-4 text-amber-600" />
                        <span>{selectedOutlet.rlname}</span>
                      </div>
                      <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-600" />
                        <span>{selectedOutlet.rlphone}</span>
                      </div>
                      <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-600" />
                        <span>{selectedOutlet.rlemail}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Operating Information */}
                <div className="space-y-3 border border-amber-200 rounded-md p-3">
                  <h3 className="font-bold text-amber-800">Operating Information</h3>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Hours: {selectedOutlet.opening_time} - {selectedOutlet.closing_time}</span>
                  </div>
                  
                  <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Order preparation time: {selectedOutlet.order_timing} minutes</span>
                  </div>
                  
                  {selectedOutlet.weeklyclosed && selectedOutlet.weeklyclosed.length > 0 && (
                    <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span>Closed on: {selectedOutlet.weeklyclosed.join(', ')}</span>
                    </div>
                  )}
                  
                  {selectedOutlet.closing_period && (
                    <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span>Closed period: {selectedOutlet.closing_period}</span>
                    </div>
                  )}
                </div>

                {/* Order Information */}
                <div className="space-y-3 border border-amber-200 rounded-md p-3 md:col-span-2">
                  <h3 className="font-bold text-amber-800">Order Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-amber-600" />
                      <span>Minimum order: ₹{selectedOutlet.min_order_amount}</span>
                    </div>
                    
                    <div className="grid grid-cols-[24px_1fr] items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      <span>{selectedOutlet.prepaid ? "Prepaid accepted" : "COD only"}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Tag className="h-4 w-4 text-amber-600" /> Tags:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedOutlet.tags && selectedOutlet.tags.split(',').map((tag:any, idx:any) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Charges */}
              <div className="space-y-3 border border-amber-200 rounded-md p-3">
  <h3 className="font-bold text-amber-800">Delivery Charges</h3>
  
  {Array.isArray(selectedOutlet.delivery_charges) && selectedOutlet.delivery_charges.length > 0 ? (
    <div className="space-y-2">
      {selectedOutlet.delivery_charges.map((charge: any, idx: any) => (
        <div key={idx} className="flex justify-between p-2 bg-amber-50 rounded">
          <span>Orders above ₹{charge.amountMoreThan}</span>
          <span className="font-medium">₹{charge.deliveryFee}</span>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-amber-600">No delivery charges specified</p>
  )}
</div>

                {/* Promotions */}
                <div className="space-y-3 border border-amber-200 rounded-md p-3">
                  <h3 className="font-bold text-amber-800">Promotions</h3>
                  
                  {selectedOutlet.promotions && selectedOutlet.promotions.promotions && 
                   selectedOutlet.promotions.promotions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOutlet.promotions.promotions.map((promo:any, idx:any) => (
                        <div key={idx} className="p-2 bg-amber-50 rounded">
                          <div className="flex justify-between">
                            <span className="text-sm">
                              {promo.requirement.type === 'AMOUNT' 
                                ? `Min. Order: ₹${promo.requirement.minimumOrderAmount}` 
                                : `Payment: ${promo.requirement.paymentType}, Min: ₹${promo.requirement.minimumOrderAmount}`}
                            </span>
                            <Badge variant="outline" className="bg-amber-200 text-amber-800">
                              {promo.requirement.type}
                            </Badge>
                          </div>
                          <div className="mt-1 font-semibold text-green-700">
                            {promo.discount.type === 'PERCENTAGE'
                              ? `${promo.discount.value}% off${promo.discount.maxDiscount > 0 ? ` (up to ₹${promo.discount.maxDiscount})` : promo.discount.maxDiscount === -1 ? ' (no cap)' : ''}`
                              : `₹${promo.discount.value} off`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">No promotions specified</p>
                  )}
                </div>

                {/* Last Updated Information */}
                {(selectedOutlet.updated_by || selectedOutlet.updated_at) && (
                  <div className="space-y-1 md:col-span-2 mt-2 text-right text-sm text-amber-600">
                    {selectedOutlet.updated_by && <div>Last updated by: {selectedOutlet.updated_by}</div>}
                    {selectedOutlet.updated_at && <div>Last updated at: {selectedOutlet.updated_at}</div>}
                  </div>
                )}
                <div className="space-y-3 border border-amber-200 rounded-md p-3"><h3 className="font-bold text-amber-800">Business Information</h3><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Building className="h-4 w-4 text-amber-600" /><span className="font-medium">{selectedOutlet.company_name}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><FileText className="h-4 w-4 text-amber-600" /><span>PAN: {selectedOutlet.vendor_pan_number}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><FileText className="h-4 w-4 text-amber-600" /><span>GST: {selectedOutlet.gst}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><FileText className="h-4 w-4 text-amber-600" /><span>FSSAI: {selectedOutlet.fssai}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Calendar className="h-4 w-4 text-amber-600" /><span>FSSAI Valid till: {formatDate(selectedOutlet.fssai_valid)}</span></div></div>
                <div className="space-y-3 border border-amber-200 rounded-md p-3"><h3 className="font-bold text-amber-800">Location Information</h3><div className="grid grid-cols-[24px_1fr] items-center gap-2"><MapPin className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.address}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><MapPin className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.city}, {selectedOutlet.state}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><MapPin className="h-4 w-4 text-amber-600" /><span>Station: {selectedOutlet.station_name} ({selectedOutlet.station_code})</span></div></div>
                <div className="space-y-3 border border-amber-200 rounded-md p-3"><h3 className="font-bold text-amber-800">Contact Information</h3><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Phone className="h-4 w-4 text-amber-600" /><span>Primary: {selectedOutlet.phone}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Phone className="h-4 w-4 text-amber-600" /><span>Admin: {selectedOutlet.admin_phone}</span></div>{selectedOutlet.alternative_phones && selectedOutlet.alternative_phones.length > 0 && (<div className="grid grid-cols-[24px_1fr] items-center gap-2"><Phone className="h-4 w-4 text-amber-600" /><span>Alternative: {selectedOutlet.alternative_phones.join(', ')}</span></div>)}<div className="grid grid-cols-[24px_1fr] items-center gap-2"><Mail className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.email}</span></div>{selectedOutlet.rlname && (<><Separator /><h4 className="font-semibold text-amber-700">Representative</h4><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Building className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.rlname}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Phone className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.rlphone}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Mail className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.rlemail}</span></div></>)}</div>
                <div className="space-y-3 border border-amber-200 rounded-md p-3"><h3 className="font-bold text-amber-800">Operating Information</h3><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /><span>Hours: {selectedOutlet.opening_time} - {selectedOutlet.closing_time}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /><span>Order preparation time: {selectedOutlet.order_timing} minutes</span></div>{selectedOutlet.weeklyclosed && selectedOutlet.weeklyclosed.length > 0 && (<div className="grid grid-cols-[24px_1fr] items-center gap-2"><Calendar className="h-4 w-4 text-amber-600" /><span>Closed on: {selectedOutlet.weeklyclosed.join(', ')}</span></div>)}{selectedOutlet.closing_period && (<div className="grid grid-cols-[24px_1fr] items-center gap-2"><Calendar className="h-4 w-4 text-amber-600" /><span>Closed period: {selectedOutlet.closing_period}</span></div>)}</div>
                <div className="space-y-3 border border-amber-200 rounded-md p-3 md:col-span-2"><h3 className="font-bold text-amber-800">Order Information</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="grid grid-cols-[24px_1fr] items-center gap-2"><IndianRupee className="h-4 w-4 text-amber-600" /><span>Minimum order: ₹{selectedOutlet.min_order_amount}</span></div><div className="grid grid-cols-[24px_1fr] items-center gap-2"><CreditCard className="h-4 w-4 text-amber-600" /><span>{selectedOutlet.prepaid ? "Prepaid accepted" : "COD only"}</span></div><div className="flex flex-col"><span className="text-sm font-medium flex items-center gap-1"><Tag className="h-4 w-4 text-amber-600" /> Tags:</span><div className="flex flex-wrap gap-1 mt-1">{selectedOutlet.tags && selectedOutlet.tags.split(',').map((tag:any, idx:any) => (<span key={idx} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">{tag.trim()}</span>))}</div></div></div></div>
                <div className="space-y-3 border border-amber-200 rounded-md p-3"><h3 className="font-bold text-amber-800">Delivery Charges</h3>{selectedOutlet.delivery_charges && selectedOutlet.delivery_charges.length > 0 ? (<div className="space-y-2">{selectedOutlet.delivery_charges.map((charge:any, idx:any) => (<div key={idx} className="flex justify-between p-2 bg-amber-50 rounded"><span>Orders above ₹{charge.amountMoreThan}</span><span className="font-medium">₹{charge.deliveryFee}</span></div>))}</div>) : (<p className="text-sm text-amber-600">No delivery charges specified</p>)}</div>
                <div className="space-y-3 border border-amber-200 rounded-md p-3"><h3 className="font-bold text-amber-800">Promotions</h3>{selectedOutlet.promotions && selectedOutlet.promotions.promotions && selectedOutlet.promotions.promotions.length > 0 ? (<div className="space-y-2">{selectedOutlet.promotions.promotions.map((promo:any, idx:any) => (<div key={idx} className="p-2 bg-amber-50 rounded"><div className="flex justify-between"><span className="text-sm">{promo.requirement.type === 'AMOUNT' ? `Min. Order: ₹${promo.requirement.minimumOrderAmount}` : `Payment: ${promo.requirement.paymentType}, Min: ₹${promo.requirement.minimumOrderAmount}`}</span><Badge variant="outline" className="bg-amber-200 text-amber-800">{promo.requirement.type}</Badge></div><div className="mt-1 font-semibold text-green-700">{promo.discount.type === 'PERCENTAGE' ? `${promo.discount.value}% off${promo.discount.maxDiscount > 0 ? ` (up to ₹${promo.discount.maxDiscount})` : promo.discount.maxDiscount === -1 ? ' (no cap)' : ''}` : `₹${promo.discount.value} off`}</div></div>))}</div>) : (<p className="text-sm text-amber-600">No promotions specified</p>)}</div>
                {(selectedOutlet.updated_by || selectedOutlet.updated_at) && (<div className="space-y-1 md:col-span-2 mt-2 text-right text-sm text-amber-600">{selectedOutlet.updated_by && <div>Last updated by: {selectedOutlet.updated_by}</div>}{selectedOutlet.updated_at && <div>Last updated at: {selectedOutlet.updated_at}</div>}</div>)}
              </div>
              <DialogFooter>
                <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleCloseDialog}><X className="mr-1 h-4 w-4" /> Close</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApproveFromDialog}><CheckCircle className="mr-1 h-4 w-4" /> Approve Outlet</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingOutlets;