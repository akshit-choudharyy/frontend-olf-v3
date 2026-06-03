import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Edit, MoreVertical, Trash, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';

interface Train {
  trainId: number;
  trainNumber: string;
  trainName: string;
  trainNumberAndName: string;
  status: number;
  runningDays: string;
}

const Trains: React.FC = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTrain, setCurrentTrain] = useState<Train | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Query to fetch trains data
  const { 
    isPending, 
    error: queryError, 
    data: allTrains = [],
    refetch
  } = useQuery({
    queryKey: ['trains'],
    queryFn: () =>
      olfService.get('/trains').then((res) => {
        return res?.data || [];
      }),
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      refetchOnWindowFocus: false,
  });

  // Apply filters to trains
  const filteredTrains = React.useMemo(() => {
    return allTrains.filter((train: Train) => {
      // Apply search filter
      const matchesSearch = 
        train.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        train.trainNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        train.runningDays.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? train.status === 1 :
        train.status === 0;
      
      return matchesSearch && matchesStatus;
    });
  }, [allTrains, searchTerm, filterStatus]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTrains.length / itemsPerPage);
  const paginatedTrains = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrains.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrains, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, itemsPerPage]);

  // Form setup for editing train
  const form = useForm<{
    trainNumber: string;
    trainName: string;
    runningDays: string;
    status: number;
  }>({
    defaultValues: {
      trainNumber: '',
      trainName: '',
      runningDays: '',
      status: 0
    }
  });

  // Handle toggle status change
  const handleStatusChange = async (trainId: number, newStatus: boolean) => {
    try {
      await olfService.put(`/train/${trainId}`, { status: newStatus ? 1 : 0 });
      refetch(); // Refresh data after update
      toast(`Status Updated!`, {
        style: {
          borderRadius: '10px',
          background: 'wheat',
          color: 'red',
        },
        duration: 4000,
      });
    } catch (error) {
      toast(`Status Update failed ${error}`, {
        style: {
          borderRadius: '10px',
          background: 'wheat',
          color: 'red',
        },
        duration: 4000,
      });
    }
  };

  // Open edit dialog for a train
  const handleEditClick = (train: Train) => {
    setCurrentTrain(train);
    form.reset({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      runningDays: train.runningDays,
      status: train.status
    });
    setEditDialogOpen(true);
  };

  // Handle form submission for edit
  const onSubmit = async (values: any) => {
    if (!currentTrain) return;
    
    // Convert inputs to uppercase
    const uppercaseValues = {
      trainNumber: values.trainNumber.toUpperCase(),
      trainName: values.trainName.toUpperCase(),
      runningDays: values.runningDays.toLowerCase(),
      status: values.status
    };
    
    try {
      await olfService.put(`/train/${currentTrain.trainId}`, uppercaseValues);
      setEditDialogOpen(false);
      refetch();
       toast(`Train Updated`, {
             style: {
               borderRadius: '10px',
               background: 'wheat',
               color: 'red',
             },
             duration: 4000,
           });
    } catch (error:any) {
       toast(`Train Update Failed ${error.message}`, {
             style: {
               borderRadius: '10px',
               background: 'wheat',
               color: 'red',
             },
             duration: 4000,
           });
    }
  };

  // Handle delete train
  const handleDeleteTrain = async (trainId: number) => {
    if (window.confirm("Are you sure you want to delete this train?")) {
      try {
        await olfService.delete(`/trains/${trainId}`);
        refetch();
          toast(`Train deleted!`, {
                style: {
                  borderRadius: '10px',
                  background: 'wheat',
                  color: 'red',
                },
                duration: 4000,
              });
      } catch (error:any) {
         toast(`Delete Train Failed ${error.message}`, {
               style: {
                 borderRadius: '10px',
                 background: 'wheat',
                 color: 'red',
               },
               duration: 4000,
             });
      }
    }
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading trains: {queryError.message}</div>;

  return (
    <div className="mx-auto">
      <Card className="border-none">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-2xl font-bold text-green-800">Trains</CardTitle>
        </CardHeader>
          <Toaster 
                position="top-right"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                  // Default options for all toasts
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  // Default options for specific types
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
        <CardContent className="p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
              <Input
                placeholder="Search trains..."
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
            <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-green-700">Status</label>
                  <Select 
                    value={filterStatus} 
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger className="border-green-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Additional filters can be added here */}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-green-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-green-100">
                <TableRow className="hover:bg-green-100/80">
                  <TableHead className="font-bold text-green-800 border border-green-200">TRAIN NUMBER</TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200">TRAIN NAME</TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200">RUNNING DAYS</TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200">STATUS</TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrains.length > 0 ? (
                  paginatedTrains.map((train: Train) => (
                    <TableRow 
                      key={train.trainId}
                      onClick={() => handleEditClick(train)}
                      className="cursor-pointer hover:bg-green-50"
                    >
                      <TableCell className="font-medium text-green-900 border border-green-200">{train.trainNumber}</TableCell>
                      <TableCell className="border border-green-200">{train.trainName}</TableCell>
                      <TableCell className="border border-green-200">{train.runningDays}</TableCell>
                      <TableCell className="border border-green-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <Switch
                            checked={train.status === 1}
                            onCheckedChange={(checked) => handleStatusChange(train.trainId, checked)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="border border-green-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-green-100">
                                <MoreVertical className="h-4 w-4 text-green-800" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-green-200">
                              <DropdownMenuItem onClick={() => handleEditClick(train)} className="hover:bg-green-50">
                                <Edit className="mr-2 h-4 w-4 text-green-600" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTrain(train.trainId)}
                                className="text-red-600 focus:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center border border-green-200">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-green-700">
              Showing {Math.min(filteredTrains.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredTrains.length, currentPage * itemsPerPage)} of {filteredTrains.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Train Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-green-300">
          <DialogHeader className="bg-green-50 p-4 rounded-t-lg">
            <DialogTitle className="text-green-800">Edit Train</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
              <FormField
                control={form.control}
                name="trainNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Train Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-green-200 focus:border-green-500"
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="trainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Train Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-green-200 focus:border-green-500"
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="runningDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Running Days</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-green-200 focus:border-green-500"
                        placeholder="e.g., mon,tue,wed"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel className="text-green-700">Status</FormLabel>
                    <FormControl>
                      <Switch 
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trains;