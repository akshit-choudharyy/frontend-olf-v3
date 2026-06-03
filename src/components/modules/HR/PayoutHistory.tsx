import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Search,
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Filter,
  Download,
  X
} from 'lucide-react';

// Payout History Component
const PayoutHistory = () => {
  // Sample payout data
  const [payouts] = useState([
    {
      paymentId: 'PAY001',
      paymentType: 'Account Transfer',
      amount: 65000,
      employeeName: 'Rajesh Kumar',
      employeeNumber: 'EMP001',
      employeeId: 1,
      paymentDate: '2025-05-15',
      totalPaymentToEmployee: 390000
    },
    {
      paymentId: 'PAY002',
      paymentType: 'Cash',
      amount: 28000,
      employeeName: 'Priya Sharma',
      employeeNumber: 'EMP002',
      employeeId: 2,
      paymentDate: '2025-05-15',
      totalPaymentToEmployee: 168000
    },
    {
      paymentId: 'PAY003',
      paymentType: 'Account Transfer',
      amount: 75000,
      employeeName: 'Amit Singh',
      employeeNumber: 'EMP003',
      employeeId: 3,
      paymentDate: '2025-04-28',
      totalPaymentToEmployee: 450000
    },
    {
      paymentId: 'PAY004',
      paymentType: 'Cheque',
      amount: 50000,
      employeeName: 'Sneha Patel',
      employeeNumber: 'EMP004',
      employeeId: 4,
      paymentDate: '2025-04-25',
      totalPaymentToEmployee: 300000
    },
    {
      paymentId: 'PAY005',
      paymentType: 'Account Transfer',
      amount: 95000,
      employeeName: 'Vikram Reddy',
      employeeNumber: 'EMP005',
      employeeId: 5,
      paymentDate: '2025-03-30',
      totalPaymentToEmployee: 570000
    },
    {
      paymentId: 'PAY006',
      paymentType: 'UPI',
      amount: 35000,
      employeeName: 'Anita Gupta',
      employeeNumber: 'EMP006',
      employeeId: 6,
      paymentDate: '2025-03-15',
      totalPaymentToEmployee: 210000
    },
    {
      paymentId: 'PAY007',
      paymentType: 'Account Transfer',
      amount: 80000,
      employeeName: 'Rohit Joshi',
      employeeNumber: 'EMP007',
      employeeId: 7,
      paymentDate: '2025-02-28',
      totalPaymentToEmployee: 480000
    },
    {
      paymentId: 'PAY008',
      paymentType: 'Cash',
      amount: 40000,
      employeeName: 'Kavya Nair',
      employeeNumber: 'EMP008',
      employeeId: 8,
      paymentDate: '2025-02-15',
      totalPaymentToEmployee: 240000
    },
    {
      paymentId: 'PAY009',
      paymentType: 'Account Transfer',
      amount: 85000,
      employeeName: 'Arjun Mehta',
      employeeNumber: 'EMP009',
      employeeId: 9,
      paymentDate: '2025-01-30',
      totalPaymentToEmployee: 510000
    },
    {
      paymentId: 'PAY010',
      paymentType: 'NEFT',
      amount: 55000,
      employeeName: 'Pooja Agarwal',
      employeeNumber: 'EMP010',
      employeeId: 10,
      paymentDate: '2025-01-15',
      totalPaymentToEmployee: 330000
    },
    {
      paymentId: 'PAY011',
      paymentType: 'Account Transfer',
      amount: 70000,
      employeeName: 'Suresh Yadav',
      employeeNumber: 'EMP011',
      employeeId: 11,
      paymentDate: '2024-12-30',
      totalPaymentToEmployee: 420000
    },
    {
      paymentId: 'PAY012',
      paymentType: 'UPI',
      amount: 45000,
      employeeName: 'Deepika Roy',
      employeeNumber: 'EMP012',
      employeeId: 12,
      paymentDate: '2024-12-15',
      totalPaymentToEmployee: 270000
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique payment types for filter
  const paymentTypes = ['All', ...new Set(payouts.map(payout => payout.paymentType))];

  // Get unique years and months for filters
  const years = [...new Set(payouts.map(payout => new Date(payout.paymentDate).getFullYear()))].sort((a, b) => b - a);
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Filter payouts based on search and filters
  const filteredPayouts = payouts.filter(payout => {
    const paymentDate = new Date(payout.paymentDate);
    
    // Search filter
    const matchesSearch = 
      payout.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Payment type filter
    const matchesPaymentType = paymentTypeFilter === 'All' || payout.paymentType === paymentTypeFilter;
    
    // Month filter
    const matchesMonth = !selectedMonth || 
      (paymentDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
    
    // Year filter
    const matchesYear = !selectedYear || 
      paymentDate.getFullYear().toString() === selectedYear;
    
    // Date range filter
    const matchesDateRange = (!startDate || paymentDate >= new Date(startDate)) &&
      (!endDate || paymentDate <= new Date(endDate));
    
    return matchesSearch && matchesPaymentType && matchesMonth && matchesYear && matchesDateRange;
  });

  // Get payment type badge color
  const getPaymentTypeBadgeColor = (type:any) => {
    switch (type) {
      case 'Account Transfer': return 'bg-blue-100 text-blue-700';
      case 'Cash': return 'bg-green-100 text-green-700';
      case 'Cheque': return 'bg-purple-100 text-purple-700';
      case 'UPI': return 'bg-orange-100 text-orange-700';
      case 'NEFT': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Format currency
  const formatCurrency = (amount:any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString:any) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setPaymentTypeFilter('All');
    setSelectedMonth('');
    setSelectedYear('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  // Calculate statistics
  const totalPayouts = filteredPayouts.reduce((sum, payout) => sum + payout.amount, 0);
  const uniqueEmployees = new Set(filteredPayouts.map(payout => payout.employeeId)).size;
  const averagePayout = filteredPayouts.length > 0 ? totalPayouts / filteredPayouts.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
                Payout History
              </h1>
              <p className="text-gray-600 mt-1">Track salary payments and compensation history</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Payouts</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPayouts)}</p>
                </div>
                <DollarSign className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Transactions</p>
                  <p className="text-2xl font-bold">{filteredPayouts.length}</p>
                </div>
                <CreditCard className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Employees Paid</p>
                  <p className="text-2xl font-bold">{uniqueEmployees}</p>
                </div>
                <Users className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Avg Payout</p>
                  <p className="text-2xl font-bold">{formatCurrency(averagePayout)}</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Payment Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={paymentTypeFilter}
                    onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Months</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Payment Records</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Payment ID, Employee Name, or Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.paymentId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="font-mono">
                          {payout.paymentId}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getPaymentTypeBadgeColor(payout.paymentType)}>
                          {payout.paymentType}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payout.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{payout.employeeName}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary">
                          {payout.employeeNumber}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600">{payout.employeeId}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{formatDate(payout.paymentDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-blue-600">
                          {formatCurrency(payout.totalPaymentToEmployee)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPayouts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payout records found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayoutHistory;