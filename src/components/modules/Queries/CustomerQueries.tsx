import { useState, useMemo } from 'react';
import { Search, Filter, Phone, Store, User, MessageSquare, Tag, AlertCircle, ChevronDown } from 'lucide-react';

// Mock data for demonstration
const mockData:any = [
  {
    id: 1,
    orderId: "ORD-2024-001",
    customerName: "Raj Sharma",
    customerPhone: "+91-9876543210",
    outletName: "Delhi Delights",
    adminNumber: "+91-9876543211",
    query: "My order was delivered cold and the food quality was poor. I ordered chicken biryani but it tasted stale.",
    status: "Open",
    queryType: "food quality"
  },
  {
    id: 2,
    orderId: "ORD-2024-002",
    customerName: "Priya Patel",
    customerPhone: "+91-9876543212",
    outletName: "Mumbai Masala",
    adminNumber: "+91-9876543213",
    query: "The app keeps crashing when I try to place an order. This has been happening for the past 3 days.",
    status: "In Progress",
    queryType: "technical issue"
  },
  {
    id: 3,
    orderId: "ORD-2024-003",
    customerName: "Arjun Singh",
    customerPhone: "+91-9876543214",
    outletName: "Punjabi Tadka",
    adminNumber: "+91-9876543215",
    query: "I was charged twice for the same order. Please process my refund immediately.",
    status: "Resolved",
    queryType: "refund"
  },
  {
    id: 4,
    orderId: "ORD-2024-004",
    customerName: "Kavya Reddy",
    customerPhone: "+91-9876543216",
    outletName: "South Indian Spice",
    adminNumber: "+91-9876543217",
    query: "Great service and food quality! The delivery was quick and the packaging was excellent. Keep up the good work!",
    status: "Resolved",
    queryType: "feedback"
  },
  {
    id: 5,
    orderId: "ORD-2024-005",
    customerName: "Vikram Gupta",
    customerPhone: "+91-9876543218",
    outletName: "Royal Rajasthani",
    adminNumber: "+91-9876543219",
    query: "The pizza was burnt and inedible. Very disappointed with the quality. This is the second time this has happened.",
    status: "Open",
    queryType: "food quality"
  },
  {
    id: 6,
    orderId: "ORD-2024-006",
    customerName: "Ananya Iyer",
    customerPhone: "+91-9876543220",
    outletName: "Chennai Corner",
    adminNumber: "+91-9876543221",
    query: "Unable to apply my discount coupon during checkout. The system shows an error message.",
    status: "In Progress",
    queryType: "technical issue"
  },
  {
    id: 7,
    orderId: "ORD-2024-007",
    customerName: "Rohit Agarwal",
    customerPhone: "+91-9876543222",
    outletName: "Kolkata Kitchen",
    adminNumber: "+91-9876543223",
    query: "The dal makhani was too salty and the naan was undercooked. Very poor quality compared to previous orders.",
    status: "Open",
    queryType: "food quality"
  },
  {
    id: 8,
    orderId: "ORD-2024-008",
    customerName: "Sneha Joshi",
    customerPhone: "+91-9876543224",
    outletName: "Gujarat Garden",
    adminNumber: "+91-9876543225",
    query: "Excellent thali! Everything was fresh and authentic. The delivery person was also very polite. Highly recommended!",
    status: "Resolved",
    queryType: "feedback"
  }
];

const statusStyles:any = {
  "Open": "bg-red-100 text-red-800 border border-red-200",
  "In Progress": "bg-yellow-100 text-yellow-800 border border-yellow-200",
  "Resolved": "bg-green-100 text-green-800 border border-green-200"
};

const queryTypeStyles:any = {
  "feedback": "bg-blue-100 text-blue-800 border border-blue-200",
  "technical issue": "bg-purple-100 text-purple-800 border border-purple-200",
  "food quality": "bg-orange-100 text-orange-800 border border-orange-200",
  "refund": "bg-pink-100 text-pink-800 border border-pink-200"
};

const StatusDropdown = ({ currentStatus, onStatusChange, queryId }:{currentStatus:any, onStatusChange:any, queryId:any}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleStatusChange = (newStatus:any) => {
    onStatusChange(queryId, newStatus);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${statusStyles[currentStatus]} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity`}
      >
        {currentStatus}
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-32">
          {["Open", "In Progress", "Resolved"].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                status === currentStatus ? 'bg-gray-100' : ''
              }`}
            >
              <span className={`${statusStyles[status]} px-2 py-1 rounded-full text-xs`}>
                {status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CustomerQueries() {
  const [data, setData] = useState(mockData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queryTypeFilter, setQueryTypeFilter] = useState("all");

  // Mock API call for status update
  const updateStatus = async (id:any, newStatus:any) => {
    try {
      // Simulate API call
      console.log(`Updating status for ID ${id} to ${newStatus}`);
      
      // Update local state
      setData((prevData:any) =>
        prevData.map((item:any) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
      
      // In real implementation, you would make the API call here:
      // const response = await fetch(`/api/queries/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
      
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter((item:any) => {
      const matchesSearch = searchTerm === "" || 
        item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerPhone.includes(searchTerm) ||
        item.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.query.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesQueryType = queryTypeFilter === "all" || item.queryType === queryTypeFilter;
      
      return matchesSearch && matchesStatus && matchesQueryType;
    });
  }, [data, searchTerm, statusFilter, queryTypeFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setQueryTypeFilter("all");
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Queries & Complaints</h1>
          <p className="text-gray-600 mt-2">Manage and track customer feedback and support requests</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border shadow-sm">
          <AlertCircle className="w-4 h-4" />
          {filteredData.length} of {data.length} queries showing
        </div>
      </div>

      {/* Summary Stats Pills */}
      <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
        <div className="bg-gradient-to-r from-red-500 to-red-600 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-lg font-bold">
            {data.filter((item:any) => item.status === 'Open').length}
          </span>
          <span className="text-sm font-medium">Open</span>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-lg font-bold">
            {data.filter((item:any) => item.status === 'In Progress').length}
          </span>
          <span className="text-sm font-medium">In Progress</span>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-lg font-bold">
            {data.filter((item:any) => item.status === 'Resolved').length}
          </span>
          <span className="text-sm font-medium">Resolved</span>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-lg font-bold">
            {data.length}
          </span>
          <span className="text-sm font-medium">Total</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, phone, outlet, or query..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-32"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={queryTypeFilter}
            onChange={(e) => setQueryTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-36"
          >
            <option value="all">All Types</option>
            <option value="feedback">Feedback</option>
            <option value="technical issue">Technical Issue</option>
            <option value="food quality">Food Quality</option>
            <option value="refund">Refund</option>
          </select>

          <button 
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer Details</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Outlet Details</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Query</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Query Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="w-8 h-8 text-gray-300" />
                      <p>No queries found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row:any) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-blue-600">{row.orderId}</span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{row.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{row.customerPhone}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{row.outletName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{row.adminNumber}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {row.query}
                        </p>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <StatusDropdown
                        currentStatus={row.status}
                        onStatusChange={updateStatus}
                        queryId={row.id}
                      />
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className={`${queryTypeStyles[row.queryType]} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
                        <Tag className="w-3 h-3" />
                        {row.queryType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div>
    
  );
}