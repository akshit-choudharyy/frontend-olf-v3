import { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Train,
  Store,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  Clock,
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Format currency with Indian Rupee symbol
const formatCurrency = (amount: any) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', '₹ ');
};

// Format date in a user-friendly way
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format time in 12-hour format
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Extended dummy data for withdrawal requests
const dummyWithdrawalRequests = [
  {
    request_id: 1001,
    outlet_id: 17,
    outlet_name: "Taste of India",
    station_name: "New Delhi Railway Station",
    station_code: "NDLS",
    requested_amount: 15000,
    wallet_balance: 17650.75,
    request_date: "2025-05-20T14:22:33.727Z",
    status: "pending"
  },
  {
    request_id: 1002,
    outlet_id: 23,
    outlet_name: "Spice Junction",
    station_name: "Mumbai Central",
    station_code: "MMCT",
    requested_amount: 8500,
    wallet_balance: 9200.50,
    request_date: "2025-05-19T18:15:42.727Z",
    status: "pending"
  },
  {
    request_id: 1003,
    outlet_id: 31,
    outlet_name: "South Express",
    station_name: "Chennai Central",
    station_code: "MAS",
    requested_amount: 22750,
    wallet_balance: 23100.25,
    request_date: "2025-05-21T09:47:11.727Z",
    status: "pending"
  },
  {
    request_id: 1004,
    outlet_id: 42,
    outlet_name: "Punjabi Dhaba",
    station_name: "Amritsar Junction",
    station_code: "ASR",
    requested_amount: 12500,
    wallet_balance: 14200.30,
    request_date: "2025-05-20T11:32:45.727Z",
    status: "pending"
  },
  {
    request_id: 1005,
    outlet_id: 56,
    outlet_name: "Bengali Sweets",
    station_name: "Howrah Junction",
    station_code: "HWH",
    requested_amount: 18750,
    wallet_balance: 19800.25,
    request_date: "2025-05-21T08:15:22.727Z",
    status: "pending"
  },
  {
    request_id: 1006,
    outlet_id: 64,
    outlet_name: "Gujarat Thali",
    station_name: "Ahmedabad Junction",
    station_code: "ADI",
    requested_amount: 9800,
    wallet_balance: 11200.75,
    request_date: "2025-05-19T16:45:33.727Z",
    status: "pending"
  },
  {
    request_id: 1007,
    outlet_id: 73,
    outlet_name: "Karnataka Coffee",
    station_name: "Bengaluru City Junction",
    station_code: "SBC",
    requested_amount: 14500,
    wallet_balance: 16300.50,
    request_date: "2025-05-20T10:20:18.727Z",
    status: "pending"
  },
  {
    request_id: 1008,
    outlet_id: 85,
    outlet_name: "Rajasthani Rasoi",
    station_name: "Jaipur Junction",
    station_code: "JP",
    requested_amount: 17250,
    wallet_balance: 18500.25,
    request_date: "2025-05-21T07:35:42.727Z",
    status: "pending"
  }
];

