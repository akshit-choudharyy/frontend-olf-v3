import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MoreVertical,
  Search,
  Filter,
  Edit,
  Trash,
  Clock,
  Tag,
  IndianRupee,
  CheckCircle,
} from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';

import { olfService } from '@/utils/axiosInstance';
import EditMenuItem from './EditMenu';

const CUISINES = [
  "SOUTH_INDIAN", "PUNJABI", "NORTH_INDIAN", "MUGHALAI", "BENGALI", "GOAN", "TAMIL", "ANDHRA", "KERALA", "INDIAN_CHINESE", "CHINESE", "AWADHI", "MALAYSIAN", "MAHARASHTRIAN", "TIBETAN", "SRI_LANKAN", "SIKKIMESE", "TASTE_OF_BIHAR", "ASSAMESE", "BAKERY_CONFECTIONERY", "CONTINENTAL", "ITALIAN", "MEXICAN", "LEBANESE", "MONGOLIAN", "MALABARI", "HYDERABADI", "ODIYA", "MARATHI", "GUJRATI", "RAJASTHANI", "AMERICAN"
];

const formatDisplayName = (name: any) => {
  return name?.split('_').map((word: any) =>
    word.charAt(0) + word.slice(1)?.toLowerCase()
  ).join(' ');
};

interface MenuItem {
  item_id: number;
  item_name: string;
  base_price: number;
  verified: any;
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
}

interface MenuItemsProps {
  outletId?: number;
}

// --- NEW MODAL COMPONENT FOR UPDATING PRICES ---
interface UpdatePriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: number;
  onSuccess: () => void;
}

