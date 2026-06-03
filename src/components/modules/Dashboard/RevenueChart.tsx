import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, ArrowUpRight, IndianRupee, ShoppingCart } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";

/**
 * @param {{ revenueAnalytics: { monthlyData: number[]; trendPercentage: number; }, orderAnalytics: { monthlyData: number[]; trendPercentage: number; }, totalOrders: number }} props
 */
const RevenueChart = ({ revenueAnalytics, orderAnalytics, totalOrders }: any) => {
  const chartRef = useRef(null);
  const { monthlyData: revenueMonthlyData = [], trendPercentage: revenueTrendPercentage = 0 } = revenueAnalytics || {};
  const { monthlyData: orderMonthlyData = [], trendPercentage: orderTrendPercentage = 0 } = orderAnalytics || {};

  // --- State for the date range ---
  const [date, setDate] = useState<DateRange | undefined>(() => {
    // Default to showing the last 3 months of the year
    const today = new Date();
    const year = today.getFullYear();
    return {
      from: new Date(year, 9, 1), // October 1st
      to: new Date(year, 11, 31),  // December 31st
    };
  });

  const allMonths = useMemo(() => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], []);

  // --- Memoized hook to filter data and perform calculations based on the selected date range ---
  const { totalRevenue, rangeTrendPercentage, filteredOrders, ordersTrendPercentage } = useMemo(() => {
    // Ensure orderMonthlyData is an array
    const safeOrderMonthlyData = Array.isArray(orderMonthlyData) ? orderMonthlyData : [];

    if (!date?.from || !date?.to) {
      // If no date range is selected, return all data
      const totalRev = revenueMonthlyData.reduce((acc: number, val: number) => acc + val, 0);
      return {
        filteredMonths: allMonths,
        filteredRevenue: revenueMonthlyData,
        filteredOrders: safeOrderMonthlyData,
        totalRevenue: totalRev,
        rangeTrendPercentage: revenueTrendPercentage,
        ordersTrendPercentage: orderTrendPercentage,
      };
    }

    const startMonth = date.from.getMonth();
    const endMonth = date.to.getMonth();

    // Slice the data for the selected range. +1 because slice's end index is exclusive.
    const slicedMonths = allMonths.slice(startMonth, endMonth + 1);
    const slicedRevenue = revenueMonthlyData.slice(startMonth, endMonth + 1);
    const slicedOrders = safeOrderMonthlyData.slice(startMonth, endMonth + 1);

    // Calculate total revenue for the selected range
    const newTotalRevenue = slicedRevenue.reduce((acc: number, val: number) => acc + val, 0);

    // Calculate trend percentage for revenue
    let newRevenueTrendPercentage = 0;
    if (slicedRevenue.length > 1 && slicedRevenue[0] !== 0) {
      const first = slicedRevenue[0];
      const last = slicedRevenue[slicedRevenue.length - 1];
      newRevenueTrendPercentage = parseFloat((((last - first) / first) * 100).toFixed(2));
    } else if (slicedRevenue.length === 1) {
      newRevenueTrendPercentage = 0; // No trend for a single month
    }

    // Calculate trend percentage for orders
    let newOrdersTrendPercentage = 0;
    if (slicedOrders.length > 1 && slicedOrders[0] !== 0) {
      const first = slicedOrders[0];
      const last = slicedOrders[slicedOrders.length - 1];
      newOrdersTrendPercentage = parseFloat((((last - first) / first) * 100).toFixed(2));
    } else if (slicedOrders.length === 1) {
      newOrdersTrendPercentage = 0; // No trend for a single month
    }

    return {
      filteredMonths: slicedMonths,
      filteredRevenue: slicedRevenue,
      filteredOrders: slicedOrders,
      totalRevenue: newTotalRevenue,
      rangeTrendPercentage: newRevenueTrendPercentage,
      ordersTrendPercentage: newOrdersTrendPercentage,
    };
  }, [date, allMonths, revenueMonthlyData, orderMonthlyData, revenueTrendPercentage, orderTrendPercentage]);

  // Calculate filtered total orders only when a date range is selected
  const filteredTotalOrders = date?.from && date?.to 
    ? filteredOrders.reduce((acc: number, val: number) => acc + val, 0)
    : totalOrders;

  return (
    <Card className="shadow-sm border-gray-100 h-full">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">Revenue Analytics</CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">Monthly revenue performance</CardDescription>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                size="sm"
                className="w-[240px] justify-start text-left font-normal text-gray-600 bg-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL")} - {format(date.to, "LLL y")}
                    </>
                  ) : (
                    format(date.from, "LLL y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"><Download className="mr-1 h-4 w-4" /> Export</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Stats with Total Revenue and Total Orders */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-emerald-600">Total Revenue (Selected Range)</div>
              <div className="bg-white p-1.5 rounded-full shadow-sm"><IndianRupee className="h-4 w-4 text-emerald-500" /></div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</span>
              <span className={`ml-2 text-xs font-medium flex items-center ${rangeTrendPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <ArrowUpRight className={`h-3 w-3 mr-0.5 ${rangeTrendPercentage < 0 ? 'transform rotate-90' : ''}`} />
                {Math.abs(rangeTrendPercentage)}%
              </span>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-600">Total Orders (Selected Range)</div>
              <div className="bg-white p-1.5 rounded-full shadow-sm"><ShoppingCart className="h-4 w-4 text-blue-500" /></div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{filteredTotalOrders.toLocaleString()}</span>
              <span className={`ml-2 text-xs font-medium flex items-center ${ordersTrendPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <ArrowUpRight className={`h-3 w-3 mr-0.5 ${ordersTrendPercentage < 0 ? 'transform rotate-90' : ''}`} />
                {Math.abs(ordersTrendPercentage)}%
              </span>
            </div>
          </div>
        </div>
        <div ref={chartRef} className="h-60"></div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;