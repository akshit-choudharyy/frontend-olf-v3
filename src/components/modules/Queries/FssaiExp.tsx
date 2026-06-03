import React, { useMemo, useState } from 'react';
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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { olfService } from '@/utils/axiosInstance';
import { differenceInDays, parseISO, format, isValid } from 'date-fns';

// Define the structure of an outlet, focusing on the needed fields
interface Outlet {
  outlet_id: number;
  outlet_name: string;
  station_name: string;
  station_code: string;
  fssai_valid: string;
  vendor_phone: string; // From the main outlet object
  rlname: string;       // Representative's name
}

// Interface for the processed outlet data, including the calculated expiration days
interface ProcessedOutlet extends Outlet {
  daysUntilExpiration: number | null;
}

/**
 * Calculates the number of days until the FSSAI expiration date.
 * @param fssaiValidDate - The expiration date string (e.g., "2025-05-26").
 * @returns The number of days remaining, or null if the date is invalid.
 *          Returns a negative number if the date has already passed.
 */
const calculateDaysUntilExpiration = (fssaiValidDate: string): number | null => {
  if (!fssaiValidDate) return null;
  
  const expirationDate = parseISO(fssaiValidDate);
  if (!isValid(expirationDate)) return null;

  const today = new Date();
  return differenceInDays(expirationDate, today);
};

const FssaiExp = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable

  // Query to fetch outlets data, similar to your existing component
  const { 
    isPending, 
    error: queryError, 
    data: allOutlets = [],
  } = useQuery<Outlet[]>({
    queryKey: ['outletsFssai'], // Use a unique query key
    queryFn: () =>
      olfService.get('/restraunts', { params: { status: 1, verified: 1 } })
        .then((res) => {
          if (res.data.status !== 1) {
            throw new Error('Unexpected response status');
          }
          return res?.data?.data?.rows || [];
        }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Process and sort outlets by FSSAI expiration date
  const sortedAndFilteredOutlets = useMemo(() => {
    if (!allOutlets) return [];

    // 1. Map and calculate expiration days for each outlet
    const processedData: ProcessedOutlet[] = allOutlets.map(outlet => ({
      ...outlet,
      daysUntilExpiration: calculateDaysUntilExpiration(outlet.fssai_valid),
    }));

    // 2. Filter based on search term (enhanced search)
    const filteredData = processedData.filter(outlet => {
      const searchLower = searchTerm.toLowerCase();
      return (
        outlet.outlet_name?.toLowerCase().includes(searchLower)
       
      );
    });

    // 3. Sort the data: outlets expiring soonest come first
    // Null expiration dates are pushed to the bottom.
    return filteredData.sort((a, b) => {
      if (a.daysUntilExpiration === null) return 1;
      if (b.daysUntilExpiration === null) return -1;
      return a.daysUntilExpiration - b.daysUntilExpiration;
    });

  }, [allOutlets, searchTerm]);

  // Pagination calculations
  const totalItems = sortedAndFilteredOutlets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedAndFilteredOutlets.slice(startIndex, endIndex);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Get page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (isPending) return <div>Loading FSSAI Expiration Data...</div>;
  if (queryError) return <div>Error: {(queryError as Error).message}</div>;

  return (
    <Card className="m-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl font-bold text-gray-800">
            FSSAI Expiration Status
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search outlets, stations, names..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Search Results Summary */}
        <div className="text-sm text-gray-600 mt-2">
          {searchTerm && (
            <span>
              Found {totalItems} result{totalItems !== 1 ? 's' : ''} for "{searchTerm}"
            </span>
          )}
          {!searchTerm && (
            <span>
              Showing {totalItems} outlet{totalItems !== 1 ? 's' : ''}
            </span>
          )}
          {totalItems > 0 && (
            <span className="ml-2">
              • Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="font-bold text-gray-700">Outlet Name</TableHead>
                <TableHead className="font-bold text-gray-700">Station</TableHead>
                <TableHead className="font-bold text-gray-700">Vendor Details</TableHead>
                <TableHead className="font-bold text-gray-700">FSSAI Valid Until</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Expires In</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((outlet) => {
                  const { daysUntilExpiration } = outlet;
                  
                  // Determine if the license is expiring soon (7 days or less)
                  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration >= 0;
                  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;

                  return (
                    <TableRow 
                      key={outlet.outlet_id} 
                      // Apply conditional styling for rows that need attention
                      className={`
                        ${isExpiringSoon ? 'bg-red-100 hover:bg-red-200 text-red-900' : ''}
                        ${isExpired ? 'bg-red-200 hover:bg-red-300 text-red-900 font-medium' : ''}
                      `}
                    >
                      <TableCell className="font-medium">{outlet.outlet_name}</TableCell>
                      
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <div>{outlet.station_name}</div>
                            <div className="text-xs text-gray-500">{outlet.station_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center">
                           <User className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <div>{outlet.rlname || 'N/A'}</div>
                            <div className="flex items-center text-xs text-gray-500">
                                <Phone className="h-3 w-3 mr-1" />
                                {outlet.vendor_phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {outlet.fssai_valid ? format(parseISO(outlet.fssai_valid), 'dd MMM yyyy') : 'N/A'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {daysUntilExpiration !== null ? (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                            ${isExpiringSoon || isExpired ? 'bg-red-500 text-white' : 'bg-green-100 text-green-800'}
                          `}>
                            {isExpiringSoon && <AlertTriangle className="h-4 w-4 mr-1" />}
                            {isExpired ? 'Expired' : `${daysUntilExpiration} days`}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>

                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? `No outlets found matching "${searchTerm}"` : 'No outlets found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            {/* Items per page info */}
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Previous</span>
              </Button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {getPageNumbers().map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="hidden sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FssaiExp;