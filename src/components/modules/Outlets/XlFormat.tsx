import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const XlFormat = ({ data = [], isLoading = false }: { data: any, isLoading: boolean }) => {
  const handleDownload = async () => {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Add the Items worksheet
    const worksheet = workbook.addWorksheet('Items');

    // Define the columns statically to match the required format
    worksheet.columns = [
      { header: 'Item ID', key: 'item_id', width: 15 },
      { header: 'Item Name', key: 'item_name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Vendor Price', key: 'vendor_price', width: 15 },
      { header: 'Base Price', key: 'base_price', width: 15 },
      { header: 'Tax', key: 'tax', width: 15 },
      { header: 'Selling Price', key: 'selling_price', width: 15 },
      { header: 'Opening Time', key: 'opening_time', width: 20 },
      { header: 'Closing Time', key: 'closing_time', width: 20 },
      { header: 'Is Vegetarian', key: 'is_vegeterian', width: 15 },
      { header: 'Cuisine', key: 'cuisine', width: 20 },
      { header: 'Food Type', key: 'food_type', width: 20 }
    ];

    if (data.length > 0) {
        // Add the data rows with transformations
        data.forEach((item: any) => {
            const sellingPrice = (item.base_price || 0) + (item.tax || 0);
            const isVegetarianText = item.is_vegeterian === 1 ? 'Yes' : 'No';

            worksheet.addRow({
                item_id: item.item_id,
                item_name: item.item_name,
                description: item.description,
                vendor_price: item.vendor_price,
                base_price: item.base_price,
                tax: item.tax,
                selling_price: sellingPrice, // Calculated field
                opening_time: item.opening_time,
                closing_time: item.closing_time,
                is_vegeterian: isVegetarianText, // Transformed field
                cuisine: item.cuisine,
                food_type: item.food_type,
            });
        });

        // Apply styling to the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
    }


    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Trigger file download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'MenuItems.xlsx');
  };

  return (
    <Button
      onClick={handleDownload}
      className="" // You can add custom styling here if needed
      disabled={isLoading || data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Items
    </Button>
  );
};

export default XlFormat;