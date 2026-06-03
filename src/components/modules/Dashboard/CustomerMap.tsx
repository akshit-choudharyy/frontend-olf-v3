import React, { useEffect, useRef, useState } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Download, 
  Share2, 
  Info, 
  Users, 
  TrendingUp, 
  Map 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Highcharts from 'highcharts';

// Define types
type TimeframeType = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ViewType = 'column' | 'bar';

interface DataPoint {
  y: number;
  color: string;
}

interface SummaryData {
  total: number;
  average: number;
  change: string;
}

interface ChartOptions {
  chart: {
    type: string;
    height: number;
    backgroundColor: string;
    style: {
      fontFamily: string;
    };
  };
  title: {
    text: null;
  };
  xAxis: {
    categories: string[];
    lineWidth: number;
    lineColor: string;
    tickWidth: number;
    labels: {
      style: {
        color: string;
        fontSize: string;
        fontWeight: string;
      };
    };
  };
  yAxis: {
    title: {
      text: null;
    };
    min: number;
    tickInterval: number;
    gridLineColor: string;
    gridLineDashStyle: string;
    labels: {
      enabled: boolean;
      format: string;
      style: {
        color: string;
        fontSize: string;
      };
    };
  };
  legend: {
    enabled: boolean;
  };
  tooltip: {
    backgroundColor: string;
    borderWidth: number;
    borderRadius: number;
    shadow: {
      offsetX: number;
      offsetY: number;
      width: number;
      opacity: number;
    };
    useHTML: boolean;
    formatter: () => string;
  };
  plotOptions: {
    column: {
      pointPadding: number;
      borderWidth: number;
      borderRadius: number;
      states: {
        hover: {
          brightness: number;
        };
      };
    };
    bar: {
      pointPadding: number;
      borderWidth: number;
      borderRadius: number;
      states: {
        hover: {
          brightness: number;
        };
      };
    };
    series: {
      pointWidth: number;
    };
  };
  series: Array<{
    name: string;
    data: DataPoint[];
  }>;
  credits: {
    enabled: boolean;
  };
}

const CustomerMap: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<TimeframeType>('weekly');
  const [viewType, setViewType] = useState<ViewType>('column');
  
  // Generate days of week based on selected timeframe
  const getCategories = (): string[] => {
    if (timeframe === 'daily') return ['Morning', 'Afternoon', 'Evening', 'Night'];
    if (timeframe === 'weekly') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (timeframe === 'monthly') return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  };
  
  // Generate data based on selected timeframe
  const getData = (): DataPoint[] => {
    if (timeframe === 'daily') {
      return [
        {y: 45, color: '#3B82F6'},
        {y: 78, color: '#10B981'},
        {y: 92, color: '#8B5CF6'},
        {y: 35, color: '#F59E0B'}
      ];
    }
    if (timeframe === 'weekly') {
      return [
        {y: 80, color: '#3B82F6'},
        {y: 70, color: '#10B981'},
        {y: 40, color: '#8B5CF6'},
        {y: 90, color: '#F59E0B'},
        {y: 70, color: '#3B82F6'},
        {y: 25, color: '#10B981'},
        {y: 80, color: '#8B5CF6'}
      ];
    }
    if (timeframe === 'monthly') {
      return [
        {y: 180, color: '#3B82F6'},
        {y: 220, color: '#10B981'},
        {y: 195, color: '#8B5CF6'},
        {y: 240, color: '#F59E0B'}
      ];
    }
    return [
      {y: 450, color: '#3B82F6'},
      {y: 520, color: '#10B981'},
      {y: 480, color: '#8B5CF6'},
      {y: 620, color: '#F59E0B'},
      {y: 580, color: '#3B82F6'},
      {y: 490, color: '#10B981'},
      {y: 540, color: '#8B5CF6'},
      {y: 620, color: '#F59E0B'},
      {y: 590, color: '#3B82F6'},
      {y: 610, color: '#10B981'},
      {y: 680, color: '#8B5CF6'},
      {y: 720, color: '#F59E0B'}
    ];
  };
  
  // Get chart options based on current state
  const getChartOptions = (): Partial<ChartOptions> => {
    const categories = getCategories();
    const data = getData();
    
    return {
      chart: {
        type: viewType,
        height: 300,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      title: {
        text: null
      },
      xAxis: {
        categories: categories,
        lineWidth: 1,
        lineColor: '#E5E7EB',
        tickWidth: 0,
        labels: {
          style: {
            color: '#6B7280',
            fontSize: '12px',
            fontWeight: '500'
          }
        }
      },
      yAxis: {
        title: {
          text: null
        },
        min: 0,
        tickInterval: timeframe === 'yearly' ? 200 : timeframe === 'monthly' ? 100 : 20,
        gridLineColor: '#F3F4F6',
        gridLineDashStyle: 'solid',
        labels: {
          enabled: true,
          format: timeframe === 'yearly' ? '{value}' : '{value}',
          style: {
            color: '#6B7280',
            fontSize: '11px'
          }
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderWidth: 0,
        borderRadius: 8,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          width: 8,
          opacity: 0.075
        },
        useHTML: true,
        formatter: function(this: Highcharts.Point): string {
          const currencySymbol = '₹';
          return `
            <div style="padding: 4px 8px;">
              <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">${this.x}</div>
              <div style="display: flex; align-items: center;">
                <div style="background-color: ${(this.series.chart.hoverPoint as any)?.color}; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px;"></div>
                <span style="color: #4B5563;">${currencySymbol}${this.y} customers</span>
              </div>
            </div>
          `;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 4,
          states: {
            hover: {
              brightness: 0.1
            }
          }
        },
        bar: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 4,
          states: {
            hover: {
              brightness: 0.1
            }
          }
        },
        series: {
          pointWidth: viewType === 'column' ? (categories.length <= 7 ? 24 : 16) : 14
        }
      },
      series: [{
        name: 'Customers',
        data: data
      }],
      credits: {
        enabled: false
      }
    };
  };

  // Initialize chart on component mount and when state changes
  useEffect(() => {
    if (chartRef.current) {
      Highcharts.chart(chartRef.current, getChartOptions() as Highcharts.Options);
    }
  }, [timeframe, viewType]);

  // Summary data based on timeframe
  const getSummary = (): SummaryData => {
    const summaries: Record<TimeframeType, SummaryData> = {
      daily: { total: 250, average: 62, change: '+15%' },
      weekly: { total: 455, average: 65, change: '+8%' },
      monthly: { total: 835, average: 208, change: '+12%' },
      yearly: { total: 6900, average: 575, change: '+23%' }
    };
    return summaries[timeframe];
  };
  
  const summary = getSummary();

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-md mr-3">
            <Map className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Customer Distribution</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-0.5">
              Geographic customer analysis
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-3 bg-green-50 text-green-700 border-green-200">
            <TrendingUp className="h-3 w-3 mr-1" /> {summary.change}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs value={viewType} onValueChange={(value: string) => setViewType(value as ViewType)} className="h-9">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="column" className="text-xs px-3">Column</TabsTrigger>
              <TabsTrigger value="bar" className="text-xs px-3">Bar</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={timeframe} onValueChange={(value: string) => setTimeframe(value as TimeframeType)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Weekly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" /> Export Data
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Share2 className="h-4 w-4 mr-2" /> Share Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Info className="h-4 w-4 mr-2" /> View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Statistics summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-600">Total Customers</div>
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900">{summary.total}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">For selected period</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">Average</div>
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900">{summary.average}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">Per {timeframe === 'daily' ? 'period' : timeframe === 'weekly' ? 'day' : timeframe === 'monthly' ? 'week' : 'month'}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-green-600">Growth Rate</div>
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900">{summary.change}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">Compared to previous period</div>
          </div>
        </div>
        
        {/* Chart */}
        <div ref={chartRef} className="h-64 mt-2"></div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center mt-4 space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs text-gray-600">North</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <span className="text-xs text-gray-600">South</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-xs text-gray-600">East</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-xs text-gray-600">West</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerMap;