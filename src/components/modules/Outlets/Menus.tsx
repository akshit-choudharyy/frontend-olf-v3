import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import eatingImg from "@/assets/images/eating.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Filter,
  Trash,
  Plus,
  Upload,
  ImportIcon,
  Leaf,
  Percent,
  RotateCcw,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import SetMarginDialog from "./SetMarginDialog";

import { olfService } from "@/utils/axiosInstance";
import AddMenuItem from "./AddMenu";
import EditMenuItem from "./EditMenu";
import XlFormat from "./XlFormat";
import ImportBulk from "./ImportBulk";

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
  "AMERICAN",
];

const formatDisplayName = (name: any) => {
  if (!name) return "Uncategorized";
  return name
    .split("_")
    .map((word: any) => word.charAt(0) + word.slice(1)?.toLowerCase())
    .join(" ");
};

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
}

interface MenuItemsProps {
  outletId?: number;
}

const Menus: React.FC<MenuItemsProps> = ({ outletId }) => {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState("all");
  const [filterVegetarian, setFilterVegetarian] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [isImportDialogOpen, setisImportDialogOpen] = useState(false);
  const [isMarginAllDialogOpen, setIsMarginAllDialogOpen] = useState(false);
  const [isMarginCategoryDialogOpen, setIsMarginCategoryDialogOpen] =
    useState(false);
  const [selectedCategoryForMargin, setSelectedCategoryForMargin] = useState<{
    foodType: string;
    items: MenuItem[];
  } | null>(null);
  const [previousItemState, setPreviousItemState] = useState<Array<{
    item_id: number;
    base_price: number;
  }> | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  // FIX: The setter setIsPushingToIRCTC was unused.
  const [isPushingToIRCTC, setIsPushingToIRCTC] = useState(false);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [stationCode, setStationCode] = useState<string>('');
  

 useEffect(() => {
    const getdata = async () => {
      const res = await olfService.get("/restraunts", {
        params: { outlet_id: outletId },
      });
      const restaurantData = res.data.data?.rows[0];
      if (restaurantData) {
        // Capture both values here
        setIsVegOnly(restaurantData.veg_only === 1);
        setStationCode(restaurantData.station_code || ''); // <-- THE FIX
        console.log("Fetched Station Code:", stationCode); // For debugging
      }
    };
    if (outletId) {
      getdata();
    }
}, [outletId]);

  const {
    isPending,
    error: queryError,
    data: allMenuItems = [],
    refetch,
  } = useQuery<MenuItem[]>({
    queryKey: ["menuItems", outletId, isVegOnly],
    queryFn: () => {
      const params: any = {
        outlet_id: outletId,
        verified: true,
        change_type: null, // <-- CHANGE THIS BACK
      };
      if (isVegOnly) {
        params.is_vegeterian = 1;
      }
      return olfService.get("/dishes", { params }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return res.data.data.rows || [];
      });
    },
    enabled: !!outletId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });

  const applyMarginToItems = async (
    items: MenuItem[],
    margin: number,
    isGlobalOperation: boolean = false
  ) => {
    // NEW: If it's a global operation, create a backup before doing anything else
    if (isGlobalOperation) {
      const backupState = items.map((item) => ({
        item_id: item.item_id,
        base_price: item.base_price,
      }));
      setPreviousItemState(backupState);
    }

    const toastId = toast.loading(
      `Applying ${margin}% margin to ${items.length} items...`
    );

    try {
      const updatePromises = items.map((item) => {
        const vendorPrice =
          typeof item.vendor_price === "number" ? item.vendor_price : 0;
        const newBasePrice = parseFloat(
          (vendorPrice * (1 + margin / 100)).toFixed(2)
        );
        return olfService.put(`/dish/${item.item_id}`, {
          base_price: newBasePrice,
        });
      });

      await Promise.all(updatePromises);

      toast.success(`Margin applied successfully to ${items.length} items!`, {
        id: toastId,
      });
      refetch();
    } catch (error) {
      toast.error(`Failed to apply margin. Please try again.`, { id: toastId });
      // NEW: If the operation fails, clear the backup so we don't have a faulty undo state
      if (isGlobalOperation) {
        setPreviousItemState(null);
      }
      throw error;
    }
  };

  const foodTypesInData = React.useMemo(() => {
    const types = new Set(["ALL"]);
    allMenuItems?.forEach((item: MenuItem) => {
      if (item.food_type) {
        types.add(item.food_type);
      }
    });
    return Array.from(types) as string[]; // Added 'as string[]' for better typing
  }, [allMenuItems]);

  const handleRevertLastMarginChange = async () => {
    if (!previousItemState) {
      toast.error("No previous state to revert to.");
      return;
    }

    setIsReverting(true);
    const toastId = toast.loading(
      `Reverting last margin change for ${previousItemState.length} items...`
    );

    try {
      const revertPromises = previousItemState.map((item) =>
        olfService.put(`/dish/${item.item_id}`, { base_price: item.base_price })
      );

      await Promise.all(revertPromises);

      toast.success("Successfully reverted the last margin change!", {
        id: toastId,
      });
      setPreviousItemState(null); // Clear the undo state after successful revert
      refetch();
    } catch (error) {
      toast.error("Failed to revert changes. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsReverting(false);
    }
  };

  const filteredMenuItems = React.useMemo(() => {
    return allMenuItems?.filter((item: MenuItem) => {
      const matchesFoodType =
        activeTab === "ALL" ? true : item.food_type === activeTab;
      const matchesSearch =
        item.item_name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        String(item.base_price).includes(searchTerm);
      const matchesCuisine =
        filterCuisine === "all" ? true : item.cuisine === filterCuisine;
      const matchesVegetarian =
        filterVegetarian === "all"
          ? true
          : filterVegetarian === "veg"
            ? item.is_vegeterian === 1
            : item.is_vegeterian === 0;

      return (
        matchesFoodType && matchesSearch && matchesCuisine && matchesVegetarian
      );
    });
  }, [allMenuItems, activeTab, searchTerm, filterCuisine, filterVegetarian]);

  const groupedMenuItems = React.useMemo(() => {
    if (!filteredMenuItems) return {};
    return filteredMenuItems.reduce(
      (acc: { [key: string]: MenuItem[] }, item: MenuItem) => {
        const foodType = item.food_type || "UNCATEGORIZED";
        if (!acc[foodType]) acc[foodType] = [];
        acc[foodType].push(item);
        return acc;
      },
      {}
    );
  }, [filteredMenuItems]);

  const openAddDialog = () => setIsAddDialogOpen(true);
  const openEditDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsEditDialogOpen(true);
  };
  const calculateSellingPrice = (basePrice: number, tax: number) =>
    basePrice + tax;

  const handleStatusToggle = async (itemId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await olfService.put(`/dish/${itemId}`, { status: newStatus });
      refetch();
      toast.success(
        `Item ${newStatus === 1 ? "enabled" : "disabled"} successfully!`
      );
    } catch (error) {
      toast.error(
        `Failed to update status! ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleDeleteMenuItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await olfService.delete(`/dish/${itemId}`);
        refetch();
        toast.success("Menu item deleted successfully!");
      } catch (error) {
        toast.error(
          `Failed to delete menu item! ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  const handleCategoryStatusToggle = async (
    items: MenuItem[],
    newStatus: number
  ) => {
    const action = newStatus === 1 ? "enabling" : "disabling";
    const toastId = toast.loading(`${action} all items in category...`);
    try {
      const updatePromises = items.map((item) =>
        olfService.put(`/dish/${item.item_id}`, { status: newStatus })
      );
      await Promise.all(updatePromises);
      toast.success(`All items ${action.replace("ing", "ed")} successfully!`, {
        id: toastId,
      });
      refetch();
    } catch (error) {
      toast.error(`Failed to update category status.`, { id: toastId });
    }
  };

  const handleCategoryDelete = async (items: MenuItem[], foodType: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete ALL ${items.length} items in the "${formatDisplayName(foodType)}" category? This action cannot be undone.`
      )
    ) {
      const toastId = toast.loading("Deleting all items in category...");
      try {
        const deletePromises = items.map((item) =>
          olfService.delete(`/dish/${item.item_id}`)
        );
        await Promise.all(deletePromises);
        toast.success(
          `Category "${formatDisplayName(foodType)}" deleted successfully!`,
          { id: toastId }
        );
        refetch();
      } catch (error) {
        toast.error("Failed to delete category.", { id: toastId });
      }
    }
  };


const VALID_CUISINES = [
  "SOUTH_INDIAN", "PUNJABI", "NORTH_INDIAN", "MUGHALAI", "BENGALI",
  "GOAN", "TAMIL", "ANDHRA", "KERALA", "INDIAN_CHINESE", "CHINESE",
  "AWADHI", "MALAYSIAN", "MAHARASHTRIAN", "TIBETAN", "CONTINENTAL",
  "ITALIAN", "MEXICAN", "LEBANESE", "MONGOLIAN", "HYDERABADI"
];

const VALID_FOOD_TYPES = [
  "SNACKS", "BREAKFAST", "STARTERS", "MAINS", "MAINS_GRAVY",
  "BREADS", "THALI", "COMBO", "DESSERTS", "SOUP", "BEVERAGE"
];

// Helper to sanitize image URL
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || url === "NULL" || url === "null" || url === "") return false;
  return /^https:\/\/([a-zA-Z0-9]+)(\.[a-zA-Z0-9\-_]+){2,5}(\/[a-zA-Z0-9_\-]+)*([A-Za-z0-9\-_+]+\.(png|jpg|jpeg|webp))$/.test(url);
};

const prepareMenuItemPayload = (item: MenuItem) => {
  const cuisine = VALID_CUISINES.includes(item.cuisine) ? item.cuisine : "NORTH_INDIAN";
  const foodType = VALID_FOOD_TYPES.includes(item.food_type) ? item.food_type : "MAINS";

  return {
    "id": String(item.item_id).substring(0, 15),
    "name": item.item_name.trim(),
    "description": item.description || null,
    "image": isValidImageUrl(item.image) ? item.image : null,  // ← fix here
    "cuisine": cuisine,
    "foodType": foodType,
    "itemType": item.is_vegeterian === 1 ? "VEG" : "NON_VEG",
    "priceDetail": {
      "basePrice": Number(item.base_price),
      "taxPercentage": (() => {
        if (!item.base_price || item.base_price <= 0 || isNaN(Number(item.tax))) return 0.05;
        const rawRate = Number(item.tax) / Number(item.base_price);
        const validRates = [0, 0.05, 0.12, 0.18, 0.28];
        return validRates.reduce((prev, curr) => Math.abs(curr - rawRate) < Math.abs(prev - rawRate) ? curr : prev);
      })(),
      "customisationDefaultBasePrice": Number(item.customisation_defaultBasePrice || item.base_price)
    },
    "schedule": [
      {
        "startTime": item.opening_time || "06:00",
        "endTime": item.closing_time || "23:00"
      }
    ],
    "cutOffTime": 45,
    "customisations": Array.isArray(item.customisations) ? item.customisations : []
  };
};

// single Push to IRCTC

  const handlePushSingleToIRCTC = async (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    const stationCode = item.station_code || '';
    const outletId = item.outlet_id;
    
    if (!stationCode) {
      toast.error('Station code not found!');
      return;
    }
    
    try {
      const payload = {
        menuItem: prepareMenuItemPayload(item)
      };
      // Send single push request to backend
      await olfService.post(`dish/push-single/${stationCode}/${outletId}`, payload);
      toast.success('Item pushed to IRCTC successfully!');
    } catch (error) {
      toast.error(`IRCTC Update Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  // New function to push all menu items to IRCTC
  const handlePushAllToIRCTC = async () => {
    if (!filteredMenuItems.length) {
      toast.error('No menu items to push!');
      return;
    }
    
    const firstItem = filteredMenuItems[0];
    const stationCode = firstItem.station_code || '';
    const outletId = firstItem.outlet_id;
    
    if (!stationCode) {
      toast.error('Station code not found!');
      return;
    }
    
    try {
      setIsPushingToIRCTC(true);
      const payload = {
        "menuItems": filteredMenuItems.map(prepareMenuItemPayload)
      };
      await olfService.post(`dish/push-all/${stationCode}/${outletId}`, payload);
      toast.success('All items pushed to IRCTC successfully!');
    } catch (error) {
      toast.error(`IRCTC Update Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPushingToIRCTC(false);
    }
  };
  const handleVegOnlyToggle = (checked: boolean) => setIsVegOnly(checked);
  const handleRowClick = (menuItem: MenuItem) => openEditDialog(menuItem);
  const handleOperationSuccess = () => refetch();

  if (isPending) return <div>Loading...</div>;
  if (queryError)
    return <div>Error loading menu items: {(queryError as Error).message}</div>;

  return (
    <div className="mx-4">
      <Toaster position="top-right" reverseOrder={false} />
      <Card className="border-none">
        <CardHeader className="bg-green-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-green-800">
              Menu Items
            </CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-green-200">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Veg Only
                </span>
                <Switch
                  checked={isVegOnly}
                  onCheckedChange={handleVegOnlyToggle}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <Button
                onClick={handlePushAllToIRCTC}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  isPushingToIRCTC ||
                  !filteredMenuItems ||
                  filteredMenuItems.length === 0
                }
              >
                <Upload className="mr-2 h-4 w-4" />{" "}
                {isPushingToIRCTC ? "Pushing..." : "Push All to IRCTC"}
              </Button>
              {previousItemState ? (
                <Button
                  variant="destructive"
                  onClick={handleRevertLastMarginChange}
                  disabled={isReverting}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isReverting ? "Reverting..." : "Revert Last Margin Change"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsMarginAllDialogOpen(true)}
                  disabled={
                    !allMenuItems || allMenuItems.length === 0 || isReverting
                  }
                >
                  <Percent className="mr-2 h-4 w-4" /> Set All Margins
                </Button>
              )}
              <XlFormat data={allMenuItems} isLoading={isPending} />
              <Button onClick={() => setisImportDialogOpen(true)}>
                <ImportIcon className="mr-2 h-4 w-4" /> Import Items
              </Button>
              <Button
                onClick={openAddDialog}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Menu Item
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-green-500" />
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
            </div>
          </div>

          {showFilters && (
            <div className="mb-4 p-2 bg-green-50 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Cuisine
                  </label>
                  <Select
                    value={filterCuisine}
                    onValueChange={setFilterCuisine}
                  >
                    <SelectTrigger className="border-green-200">
                      <SelectValue placeholder="Select cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cuisines</SelectItem>
                      {CUISINES.map((cuisine: string) => (
                        <SelectItem key={cuisine} value={cuisine}>
                          {formatDisplayName(cuisine)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Type
                  </label>
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

          

       
<Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab}>
  {/* The TabsList part was already correct and doesn't need changes */}
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
  
  {/* 
    This is the main fix. We create a <TabsContent> for EACH possible tab.
    The content inside is your new grouped layout.
    The <Tabs> parent will only render the one whose `value` matches `activeTab`.
  */}
  {foodTypesInData.map((type) => (
    <TabsContent key={type} value={type} className="mt-0">
      <div className="space-y-8 mt-4">
        {Object.keys(groupedMenuItems).length > 0 ? (
          Object.entries(groupedMenuItems).map(([foodType, items]: [string, MenuItem[]]) => {
            const isCategoryActive = items.every(item => item.status === 1);
            return (
              <div key={foodType}>
                <div className="bg-orange-500 text-white p-3 rounded-t-lg flex justify-between items-center">
                  <h3 className="font-bold tracking-wider uppercase">{formatDisplayName(foodType)}</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => {
                        setSelectedCategoryForMargin({ foodType, items });
                        setIsMarginCategoryDialogOpen(true);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 h-auto"
                      title={`Set margin for ${formatDisplayName(foodType)}`}
                    >
                      <Percent className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={isCategoryActive}
                      onCheckedChange={() => handleCategoryStatusToggle(items, isCategoryActive ? 0 : 1)}
                      className="data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-200 [&>span]:bg-orange-500"
                    />
                    <Button onClick={() => handleCategoryDelete(items, foodType)} variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2 h-auto">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-green-600">
                        <TableRow className="hover:bg-green-700/90 border-b-0">
                          <TableHead className="text-white">Item Id</TableHead>
                          <TableHead className="text-white">Image</TableHead>
                          <TableHead className="text-white">Item Name</TableHead>
                          <TableHead className="text-white">Vendor Price</TableHead>
                          <TableHead className="text-white">Base Price</TableHead>
                          <TableHead className="text-white">Tax</TableHead>
                          <TableHead className="text-white">Selling Price</TableHead>
                          <TableHead className="text-white">Opening Time</TableHead>
                          <TableHead className="text-white">Closing Time</TableHead>
                          <TableHead className="text-white text-center">Status</TableHead>
                          <TableHead className="text-white text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item: MenuItem) => (
                          <TableRow key={item.item_id} className="hover:bg-gray-50 cursor-pointer border-t" onClick={() => handleRowClick(item)}>
                            <TableCell className="font-mono text-blue-600">{item.item_id}</TableCell>
                            <TableCell>    <img 
      src={(!item.image || item.image === "NULL") ? eatingImg : item.image} 
      alt={item.item_name} 
      onError={(e) => { e.currentTarget.src = eatingImg; }}
      className="w-12 h-12 object-cover rounded-md bg-gray-200" 
    /></TableCell>
                            <TableCell className="font-medium text-gray-800">{item.item_name}</TableCell>
                            <TableCell>₹{item.vendor_price}</TableCell>
                            <TableCell>₹{item.base_price}</TableCell>
                            <TableCell>₹{item.tax}</TableCell>
                            <TableCell className="font-semibold">₹{calculateSellingPrice(item.base_price, item.tax)}</TableCell>
                            <TableCell>{item.opening_time}</TableCell>
                            <TableCell>{item.closing_time}</TableCell>
                            <TableCell><div className="flex justify-center" onClick={(e) => e.stopPropagation()}><Switch checked={item.status === 1} onCheckedChange={() => handleStatusToggle(item.item_id, item.status)} className="data-[state=checked]:bg-green-600" /></div></TableCell>
                            <TableCell><div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-green-200 text-blue-700 hover:bg-blue-50"
                                  onClick={(e) => handlePushSingleToIRCTC(item, e)}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Push
                                </Button>
                              
                              <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100" onClick={() => openEditDialog(item)}>Edit</Button><Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" onClick={(e) => handleDeleteMenuItem(item.item_id, e)}>Delete</Button></div></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )
          })
        ) : (<div className="text-center py-10 border rounded-lg bg-gray-50"><p>No menu items found.</p></div>)}
      </div>
    </TabsContent>
  ))}
</Tabs>
{/* ======================== END: CORRECTED CODE ========================= */}
        </CardContent>
      </Card>
      {isAddDialogOpen && (
        <AddMenuItem
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          outletId={outletId}
          onSuccess={handleOperationSuccess}
        />
      )}
{isImportDialogOpen && (
  <ImportBulk
    open={isImportDialogOpen}
    onOpenChange={setisImportDialogOpen}
    outletId={outletId}
    // currentData={allMenuItems || []} // <--- PASS THE DATA HERE
  />
)}
      {isEditDialogOpen && selectedMenuItem && (
        <EditMenuItem
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          menuItemData={selectedMenuItem}
          onSuccess={handleOperationSuccess}
        />
      )}

      <SetMarginDialog
        open={isMarginAllDialogOpen}
        onOpenChange={setIsMarginAllDialogOpen}
        title="Set Margin For All Items"
        description={`This will update the Base Price for all ${allMenuItems.length} items based on their Vendor Price. This action can be undone once.`} // <-- Updated description
        onApply={(margin) => applyMarginToItems(allMenuItems, margin, true)} // <-- PASS TRUE HERE
      />

      {/* NEW: Margin Dialog for Category Items */}
      {selectedCategoryForMargin && (
        <SetMarginDialog
          open={isMarginCategoryDialogOpen}
          onOpenChange={(isOpen) => {
            setIsMarginCategoryDialogOpen(isOpen);
            // Reset selected category when dialog is closed
            if (!isOpen) {
              setSelectedCategoryForMargin(null);
            }
          }}
          title={`Set Margin for ${formatDisplayName(selectedCategoryForMargin.foodType)}`}
          description={`This will update the Base Price for all ${selectedCategoryForMargin.items.length} items in this category. This action cannot be undone.`}
          onApply={(margin) =>
            applyMarginToItems(selectedCategoryForMargin.items, margin)
          }
        />
      )}
    </div> // This is the closing tag of the main div
  );
};

export default Menus;
