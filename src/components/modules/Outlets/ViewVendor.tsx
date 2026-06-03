// ui/VendorInfoDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { olfService } from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  vendor_phone: string;
  vendor_email: string;
  vendor_address: string;
}

interface VendorInfoDialogProps {
  vendorId: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function ViewVendor({ vendorId, open, setOpen }: VendorInfoDialogProps) {
  const { data: vendor, isPending, error } = useQuery<Vendor | null>({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const res = await olfService.get("/rest-vendor", {
        params: { vendor_id: vendorId },
      });
      if (!res.data || res.data.status !== 1) {
        throw new Error("Unexpected response status");
      }
      return res.data.data || null;
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vendor Information</DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error loading vendor info</div>
        ) : vendor ? (
          <div className="space-y-4">
            <div><strong>Name:</strong> {vendor.vendor_name}</div>
            <div><strong>Phone:</strong> {vendor.vendor_phone}</div>
            <div><strong>Email:</strong> {vendor.vendor_email}</div>
            <div><strong>Address:</strong> {vendor.vendor_address}</div>
          </div>
        ) : (
          <div>Vendor not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
