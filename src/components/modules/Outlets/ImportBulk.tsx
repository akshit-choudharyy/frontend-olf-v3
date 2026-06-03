import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileUp, File as FileIcon, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { olfService } from '@/utils/axiosInstance';
import * as XLSX from "xlsx";

interface ImportBulkProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: number;
  // removed currentData as it is no longer needed for template
}

const ImportBulk: React.FC<ImportBulkProps> = ({ 
  open, 
  onOpenChange, 
  outletId
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // --- NEW: Download Dummy Template ---
  const handleDownloadTemplate = () => {
    // 1. Define Dummy Data structure matching Backend expectations
    const templateData = [
      {
        "Item ID": "", // Leave empty for new items, fill if updating known ID
        "Item Name": "Example Butter Chicken",
        "Description": "Spicy rich curry",
        "Vendor Price": 200,
        "Base Price": 250,
        "Tax": 12.5,
        "Selling Price": 262.5,
        "Opening Time": "10:00",
        "Closing Time": "22:00",
        "Is Vegetarian": "No",
        "Cuisine": "NORTH INDIAN",
        "Food Type": "Main Course"
      },
      {
        "Item ID": "",
        "Item Name": "Example Veg Burger",
        "Description": "Crispy patty with cheese",
        "Vendor Price": 100,
        "Base Price": 150,
        "Tax": 7.5,
        "Selling Price": 157.5,
        "Opening Time": "11:00",
        "Closing Time": "23:00",
        "Is Vegetarian": "Yes",
        "Cuisine": "FAST FOOD",
        "Food Type": "Snack"
      }
    ];

    // 2. Create Sheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Optional: Set column widths for better readability
    const wscols = [
      { wch: 10 }, // Item ID
      { wch: 25 }, // Item Name
      { wch: 30 }, // Description
      { wch: 12 }, // Vendor Price
      { wch: 12 }, // Base Price
      { wch: 10 }, // Tax
      { wch: 12 }, // Selling Price
      { wch: 15 }, // Opening
      { wch: 15 }, // Closing
      { wch: 12 }, // Veg
      { wch: 15 }, // Cuisine
      { wch: 15 }, // Type
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Menu_Template");
    
    // 3. Download
    XLSX.writeFile(workbook, `Menu_Upload_Template.xlsx`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        setSelectedFile(file);
      } else {
        toast({ title: "Invalid file", description: "Please use .xlsx", variant: "destructive" });
      }
    }
  };

  // --- CLEAN FILE BEFORE UPLOAD ---
  // (Simplified clean function since backend is now robust)
  const cleanFileToBlob = async (): Promise<Blob | null> => {
    if (!selectedFile) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          let jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          // Filter Empty Rows
          jsonData = jsonData.filter(row => 
             row["Item Name"] && row["Item Name"].toString().trim() !== ""
          );

          // Re-create Excel to ensure clean headers
          const newSheet = XLSX.utils.json_to_sheet(jsonData);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");
          
          const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsBinaryString(selectedFile);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !outletId) return;
    setIsUploading(true);

    try {
      const blobToSend = await cleanFileToBlob();
      if (!blobToSend) throw new Error("Failed to process file");

      const formData = new FormData();
      formData.append('file', blobToSend, 'menu_update.xlsx'); 
      
      const response = await olfService.post(`/itemupload/${outletId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 1 || response.status === 200) {
        toast({ title: "Success", description: "Menu updated successfully" });
        setSelectedFile(null);
        onOpenChange(false);
        window.location.reload();
      } else {
        throw new Error(response.data.info || "Failed to import");
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      toast({ 
        title: "Upload failed", 
        description: error.response?.data?.info || error.message || "Backend error", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-800">Bulk Menu Upload</DialogTitle>
          <DialogDescription>Download the template, fill it with your items, and upload.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
            {/* Step 1: Download Template */}
            <div className="flex flex-col gap-2 border p-4 rounded-md bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                   <FileSpreadsheet className="h-5 w-5 text-green-600"/> 
                   Step 1: Download Template
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Get a sample Excel file with the correct headers. 
                  <br/>
                  <ul className="list-disc ml-5 mt-1 text-xs text-gray-500">
                    <li>Leave <b>Item ID</b> empty to create new items.</li>
                    <li>Enter an <b>Item ID</b> to update an existing item.</li>
                  </ul>
                </div>
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full bg-white border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300">
                    <Download className="mr-2 h-4 w-4" /> Download Example Template
                </Button>
            </div>

            {/* Step 2: Upload File */}
            <div className="border-t pt-4">
              <div className="font-semibold text-gray-800 mb-2">Step 2: Upload Filled Excel</div>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  
                  {selectedFile ? (
                  <div className="flex items-center mt-2 p-2 bg-white border rounded w-full shadow-sm">
                      <FileIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-700 truncate font-medium">{selectedFile.name}</span>
                      <Button variant="ghost" size="sm" className="ml-auto text-xs h-6" onClick={() => setSelectedFile(null)}>Change</Button>
                  </div>
                  ) : (
                  <p className="text-sm text-gray-500 text-center">Drag and drop your Excel file here <br/> or click below</p>
                  )}
                  
                  <Button onClick={handleBrowseClick} variant="secondary" className="mt-4">
                      <FileUp className="h-4 w-4 mr-2" /> Select File
                  </Button>
              </div>
            </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} className="bg-green-600 hover:bg-green-700 text-white shadow-md" disabled={!selectedFile || isUploading}>
            {isUploading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Processing...</> : <><Upload className="h-4 w-4 mr-2" /> Upload Menu</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportBulk;