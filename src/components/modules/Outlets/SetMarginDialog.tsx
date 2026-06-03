import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetMarginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onApply: (margin: number) => Promise<void>; // Make onApply async
}

const SetMarginDialog: React.FC<SetMarginDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onApply,
}) => {
  const [margin, setMargin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleApplyClick = async () => {
    const marginValue = parseFloat(margin);
    if (isNaN(marginValue) || marginValue < 0) {
      setError('Please enter a valid, non-negative margin percentage.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onApply(marginValue); // Await the promise from the parent
      onOpenChange(false); // Close dialog on success
    } catch (err) {
      // Error is handled by toast in the parent component
      console.error("Failed to apply margin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setMargin('');
        setError('');
        setIsLoading(false);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="margin" className="text-right">
              Margin (%)
            </Label>
            <Input
              id="margin"
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="e.g., 20"
              className="col-span-3"
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApplyClick} disabled={isLoading}>
            {isLoading ? 'Applying...' : 'Apply Margin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetMarginDialog;