import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, UtensilsCrossed, RefreshCw, Star } from 'lucide-react';

const RatingPieChart = ({ value,  color, title, subtitle, icon }:{value:any,color:any,title:any,subtitle:any,icon:any}) => {
  // Calculate stroke dash array for circle
  const maxValue = 5;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = value / maxValue;
  const dashArray = `${circumference * fillPercentage} ${circumference * (1 - fillPercentage)}`;
  
  // Calculate lighter color for background
  const getLighterColor = (hexColor:any) => {
    switch(hexColor) {
      case '#EF4444': return '#FECACA'; // Red to light red
      case '#10B981': return '#D1FAE5'; // Green to light green
      case '#3B82F6': return '#DBEAFE'; // Blue to light blue
      case '#F59E0B': return '#FEF3C7'; // Amber to light amber
      case '#8B5CF6': return '#EDE9FE'; // Purple to light purple
      default: return '#E5E7EB';
    }
  };

  // Get background color for card
  const getBackgroundColor = (hexColor:any) => {
    switch(hexColor) {
      case '#EF4444': return 'bg-red-50'; 
      case '#10B981': return 'bg-emerald-50'; 
      case '#3B82F6': return 'bg-blue-50'; 
      case '#F59E0B': return 'bg-amber-50';
      case '#8B5CF6': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };
  
  // Generate stars based on rating
  const renderStars = (rating:any) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-current" style={{ color }} />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-200" />
          <div className="absolute overflow-hidden w-2 h-4">
            <Star className="w-4 h-4 fill-current" style={{ color }} />
          </div>
        </div>
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-200" />);
    }
    
    return stars;
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-100">
      <CardHeader className={`${getBackgroundColor(color)} px-6 py-4 border-b border-opacity-20`} style={{ borderColor: getLighterColor(color) }}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-gray-800">{title}</CardTitle>
          <div className="p-2 rounded-full" style={{ backgroundColor: getLighterColor(color) }}>
            {icon}
          </div>
        </div>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          {/* Background circle */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={getLighterColor(color)}
              strokeWidth="12"
            />
            {/* Foreground circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={dashArray}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          {/* Value text */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold" style={{ color }}>{value.toFixed(1)}</span>
            <span className="text-xs text-gray-500 mt-1">out of {maxValue}</span>
          </div>
        </div>
        
        <div className="w-full mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Rating</span>
            <div className="flex">
              {renderStars(value)}
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
            <div 
              className="h-2 rounded-full" 
              style={{ width: `${(value/maxValue) * 100}%`, backgroundColor: color }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PieCharts = () => {
  const [showValue, setShowValue] = useState(true);
  const [showChart, setShowChart] = useState(true);
  
  const chartData = [
    { 
      title: 'Food Delivery', 
      value: 4.2, 
      color: '#8B5CF6',
      subtitle: 'customer satisfaction',
      icon: <ShoppingBag className="h-5 w-5 text-purple-500" />
    },
    { 
      title: 'Outlet Ratings', 
      value: 3.8, 
      color: '#10B981',
      subtitle: 'Average store experience',
      icon: <Store className="h-5 w-5 text-emerald-500" />
    },
    { 
      title: 'Food Quality', 
      value: 4.5, 
      color: '#F59E0B',
      subtitle: 'Average taste & freshness',
      icon: <UtensilsCrossed className="h-5 w-5 text-amber-500" />
    }
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 w-full max-w-6xl mx-auto p-2" style={{height:'100%'}}>
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Customer Rating Metrics</h3>
          <p className="text-sm text-gray-500 mt-1">Average ratings across all service channels</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
            onClick={() => setShowChart(!showChart)}
          >
            {showChart ? 'Hide Charts' : 'Show Charts'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-gray-600 border-gray-200 hover:bg-gray-50 gap-2"
            onClick={() => setShowValue(!showValue)}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>
      <div className="p-6">
        {showChart && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chartData.map((chart, index) => (
              <RatingPieChart 
                key={index}
                value={chart.value}
                color={chart.color}
                title={chart.title}
                subtitle={chart.subtitle}
                icon={chart.icon}
              />
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 rounded-b-xl">
        <div className="flex items-center justify-between">
          <span>Last updated: Today at 10:23 AM</span>
          <span>Total reviews analyzed: 2,458</span>
        </div>
      </div>
    </div>
  );
};

export default PieCharts;