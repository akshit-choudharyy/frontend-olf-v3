import React, { useState, useEffect } from 'react';
// import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Search, 
  Filter, 
  User, 
  Edit, 
  Trash, 
  Mail,
  Phone,
  MapPin,
  Building,
  Plus,
  ArrowLeft
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';

import { olfService } from '@/utils/axiosInstance';
import AddVendor from './AddVendor';
import EditVendor from './EditVendor';
import ExportVendor from './ExportVendors';
// Import the new component
import ViewVendorOutlets from './ViewVendorOutlets';

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  vendor_phone: string;
  vendor_email: string;
  vendor_address: string;
}

const Vendors = () => {
  // const navigate = useNavigate();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters state (can be expanded as needed)
  const [filterCity, setFilterCity] = useState('all');
  const [filterState, setFilterState] = useState('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // --- NEW STATE FOR OUTLET POPUP ---
  const [isOutletDialogOpen, setIsOutletDialogOpen] = useState(false);
  const [selectedVendorForOutlets, setSelectedVendorForOutlets] = useState<Vendor | null>(null);

  // Query to fetch vendors data
  const { 
    isPending, 
    error: queryError, 
    data: allVendors = [],
    refetch
  } = useQuery({
    queryKey: ['vendors'],
    queryFn: () =>
      olfService.get('/rest-vendor').then((res) => {
        if (!res.data || res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      }),
  });

  // Extract cities and states from vendor addresses for filtering
  const extractLocationData = (vendors: Vendor[]) => {
    const cities = new Set<string>();
    const states = new Set<string>();
    
    vendors.forEach(vendor => {
      const addressParts = vendor.vendor_address.split(',');
      if (addressParts.length >= 2) {
        cities.add(addressParts[1].trim());
      }
      if (addressParts.length >= 3) {
        states.add(addressParts[2].trim());
      }
    });
    
    return {
      cities: Array.from(cities),
      states: Array.from(states)
    };
  };
  
  const { cities, states } = React.useMemo(() => extractLocationData(allVendors), [allVendors]);

  // Apply filters to vendors
  const filteredVendors = React.useMemo(() => {
    return allVendors.filter((vendor: Vendor) => {
      // Apply search filter
      const matchesSearch = 
        vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendor_phone.includes(searchTerm) ||
        vendor.vendor_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply city filter
      const matchesCity = filterCity === 'all' ? true : 
        vendor.vendor_address.toLowerCase().includes(filterCity.toLowerCase());
      
      // Apply state filter
      const matchesState = filterState === 'all' ? true : 
        vendor.vendor_address.toLowerCase().includes(filterState.toLowerCase());
      
      return matchesSearch && matchesCity && matchesState;
    });
  }, [allVendors, searchTerm, filterCity, filterState]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const paginatedVendors = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCity, filterState, itemsPerPage]);

  // Handle opening dialogs
  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditDialogOpen(true);
  };

  // Handle successful operations
  const handleOperationSuccess = () => {
    refetch();
    toast.success('Operation completed successfully!', {
      style: {
        borderRadius: '10px',
        background: 'black',
        color: 'white',
      },
      duration: 3000,
    });
  };

  // --- UPDATED: Handle view outlets ---
  // Now opens a popup instead of navigating
  const handleViewOutlets = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVendorForOutlets(vendor);
    setIsOutletDialogOpen(true);
  };

  // Handle delete vendor
  const handleDeleteVendor = async (vendorId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm("Are you sure you want to delete this vendor? This will also delete all associated outlets.")) {
      try {
        await olfService.delete(`/rest-vendor/${vendorId}`);
        refetch();
        toast.success('Vendor deleted successfully!', {
          style: {
            borderRadius: '10px',
            background: 'black',
            color: 'white',
          },
          duration: 3000,
        });
      } catch (error) {
        toast.error(`Failed to delete vendor! ${error}`, {
          style: {
            borderRadius: '10px',
            background: 'black',
            color: 'red',
          },
          duration: 4000,
        });
      }
    }
  };

  // Handle row click
  const handleRowClick = (vendor: Vendor) => {
    openEditDialog(vendor);
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading vendors: {(queryError as Error).message}</div>;

  return (
    <div className="mx-4">
      <Button className='m-2 bg-green-400' onClick={()=>window.history.back()}><ArrowLeft/></Button>

      {/* Toaster for notifications */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
          }
        }}
      />
      
      <Card className="border-none">
        <CardHeader className="bg-green-50 p-2">

          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-green-800">Vendors</CardTitle>
            <Button 
              onClick={openAddDialog}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Vendor
            </Button>
          </div>
          <ExportVendor data={allVendors} isLoading={isPending}/>
        </CardHeader>
        
        <CardContent className="p-1">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
              <Input
                placeholder="Search vendors..."
                className="pl-8 border-green-200 focus:border-green-500 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[120px] border-green-200">
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
            <div className="mb-2 p-2 bg-green-50 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-green-700">City</label>
                  <Select 
                    value={filterCity} 
                    onValueChange={setFilterCity}
                  >
                    <SelectTrigger className="border-green-200">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-green-700">State</label>
                  <Select 
                    value={filterState} 
                    onValueChange={setFilterState}
                  >
                    <SelectTrigger className="border-green-200">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Table */}
          <div className="border border-green-200 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-green-100">
                  <TableRow className="hover:bg-green-100/80">
                    <TableHead className="font-bold text-green-800 border border-green-200">VENDOR NAME</TableHead>
                    <TableHead className="font-bold text-green-800 border border-green-200">CONTACT INFO</TableHead>
                    <TableHead className="font-bold text-green-800 border border-green-200">ADDRESS</TableHead>
                    <TableHead className="font-bold text-green-800 border border-green-200">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.length > 0 ? (  
                    paginatedVendors.map((vendor: Vendor) => (
                      <TableRow 
                        key={vendor.vendor_id} 
                        className="hover:bg-green-50 cursor-pointer"
                        onClick={() => handleRowClick(vendor)}
                      >
                        <TableCell className="font-medium text-green-900 border border-green-200">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-green-700" />
                            </div>
                            <div className="font-semibold">{vendor.vendor_name}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="border border-green-200">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 text-green-600 mr-1" />
                              <span className="font-medium">{vendor.vendor_phone}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Mail className="h-3 w-3 text-green-600 mr-1" />
                              <span>{vendor.vendor_email}</span>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="border border-green-200">
                          <div className="flex items-start">
                            <MapPin className="h-3 w-3 text-green-600 mr-1 mt-0.5" />
                            <span>{vendor.vendor_address}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="border border-green-200">
                          <div className="flex space-x-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-700 hover:bg-green-50"
                              // UPDATED: Pass the whole vendor object
                              onClick={(e) => handleViewOutlets(vendor, e)}
                            >
                              <Building className="h-3 w-3 mr-1" />
                              Outlets
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-green-100"
                                  onClick={(e) => e.stopPropagation()} // Prevent row click
                                >
                                  <MoreVertical className="h-4 w-4 text-green-800" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-green-200">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(vendor);
                                  }} 
                                  className="hover:bg-green-50"
                                >
                                  <Edit className="mr-2 h-4 w-4 text-green-600" />
                                  Edit Vendor
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => handleDeleteVendor(vendor.vendor_id, e)}
                                  className="text-red-600 focus:text-red-700 hover:bg-red-50"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Vendor
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center border border-green-200">
                        No vendors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-green-700">
              Showing {Math.min(filteredVendors.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredVendors.length, currentPage * itemsPerPage)} of {filteredVendors.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
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
                      : "border-green-200 text-green-700 hover:bg-green-50"}
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
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Vendor Dialog Component */}
      {isAddDialogOpen && (
        <AddVendor
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleOperationSuccess}
        />
      )}

      {/* Edit Vendor Dialog Component */}
      {isEditDialogOpen && selectedVendor && (
        <EditVendor
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          vendorData={selectedVendor}
          onSuccess={handleOperationSuccess}
        />
      )}

      {/* NEW: View Vendor Outlets Dialog */}
      {isOutletDialogOpen && selectedVendorForOutlets && (
        <ViewVendorOutlets
          open={isOutletDialogOpen}
          onOpenChange={setIsOutletDialogOpen}
          vendorId={selectedVendorForOutlets.vendor_id}
          vendorName={selectedVendorForOutlets.vendor_name}
        />
      )}
    </div>
  );
};

export default Vendors;