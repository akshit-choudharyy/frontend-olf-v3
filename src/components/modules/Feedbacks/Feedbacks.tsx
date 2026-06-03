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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Star, StarHalf, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { olfService } from '@/utils/axiosInstance';

interface Rating {
  res_id: number;
  rating: number;
  review: string;
  created_at: string;
  order_id: number;
  user_id: number;
  rating_id: number;
  first_name: string;
  last_name: string;
  outlet_name: string;
  oid: number;
}

const Feedbacks = ({outletid}:{outletid:any}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Query to fetch ratings data
  const { 
    isPending, 
    error: queryError, 
    data: allRatings = [],
  } = useQuery<Rating[], Error>({
    queryKey: ['ratings',outletid],
    queryFn: () =>
      olfService.get('/ratings',{params:{res_id:outletid}}).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      }),
      staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
      refetchOnWindowFocus: false,
  });

  // Apply filters to ratings
  const filteredRatings = React.useMemo(() => {
    return allRatings.filter((rating: Rating) => {
      // Apply search filter
      const matchesSearch = 
        `${rating.first_name} ${rating.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rating.outlet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rating.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rating.order_id.toString().includes(searchTerm);
      
      // Apply rating filter
      const matchesRating = ratingFilter === 'all' || 
        (ratingFilter === 'high' && rating.rating >= 4) ||
        (ratingFilter === 'low' && rating.rating <= 2) ||
        (Number.isInteger(parseInt(ratingFilter)) && rating.rating === parseInt(ratingFilter));
      
      return matchesSearch && matchesRating;
    });
  }, [allRatings, searchTerm, ratingFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
  const paginatedRatings = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRatings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRatings, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ratingFilter, itemsPerPage]);

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }, (_, i) => <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
        {Array.from({ length: emptyStars }, (_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Calculate stats
  const averageRating = filteredRatings.length > 0 
    ? (filteredRatings.reduce((sum: number, r: Rating) => sum + r.rating, 0) / filteredRatings.length).toFixed(1)
    : '0.0';
  const highRatedReviews = filteredRatings.filter((r: Rating) => r.rating >= 4).length;
  const lowRatedReviews = filteredRatings.filter((r: Rating) => r.rating <= 2).length;

  if (isPending) return <div className="p-6">Loading ratings...</div>;
  if (queryError) return <div className="p-6 text-red-600">Error: {queryError.message}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Customer Feedback</CardTitle>
          <CardDescription>Analyze and respond to customer ratings and reviews.</CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredRatings.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageRating}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive Reviews</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{highRatedReviews}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negative Reviews</CardTitle>
                <ThumbsDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowRatedReviews}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative w-full md:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, outlet, review..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className='flex gap-4 w-full md:w-auto'>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="high">4+ Stars</SelectItem>
                    <SelectItem value="low">2- Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-full md:w-[120px]">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRatings.length > 0 ? (
                  paginatedRatings.map((rating: Rating) => (
                    <TableRow key={rating.rating_id}>
                      <TableCell className="font-medium">#{rating.order_id}</TableCell>
                      <TableCell>{rating.first_name} {rating.last_name}</TableCell>
                      <TableCell>{rating.outlet_name}</TableCell>
                      <TableCell>{renderStars(rating.rating)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={rating.review}>
                        {rating.review || <span className="text-muted-foreground">No review text</span>}
                      </TableCell>
                      <TableCell className="text-right">{formatDate(rating.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredRatings.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredRatings.length, currentPage * itemsPerPage)} of {filteredRatings.length} results.
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedbacks;