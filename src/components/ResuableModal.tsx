// ReusableModal.tsx
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface ReusableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  contentClassName?: string;
}

export const ReusableModal: React.FC<ReusableModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerContent,
  contentClassName="w-full max-h-screen overflow-y-auto"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader className="p-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Scrollable content wrapper */}
        <ScrollArea >
          {children}
        </ScrollArea>

        {footerContent && (
          <DialogFooter className="mt-4 p-0">
            {footerContent}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
