import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Added useMutation, useQueryClient
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Added Dialog imports
import { Label } from "@/components/ui/label"; // Added Label import
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Phone,
  Star,
  Package,
  Calendar,
  User,
  Shield,
  Plus // Added Plus icon
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';

// Define delivery person interface
interface DeliveryPerson {
  del_id: number;
  name: string;
  phone: string;
  docs: string;
  docs_exp: string;
  rating: number;
  total_del: number;
  del_profile: string;
  aadhar: string;
  outlet_id: number;
  verified: boolean;
}

interface DeliveryPersonsProps {
  outletId?: number; 
}

const DeliveryPersons: React.FC<DeliveryPersonsProps> = ({ outletId }) => {
  const queryClient = useQueryClient(); // Initialize Query Client
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterVerified, setFilterVerified] = useState('all');
  const [filterRating, setFilterRating] = useState('all');

  // Add Person Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    aadhar: '',
    outlet_id: outletId ? String(outletId) : '',
    // Default values to prevent DB errors if columns not nullable
    rating: 5,
    total_del: 0,
    verified: false,
    docs: 'Pending',
    docs_exp: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] // 1 year from now
  });

  const { 
    isPending, 
    error: queryError, 
    data: allDeliveryPersons = [],
    refetch
  } = useQuery({
    queryKey: ['delivery-persons', outletId],
    queryFn: () => {
      const params = outletId ? { outlet_id: outletId } : {};
      return olfService.get('/dels', { params }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      });
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: false,
  });

  // --- MUTATION TO ADD DELIVERY PERSON ---
  const createMutation = useMutation({
    mutationFn: (newPerson: any) => {
      // Backend expects payload. Your CreateEntity maps keys to columns.
      return olfService.post('/del', newPerson);
    },
    onSuccess: (res) => {
      if(res.data.status === 1) {
        toast.success('Delivery person added successfully!');
        setIsAddOpen(false);
        setFormData({
            name: '',
            phone: '',
            aadhar: '',
            outlet_id: outletId ? String(outletId) : '',
            rating: 5,
            total_del: 0,
            verified: false,
            docs: 'Pending',
            docs_exp: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        });
        // Invalidate query to refresh table
        queryClient.invalidateQueries({ queryKey: ['delivery-persons'] });
      } else {
        toast.error(res.data.info || 'Failed to add delivery person');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.info || error.message || 'Something went wrong');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = () => {
    if (!formData.name || !formData.phone || !formData.outlet_id) {
      toast.error("Name, Phone and Outlet ID are required");
      return;
    }
    createMutation.mutate(formData);
  };

  // --- FILTERS LOGIC ---
  const filteredDeliveryPersons = React.useMemo(() => {
    return allDeliveryPersons?.filter((person: DeliveryPerson) => {
      const matchesSearch = 
        person.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        person.phone?.includes(searchTerm) ||
        person.aadhar?.includes(searchTerm) ||
        String(person.del_id).includes(searchTerm);
      
      const matchesVerified = filterVerified === 'all' ? true :
        (filterVerified === 'verified' ? person.verified === true : person.verified === false);
      
      const matchesRating = filterRating === 'all' ? true :
        (filterRating === 'high' ? person.rating >= 4 : 
         filterRating === 'medium' ? person.rating >= 2 && person.rating < 4 :
         person.rating < 2);
      
      return matchesSearch && matchesVerified && matchesRating;
    });
  }, [allDeliveryPersons, searchTerm, filterVerified, filterRating]);

  const totalPages = Math.ceil(filteredDeliveryPersons.length / itemsPerPage);
  const paginatedDeliveryPersons = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDeliveryPersons.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeliveryPersons, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterVerified, filterRating, itemsPerPage]);

  const handleVerificationToggle = async (delId: number, currentStatus: boolean) => {
    try {
      await olfService.put(`/del/${delId}`, { verified: !currentStatus });
      refetch();
      toast.success(`Delivery person ${currentStatus ? 'unverified' : 'verified'} successfully!`);
    } catch (error) {
      toast.error(`Failed to update verification status!`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const isDocExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
    ));
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading delivery persons: {(queryError as Error).message}</div>;

  return (
    <div className="mx-4">
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#363636', color: '#fff', borderRadius: '10px' } }} />
      
      <Card className="border-none">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-blue-800">Delivery Persons</CardTitle>
            <div className="flex gap-4 items-center">
                <div className="text-sm text-blue-600 hidden md:block">
                Total: {filteredDeliveryPersons.length}
                </div>
                
                {/* --- ADD NEW PERSON BUTTON & MODAL --- */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                      <Plus className="h-4 w-4" /> Add Person
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Delivery Person</DialogTitle>
                      <DialogDescription>
                        Enter the details of the new delivery executive here.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          className="col-span-3" 
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleInputChange} 
                          className="col-span-3" 
                          placeholder="9876543210"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="aadhar" className="text-right">Aadhar</Label>
                        <Input 
                          id="aadhar" 
                          name="aadhar" 
                          value={formData.aadhar} 
                          onChange={handleInputChange} 
                          className="col-span-3" 
                          placeholder="1234 5678 9012"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="outlet_id" className="text-right">Outlet ID</Label>
                        <Input 
                          id="outlet_id" 
                          name="outlet_id" 
                          type="number"
                          value={formData.outlet_id} 
                          onChange={handleInputChange} 
                          className="col-span-3" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleAddSubmit}
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? 'Saving...' : 'Save changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* --- END MODAL --- */}

            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-1 pt-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-500" />
              <Input
                placeholder="Search delivery persons..."
                className="pl-8 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[120px] border-blue-200">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mb-2 p-2 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-700">Verification Status</label>
                  <Select value={filterVerified} onValueChange={setFilterVerified}>
                    <SelectTrigger className="border-blue-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Rating</label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="border-blue-200">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="high">4+ Stars</SelectItem>
                      <SelectItem value="medium">2-4 Stars</SelectItem>
                      <SelectItem value="low">Below 2 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Persons Table */}
          <div className="border border-blue-200 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-blue-100">
                  <TableRow className="hover:bg-blue-100/80">
                    <TableHead className="font-bold text-blue-800 border border-blue-200">DEL ID</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">PERSON</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">CONTACT</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">DOCUMENTS</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">PERFORMANCE</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">VERIFIED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeliveryPersons.length > 0 ? (  
                    paginatedDeliveryPersons.map((person: DeliveryPerson) => (
                      <TableRow key={person.del_id} className="hover:bg-blue-50">
                        <TableCell className="border border-blue-200">
                          <span className='text-lg text-blue-500 font-semibold'># {person.del_id}</span>
                        </TableCell>
                        <TableCell className="font-medium text-blue-900 border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-50 flex-shrink-0">
                              {person.del_profile ? (
                                <img src={person.del_profile} alt={person.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                                  <User className="w-6 h-6 text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-base">{person.name}</div>
                              <div className="text-xs text-blue-600">Outlet ID: {person.outlet_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col text-sm space-y-1">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 text-blue-600 mr-2" />
                              <span className="font-medium">{person.phone}</span>
                            </div>
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 text-blue-600 mr-2" />
                              <span className="text-xs">Aadhar: {person.aadhar}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col text-sm space-y-1">
                            <div className="flex items-center">
                              <span className="font-medium">Doc: {person.docs}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 text-blue-600 mr-1" />
                              <span className={`text-xs ${isDocExpired(person.docs_exp) ? 'text-red-600 font-semibold' : 'text-blue-600'}`}>
                                Exp: {formatDate(person.docs_exp)}
                              </span>
                            </div>
                            {isDocExpired(person.docs_exp) && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                Expired
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col text-sm space-y-2">
                            <div className="flex items-center">
                              <div className="flex mr-2">
                                {renderStars(person.rating)}
                              </div>
                              <span className="text-xs">({person.rating}/5)</span>
                            </div>
                            <div className="flex items-center">
                              <Package className="h-3 w-3 text-blue-600 mr-1" />
                              <span className="text-xs">{person.total_del} deliveries</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col items-center space-y-2">
                            <Switch 
                              checked={person.verified}
                              onCheckedChange={() => handleVerificationToggle(person.del_id, person.verified)}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className={`text-xs px-2 py-1 rounded-full ${person.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {person.verified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center border border-blue-200">
                        No delivery persons found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-blue-700">
              Showing {Math.min(filteredDeliveryPersons.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredDeliveryPersons.length, currentPage * itemsPerPage)} of {filteredDeliveryPersons.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryPersons;