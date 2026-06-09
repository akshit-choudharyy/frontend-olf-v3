import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import vegIcon from "@/assets/images/veg.png";
import nonVegIcon from "@/assets/images/non-veg.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  Edit,
  Trash,
  Upload,
  Clock,
  MapPin,
  Phone,
  FileText,
  IndianRupee,
  ArrowLeft,
  MessageSquare,
  Wallet,
  ShoppingBag,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  CupSoda,
  UserCog,
  TimerReset,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { format } from "date-fns";
import { olfService } from "@/utils/axiosInstance";
import EditOutlet from "./EditOutlet";
import { AddOutletButton } from "./AddOutlet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import AddClosure from "./AddClosure";
import ExportOutlet from "./ExportOutlet";

interface Outlet {
  outlet_id: number;
  outlet_name: string;
  order_timing: string;
  min_order_amount: number;
  opening_time: string;
  closing_time: string;
  delivery_charges: any;
  prepaid: boolean;
  address: string;
  city: string;
  state: string;
  company_name: string;
  vendor_pan_number: string;
  gst: string;
  fssai: string;
  fssai_valid: string;
  logo_image: string;
  email: string;
  phone: string;
  alternative_phones: string | null;
  tags: string;
  station_name: string;
  station_code: string;
  vendor_id: number;
  status: number;
  closing_period: any;
  updated_by: any;
  updated_at: any;
  wallet_amount: number; // Added wallet amount field
  vendor_name: string | null;
  irctc_application_id?: string | null; // ✅ add this
  irctc_status?: string | null;
}

const Outlets = ({ stationcode }: { stationcode: any }) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [itemsPerPage, setItemsPerPage] = useState<any>(10);
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<any>("");
  const [showFilters, setShowFilters] = useState<any>(false);
  const [filterTags, setFilterTags] = useState<any>("all");
  const [filterStation, setFilterStation] = useState<any>("all");
  const [filterCity, setFilterCity] = useState<any>("all");
  const [filterState, setFilterState] = useState<any>("all");
  const [filterStatus, setFilterStatus] = useState<any>("all");
  const [editDialogDefaultTab, setEditDialogDefaultTab] = useState("basic");

  // Edit Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<any>(false);
  const [isClosureDialogOpen, setClosureDialogOpen] = useState<any>(false);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [isPushingToIRCTC, setIsPushingToIRCTC] = useState<boolean>(false);

  // New state for outlet details dialog
  const [isOutletDetailsOpen, setIsOutletDetailsOpen] =
    useState<boolean>(false);
  const [selectedOutletForDetails, setSelectedOutletForDetails] =
    useState<any>(null);

  const [outletToDelete, setOutletToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [outletToReactivate, setOutletToReactivate] = useState<number | null>(
    null,
  );
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [pushResults, setPushResults] = useState<
    Record<number, { success: boolean; date?: string; error?: string }>
  >(() => {
    const stored = localStorage.getItem("pushResults");
    return stored ? JSON.parse(stored) : {};
  });

  // Query to fetch outlets data
  const {
    isPending,
    error: queryError,
    data: allOutlets = [],
    refetch,
  } = useQuery({
    // --- CHANGE 1: Make the queryKey dynamic ---
    // This tells React Query to re-fetch when the stationcode changes.
    queryKey: ["outlets", stationcode],

    queryFn: () => {
      // --- CHANGE 2: Build the parameters conditionally ---
      const queryParams: any = { verified: 1 };
      if (stationcode) {
        queryParams.station_code = stationcode;
      }

      return olfService
        .get("/restraunts", {
          params: queryParams, // Use the dynamically built params
        })
        .then((res) => {
          if (res.data.status !== 1) {
            throw new Error("Unexpected response status");
          }
          const outletsFromApi = res?.data?.data?.rows || [];

          // Your existing promotion parsing logic (no changes needed here)
          return outletsFromApi.map((outlet: any) => {
            if (outlet.promotions && typeof outlet.promotions === "string") {
              try {
                if (outlet.promotions.toUpperCase() === "NULL") {
                  return { ...outlet, promotions: null };
                }
                const parsedPromotions = JSON.parse(outlet.promotions);
                return { ...outlet, promotions: parsedPromotions };
              } catch (e) {
                console.error("Failed to parse promotions", e);
                return { ...outlet, promotions: null };
              }
            }
            return outlet;
          });
        });
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });

  // Apply filters to outlets
  const filteredOutlets = React.useMemo(() => {
    return allOutlets?.filter((outlet: Outlet) => {
      // Hide deleted outlets (status 3).
      if (outlet.status === 3) {
        return false;
      }

      // Apply search filter
      const matchesSearch =
        outlet.outlet_name
          ?.toLowerCase()
          ?.includes(searchTerm?.toLowerCase()) ||
        outlet.gst?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        outlet.phone?.includes(searchTerm);

      // Apply tags filter
      const matchesTags =
        filterTags === "all"
          ? true
          : outlet.tags &&
            outlet.tags.split(",").some((tag) => tag.trim() === filterTags);

      // Apply station filter
      const matchesStation =
        filterStation === "all" ? true : outlet.station_code === filterStation;

      // Apply city filter
      const matchesCity =
        filterCity === "all"
          ? true
          : outlet.city?.toLowerCase() === filterCity?.toLowerCase();

      // Apply state filter
      const matchesState =
        filterState === "all"
          ? true
          : outlet.state?.toLowerCase() === filterState?.toLowerCase();

      const matchesStatus = (() => {
        if (filterStatus === "all") return true;

        const isActive = outlet.status === 1;
        const isInactive = outlet.status === 2;
        const isClosed = outlet.status === 0;

        if (filterStatus === "active") return isActive;
        if (filterStatus === "inactive") return isInactive;
        if (filterStatus === "closed") return isClosed;
        return true;
      })();

      return (
        matchesSearch &&
        matchesTags &&
        matchesStation &&
        matchesCity &&
        matchesState &&
        matchesStatus
      ); // ADD matchesStatus here
    });
  }, [
    allOutlets,
    searchTerm,
    filterTags,
    filterStation,
    filterCity,
    filterState,
    filterStatus,
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOutlets.length / itemsPerPage);
  const paginatedOutlets = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOutlets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOutlets, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterTags,
    filterStation,
    filterCity,
    filterState,
    itemsPerPage,
    filterStatus,
  ]);

  // Get unique values for filter options
  const outletTags = React.useMemo(() => {
    const allTags = new Set<string>();
    allOutlets.forEach((outlet: Outlet) => {
      if (outlet.tags) {
        outlet.tags.split(",").forEach((tag) => {
          allTags.add(tag.trim());
        });
      }
    });
    return [...allTags];
  }, [allOutlets]);

  const stations = React.useMemo(() => {
    return [
      ...new Set(allOutlets.map((outlet: Outlet) => outlet.station_code)),
    ];
  }, [allOutlets]);

  const cities = React.useMemo(() => {
    return [...new Set(allOutlets.map((outlet: Outlet) => outlet.city))];
  }, [allOutlets]);

  const states = React.useMemo(() => {
    return [...new Set(allOutlets.map((outlet: Outlet) => outlet.state))];
  }, [allOutlets]);

  // Handle opening the edit dialog
  const openEditDialog = (outlet: Outlet, tab: string = "basic") => {
    setSelectedOutlet(outlet);
    setEditDialogDefaultTab(tab);
    setIsEditDialogOpen(true);
  };

  const openClosureDialog = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setClosureDialogOpen(true);
  };

  // Handle outlet ID click - opens details dialog
  const handleOutletIdClick = async (outlet: Outlet, e: React.MouseEvent) => {
    e.stopPropagation();

    // Set outlet data immediately so dialog opens fast
    setSelectedOutletForDetails(outlet);
    setIsOutletDetailsOpen(true);

    // Then fetch fresh vendor data and update the displayed name
    try {
      const res = await olfService.get("/rest-vendor", {
        params: { vendor_id: outlet.vendor_id },
      });
      const freshVendor = res?.data?.data?.rows[0];
      if (freshVendor) {
        setSelectedOutletForDetails((prev: any) => ({
          ...prev,
          vendor_name: freshVendor.vendor_name,
          phone: freshVendor.vendor_phone,
          email: freshVendor.vendor_email,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch fresh vendor data", err);
    }
  };

  // Handle row click
  const handleRowClick = (outlet: Outlet) => {
    openEditDialog(outlet, "basic");
  };

  // Handle edit outlet
  const handleEditOutlet = (outlet: Outlet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    openEditDialog(outlet, "basic");
    openEditDialog(outlet);
  };

  const handleAddClosure = (outlet: Outlet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    openClosureDialog(outlet);
  };

  const userdata = localStorage.getItem("persist:root");
  const parsedData = userdata ? JSON.parse(userdata) : null;
  const user = JSON.parse(parsedData.auth).user;

  // Handle delete outlet
  const initiateDeleteOutlet = (outletId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOutletToDelete(outletId);
    setIsDeleteDialogOpen(true);
  };

  // 2. Function called when clicking "Continue" in the dialog
  const confirmDeleteOutlet = async () => {
    if (!outletToDelete) return;

    try {
      await olfService.put(`/restraunt/${outletToDelete}`, {
        status: 3, // Set to 3 for "Deleted"
        updated_by: user?.name,
        updated_at: format(new Date(), "yyyy-MM-dd HH:mm"),
      });

      refetch(); // Refresh the main list

      // CUSTOM STYLED TOAST (Black bg, Green tick)
      toast.success("Outlet moved to Deleted list successfully!", {
        style: {
          borderRadius: "10px",
          background: "#000", // Black background
          color: "#fff", // White text
        },
        iconTheme: {
          primary: "#4ade80", // Bright Green color
          secondary: "#fff",
        },
      });
    } catch (error) {
      toast.error(`Failed to delete outlet: ${error}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setOutletToDelete(null);
    }
  };

  const initiateReactivate = (outletId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOutletToReactivate(outletId);
    setIsReactivateDialogOpen(true);
  };

  // 2. Performs the action with the Green Tick Toast
  const confirmReactivate = async () => {
    if (!outletToReactivate) return;

    try {
      await olfService.put(`/restraunt/${outletToReactivate}`, {
        status: 1, // Set to Active
        updated_by: user?.name,
        updated_at: format(new Date(), "yyyy-MM-dd HH:mm"),
      });

      refetch();

      // CUSTOM STYLED TOAST (Black bg, Green tick)
      toast.success("Outlet reactivated successfully!", {
        style: {
          borderRadius: "10px",
          background: "#000",
          color: "#fff",
        },
        iconTheme: {
          primary: "#4ade80", // Bright Green
          secondary: "#fff",
        },
        duration: 4000,
      });
    } catch (error) {
      toast.error(`Outlet reactivation failed! ${error}`, {
        style: {
          borderRadius: "10px",
          background: "#000",
          color: "red",
        },
        duration: 4000,
      });
    } finally {
      setIsReactivateDialogOpen(false);
      setOutletToReactivate(null);
    }
  };

  // Function to prepare outlet payload for IRCTC
  // const prepareOutletPayload = (outlet: any) => {
  //   return {
  //     outletId: outlet.outlet_id,
  //     outletName: outlet.outlet_name,
  //     order_timing: outlet.order_timing,
  //     minOrderAmount: outlet.min_order_amount,
  //     openingTime: outlet.opening_time,
  //     closingTime: outlet.closing_time,
  //     deliveryCharges: outlet?.delivery_charges,
  //     prepaid: outlet.prepaid,
  //     promotions:
  //       outlet?.promotions?.promotions?.length > 0
  //         ? outlet?.promotions?.promotions
  //         : null,
  //     address: outlet.address,
  //     city: outlet.city,
  //     state: outlet.state,
  //     companyName: outlet.company_name,
  //     vendorPanNumber: outlet.vendor_pan_number,
  //     gstNo: outlet.gst,
  //     fssaiNo: outlet.fssai,
  //     fssaiValidUpto: outlet.fssai_valid,
  //     closingPeriod: outlet.closing_period || [],
  //     weeklyClosed: outlet.weeklyclosed || [],
  //     logoImage: outlet.logo_image,
  //     email: outlet.rlemail,
  //     mobile: outlet.rlphone,
  //   };
  // };

  // New function to push all outlets to IRCTC

  const handlePushSingleToIRCTC = async (outlet: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await olfService.post(
        `/restraunt/push/${outlet.station_code}`,
        {
          outlet_id: outlet.outlet_id,
          outlet_name: outlet.outlet_name,
          logo_image: outlet.logo_image,
          min_order_amount: outlet.min_order_amount,
          order_timing: outlet.order_timing,
          opening_time: outlet.opening_time,
          closing_time: outlet.closing_time,
          prepaid: outlet.prepaid,
          gst: outlet.gst,
          fssai: outlet.fssai,
          fssai_valid: outlet.fssai_valid,
          address: outlet.address,
          email: outlet.email,
          phone: outlet.phone,
          tags: outlet.tags,
          irctc_application_id: outlet.irctc_application_id,
          promotions: outlet.promotions,
          charges: outlet.charges || outlet.delivery_charges,
        },
      );

      if (response.data.status) {
        const isUpdate = response.data.action === "updated";
        const now = format(new Date(), "dd MMM yyyy, HH:mm");
        // ✅ Store success
        setPushResults((prev) => ({
          ...prev,
          [outlet.outlet_id]: { success: true, date: now },
        }));
        toast.success(
          `${isUpdate ? "🔄 Updated" : "✅ Pushed"}: ${outlet.outlet_name}`,
          {
            duration: 4000,
            style: {
              borderRadius: "10px",
              background: isUpdate ? "#92400e" : "#166534",
              color: "white",
            },
          },
        );
        refetch();
      } else {
        // ✅ Store failure
        setPushResults((prev) => ({
          ...prev,
          [outlet.outlet_id]: {
            success: false,
            error: response.data.message || "Push failed",
          },
        }));
        toast.error(`❌ Failed: ${outlet.outlet_name}`, { duration: 5000 });
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error.message ||
        "Unknown error";
      //  Store error
      setPushResults((prev) => ({
        ...prev,
        [outlet.outlet_id]: { success: false, error: msg },
      }));
      toast.error(` ${outlet.outlet_name}: ${msg}`, { duration: 5000 });
    }
  };
  const handlePushAllToIRCTC = async () => {
    if (!filteredOutlets.length) {
      toast.error("No outlets to push!");
      return;
    }

    const stationCode = filteredOutlets[0].station_code;
    if (!stationCode) {
      toast.error("Station code not found!");
      return;
    }

    try {
      setIsPushingToIRCTC(true);

      const response = await olfService.post(
        `/restraunt/push-all/${stationCode}`,
        { outlets: filteredOutlets }, //  send ALL, backend handles POST vs PATCH
      );

      const { results } = response.data;
      const newPushResults: Record<
        number,
        { success: boolean; date?: string; error?: string }
      > = {};
      const now = format(new Date(), "dd MMM yyyy, HH:mm");
      results.forEach((r: any) => {
        if (r.status === "success") {
          newPushResults[r.outletId] = { success: true, date: now };
        } else {
          newPushResults[r.outletId] = {
            success: false,
            error: r.error || "Push failed",
          };
        }
      });
      setPushResults((prev) => ({ ...prev, ...newPushResults }));
      const createdItems = results.filter(
        (r: any) => r.status === "success" && r.action === "created",
      );
      const updatedItems = results.filter(
        (r: any) => r.status === "success" && r.action === "updated",
      );
      const failedItems = results.filter((r: any) => r.status === "failed");

      if (createdItems.length > 0) {
        const names = createdItems.map((r: any) => r.outletName).join(", ");
        toast.success(` ${createdItems.length} newly pushed:\n${names}`, {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#166534",
            color: "white",
            whiteSpace: "pre-line",
            maxWidth: "400px",
          },
        });
      }

      if (updatedItems.length > 0) {
        const names = updatedItems.map((r: any) => r.outletName).join(", ");
        toast(`🔄 ${updatedItems.length} updated on IRCTC:\n${names}`, {
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#92400e",
            color: "white",
            whiteSpace: "pre-line",
            maxWidth: "400px",
          },
        });
      }

      if (failedItems.length > 0) {
        const names = failedItems.map((r: any) => r.outletName).join(", ");
        toast.error(` ${failedItems.length} failed:\n${names}`, {
          duration: 6000,
          style: {
            borderRadius: "10px",
            background: "#991b1b",
            color: "white",
            whiteSpace: "pre-line",
            maxWidth: "400px",
          },
        });
      }

      if (!createdItems.length && !updatedItems.length && !failedItems.length) {
        toast("No outlets were processed.", { duration: 3000 });
      }

      refetch();
    } catch (error) {
      toast.error(
        `Push failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsPushingToIRCTC(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return e;
    }
  };

  // Format wallet amount with proper styling
  const formatWalletAmount = (amount: number) => {
    const formattedAmount = Math.abs(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      amount: formattedAmount,
      isNegative: amount < 0,
      isZero: amount === 0,
    };
  };

  // Sync pushResults to localStorage for persistence across refreshes
  useEffect(() => {
    localStorage.setItem("pushResults", JSON.stringify(pushResults));
  }, [pushResults]);
  const handleEditSuccess = () => {
    refetch();
  };

  const [vendor, setvendor] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const handleShowVendorDetails = async (
    vendorId: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent row click
    const res = await olfService.get("/rest-vendor", {
      params: { vendor_id: vendorId },
    });
    setvendor(res?.data?.data?.rows[0] || []);
    console.log(res?.data?.data?.rows[0]);
    setOpen(true);
  };

  // Navigation handlers for outlet details dialog
  const handleNavigateToWallet = (outletId: number) => {
    setIsOutletDetailsOpen(false);
    navigate({ to: `/wallet/${outletId}` });
  };

  const handleNavigateToOrders = (outletId: number) => {
    setIsOutletDetailsOpen(false);
    navigate({ to: `/outorders/${outletId}` });
  };
  const handleNavigateToDelivery = (outletId: number) => {
    navigate({ to: `/delivery/${outletId}` });
  };

  const handleNavigateToFeedback = (outletId: number) => {
    setIsOutletDetailsOpen(false);
    navigate({ to: `/feedbacks/${outletId}` });
  };
  const handleNavigateToMenu = (outletId: number) => {
    setIsOutletDetailsOpen(false);
    navigate({ to: `/menu/${outletId}` });
  };
  const handleNavigateToPendingMenu = (outletId: number) => {
    setIsOutletDetailsOpen(false);
    navigate({ to: `/pendingmenu/${outletId}` });
  };

  console.log(vendor);

  const isFssaiExpired = (dateString: string) => {
    if (!dateString) return false;

    // Get today's date with time set to the beginning of the day for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(dateString);

    // An invalid date string will result in expiryDate being "Invalid Date"
    // which compares as false, correctly handling bad data.
    return expiryDate < today;
  };

  if (isPending) return <div>Loading...</div>;
  if (queryError)
    return <div>Error loading outlets: {(queryError as Error).message}</div>;

  const stationDisplayName =
    !isPending && allOutlets.length > 0
      ? allOutlets[0].station_name // Use the name from the first outlet if data is loaded
      : stationcode;

  // Helper
  const getStatusInfo = (status: number) => {
    if (status === 0) {
      return {
        text: "Closed",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    } else if (status === 2) {
      return {
        text: "Inactive",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    } else {
      return {
        text: "Active",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    }
  };

  return (
    <div className="mx-4 my-6">
      {/* Vendor Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Name:</strong> {vendor?.vendor_name}
            </div>
            <div>
              <strong>Phone:</strong> {vendor?.vendor_phone}
            </div>
            <div>
              <strong>Email:</strong> {vendor?.vendor_email}
            </div>
            <div>
              <strong>Address:</strong> {vendor?.vendor_address}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Outlet Details Dialog */}
      <Dialog open={isOutletDetailsOpen} onOpenChange={setIsOutletDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedOutletForDetails?.logo_image && (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={
                      selectedOutletForDetails.logo_image == "NULL"
                        ? "https://www.olfstores.com/assets/img/20240509062619olf.png"
                        : selectedOutletForDetails.logo_image
                    }
                    alt={selectedOutletForDetails.outlet_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="text-xl font-bold">
                  Outlet Details - #{selectedOutletForDetails?.outlet_id}
                </div>
                <div className="text-lg text-gray-600">
                  {selectedOutletForDetails?.outlet_name}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedOutletForDetails && (
            <div className="space-y-6">
              {/* Navigation Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() =>
                    handleNavigateToMenu(selectedOutletForDetails.outlet_id)
                  }
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CupSoda className="h-4 w-4" />
                  Menu
                </Button>
                <Button
                  onClick={() =>
                    handleNavigateToPendingMenu(
                      selectedOutletForDetails.outlet_id,
                    )
                  }
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <TimerReset className="h-4 w-4" />
                  Pending Menu
                </Button>

                <Button
                  onClick={(e) =>
                    handleShowVendorDetails(
                      selectedOutletForDetails.vendor_id,
                      e,
                    )
                  }
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CupSoda className="h-4 w-4" />
                  Vendor
                </Button>
                <Button
                  onClick={() =>
                    handleNavigateToWallet(selectedOutletForDetails.outlet_id)
                  }
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Wallet className="h-4 w-4" />
                  Wallet
                </Button>
                <Button
                  onClick={() =>
                    handleNavigateToOrders(selectedOutletForDetails.outlet_id)
                  }
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </Button>
                <Button
                  onClick={() =>
                    handleNavigateToDelivery(selectedOutletForDetails.outlet_id)
                  }
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <UserCog className="h-4 w-4" />
                  Delivery persons
                </Button>

                <Button
                  onClick={() =>
                    handleNavigateToFeedback(selectedOutletForDetails.outlet_id)
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </Button>
              </div>

              {/* Outlet Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Outlet Name:</strong>{" "}
                      {selectedOutletForDetails.outlet_name}
                    </div>
                    <div>
                      <strong>Company:</strong>{" "}
                      {selectedOutletForDetails.company_name}
                    </div>
                    <div>
                      <strong>Station:</strong>{" "}
                      {selectedOutletForDetails.station_name} (
                      {selectedOutletForDetails.station_code})
                    </div>
                    <div>
                      <strong>Address:</strong>{" "}
                      {selectedOutletForDetails.address}
                    </div>
                    <div>
                      <strong>City:</strong> {selectedOutletForDetails.city}
                    </div>
                    <div>
                      <strong>State:</strong> {selectedOutletForDetails.state}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <strong>Tags:</strong>
                      {selectedOutletForDetails.tags &&
                        selectedOutletForDetails.tags
                          .split(",")
                          .map((tag: any, idx: any) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 ml-1"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-[max-content_1fr] items-start gap-x-4 gap-y-3">
                    {/* --- Row 4: Vendor --- */}
                    {selectedOutletForDetails.vendor_name && (
                      <>
                        <div className="flex items-center gap-2 text-gray-800">
                          <UserCog className="h-4 w-4 text-gray-500" />
                          <strong>Vendor:</strong>
                        </div>
                        <div className="break-words text-gray-700">
                          {" "}
                          {/* Allows text to wrap at spaces */}
                          {selectedOutletForDetails.vendor_name}
                        </div>
                      </>
                    )}
                    {/* --- Row 1: Phone --- */}
                    <div className="flex items-center gap-2 text-gray-800">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <strong>Phone:</strong>
                    </div>
                    <div className="font-medium text-gray-700">
                      {selectedOutletForDetails.phone}
                    </div>

                    {/* --- Row 2: Alternative Phones (if they exist) --- */}
                    {Array.isArray(
                      selectedOutletForDetails?.alternative_phones,
                    ) &&
                      selectedOutletForDetails?.alternative_phones?.length >
                        0 && (
                        <>
                          <div className="flex items-center gap-2 text-gray-800">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <strong>Alt Phone:</strong>
                          </div>
                          <div className="font-medium text-gray-700">
                            {selectedOutletForDetails.alternative_phones.map(
                              (phone: any) => (
                                <div key={phone}>{phone}</div>
                              ),
                            )}
                          </div>
                        </>
                      )}

                    {/* --- Row 3: Email --- */}
                    <div className="flex items-center gap-2 text-gray-800">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <strong>Email:</strong>
                    </div>
                    <div className="break-all text-gray-700">
                      {" "}
                      {/* Allows long text to wrap */}
                      {selectedOutletForDetails.email}
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Operational Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Opening Time:</strong>{" "}
                      {selectedOutletForDetails.opening_time}
                    </div>
                    <div>
                      <strong>Closing Time:</strong>{" "}
                      {selectedOutletForDetails.closing_time}
                    </div>
                    <div>
                      <strong>Order Preparation Time:</strong>{" "}
                      {selectedOutletForDetails.order_timing} minutes
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-gray-500" />
                      <strong>Min Order Amount:</strong> ₹
                      {selectedOutletForDetails.min_order_amount}
                    </div>
                    <div>
                      <strong>Payment Mode:</strong>{" "}
                      {selectedOutletForDetails.prepaid
                        ? "Prepaid Only"
                        : "COD & Prepaid"}
                    </div>
                    <div>
                      <strong>Delivery Charges:</strong>
                      {selectedOutletForDetails?.delivery_charges?.length >
                      0 ? (
                        JSON.parse(
                          selectedOutletForDetails.delivery_charges,
                        ).map((data: any, idx: number) => (
                          <div key={idx} className="ml-4 text-sm">
                            ₹{data.deliveryFee} for orders above ₹
                            {data.amountMoreThan}
                          </div>
                        ))
                      ) : (
                        <div className="ml-4 text-sm">Free Delivery</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Information - New Card for Wallet */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const walletInfo = formatWalletAmount(
                        selectedOutletForDetails.wallet_amount,
                      );
                      return (
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-gray-500" />
                          <strong>Wallet Balance:</strong>
                          <span
                            className={`font-bold text-lg ${
                              walletInfo.isNegative
                                ? "text-red-600"
                                : walletInfo.isZero
                                  ? "text-gray-500"
                                  : "text-green-600"
                            }`}
                          >
                            {walletInfo.isNegative ? "-" : ""}₹
                            {walletInfo.amount}
                          </span>
                          {walletInfo.isNegative}
                          {walletInfo.isZero && (
                            <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full ml-2">
                              Zero Balance
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Legal Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Legal Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>GST Number:</strong>{" "}
                      {selectedOutletForDetails.gst}
                    </div>
                    <div>
                      <strong>PAN Number:</strong>{" "}
                      {selectedOutletForDetails.vendor_pan_number}
                    </div>
                    <div>
                      <strong>FSSAI License:</strong>{" "}
                      {selectedOutletForDetails.fssai}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <strong>FSSAI Valid Till:</strong>{" "}
                      {String(formatDate(selectedOutletForDetails.fssai_valid))}
                      {isFssaiExpired(selectedOutletForDetails.fssai_valid) && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                          Expired
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Information */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedOutletForDetails?.closing_period?.length > 0 ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <strong>Status:</strong>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOutletForDetails?.closing_period?.length > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedOutletForDetails?.closing_period?.length > 0
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </div>
                    {selectedOutletForDetails?.updated_by && (
                      <div>
                        <strong>Last Updated By:</strong>{" "}
                        {selectedOutletForDetails.updated_by}
                      </div>
                    )}
                    {selectedOutletForDetails?.updated_at && (
                      <div>
                        <strong>Last Updated At:</strong>{" "}
                        {selectedOutletForDetails.updated_at}
                      </div>
                    )}
                    {selectedOutletForDetails?.closing_period?.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-md">
                        <strong>Closure Information:</strong>
                        <div className="mt-1 text-sm">
                          This outlet is currently inactive due to closure
                          period settings.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        className="mb-4"
        onClick={() => window.history.back()}
      >
        <ArrowLeft />
      </Button>

      {/* This component is responsible for rendering the toasts */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options for all toasts
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          // Default options for specific types
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
      <Card>
        <CardHeader className="bg-gray-50 p-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {stationcode
                ? `Outlets on ${stationDisplayName} (${stationcode})`
                : "All Outlets"}
            </CardTitle>
            <div className="flex gap-2">
              {/* New Push All To IRCTC Button */}
              <Button
                onClick={handlePushAllToIRCTC}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isPushingToIRCTC || filteredOutlets.length === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isPushingToIRCTC ? "Pushing..." : "Push All to IRCTC"}
              </Button>
              <ExportOutlet data={allOutlets} isLoading={isPending} />

              {stationcode && (
                <AddOutletButton
                  stationId={stationcode}
                  vendorId={1}
                  onSuccess={() => {
                    // Handle successful outlet creation
                    // e.g., refresh data, show notification, etc.
                  }}
                  className="custom-button-class"
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search outlets..."
                className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-gray-300 text-gray-600 hover:bg-gray-100"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[120px] border-gray-300">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="15">15 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* THIS IS THE MISSING PART THAT FIXES THE ERROR */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <Select value={filterTags} onValueChange={setFilterTags}>
                    <SelectTrigger className="border-gray-300 bg-white">
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {outletTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* The rest of your filters */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="border-gray-300 bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Station
                  </label>
                  <Select
                    value={filterStation}
                    onValueChange={setFilterStation}
                  >
                    <SelectTrigger className="border-gray-300 bg-white">
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stations</SelectItem>
                      {stations.map((station: any) => (
                        <SelectItem key={station} value={station}>
                          {station}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    City
                  </label>
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="border-gray-300 bg-white">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((city: any) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    State
                  </label>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger className="border-gray-300 bg-white">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state: any) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Table with horizontal scroll for many columns */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      OUTLET ID
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      OUTLET NAME
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      STATION
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      TIMING
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      ORDER INFO
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      CONTACT
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      DOCUMENTS
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      WALLET BALANCE
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      ACTIONS
                    </TableHead>
                    <TableHead className="font-bold text-gray-1000 border-x border-gray-200 p-3">
                      LAST PUSH
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOutlets.length > 0 ? (
                    paginatedOutlets.map((outlet: Outlet) => (
                      <TableRow
                        key={outlet.outlet_id}
                        className="bg-white hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(outlet)}
                      >
                        <TableCell className="font-medium text-gray-900 border-x border-gray-200 p-3">
                          <div
                            className="font-semibold text-blue-600 cursor-pointer hover:underline"
                            onClick={(e) => handleOutletIdClick(outlet, e)}
                          >
                            #{outlet.outlet_id}
                          </div>
                        </TableCell>
                        <TableCell
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(outlet, "basic");
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Outlet Logo Image */}
                            {outlet.logo_image && (
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={
                                    outlet.logo_image == "NULL"
                                      ? "https://www.olfstores.com/assets/img/20240509062619olf.png"
                                      : outlet.logo_image
                                  }
                                  alt={outlet.outlet_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="flex flex-col">
                              {/* Outlet Name (Main Title) */}
                              <div className="font-semibold text-gray-900">
                                {outlet.outlet_name}
                              </div>

                              {/* Tags Section: Replacing Text with Icons */}
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {outlet.tags &&
                                  outlet.tags.split(",").map((tag, idx) => {
                                    const cleanTag = tag.trim().toLowerCase();

                                    // 1. If tag is VEG -> Show Green Icon
                                    if (
                                      cleanTag === "veg" ||
                                      cleanTag === "pure veg"
                                    ) {
                                      return (
                                        <img
                                          key={idx}
                                          src={vegIcon}
                                          alt="Veg"
                                          className="w-4 h-4"
                                          title="Veg"
                                        />
                                      );
                                    }

                                    // 2. If tag is NON VEG -> Show Red Icon
                                    if (cleanTag.includes("non")) {
                                      return (
                                        <img
                                          key={idx}
                                          src={nonVegIcon}
                                          alt="Non-Veg"
                                          className="w-4 h-4"
                                          title="Non-Veg"
                                        />
                                      );
                                    }

                                    // 3. For any other tags (e.g. "Chinese", "Bakery") -> Show Text Pill
                                    return (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                                      >
                                        {tag.trim()}
                                      </span>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-800">
                                {outlet.station_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {outlet.station_code}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell
                          className="border-x border-gray-200 p-3"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the row click
                            openEditDialog(outlet, "orders");
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm text-gray-700">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <span>
                                {outlet.opening_time} - {outlet.closing_time}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 pl-6">
                              Prep: {outlet.order_timing} mins
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          <div className="flex flex-col text-sm text-gray-700">
                            <div className="flex items-center">
                              <IndianRupee className="h-4 w-4 text-gray-400 mr-2" />
                              <span>Min: ₹{outlet.min_order_amount}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 pl-6">
                              {outlet.prepaid
                                ? "Prepaid only"
                                : "COD & Prepaid"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center text-gray-700">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="font-medium">
                                {outlet.phone}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                              {outlet.email}
                            </div>
                            <div className="text-xs text-gray-900 mt-1 truncate max-w-[150px]">
                              {outlet.vendor_name}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell
                          className="border-x border-gray-200 p-3"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the row click
                            openEditDialog(outlet, "business");
                          }}
                        >
                          <div className="flex flex-col text-sm text-gray-700">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-gray-400 mr-2" />
                              <span>GST: {outlet.gst}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <FileText className="h-4 w-4 text-gray-400 mr-2" />
                              <span>FSSAI: {outlet.fssai}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <span>
                                Valid till:{" "}
                                {String(formatDate(outlet.fssai_valid))}
                              </span>
                              {isFssaiExpired(outlet.fssai_valid) && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                                  Expired
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          {(() => {
                            const walletInfo = formatWalletAmount(
                              outlet.wallet_amount,
                            );
                            return (
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-1">
                                  <Wallet className="h-4 w-4 text-gray-400" />
                                  <span
                                    className={`font-bold text-sm ${
                                      walletInfo.isNegative
                                        ? "text-red-600"
                                        : walletInfo.isZero
                                          ? "text-gray-500"
                                          : "text-green-600"
                                    }`}
                                  >
                                    {walletInfo.isNegative ? "-" : ""}₹
                                    {walletInfo.amount}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          {(() => {
                            const statusInfo = getStatusInfo(outlet.status);
                            return (
                              <div className="flex flex-wrap gap-1 items-center">
                                <Button
                                  variant={"outline"}
                                  className={`${statusInfo.className} text-xs h-auto py-1 px-2`}
                                  title={
                                    outlet.status === 1
                                      ? "Set closure period (make inactive)"
                                      : "Re-activate this outlet"
                                  }
                                  onClick={(e) => {
                                    if (outlet.status === 1) {
                                      handleAddClosure(outlet, e);
                                    } else {
                                      initiateReactivate(outlet.outlet_id, e);
                                    }
                                  }}
                                >
                                  {statusInfo.text}
                                </Button>
                                <Button
                                  className={`text-white text-xs ${
                                    outlet.irctc_application_id
                                      ? "bg-orange-500 hover:bg-orange-600"
                                      : "bg-blue-500 hover:bg-blue-600"
                                  }`}
                                  onClick={(e) =>
                                    handlePushSingleToIRCTC(outlet, e)
                                  }
                                  title={
                                    outlet.irctc_application_id
                                      ? `Re-push to update (App ID: ${outlet.irctc_application_id})`
                                      : "Push to IRCTC for the first time"
                                  }
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  {outlet.irctc_application_id
                                    ? "Re-Push"
                                    : "Push"}
                                </Button>
                                <div className="flex flex-col mt-1">
                                  <span className="text-xs text-gray-500">
                                    {outlet?.updated_by}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {outlet?.updated_at}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) =>
                                initiateDeleteOutlet(outlet.outlet_id, e)
                              }
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => handleEditOutlet(outlet, e)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="border-x border-gray-200 p-3">
                          {(() => {
                            const result = pushResults[outlet.outlet_id];
                            if (!result) {
                              return (
                                <span className="text-xs text-gray-400">—</span>
                              );
                            }
                            if (result.success) {
                              return (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs font-medium">
                                    {result.date}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-start gap-1 text-red-600">
                                <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                <span className="text-xs leading-snug">
                                  {result.error}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {Math.min(
                filteredOutlets.length,
                (currentPage - 1) * itemsPerPage + 1,
              )}{" "}
              to {Math.min(filteredOutlets.length, currentPage * itemsPerPage)}{" "}
              of {filteredOutlets.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p: any) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
                        ? "bg-gray-800 text-white hover:bg-gray-900"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
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
                  setCurrentPage((p: any) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you really want to delete this outlet? It will be moved to
                  the Deleted list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeleteOutlet();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={isReactivateDialogOpen}
            onOpenChange={setIsReactivateDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reactivate Outlet</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reactivate this outlet? It will be
                  set to "Active" status immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmReactivate();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Yes, Reactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Outlet Dialog */}
          <EditOutlet
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            outletData={selectedOutlet}
            onSave={handleEditSuccess}
            defaultTab={editDialogDefaultTab}
          />

          <AddClosure
            open={isClosureDialogOpen}
            onOpenChange={setClosureDialogOpen}
            onSuccess={handleEditSuccess}
            outletData={selectedOutlet}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Outlets;
