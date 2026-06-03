import React, { useState, useEffect } from 'react';
import { Bell, Users, Store, UserPlus,  ChevronDown } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PieCharts from './PieCharts';
import OrderChart from './OrderChart';
import RevenueChart from './RevenueChart';
import CustomerMap from './CustomerMap';

// Mock components for the dashboard
const StatsCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Total Orders</h3>
      <p className="text-2xl font-bold text-blue-600">1,234</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Revenue</h3>
      <p className="text-2xl font-bold text-green-600">$45,678</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Customers</h3>
      <p className="text-2xl font-bold text-purple-600">5,678</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Active Restaurants</h3>
      <p className="text-2xl font-bold text-orange-600">89</p>
    </div>
  </div>
);



// Notification Menu Component
const NotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(true);

  // Mock notification counts
  const notifications = {
    customerQueries: 5,
    restaurantRequests: 3,
    onboardingRequests: 8,
  };

  const totalNotifications = Object.values(notifications).reduce((sum, count) => sum + count, 0);

  // Blinking animation control
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const notificationItems = [
    {
      title: 'Customer Queries',
      count: notifications.customerQueries,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      route:'/custque'
    },
    {
      title: 'Restaurant Requests',
      count: notifications.restaurantRequests,
      icon: Store,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      route:'/restreq'
    },
    {
      title: 'Onboarding Requests',
      count: notifications.onboardingRequests,
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      route:'/pendingoutlets'

    },
    
  ];

  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 ${
          isBlinking && totalNotifications > 0 ? 'animate-pulse' : ''
        }`}
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {totalNotifications > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold ${
            isBlinking ? 'animate-bounce' : ''
          }`}>
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <span className="text-sm text-gray-500">{totalNotifications} new</span>
              </div>
            </div>

            {/* Notification Items */}
            <div className="max-h-96 overflow-y-auto">
              {notificationItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                     navigate({to:item.route});
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${item.bgColor}`}>
                        <IconComponent className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {item.count} new {item.count === 1 ? 'notification' : 'notifications'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.count > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            {item.count}
                          </span>
                        )}
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
              <button 
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                onClick={() => {
                  console.log('View all notifications');
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Notification */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-2 sm:p-2 lg:p-8 container mx-auto max-w-7xl">
        {/* Stats Cards Section */}
        <section className="mb-8">
          <StatsCards />
        </section>
        
        {/* Charts Section - All with equal height */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* First Row */}
            <div className="w-full h-full flex">
              <div className="w-full flex-1 flex flex-col">
                <PieCharts />
              </div>
            </div>
            <div className="w-full h-full flex">
              <div className="w-full flex-1 flex flex-col">
                <OrderChart />
              </div>
            </div>
            
            {/* Second Row */}
            <div className="w-full h-full flex">
              <div className="w-full flex-1 flex flex-col">
                <RevenueChart />
              </div>
            </div>
            <div className="w-full h-full flex">
              <div className="w-full flex-1 flex flex-col">
                <CustomerMap />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;