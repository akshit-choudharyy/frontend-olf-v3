
// --- NEW: Imports for Razorpay logic and Modal UI ---
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
// --- END NEW ---

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Filter, Search, RefreshCw, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { olfService } from '@/utils/axiosInstance';
import ExportWallet from './ExportWallet';
import { useDebounce } from '@/hooks/useDebounce';

const WalletHistory = ({ outletid }: { outletid: any }) => {
  // --- NEW: State for the deposit modal and payment process ---
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { Razorpay } = useRazorpay();
  const queryClient = useQueryClient();
  // --- END NEW ---

   const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('credit'); // 'credit' or 'debit'
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isProcessingAdjustment, setIsProcessingAdjustment] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all');

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

 const { data: outletData, isPending: isOutletPending } = useQuery({
  queryKey: ['outletDetails', outletid],
  queryFn: () =>
    olfService.get('/restraunts', {
      // REMOVE status and verified here
      params: { outlet_id: outletid } 
    }).then((res) => res?.data?.data?.rows[0]),
  enabled: !!outletid,
  refetchOnWindowFocus: true,
});

 const walletBalance = outletData?.wallet_amount ?? 0;


  const { isPending, data, refetch } = useQuery({
    queryKey: ['wallet-history', outletid, currentPage, itemsPerPage, filterType, dateRange, debouncedSearchTerm],
    queryFn: () => {
      const params = {
        outlet_id: outletid,
        page: currentPage - 1, limit: itemsPerPage,
        search: debouncedSearchTerm || undefined,
        filter_by: filterType !== 'all' ? filterType : undefined,
        from_date: dateRange.start || undefined,
        to_date: dateRange.end || undefined,
      };
      return olfService.get('/vendor/wallet', { params }).then((res) => res?.data?.data);
    },
    enabled: !!outletid,
    refetchOnWindowFocus: false,
  });

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    setIsProcessingPayment(true);
    try {
      const orderResponse = await olfService.post('/rzp/create-order', { amount, currency: "INR" });
      const razorpayOrder = orderResponse.data.data;

      const options: RazorpayOrderOptions = {
        key: "rzp_test_JcjOC7WXfkQbdm", // Replace with env variable
        amount: razorpayOrder.amount, currency: "INR",
        name: "OLF Vendor Wallet",
        description: `Deposit for Outlet ID: ${outletid}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            await olfService.post('/vendor/wallet/deposit', {
              outlet_id: outletid, amount,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert(`Successfully deposited ${formatCurrency(amount)}!`);
            await queryClient.invalidateQueries({ queryKey: ['outletDetails', outletid] });
            await queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
            setIsDepositModalOpen(false);
            setDepositAmount('');
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            alert("Could not verify your payment. Please contact support.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: { name: outletData?.outlet_name || "Vendor", contact: outletData?.mobile || "" },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => { setIsProcessingPayment(false); } }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Failed to create Razorpay order:", error);
      alert("Could not initiate payment. Please try again.");
      setIsProcessingPayment(false);
    }
    
  };

  const handleManualAdjustment = async () => {
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    if (!adjustmentReason.trim()) {
      alert("Please provide a reason for the adjustment.");
      return;
    }

    setIsProcessingAdjustment(true);
    try {
      // This calls the NEW backend endpoint you just created
      await olfService.post('/vendor/wallet/manual-adjustment', {
        outlet_id: outletid,
        amount: amount,
        type: adjustmentType,
        reason: adjustmentReason,
      });

      alert(`Successfully processed a ${adjustmentType} of ${formatCurrency(amount)}!`);
      
      await queryClient.invalidateQueries({ queryKey: ['outletDetails', outletid] });
      await queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
      
      setIsAdjustmentModalOpen(false);
      setAdjustmentAmount('');
      setAdjustmentType('credit');
      setAdjustmentReason('');

    } catch (error) {
      console.error("Failed to process manual adjustment:", error);
      alert("Could not process the adjustment. Please check the details and try again.");
    } finally {
      setIsProcessingAdjustment(false);
    }
  };

  const transactions = data?.rows || [];
  const totalTransactions = data?.total || 0;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  // FIX 1: The body of this function was missing. I've restored it.
  const formatDate = (dateString: any) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: any): string => {
    if (amount === null || amount === undefined || isNaN(parseFloat(amount))) { return '₹--'; }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

const getTransactionTypeBadge = (transactionType: any) => {
    // Default variant
    let variant: "default" | "secondary" | "destructive" | "outline" = 'secondary';
    // Additional classes for custom colors
    let className = 'text-xs'; 

    switch (transactionType) {
      case 'ORDER_SETTLEMENT':
        variant = 'default';
        break;
      case 'CREDIT_BY_ADMIN':
        // Custom style for admin credits to make them stand out
        className += ' bg-blue-100 text-blue-800 border-blue-200';
        break;
      case 'DEBIT_BY_ADMIN':
        // Custom style for admin debits
        className += ' bg-yellow-100 text-yellow-800 border-yellow-200';
        break;
      case 'RAZORPAY_DEPOSIT': // Let's also style the deposits you already have
        className += ' bg-green-100 text-green-800 border-green-200';
        break;
    }

    return (
      <Badge variant={variant} className={className}>
        {transactionType?.replace(/_/g, ' ') || 'N/A'}
      </Badge>
    );
  };

  const clearFilters = () => {
    setFilterType('all');
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <>
      <Card >
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-xl font-semibold">Wallet Transaction History</CardTitle>

            <div className="flex items-center gap-4">
              <div
                onClick={() => setIsDepositModalOpen(true)}
                className="flex items-center gap-2 bg-green-50 p-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-green-700 font-medium leading-tight">Add Deposit</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border">
                <Wallet className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  {isOutletPending ? (
                    <span className="text-xs font-bold animate-pulse">Loading...</span>
                  ) : (
                    <span
                      className={`font-bold text-sm leading-tight ${walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {formatCurrency(walletBalance)}
                    </span>
                  )}
                </div>
              </div>

              <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isPending}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
                          <div
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="flex items-center gap-2 bg-blue-50 p-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-blue-700 font-medium leading-tight">Manual Adjustment</span>
                </div>
              </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by Order ID, User, Transaction ID, or Description..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
            <ExportWallet outletid={outletid} dateRange={dateRange} />

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterType} onValueChange={(value) => { setFilterType(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credit Only</SelectItem>
                  <SelectItem value="debit">Debit Only</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input type="date" value={dateRange.start} onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }} className="w-full sm:w-auto" />
                <Input type="date" value={dateRange.end} onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }} className="w-full sm:w-auto" />
              </div>

              <Button variant="outline" onClick={clearFilters} size="sm"> Clear </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isPending ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found matching your criteria.
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  {/* FIX 2: The TableHeader content was missing. I've restored it. */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>Opening Balance</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Updated By</TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* FIX 3: The TableBody content was missing. I've restored it. */}
                  <TableBody>
                    {transactions.map((transaction: any) => (
                      <TableRow key={transaction.wallet_id}>
                        <TableCell>
                          <span className="font-medium">{transaction.order_id ? `#${transaction.order_id}` : 'N/A'}</span>
                        </TableCell>
                        <TableCell className="font-medium">{formatDate(transaction.transaction_date)}</TableCell>
                        <TableCell>{getTransactionTypeBadge(transaction.transaction_type)}</TableCell>
                        <TableCell><span className="text-sm text-gray-600">{transaction.description}</span></TableCell>
                        <TableCell><span className="font-medium">{formatCurrency(transaction.net_amount)}</span></TableCell>
                        <TableCell><span className="font-medium">{formatCurrency(transaction.opening_balance)}</span></TableCell>
                        <TableCell><span className="text-green-600 font-semibold">{parseFloat(transaction.credit) > 0 ? formatCurrency(transaction.credit) : '-'}</span></TableCell>
                        <TableCell><span className="text-red-600 font-semibold">{parseFloat(transaction.debit) > 0 ? formatCurrency(transaction.debit) : '-'}</span></TableCell>
                        <TableCell><span className={`font-medium ${parseFloat(transaction.margin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(transaction.margin)}</span></TableCell>
                        <TableCell><span className="font-medium">{formatCurrency(transaction.current_balance)}</span></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{transaction.updated_by}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* FIX 4: The Pagination UI was missing. I've restored it. */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}. Showing {transactions.length} of {totalTransactions} transactions.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isPending}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || isPending}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Deposit to Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to add to your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label htmlFor="amount">Amount (INR)</label>
            <Input
              id="amount" type="number"
              placeholder="e.g., 5000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleDeposit} disabled={isProcessingPayment || !depositAmount}>
              {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessingPayment ? "Processing..." : `Proceed to Pay ${formatCurrency(depositAmount || 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manual Wallet Adjustment</DialogTitle>
            <DialogDescription>
              Directly credit or debit the outlet's wallet. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="adjustment-type" className="text-right">Type</label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select adjustment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                  <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <label htmlFor="adjustment-amount" className="text-right">Amount (INR)</label>
              <Input
                id="adjustment-amount" type="number"
                placeholder="e.g., 500"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <label htmlFor="adjustment-reason" className="text-right">Reason</label>
               <Input
                id="adjustment-reason"
                placeholder="e.g., Performance Bonus"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleManualAdjustment} disabled={isProcessingAdjustment || !adjustmentAmount || !adjustmentReason}>
              {isProcessingAdjustment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessingAdjustment ? "Processing..." : `Submit Adjustment`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </>
  );
};

export default WalletHistory;