// Pagination component with improved styling
const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {[...Array(totalPages)].map((_, i) => (
          <Button
            key={i}
            variant={currentPage === i + 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(i + 1)}
            className={`h-8 w-8 p-0 ${currentPage === i + 1 ? 'bg-slate-800' : ''}`}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Withdrawal confirmation dialog component
const WithdrawalConfirmationDialog = ({ isOpen, onClose, request, onConfirm }: { isOpen: boolean, onClose: () => void, request: any, onConfirm: (id: number) => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleWithdraw = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      // In real implementation, you would call your API here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onConfirm(request.request_id);
      toast.success(`Withdrawal for ${request.outlet_name} processed successfully!`);
      onClose();
    } catch (error) {
      toast.error("Failed to process withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!request) return null;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to process the following withdrawal request:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-slate-50 p-4 rounded-lg my-4">
          <div className="flex items-start gap-3 mb-3">
            <Store className="h-5 w-5 text-slate-500 mt-0.5" />
            <div>
              <h3 className="font-medium">{request.outlet_name}</h3>
              <p className="text-sm text-slate-500">{request.station_name} ({request.station_code})</p>
              <div className="flex items-center mt-1.5 text-xs text-slate-500">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(request.request_date)}
                <Clock className="h-3 w-3 ml-2 mr-1" />
                {formatTime(request.request_date)}
              </div>
            </div>
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Requested Amount</p>
              <p className="text-lg font-medium text-green-700">{formatCurrency(request.requested_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Wallet Balance</p>
              <p className="text-lg font-medium">{formatCurrency(request.wallet_balance)}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <p className="text-sm text-amber-700">
                This action will transfer funds to the vendor's registered bank account.
              </p>
            </div>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleWithdraw}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Withdraw Funds
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Mobile card component for withdrawal requests with improved UI
const WithdrawalRequestCard = ({ request, onWithdraw }: { request: any, onWithdraw: (request: any) => void }) => {
  return (
    <Card className="mb-3 overflow-hidden border-slate-200">
      <CardHeader className="p-4 pb-2 bg-slate-50 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">#{request.request_id}</span>
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>
          </div>
          <div className="text-xs text-slate-500">
            {formatDate(request.request_date)}
          </div>
        </div>
        <CardDescription className="mt-1">
          <div className="flex items-center">
            <Store className="h-3 w-3 mr-1 text-slate-400" />
            {request.outlet_name}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs text-slate-500 mb-1">Requested Amount</h4>
            <p className="text-lg font-medium text-green-600">{formatCurrency(request.requested_amount)}</p>
          </div>
          <div>
            <h4 className="text-xs text-slate-500 mb-1">Wallet Balance</h4>
            <p className="text-lg font-medium">{formatCurrency(request.wallet_balance)}</p>
          </div>
        </div>
        
        <div className="flex items-center mt-4">
          <Train className="h-4 w-4 text-slate-400 mr-2" />
          <span className="text-sm text-slate-600">{request.station_name} ({request.station_code})</span>
        </div>
        
        <div className="mt-4">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={() => onWithdraw(request)}
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Process Withdrawal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Status Badge component
const StatusBadge = ({ status }: { status: string }) => {
  let colorClasses = "";
  let label = "";
  
  switch (status) {
    case "pending":
      colorClasses = "bg-amber-50 text-amber-600 border-amber-200";
      label = "Pending";
      break;
    case "processing":
      colorClasses = "bg-blue-50 text-blue-600 border-blue-200";
      label = "Processing";
      break;
    case "completed":
      colorClasses = "bg-green-50 text-green-600 border-green-200";
      label = "Completed";
      break;
    case "rejected":
      colorClasses = "bg-red-50 text-red-600 border-red-200";
      label = "Rejected";
      break;
    default:
      colorClasses = "bg-slate-50 text-slate-600 border-slate-200";
      label = status;
  }
  
  return (
    <Badge variant="outline" className={`${colorClasses} capitalize`}>
      {label}
    </Badge>
  );
};

// Main withdrawal requests component with improved Table UI
const WithdrawalRequests = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<any>(dummyWithdrawalRequests);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<any>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Sorting state
  const [sortField, setSortField] = useState<any>("request_date");
  const [sortDirection, setSortDirection] = useState<any>("desc");
  
  // Sort the data
  const sortedRequests = [...withdrawalRequests].sort((a, b) => {
    if (sortField === "request_date") {
      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortField === "requested_amount" || sortField === "wallet_balance") {
      return sortDirection === "asc" 
        ? a[sortField] - b[sortField] 
        : b[sortField] - a[sortField];
    } else {
      // String comparison for other fields
      return sortDirection === "asc"
        ? a[sortField].toString().localeCompare(b[sortField].toString())
        : b[sortField].toString().localeCompare(a[sortField].toString());
    }
  });
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  
  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Handle opening the confirmation dialog
  const handleWithdraw = (request: any) => {
    setSelectedRequest(request);
    setIsConfirmDialogOpen(true);
  };
  
  // Handle confirmation of withdrawal
  const handleConfirmWithdrawal = (requestId: number) => {
    // In a real implementation, this would update the database
    // For now, we'll just update our local state
    setWithdrawalRequests((prevRequests:any) => 
      prevRequests.filter((req:any) => req.request_id !== requestId)
    );
    
    // Adjust current page if necessary after removal
    if (currentItems.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Generate table header with sort functionality
  const SortableTableHeader = ({ field, label }: { field: string, label: string }) => (
    <TableHead>
      <button 
        className="flex items-center font-semibold text-slate-700 hover:text-slate-900 focus:outline-none"
        onClick={() => handleSort(field)}
      >
        {label}
        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === field ? 'text-slate-900' : 'text-slate-400'}`} />
      </button>
    </TableHead>
  );
  
  return (
    <div className="container mx-auto px-4 py-1">
      <Toaster position="top-right" />
      
      {/* Confirmation Dialog */}
      <WithdrawalConfirmationDialog 
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        request={selectedRequest}
        onConfirm={handleConfirmWithdrawal}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Withdrawal Requests</h1>
      </div>
      
      {/* Items per page selector */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-600">per page</span>
        </div>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden">
        {withdrawalRequests.length > 0 ? (
          <>
            <div className="space-y-4">
              {currentItems.map(request => (
                <WithdrawalRequestCard
                  key={request.request_id}
                  request={request}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <IndianRupee className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Pending Withdrawals</h3>
              <p className="text-sm text-slate-500">
                There are no pending withdrawal requests at this time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Desktop View with Improved Table */}
      <div className="hidden md:block">
        <Card className="shadow-sm">
          <CardHeader className="p-5 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-slate-800">Pending Withdrawal Requests</CardTitle>
                <CardDescription className="mt-1">
                  Process vendor withdrawal requests to transfer funds to their registered bank accounts.
                </CardDescription>
              </div>
              {withdrawalRequests.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">
                  {withdrawalRequests.length} Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {withdrawalRequests.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-200">
                        <SortableTableHeader field="request_id" label="Request ID" />
                        <TableHead className="font-semibold text-slate-700">Outlet Details</TableHead>
                        <SortableTableHeader field="requested_amount" label="Requested Amount" />
                        <SortableTableHeader field="wallet_balance" label="Wallet Balance" />
                        <SortableTableHeader field="request_date" label="Request Date" />
                        <TableHead className="font-semibold text-slate-700 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map(request => (
                        <TableRow key={request.request_id} className="group hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                            #{request.request_id}
                            <div className="text-xs text-slate-500 mt-1">
                              <StatusBadge status={request.status} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{request.outlet_name}</span>
                              <span className="text-xs text-slate-500">ID: {request.outlet_id}</span>
                              <div className="flex items-center mt-1">
                                <Train className="h-3 w-3 text-slate-400 mr-1" />
                                <span className="text-xs text-slate-500">
                                  {request.station_name} ({request.station_code})
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-lg font-medium text-green-600 whitespace-nowrap">
                              {formatCurrency(request.requested_amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-700 whitespace-nowrap">
                              {formatCurrency(request.wallet_balance)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="whitespace-nowrap">
                              <div className="font-medium text-slate-700">{formatDate(request.request_date)}</div>
                              <div className="text-xs text-slate-500">{formatTime(request.request_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              className="bg-green-600 hover:bg-green-700 shadow-sm transition-all group-hover:shadow" 
                              onClick={() => handleWithdraw(request)}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                              Withdraw
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="text-sm text-slate-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, withdrawalRequests.length)} of {withdrawalRequests.length} entries
                  </div>
                  
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <IndianRupee className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No Pending Withdrawals</h3>
                <p className="text-sm text-slate-500">
                  There are no pending withdrawal requests at this time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalRequests;