// EditDialog.tsx
import  { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: Record<string, any> | null;
  allFields: string[];
  readOnlyFields: string[];
  onSave: (updatedRow: Record<string, any>) => void;
  formatKey: (key: string) => string;
}

export function EditOrder({
  open,
  onOpenChange,
  row,
  allFields,
  readOnlyFields,
  onSave,
  formatKey
}: EditDialogProps) {
  const [editedRow, setEditedRow] = useState<Record<string, any> | null>(null);
  
  // Fields to exclude from edit dialog
  const dialogExcludeFields = ['created_at', 'updated_at'];

  // Update editedRow when row changes
  useEffect(() => {
    setEditedRow(row);
  }, [row]);

  // Check if a field is a datetime field
  const isDateTimeField = (fieldKey: string) => {
    return fieldKey.toLowerCase().includes('time') || 
           fieldKey.toLowerCase().includes('date');
  };

  // Format datetime value for input
  const formatDateTimeValue = (value: any) => {
    if (!value) return '';
    
    try {
      // Try to convert to a valid datetime-local format
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DDThh:mm
      return date.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  // Handle dialog field changes
  const handleDialogFieldChange = (columnKey: string, value: any) => {
    if (editedRow) {
      setEditedRow({
        ...editedRow,
        [columnKey]: value,
      });
    }
  };

  // Check if a field is read-only
  const isReadOnly = (key: string) => readOnlyFields.includes(key);

  // Function to handle dialog close without losing changes
  const handleDialogClose = () => {
    onOpenChange(false);
  };

  // Save dialog changes
  const handleSave = () => {
    if (editedRow) {
      onSave(editedRow);
    }
  };

  if (!editedRow) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleDialogClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="max-w-xl bg-amber-50 p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-amber-200 to-yellow-300 p-4">
          <DialogTitle className="text-xl font-bold text-gray-800">Edit Food Item</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {/* Filter out excluded fields for dialog */}
            {allFields
              .filter(fieldKey => !dialogExcludeFields.includes(fieldKey))
              .map((fieldKey) => {
                return (
                  <div key={fieldKey} className="flex flex-col">
                    <span className="text-sm font-semibold mb-1 text-gray-700">{formatKey(fieldKey)}</span>
                    {isReadOnly(fieldKey) ? (
                      <div className={`p-2 rounded border border-amber-200`}>
                        {fieldKey.toLowerCase().includes('price') ? 
                          `₹ ${editedRow[fieldKey] || ''}` : 
                          (editedRow[fieldKey] === undefined ? '' : editedRow[fieldKey])}
                      </div>
                    ) : isDateTimeField(fieldKey) ? (
                      // DateTime selector for fields containing "time" or "date"
                      <Input
                        type="datetime-local"
                        className={`border-2 border-amber-200 rounded-md focus:border-amber-400 focus:ring focus:ring-amber-200`}
                        value={formatDateTimeValue(editedRow[fieldKey])}
                        onChange={(e) => handleDialogFieldChange(fieldKey, e.target.value)}
                      />
                    ) : (
                      <div className="relative">
                        {fieldKey.toLowerCase().includes('price') && (
                          <span className="absolute left-3 top-2 text-gray-600">₹</span>
                        )}
                        <Input
                          className={`border-2 border-amber-200 rounded-md  focus:border-amber-400 focus:ring focus:ring-amber-200 ${fieldKey.toLowerCase().includes('price') ? 'pl-7' : ''}`}
                          value={editedRow[fieldKey] || ''}
                          onChange={(e) => handleDialogFieldChange(fieldKey, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 bg-gradient-to-r from-amber-100 to-yellow-200">
          <Button 
            variant="outline" 
            className="border-2 border-gray-300 hover:bg-gray-100 flex items-center gap-2" 
            onClick={() => onOpenChange(false)}
          >
            <X size={16} /> Cancel
          </Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2" 
            onClick={handleSave}
          >
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}