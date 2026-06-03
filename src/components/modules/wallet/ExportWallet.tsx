// src/components/ExportWallet.tsx
import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { olfService } from '@/utils/axiosInstance';
import { format } from 'date-fns';

interface ExportWalletProps {
  outletid: any;
  dateRange: { start: string; end: string };
}

const ExportWallet = ({ outletid, dateRange }: ExportWalletProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!outletid) return;
    setIsExporting(true);
    
    try {
      // Fetch ALL transactions for the given date range (no pagination)
      const params = {
        outlet_id: outletid,
        from_date: dateRange.start || undefined,
        to_date: dateRange.end || undefined,
        // No 'limit' or 'page' params means we get all records
      };

      const response = await olfService.get('/vendor/wallet', { params });
      const transactions = response?.data?.data?.rows || [];

      if (transactions.length === 0) {
        alert('No data to export for the selected date range.');
        return;
      }

      // Generate CSV content
      const headers = [
        'Wallet ID', 'Order ID', 'Transaction Date', 'Transaction Type', 'Description', 
        'Order Amount (INR)', 'Opening Balance (INR)', 'Credit (INR)', 'Debit (INR)', 
        'Margin (INR)', 'Current Balance (INR)', 'Updated By'
      ];

      const csvContent = [
        headers.join(','),
        ...transactions.map((tx: any) => [
          tx.wallet_id,
          tx.order_id || 'N/A',
          `"${format(new Date(tx.transaction_date), 'yyyy-MM-dd HH:mm:ss')}"`,
          tx.transaction_type,
          `"${(tx.description || '').replace(/"/g, '""')}"`, // Handle quotes in description
          tx.net_amount || 0,
          tx.opening_balance || 0,
          tx.credit || 0,
          tx.debit || 0,
          tx.margin || 0,
          tx.current_balance || 0,
          tx.updated_by || 'system'
        ].join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const fileName = `WalletHistory_${outletid}_${dateRange.start}_to_${dateRange.end}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Failed to export wallet history:', error);
      alert('An error occurred while exporting the data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Export
    </Button>
  );
};

export default ExportWallet;