const UpdatePriceModal: React.FC<UpdatePriceModalProps> = ({ open, onOpenChange, outletId, onSuccess }) => {
  const [updateType, setUpdateType] = useState('margin'); // 'margin' or 'amount'
  const [margin, setMargin] = useState('');
  const [amountToAdd, setAmountToAdd] = useState('');

  const updateByMarginMutation = useMutation({
    mutationFn: (marginPercentage: number) => {
      if (!outletId) throw new Error("Outlet ID is not available.");
      return olfService.post('/dishes/bulk-update-price', {
        outlet_id: outletId,
        margin_percentage: marginPercentage
      });
    },
    onSuccess: () => {
      toast.success('Prices are being updated based on margin!');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(`Failed to update prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSettled: () => setMargin('')
  });

  const updateByAmountMutation = useMutation({
    mutationFn: (amount: number) => {
      if (!outletId) throw new Error("Outlet ID is not available.");
      // NOTE: This requires a new backend endpoint and controller logic
      return olfService.post('/dishes/bulk-update-price-absolute', {
        outlet_id: outletId,
        amount_to_add: amount
      });
    },
    onSuccess: (data: any) => {
      toast.success(data?.data?.info || 'Prices are being updated by the specified amount!');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(`Failed to update prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSettled: () => setAmountToAdd('')
  });

  const isPending = updateByMarginMutation.isPending || updateByAmountMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateType === 'margin') {
      const marginValue = parseFloat(margin);
      if (isNaN(marginValue) || marginValue < 0) {
        toast.error('Please enter a valid, non-negative margin percentage.');
        return;
      }
      updateByMarginMutation.mutate(marginValue);
    } else { // updateType === 'amount'
      const amountValue = parseFloat(amountToAdd);
      if (isNaN(amountValue)) {
        toast.error('Please enter a valid amount to add.');
        return;
      }
      updateByAmountMutation.mutate(amountValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Bulk Update Base Prices</DialogTitle>
            <DialogDescription>
              Update the base price for <strong>all unverified menu items</strong> for this outlet using one of the methods below.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={updateType} onValueChange={setUpdateType} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="margin">By Margin (%)</TabsTrigger>
              <TabsTrigger value="amount">By Amount (₹)</TabsTrigger>
            </TabsList>

            <TabsContent value="margin">
              <Card className="border-none shadow-none">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    The new base price will be calculated based on the vendor price. <br />
                    <code className="mt-2 inline-block relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                      New Price = Vendor Price * (1 + Margin/100)
                    </code>
                  </p>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="margin" className="text-right">
                      Margin (%)
                    </Label>
                    <Input
                      id="margin"
                      type="number"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., 20 for 20%"
                      disabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="amount">
              <Card className="border-none shadow-none">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    The specified amount will be added directly to the current base price.
                    <code className="mt-2 inline-block relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                      New Price = Current Base Price + Amount
                    </code>
                  </p>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount (₹)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amountToAdd}
                      onChange={(e) => setAmountToAdd(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., 10 or -5"
                      disabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Prices'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const UnverifiedMenu: React.FC<MenuItemsProps> = ({ outletId }) => {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [filterVegetarian, setFilterVegetarian] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isUpdatePriceModalOpen, setIsUpdatePriceModalOpen] = useState(false); // State for price modal

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isApproving, setIsApproving] = useState(false);

  const {
    isPending,
    error: queryError,
    data: allMenuItems = [],
    refetch
  } = useQuery({
    queryKey: ['unverifiedDishes', outletId],
    queryFn: () => {
      return olfService.get('/dishes', { params: { outlet_id: outletId, verified: false, change_type: 0 } }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      });
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const foodTypesInData = React.useMemo(() => {
    const types = new Set(['ALL']);
    allMenuItems?.forEach((item: MenuItem) => {
      if (item.food_type) {
        types.add(item.food_type);
      }
    });
    return Array.from(types);
  }, [allMenuItems]);

  const filteredMenuItems = React.useMemo(() => {
    return allMenuItems?.filter((item: MenuItem) => {
      const matchesFoodType = activeTab === 'ALL' ? true : item.food_type === activeTab;
      const matchesSearch =
        item.item_name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        String(item.base_price).includes(searchTerm);
      const matchesCuisine = filterCuisine === 'all' ? true : item.cuisine === filterCuisine;
      const matchesVegetarian = filterVegetarian === 'all' ? true :
        (filterVegetarian === 'veg' ? item.is_vegeterian === 1 : item.is_vegeterian === 0);

      return matchesFoodType && matchesSearch && matchesCuisine && matchesVegetarian;
    });
  }, [allMenuItems, activeTab, searchTerm, filterCuisine, filterVegetarian]);

  const paginatedMenuItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [activeTab, searchTerm, filterCuisine, filterVegetarian, itemsPerPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const pageItemIds = paginatedMenuItems.map((item: any) => item.item_id);
    const newSelectedItems = new Set(selectedItems);

    if (checked) {
      pageItemIds.forEach((id: any) => newSelectedItems.add(id));
    } else {
      pageItemIds.forEach((id: any) => newSelectedItems.delete(id));
    }
    setSelectedItems(newSelectedItems);
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const isAllOnPageSelected = paginatedMenuItems.length > 0 && paginatedMenuItems.every((item: any) => selectedItems.has(item.item_id));
  const isSomeOnPageSelected = paginatedMenuItems.some((item: any) => selectedItems.has(item.item_id));

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected for approval.');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${selectedItems.size} selected menu items?`)) {
      return;
    }

    setIsApproving(true);
    try {
      const itemIds = Array.from(selectedItems);
      await olfService.put('/dishes/bulk-update', {
        itemIds: itemIds,
        payload: { verified: true }
      });

      toast.success(`${itemIds.length} items approved successfully!`);
      setSelectedItems(new Set());
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to approve items: ${errorMessage}`);
    } finally {
      setIsApproving(false);
    }
  };

  const openEditDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsEditDialogOpen(true);
  };

  const calculateSellingPrice = (basePrice: number, tax: number) => {
    const taxAmount = basePrice + tax;
    return taxAmount;
  };

  const handleStatusToggle = async (itemId: number, currentStatus: any) => {
    try {
      await olfService.put(`/dish/${itemId}`, { verified: !currentStatus });
      refetch();
      toast.success(`Item status updated successfully!`);
    } catch (error) {
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteMenuItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await olfService.delete(`/dish/${itemId}`);
        refetch();
        toast.success('Menu item deleted successfully!');
      } catch (error) {
        toast.error(`Failed to delete menu item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleRowClick = (menuItem: MenuItem) => {
    openEditDialog(menuItem);
  };

  const handleOperationSuccess = () => {
    refetch();
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError) return <div>Error loading menu items: {(queryError as Error).message}</div>;

  return (
    <div className="mx-4">
      <Toaster position="top-right" reverseOrder={false} />

      <Card className="border-none">
        <CardHeader className="bg-green-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-green-800">Unverified Menu Items</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-1 pt-4">
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

            <TabsContent value={activeTab} className="mt-0">
              <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                    <Input
                      placeholder="Search menu items..."
                      className="pl-8 border-green-200 focus:border-green-500 focus:ring-green-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      onClick={handleBulkApprove}
                      disabled={isApproving || selectedItems.size === 0}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isApproving ? 'Approving...' : `Approve Selected (${selectedItems.size})`}
                    </Button>
                     <Button
                        onClick={() => setIsUpdatePriceModalOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <IndianRupee className="mr-2 h-4 w-4" /> Bulk Update Prices
                      </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-[120px] border-green-200"><SelectValue placeholder="Show" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem><SelectItem value="10">10 per page</SelectItem><SelectItem value="25">25 per page</SelectItem><SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showFilters && (
                <div className="mb-2 p-2 bg-green-50 rounded-md border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Advanced Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-700">Cuisine</label>
                      <Select value={filterCuisine} onValueChange={setFilterCuisine}>
                        <SelectTrigger className="border-green-200"><SelectValue placeholder="Select cuisine" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cuisines</SelectItem>
                          {CUISINES.map((cuisine) => (<SelectItem key={cuisine} value={cuisine}>{formatDisplayName(cuisine)}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">Type</label>
                      <Select value={filterVegetarian} onValueChange={setFilterVegetarian}>
                        <SelectTrigger className="border-green-200"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem><SelectItem value="veg">Vegetarian</SelectItem><SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-green-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-green-100">
                      <TableRow className="hover:bg-green-100/80">
                        <TableHead className="w-[50px] border border-green-200">
                          <Checkbox
                            checked={isAllOnPageSelected ? true : (isSomeOnPageSelected ? "indeterminate" : false)}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all items on this page"
                            disabled={paginatedMenuItems.length === 0}
                          />
                        </TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">ITEM ID</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">ITEM</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">PRICE</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">AVAILABILITY</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">CATEGORY</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">APPROVE</TableHead>
                        <TableHead className="font-bold text-green-800 border border-green-200">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMenuItems.length > 0 ? (
                        paginatedMenuItems.map((item: MenuItem) => (
                          <TableRow key={item.item_id} className="hover:bg-green-50 data-[state=selected]:bg-green-100" data-state={selectedItems.has(item.item_id) ? 'selected' : 'unselected'}>
                            <TableCell className="border border-green-200">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedItems.has(item.item_id)}
                                  onCheckedChange={(checked) => handleSelectItem(item.item_id, !!checked)}
                                  aria-label={`Select item ${item.item_name}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="border border-green-200" onClick={() => handleRowClick(item)}><span className='text-lg text-green-500'># {item?.item_id}</span></TableCell>
                            <TableCell className="font-medium text-green-900 border border-green-200" onClick={() => handleRowClick(item)}>
                              <div className="flex items-center gap-2">
                                {item.image && (<div className="w-10 h-10 rounded-md overflow-hidden bg-green-50 flex-shrink-0"><img src={item.image} alt={item.item_name} className="w-full h-full object-cover" /></div>)}
                                <div>
                                  <div className="font-semibold">{item.item_name}</div><div className="text-xs text-green-600">{item?.description?.slice(0, 33)}...</div>
                                  <div className="text-xs mt-1">{item.is_vegeterian === 1 ? (<span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Veg</span>) : (<span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">Non-Veg</span>)}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="border border-green-200" onClick={() => handleRowClick(item)}>
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center"><IndianRupee className="h-3 w-3 text-green-600 mr-1" /><span className="font-medium">Base: ₹{item.base_price}</span></div>
                                <div className="flex items-center mt-1"><IndianRupee className="h-3 w-3 text-green-600 mr-1" /><span>Selling: ₹{calculateSellingPrice(item.base_price, item.tax).toFixed(2)}</span></div>
                                <div className="text-xs text-green-600 mt-1">Tax: ₹{item.tax} | Vendor: ₹{item.vendor_price}</div>
                              </div>
                            </TableCell>
                            <TableCell className="border border-green-200" onClick={() => handleRowClick(item)}>
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center"><Clock className="h-3 w-3 text-green-600 mr-1" /><span>{item.opening_time} - {item.closing_time}</span></div>
                                <div className="text-xs text-green-600 mt-1">{item.bulk_only === 1 && (<span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Bulk Only</span>)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="border border-green-200" onClick={() => handleRowClick(item)}>
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center"><Tag className="h-3 w-3 text-green-600 mr-1" /><span className="font-medium">{formatDisplayName(item.food_type)}</span></div>
                                <div className="flex items-center mt-1"><Tag className="h-3 w-3 text-green-600 mr-1" /><span>{formatDisplayName(item.cuisine)}</span></div>
                              </div>
                            </TableCell>
                            <TableCell className="border border-green-200">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <Switch checked={item.verified} onCheckedChange={() => handleStatusToggle(item.item_id, item.verified)} className="data-[state=checked]:bg-green-600" />
                              </div>
                            </TableCell>
                            <TableCell className="border border-green-200">
                              <div className="flex space-x-2 justify-center">
                                <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                                  <Edit className="h-3 w-3 mr-1" />Review
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-green-100" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4 text-green-800" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="border-green-200">
                                    <DropdownMenuItem onClick={(e) => handleDeleteMenuItem(item.item_id, e)} className="text-red-600 focus:text-red-700 hover:bg-red-50">
                                      <Trash className="mr-2 h-4 w-4" />Delete Item
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={8} className="h-24 text-center border border-green-200">No menu items found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-green-700">
                  Showing {Math.min(filteredMenuItems.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredMenuItems.length, currentPage * itemsPerPage)} of {filteredMenuItems.length} results
                </div>
              </div>

            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isEditDialogOpen && selectedMenuItem && (
        <EditMenuItem open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} menuItemData={selectedMenuItem} onSuccess={handleOperationSuccess} />
      )}

      {/* RENDER THE PRICE UPDATE MODAL */}
      {isUpdatePriceModalOpen && (
        <UpdatePriceModal
          open={isUpdatePriceModalOpen}
          onOpenChange={setIsUpdatePriceModalOpen}
          outletId={outletId}
          onSuccess={handleOperationSuccess}
        />
      )}
    </div>
  );
};

export default UnverifiedMenu;