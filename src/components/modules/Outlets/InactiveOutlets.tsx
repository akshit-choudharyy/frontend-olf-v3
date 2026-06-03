import React, { useState, useEffect } from 'react';
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
  Search,
  Filter,
  Clock,
  MapPin,
  Phone,
  FileText,
  IndianRupee,
  Power
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';
import ExportOutlet from './ExportOutlet';

const InactiveOutlets = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState('all');
  const [filterState, setFilterState] = useState('all');

  // Query to fetch inactive outlets data (status=1)
const {
  isPending,
  error: queryError,
  data: allOutlets = [],
  refetch
} = useQuery({
  queryKey: ['inactive-outlets'],
  queryFn: () =>
    // Corrected to fetch INACTIVE outlets
    olfService.get('/restraunts', { params: { status: 0 } }).then((res) => { // <<< FIXED
      if (res.data.status !== 1) {
        throw new Error('Unexpected response status');
      }
        
        const outlets = res?.data?.data?.rows || [];

        return outlets.map((outlet: any) => { // FIX: Added 'any' type to 'outlet'
          try {
            return {
              ...outlet,
              delivery_charges: JSON.parse(outlet.delivery_charges || '[]'),
              closing_period: JSON.parse(outlet.closing_period || '[]'),
            };
          } catch (e) {
            console.error("Failed to parse outlet data:", outlet, e);
            return outlet;
          }
        });
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: false,
  });

  // Apply filters to outlets
  const filteredOutlets = React.useMemo(() => {
    return allOutlets?.filter((outlet: any) => { // FIX: Added 'any' type to 'outlet'
      // Apply search filter
      const matchesSearch =
        outlet.outlet_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        outlet.gst?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        outlet.phone?.includes(searchTerm);

      // Apply city filter
      const matchesCity = filterCity === 'all' ? true : outlet.city?.toLowerCase() === filterCity?.toLowerCase();

      // Apply state filter
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCity, filterState, itemsPerPage]);

  // Get unique values for filter options
  const cities = React.useMemo(() => {
    return [...new Set(allOutlets.map((outlet: any) => outlet.city))]; // FIX: Added 'any' type to 'outlet'
  }, [allOutlets]);

  const states = React.useMemo(() => {
    return [...new Set(allOutlets.map((outlet: any) => outlet.state))]; // FIX: Added 'any' type to 'outlet'
  }, [allOutlets]);

  // Handle activate outlet
 const handleActivateOutlet = async (outletId: any) => {
  if (window.confirm("Are you sure you want to activate this outlet?")) {
    try {
      // Change status to 1 for 'active' // <<< FIXED COMMENT
      await olfService.put(`/restraunt/${outletId}`, { status: 1 }); // <<< FIXED LOGIC
      refetch();
      toast('Outlet activated successfully!', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'white',
        },
        duration: 4000,
      });
    } catch (error: any) {
      toast(`Outlet activation failed! ${error}`, {
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

  // Format date for display
  const formatDate = (dateString: any) => { // FIX: Added 'any' type to 'dateString'
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return e;
    }
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading inactive outlets: {queryError.message}</div>;

  return (
    <div className="mx-4">
      {/* This component is responsible for rendering the toasts */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: 'green',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: 'red',
            },
          },
        }}
      />

      <Card className="border-none">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-2xl font-bold text-blue-800">Inactive Outlets</CardTitle>
        </CardHeader>
        <CardContent className="p-1">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-500" />
              <Input
                placeholder="Search inactive outlets..."
                className="pl-8 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ExportOutlet data={filteredOutlets} isLoading={isPending} />

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
                  <label className="text-sm font-medium text-blue-700">City</label>
                  <Select
                    value={filterCity}
                    onValueChange={setFilterCity}
                  >
                    <SelectTrigger className="border-blue-200">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((city: any) => ( // FIX: Added 'any' type to 'city'
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-blue-700">State</label>
                  <Select
                    value={filterState}
                    onValueChange={setFilterState}
                  >
                    <SelectTrigger className="border-blue-200">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state: any) => ( // FIX: Added 'any' type to 'state'
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Table with horizontal scroll for many columns */}
          <div className="border border-blue-200 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-blue-100">
                  <TableRow className="hover:bg-blue-100/80">
                    <TableHead className="font-bold text-blue-800 border border-blue-200">OUTLET NAME</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">STATION</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">TIMING</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">ORDER INFO</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">CONTACT</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">DOCUMENTS</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">TAGS</TableHead>
                    <TableHead className="font-bold text-blue-800 border border-blue-200">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOutlets.length > 0 ? (
                    paginatedOutlets.map((outlet: any) => ( // FIX: Added 'any' type to 'outlet'
                      <TableRow
                        key={outlet.outlet_id}
                        className="hover:bg-blue-50"
                      >
                        <TableCell className="font-medium text-blue-900 border border-blue-200">
                          <div className="flex items-center gap-2">
                            {outlet.logo_image && (
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-50 flex-shrink-0">
                                <img
                                  src={outlet.logo_image}
                                  alt={outlet.outlet_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold">{outlet.outlet_name}</div>
                              <div className="text-xs text-blue-600">{outlet.company_name}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 text-blue-600 mr-1" />
                            <div>
                              <div className="font-medium">{outlet.station_name}</div>
                              <div className="text-xs text-blue-600">{outlet.station_code}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm">
                              <Clock className="h-3 w-3 text-blue-600 mr-1" />
                              <span>{outlet.opening_time} - {outlet.closing_time}</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Order prep: {outlet.order_timing} mins
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center">
                              <IndianRupee className="h-3 w-3 text-blue-600 mr-1" />
                              <span>Min: ₹{outlet.min_order_amount}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              {Array.isArray(outlet.delivery_charges) && outlet.delivery_charges.length > 0 ? (
                                outlet.delivery_charges.map((data: any, index: any) => ( // FIX: Added 'any' type to 'data' and 'index'
                                  <div key={index} className="mr-2">
                                    <span>Delivery: ₹{data.deliveryFee} for ₹{data.amountMoreThan}</span>
                                  </div>
                                ))
                              ) : (
                                typeof outlet.delivery_charges === 'number' && (
                                  <div>
                                    <span>Delivery: ₹{outlet.delivery_charges}</span>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {outlet.prepaid ? "Prepaid accepted" : "COD only"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 text-blue-600 mr-1" />
                              <span className="font-medium">{outlet.phone}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Phone className="h-3 w-3 text-blue-600 mr-1" />
                              <span>Admin: {outlet.admin_phone}</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {outlet.email}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 text-blue-600 mr-1" />
                              <span>GST: {outlet.gst}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <FileText className="h-3 w-3 text-blue-600 mr-1" />
                              <span>FSSAI: {outlet.fssai}</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Valid till: {String(formatDate(outlet.fssai_valid))}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex flex-wrap gap-1">
                            {outlet.tags && outlet.tags.split(',').map((tag: any, idx: any) => ( // FIX: Added 'any' type to 'tag' and 'idx'
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="border border-blue-200">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleActivateOutlet(outlet.outlet_id)}
                            >
                              <Power className="mr-1 h-3 w-3" /> Activate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center border border-blue-200">
                        No inactive outlets found.
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
              Showing {Math.min(filteredOutlets.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredOutlets.length, currentPage * itemsPerPage)} of {filteredOutlets.length} results
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
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-blue-200 text-blue-700 hover:bg-blue-50"}
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

export default InactiveOutlets;