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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Search, 
  Filter, 
  Edit, 
  Trash, 
  Clock,
  Tag,
  Upload,
  IndianRupee,
  Leaf
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';

import { olfService } from '@/utils/axiosInstance';
import EditMenuItem from '../Outlets/EditMenu';
import XlFormat from '../Outlets/XlFormat';



const CUISINES = [
  "SOUTH_INDIAN",
  "PUNJABI",
  "NORTH_INDIAN",
  "MUGHALAI",
  "BENGALI",
  "GOAN",
  "TAMIL",
  "ANDHRA",
  "KERALA",
  "INDIAN_CHINESE",
  "CHINESE",
  "AWADHI",
  "MALAYSIAN",
  "MAHARASHTRIAN",
  "TIBETAN",
  "SRI_LANKAN",
  "SIKKIMESE",
  "TASTE_OF_BIHAR",
  "ASSAMESE",
  "BAKERY_CONFECTIONERY",
  "CONTINENTAL",
  "ITALIAN",
  "MEXICAN",
  "LEBANESE",
  "MONGOLIAN",
  "MALABARI",
  "HYDERABADI",
  "ODIYA",
  "MARATHI",
  "GUJRATI",
  "RAJASTHANI",
  "AMERICAN"
];

// Format food type and cuisine display names
const formatDisplayName = (name:any) => {
  return name?.split('_').map((word:any) => 
    word.charAt(0) + word.slice(1)?.toLowerCase()
  ).join(' ');
};

// Define menu item interface
interface MenuItem {
  item_id: number;
  item_name: string;
  base_price: number;
  status: number;
  outlet_id: number;
  description: string;
  vendor_price: number;
  opening_time: string;
  closing_time: string;
  is_vegeterian: number;
  image: string;
  cuisine: string;
  food_type: string;
  bulk_only: number;
  customisations: any;
  customisation_defaultBasePrice: any;
  tax: number;
  station_code?: string;
  change_type:any;
}



const ItemReq = () => {
  // Active tab for food type filtering
  const [activeTab, setActiveTab] = useState<string>("ALL");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [filterVegetarian, setFilterVegetarian] = useState('all');
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  // Loading state for push all button
  const [isPushingToIRCTC, setIsPushingToIRCTC] = useState(false);

  // Veg status states
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);

  useEffect(() => {
    const getdata = async () => {
      const res = await olfService.get('/restraunts', {params: {change_type:2}});
      const vegOnlyValue = res.data.data?.rows[0]?.veg_only;
      setIsVegOnly(vegOnlyValue === 1);
    }
    getdata();
  }, []);

  const { 
    isPending, 
    error: queryError, 
    data: allMenuItems = [],
    refetch
  } = useQuery({
    queryKey: ['outlets', isVegOnly],
    queryFn: () => {
      const params: any = {verified:true,change_type:1 };
      if (isVegOnly) {
        params.is_vegeterian = 1;
      }
      return olfService.get('/dishes', { params }).then((res) => {
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

  // Get unique food types in data for tabs
  const foodTypesInData = React.useMemo(() => {
    const types = new Set(['ALL']);
    allMenuItems?.forEach((item: MenuItem) => {
      if (item.food_type) {
        types.add(item.food_type);
      }
    });
    return Array.from(types);
  }, [allMenuItems]);

  // Apply filters to menu items
  const filteredMenuItems = React.useMemo(() => {
    return allMenuItems?.filter((item: MenuItem) => {
      // Apply food type filter from tabs
      const matchesFoodType = activeTab === 'ALL' ? true : item.food_type === activeTab;
      
      // Apply search filter
      const matchesSearch = 
        item.item_name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        String(item.base_price).includes(searchTerm);
      
      // Apply cuisine filter
      const matchesCuisine = filterCuisine === 'all' ? true : item.cuisine === filterCuisine;
      
      // Apply vegetarian filter
      const matchesVegetarian = filterVegetarian === 'all' ? true :
        (filterVegetarian === 'veg' ? item.is_vegeterian === 1 : item.is_vegeterian === 0);
      
      return matchesFoodType && matchesSearch && matchesCuisine && matchesVegetarian;
    });
  }, [allMenuItems, activeTab, searchTerm, filterCuisine, filterVegetarian]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const paginatedMenuItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterCuisine, filterVegetarian, itemsPerPage]);

  // Handle opening dialogs

  const openEditDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsEditDialogOpen(true);
  };

  // Calculate selling price (base_price + tax)
  const calculateSellingPrice = (basePrice: number, tax: number) => {
    const taxAmount = basePrice+tax;
    return  taxAmount;
  };

  // Handle status toggle
  const handleStatusToggle = async (itemId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 0 ? 0 : 2;
      await olfService.put(`/dish/${itemId}`, { change_type: 0 });
      
      refetch();
      toast.success(`Item ${newStatus === 0 ? 'enabled' : 'disabled'} successfully!`, {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'white',
        },
        duration: 3000,
      });
    } catch (error) {
      toast.error(`Failed to update status! ${error instanceof Error ? error.message : 'Unknown error'}`, {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 4000,
      });
    }
  };

  // Handle delete menu item
  const handleDeleteMenuItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await olfService.delete(`/dish/${itemId}`);
        refetch();
        toast.success('Menu item deleted successfully!', {
          style: {
            borderRadius: '10px',
            background: 'black',
            color: 'white',
          },
          duration: 3000,
        });
      } catch (error) {
        toast.error(`Failed to delete menu item! ${error instanceof Error ? error.message : 'Unknown error'}`, {
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

  // Function to prepare menu item payload for IRCTC
  const prepareMenuItemPayload = (item: MenuItem) => {
    return {
      "itemId": item.item_id,
      "itemName": item.item_name,
      "basePrice": item.base_price,
      "description": item.description,
      "openingTime": item.opening_time,
      "closingTime": item.closing_time,
      "taxPercentage": 0.05,
      "sellingPrice": item.base_price + (0.05 * item.base_price),
      "isVegeterian": item.is_vegeterian == 1 ? true : false,
      "image": item.image,
      "cuisine": item.cuisine,
      "foodType": item.food_type,
      "bulkOnly": item.bulk_only == 1 ? true : false,
      "customisations": item.customisations,
      "customisationDefaultBasePrice": item.customisation_defaultBasePrice || 0,
    };
  };

  // New function to push all menu items to IRCTC
  const handlePushAllToIRCTC = async () => {
    if (!filteredMenuItems.length) {
      toast.error('No menu items to push!', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 3000,
      });
      return;
    }
    
    // Get station code and outlet id from first item as example
    // In practice, you might need to determine these differently
    const firstItem = filteredMenuItems[0];
    const stationCode = firstItem.station_code || '';
    const outletId = firstItem.outlet_id;
    
    if (!stationCode) {
      toast.error('Station code not found!', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'red',
        },
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsPushingToIRCTC(true);
      
      // Prepare payload with all menu items
      const payload = {
        "menuItems": filteredMenuItems.map(prepareMenuItemPayload)
      };
      
      await olfService.post(`dish/${stationCode}/${outletId}`, JSON.stringify(payload));
      
      toast.success('All items pushed to IRCTC successfully!', {
        style: {
          borderRadius: '10px',
          background: 'black',
          color: 'white',
        },
        duration: 4000,
      });
    } catch (error) {
      toast.error(`IRCTC Update Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        style: {
          borderRadius: '10px',
          background: 'wheat',
          color: 'red',
        },
        duration: 4000,
      });
    } finally {
      setIsPushingToIRCTC(false);
    }
  };

  // Handle veg only toggle
  const handleVegOnlyToggle = (checked: boolean) => {
    setIsVegOnly(checked);
  };

  // Handle row click
  const handleRowClick = (menuItem: MenuItem) => {
    openEditDialog(menuItem);
  };

  // Handle operation success
  const handleOperationSuccess = () => {
    refetch();
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading menu items: {(queryError as Error).message}</div>;

  return (
    <div className="mx-4">
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
        <CardHeader className="bg-green-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-green-800">Menu Items</CardTitle>
            <div className="flex gap-2 items-center">
              {/* Veg Only Toggle */}
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-green-200">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Veg Only</span>
                <Switch 
                  checked={isVegOnly}
                  onCheckedChange={handleVegOnlyToggle}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              {/* Push All To IRCTC Button */}
              <Button 
                onClick={handlePushAllToIRCTC}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isPushingToIRCTC || filteredMenuItems.length === 0}
              >
                <Upload className="mr-2 h-4 w-4" /> 
                {isPushingToIRCTC ? 'Pushing...' : 'Push All to IRCTC'}
              </Button>

              <XlFormat 
                data={allMenuItems} 
                isLoading={isPending} 
              />
              
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-1 pt-4">
          {/* Food Type Tabs */}
          <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-green-100 p-1 mb-4 overflow-x-auto flex w-full">
              {foodTypesInData.map((type) => (
                <TabsTrigger 
                  key={type} 
                  value={type}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  {type === 'ALL' ? 'All Items' : formatDisplayName(type)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* We'll use a single content area for all tabs */}
            <TabsContent value={activeTab} className="mt-0">
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                  <Input
                    placeholder="Search menu items..."
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
                      <label className="text-sm font-medium text-green-700">Cuisine</label>
                      <Select 
                        value={filterCuisine} 
                        onValueChange={setFilterCuisine}
                      >
                        <SelectTrigger className="border-green-200">
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cuisines</SelectItem>
                          {CUISINES.map((cuisine) => (
                            <SelectItem key={cuisine} value={cuisine}>{formatDisplayName(cuisine)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-green-700">Type</label>
                      <Select 
                        value={filterVegetarian} 
                        onValueChange={setFilterVegetarian}
                      >
                        <SelectTrigger className="border-green-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="veg">Vegetarian</SelectItem>
                          <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items Table */}
              <div className="border border-green-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-green-100">
                      <TableRow className="hover:bg-green-100/80">
                        <TableHead className="font-bold text-green-800 border border-green-200">ITEM ID</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">ITEM</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">PRICE DETAILS</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">AVAILABILITY</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">CATEGORY</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">APPROVE</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMenuItems.length > 0 ? (  
                        paginatedMenuItems.map((item: MenuItem) => (
                          <TableRow 
                            key={item.item_id} 
                            className="hover:bg-green-50 cursor-pointer"
                            onClick={() => handleRowClick(item)}
                          >
                              <TableCell className="border border-green-200">
                              
                                  <span className='text-lg text-green-500'># {item?.item_id}</span>
                              
                            </TableCell>
                            <TableCell className="font-medium text-green-900 border border-green-200">
                              <div className="flex items-center gap-2">
                                {item.image && (
                                  <div className="w-10 h-10 rounded-md overflow-hidden bg-green-50 flex-shrink-0">
                                    <img 
                                      src={item.image} 
                                      alt={item.item_name} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold">{item.item_name}</div>
                                  <div className="text-xs text-green-600">{item?.description?.slice(0,33)}...</div>
                                  <div className="text-xs mt-1">
                                    {item.is_vegeterian === 1 ? (
                                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Veg</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">Non-Veg</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="border border-green-200">
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center">
                                  <IndianRupee className="h-3 w-3 text-green-600 mr-1" />
                                  <span className="font-medium">Base: ₹{item.base_price}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <IndianRupee className="h-3 w-3 text-green-600 mr-1" />
                                  <span>Selling: ₹{calculateSellingPrice(item.base_price, item.tax).toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  Tax: ₹{item.tax} | Vendor: ₹{item.vendor_price}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="border border-green-200">
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 text-green-600 mr-1" />
                                  <span>{item.opening_time} - {item.closing_time}</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  {item.bulk_only === 1 && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Bulk Only</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="border border-green-200">
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center">
                                  <Tag className="h-3 w-3 text-green-600 mr-1" />
                                  <span className="font-medium">{formatDisplayName(item.food_type)}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Tag className="h-3 w-3 text-green-600 mr-1" />
                                  <span>{formatDisplayName(item.cuisine)}</span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="border border-green-200">
                              <div 
                                className="flex justify-center" 
                                onClick={(e) => e.stopPropagation()} // Prevent row click when toggling
                              >
                                <Switch 
                                  checked={item.change_type == 1}
                                  onCheckedChange={() => handleStatusToggle(item.item_id, item.change_type)}
                                  className="data-[state=checked]:bg-green-600"
                                />
                              </div>
                            </TableCell>
                            
                            <TableCell className="border border-green-200">
                              <div className="flex space-x-2 justify-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(item);
                                  }}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
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
                                      onClick={(e) => handleDeleteMenuItem(item.item_id, e)}
                                      className="text-red-600 focus:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete Item
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center border border-green-200">
                            No menu items found.
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
                  Showing {Math.min(filteredMenuItems.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredMenuItems.length, currentPage * itemsPerPage)} of {filteredMenuItems.length} results
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

   

      {/* Edit Menu Item Dialog Component */}
      {isEditDialogOpen && selectedMenuItem && (
        <EditMenuItem
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          menuItemData={selectedMenuItem}
          onSuccess={handleOperationSuccess}
        />
      )}
    </div>
  );
};

export default ItemReq;