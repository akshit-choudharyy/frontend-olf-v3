import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import Highcharts from 'highcharts';

const OrderChart = () => {
  const chartRef = useRef(null);
  const [activeDay, setActiveDay] = useState(4); // Thursday by default
  
  const data: number[] = useMemo(() => [320, 380, 320, 450, 380, 340, 420], []);
  const days = useMemo(() => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);
  const trendPercentage = 12.5; // Example trend data

  useEffect(() => {
    if (chartRef.current) {
      // Create chart with proper parameters order: container, options
      const chart = new Highcharts.Chart({
        chart: {
          renderTo: chartRef.current as HTMLElement,
          type: 'areaspline',
          height: 240,
          backgroundColor: 'transparent'
        },
       
        title: {
          text: ''
        },
        xAxis: {
          categories: days,
          labels: {
            enabled: false
          },
          lineWidth: 0,
          tickWidth: 0,
          crosshair: {
            width: 1,
            color: '#e2e8f0'
          }
        },
        yAxis: {
          title: {
            text: null
          },
          gridLineWidth: 1,
          gridLineColor: '#f1f5f9',
          labels: {
            enabled: true,
            style: {
              color: '#94a3b8',
              fontSize: '10px'
            }
          }
        },
        tooltip: {
          formatter: function() {
            return `<div style="font-weight: 500; color:#1e293b;">₹${this.y} Orders</div>
                    <div style="font-size: 11px; color: #64748b;">Oct 8th, 2023 · ${this.x}</div>`;
          },
          backgroundColor: 'white',
          borderWidth: 0,
          borderRadius: 8,
          padding: 10,
          shadow: {
            offsetX: 0,
            offsetY: 4,
            opacity: 0.1,
            width: 8
          }
        },
        plotOptions: {
          areaspline: {
            fillColor: {
              linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1
              },
              stops: [
                [0, 'rgba(59, 130, 246, 0.2)'],
                [1, 'rgba(59, 130, 246, 0.0)']
              ]
            },
            marker: {
              radius: 4,
              lineColor: '#3B82F6',
              lineWidth: 2,
              fillColor: 'white',
              symbol: 'circle',
              states: {
                hover: {
                  lineWidth: 3,
                  radius: 5
                }
              }
            },
            lineWidth: 3,
            color: '#3B82F6',
            states: {
              hover: {
                lineWidth: 3
              }
            }
          }
        },
        series: [{
          type: 'areaspline',
          name: 'Orders',
          data: data,
          marker: {
            enabled: true,
            symbol: 'circle'
          }
        }],
        credits: {
          enabled: false
        },
        legend: {
          enabled: false
        }
      });
      
      // Highlight active point
      const point = chart.series[0].points[activeDay];
      point.select(true, true);
    }
  }, [activeDay, days, data]);

  // Handle day selection
  const handleDayClick = (index:any) => {
    setActiveDay(index);
  };

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-50 flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">Order Analytics</CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Weekly performance overview
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50">
            <Calendar className="mr-1 h-4 w-4" />
            This Week
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-600">Total Orders</div>
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{data[activeDay]}</span>
              <span className="ml-2 text-xs font-medium flex items-center text-emerald-600">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {trendPercentage}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">vs previous period</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Selected Day</div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900">{days[activeDay]}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Oct 8th, 2023</div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="mt-4">
          <div ref={chartRef} className="h-60"></div>
        </div>
        
        {/* Day Selector */}
        <div className="grid grid-cols-7 gap-2 mt-4">
          {days.map((day, index) => (
            <div 
              key={index}
              onClick={() => handleDayClick(index)}
              className={`
                cursor-pointer px-1 py-2 rounded-md text-center transition-all
                ${activeDay === index ? 
                  'bg-blue-100 text-blue-700 font-medium' : 
                  'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-xs font-medium">{day.substring(0, 3)}</div>
              <div className="text-sm mt-1 font-semibold">{data[index]}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderChart;