import { 
  Activity, 
  Package,
  ShoppingBag,
  AlertCircle,
  Building,
  Map,
  Users
} from 'lucide-react';

const StatCard = ({ icon, value, label, color }:{icon:any,value:any,label:any,color:any}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
      <div className="rounded-lg h-16 w-16 flex items-center justify-center" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-gray-600">{label}</span>
      </div>
    </div>
  );
};

const StatsCards = () => {
  const stats = [
    {
      icon: <Activity className="h-8 w-8 text-white" />,
      value: "45",
      label: "Today's Live Orders",
      color: "#9C5CBF" // Darker purple
    },
    {
      icon: <Package className="h-8 w-8 text-white" />,
      value: "357",
      label: "Orders Delivered",
      color: "#2E9D5C" // Darker green
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-white" />,
      value: "38",
      label: "Orders Undelivered",
      color: "#6A5CBF" // Darker lavender
    },
    {
      icon: <AlertCircle className="h-8 w-8 text-white" />,
      value: "21",
      label: "Orders Cancelled",
      color: "#BF5CA6" // Darker pink
    },
    {
      icon: <Building className="h-8 w-8 text-white" />,
      value: "24",
      label: "No. of Stations",
      color: "#D98234" // Darker orange
    },
    {
      icon: <Map className="h-8 w-8 text-white" />,
      value: "8",
      label: "No. of Zones",
      color: "#3485D9" // Darker blue
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-white" />,
      value: "42",
      label: "Active Outlets",
      color: "#34A67C" // Darker teal
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      value: "76",
      label: "No. of Agents",
      color: "#8F52C9" // Darker violet
    }
  ];

  return (
    <div className="p-4  bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard 
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsCards;