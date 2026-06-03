import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface ReusableSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback to update open state */
  onOpenChange: (open: boolean) => void;
  /** Title text for the header */
  title: string;
  /** Optional description for the header */
  description?: string;
  /** Main content of the sheet (e.g. a form) */
  children: React.ReactNode;
  /** Optional footer content (e.g. action buttons) */
  footerContent?: React.ReactNode;
  /** Optional additional className for the SheetContent wrapper */
  contentClassName?: string;
  side?:"left"|"right"|"top"|"bottom";
}

export const ReusableSheet: React.FC<ReusableSheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerContent,
  contentClassName = "sm:max-w-lg w-[90vw] p-6",
  side="left"
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={contentClassName} side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
        {footerContent && (
          <SheetFooter className="mt-4 p-0">
            {footerContent}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
