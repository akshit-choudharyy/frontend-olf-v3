import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Edit,
  Eye,
  Trash,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { olfService } from "@/utils/axiosInstance";
import AddStation from "./AddStation";
import { useNavigate } from "@tanstack/react-router";

// Corrected interface to match the API response
interface Station {
  station_id: number;
  station_name: string;
  station_code: string;
  total_outlets: string;
  active_outlets: string;
  inactive_outlets: string;
  closed_outlets: string;
  created_at: string;
  created_by?: string;
}

const Stations: React.FC = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Query to fetch stations data
  const {
    isPending,
    error: queryError,
    data: allStations = [],
    refetch,
  } = useQuery({
    queryKey: ["stationss"],
    queryFn: () =>
      olfService.get("/stations").then((res) => {
        if (res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return res.data.data.rows || [];
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });

  // Apply filters to stations - FIXED SEARCH LOGIC
  const filteredStations = React.useMemo(() => {
    return allStations.filter((station: Station) => {
      // If searchTerm is empty, don't filter anything
      if (!searchTerm) {
        return true;
      }

      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      // Apply search filter (case-insensitive) on station name and code
      const matchesSearch =
        station.station_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        station.station_code?.toLowerCase().includes(lowerCaseSearchTerm);

      return matchesSearch;
    });
  }, [allStations, searchTerm]);

  const currentUser = localStorage.getItem("username") || "Guest";

  // Calculate pagination
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const paginatedStations = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStations, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Form setup for editing station
  const form = useForm<{ station_name: string; station_code: string }>({
    defaultValues: {
      station_name: "",
      station_code: "",
    },
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return { date: "N/A", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }), // Result: 22 Nov 2025
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }), // Result: 08:05 PM
    };
  };

  // Open edit dialog for a station
  const handleEditClick = (station: Station) => {
    setCurrentStation(station);
    form.reset({
      station_name: station.station_name,
      station_code: station.station_code,
    });
    setEditDialogOpen(true);
  };

  // Handle form submission for edit
  const onSubmit = async (values: {
    station_name: string;
    station_code: string;
  }) => {
    if (!currentStation) return;

    // Convert inputs to uppercase
    const uppercaseValues = {
      station_name: values.station_name.toUpperCase(),
      station_code: values.station_code.toUpperCase(),
    };

    try {
      await olfService.put(
        `/station/${currentStation.station_id}`,
        uppercaseValues
      );
      setEditDialogOpen(false);
      refetch();
      toast(`Station Updated`, {
        style: {
          borderRadius: "10px",
          background: "wheat",
          color: "red",
        },
        duration: 4000,
      });
    } catch (error: any) {
      toast(`Station Update Failed ${error.message}`, {
        style: {
          borderRadius: "10px",
          background: "wheat",
          color: "red",
        },
        duration: 4000,
      });
    }
  };
  const navigate = useNavigate();
  // Handle view outlets
  const handleViewOutlets = (stationId: number) => {
    navigate({ to: `/outlet/${stationId}` });
  };

  const handleAddOutlet = (stationId: number) => {
    navigate({ to: `/outlet/${stationId}` });
  };

  // Handle delete station - CORRECTED TYPE FOR stationId
  const handleDeleteStation = async (stationId: number) => {
    if (window.confirm("Are you sure you want to delete this station?")) {
      try {
        await olfService.delete(`/stations/${stationId}`);
        refetch();
        toast(`Station deleted!`, {
          style: {
            borderRadius: "10px",
            background: "wheat",
            color: "red",
          },
          duration: 4000,
        });
      } catch (error: any) {
        toast(`Delete Station Failed ${error.message}`, {
          style: {
            borderRadius: "10px",
            background: "wheat",
            color: "red",
          },
          duration: 4000,
        });
      }
    }
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError)
    return <div>Error loading stations: {queryError.message}</div>;

  return (
    <div className="mx-auto">
      <Card className="border-none">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-2xl font-bold text-green-800">
            Stations
          </CardTitle>
          <AddStation />
        </CardHeader>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "green",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: "red",
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
                placeholder="Search stations..."
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
              <h3 className="font-semibold text-green-800 mb-2">
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Additional filters can be added here */}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-green-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-green-100">
                <TableRow className="hover:bg-green-100/80">
                  {/* 1. STATION ID (New) */}
                  <TableHead className="font-bold text-green-800 border border-green-200 w-[60px] text-center">
                    ID
                  </TableHead>

                  <TableHead className="font-bold text-green-800 border border-green-200 w-[200px]">
                    STATION NAME
                  </TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200 w-[100px]">
                    CODE
                  </TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200 w-[130px]">
                    OUTLET STATS
                  </TableHead>
                  <TableHead className="font-bold text-green-800 border border-green-200 w-[140px]">
                    CREATED INFO
                  </TableHead>

                  {/* 2. OUTLET OPERATIONS (Moved Here) */}
                  <TableHead className="font-bold text-green-800 border border-green-200 w-[180px] text-center">
                    OPERATIONS
                  </TableHead>

                  {/* 3. ACTIONS (Moved to Last) */}
                  <TableHead className="font-bold text-green-800 border border-green-200 w-[100px] text-center">
                    ACTIONS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStations.length > 0 ? (
                  paginatedStations.map((station: Station) => (
                    <TableRow
                      key={station.station_id}
                      className="hover:bg-green-50"
                    >
                      {/* 1. ID COLUMN */}
                      <TableCell className="font-bold text-gray-500 text-center border border-green-200 py-2">
                        #{station.station_id}
                      </TableCell>

                      {/* NAME COLUMN */}
                      <TableCell
                        className="font-medium text-green-900 border border-green-200 py-2 truncate max-w-[200px]"
                        title={station.station_name}
                      >
                        {station.station_name}
                      </TableCell>

                      {/* CODE COLUMN */}
                      <TableCell className="border border-green-200 py-2 font-mono text-xs">
                        {station.station_code}
                      </TableCell>

                      {/* STATS COLUMN (Compact & Professional) */}
                      <TableCell className="border border-green-200 py-2 px-3 align-top">
                        <div className="w-[110px] flex flex-col gap-1">
                          <div className="flex justify-between items-center border-b border-green-100 pb-1 mb-0.5">
                            <span className="text-xs font-bold text-gray-700">
                              TOTAL
                            </span>
                            <span className="text-sm font-bold text-black">
                              {station.total_outlets || "0"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 text-[11px] font-medium leading-3">
                            <div className="flex justify-between items-center text-green-700">
                              <span>Active</span>
                              <span>{station.active_outlets || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center text-orange-600">
                              <span>Inactive</span>
                              <span>{station.inactive_outlets || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center text-red-600">
                              <span>Closed</span>
                              <span>{station.closed_outlets || "0"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* CREATED INFO COLUMN */}
                      <TableCell className="border border-green-200 py-2 px-3 align-top">
                        <div className="flex flex-col justify-center min-h-[40px]">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="bg-green-100 p-0.5 rounded-full">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3 h-3 text-green-700"
                              >
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                            <span
                              className="text-xs font-bold text-gray-700 truncate max-w-[100px]"
                              title={station.created_by || currentUser}
                            >
                              {/* If API sends a name, show it. Otherwise, show the logged-in user */}
                              {station.created_by
                                ? station.created_by
                                : currentUser}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium leading-3 pl-5">
                            <div>{formatDate(station.created_at).date}</div>
                            <div className="text-[9px] text-gray-400">
                              {formatDate(station.created_at).time}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. OPERATIONS COLUMN (Moved Here) */}
                      <TableCell className="border border-green-200 py-2">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            // UPDATED: Passing station.station_id instead of station_code
                            onClick={() =>
                              handleViewOutlets(station.station_id)
                            }
                            className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <Eye className="mr-1.5 h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            // UPDATED: Passing station.station_id instead of station_code
                            onClick={() => handleAddOutlet(station.station_id)}
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          >
                            <Plus className="mr-1.5 h-3 w-3" />
                            Add
                          </Button>
                        </div>
                      </TableCell>

                      {/* 3. ACTIONS COLUMN (Moved to Last) */}
                      <TableCell className="border border-green-200 py-2">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(station)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() =>
                              handleDeleteStation(station.station_id)
                            }
                            title="Delete"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center border border-green-200"
                    >
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
              Showing{" "}
              {Math.min(
                filteredStations.length,
                (currentPage - 1) * itemsPerPage + 1
              )}{" "}
              to {Math.min(filteredStations.length, currentPage * itemsPerPage)}{" "}
              of {filteredStations.length} results
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
                    className={
                      currentPage === pageNum
                        ? "bg-green-600 hover:bg-green-700"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Station Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-green-300">
          <DialogHeader className="bg-green-50 p-4 rounded-t-lg">
            <DialogTitle className="text-green-800">Edit Station</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-4"
            >
              <FormField
                control={form.control}
                name="station_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">
                      Station Name
                    </FormLabel>
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
                name="station_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">
                      Station Code
                    </FormLabel>
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

              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stations;
