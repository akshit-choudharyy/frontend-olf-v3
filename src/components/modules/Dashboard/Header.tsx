import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Package, 
  Settings,
  Search,
  Menu,
  X,
  Download
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  icon: React.ElementType;
  count: number;
  color: string;
  label: string;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Notification data with darker colors
  const notifications: NotificationItem[] = [
    { icon: Bell, count: 3, color: "blue", label: "Alerts" },
    { icon: Package, count: 2, color: "emerald", label: "Orders" },
    { icon: Settings, count: 0, color: "slate", label: "Settings" }
  ];

  // Color mapping for darker shades
  const getDarkerColor = (baseColor: string): string => {
    switch (baseColor) {
      case 'blue': return '#1E40AF'; // darker blue
      case 'emerald': return '#065F46'; // darker emerald
      case 'slate': return '#334155'; // darker slate
      default: return '#334155';
    }
  };

  // Color mapping for background colors
  const getLighterColor = (baseColor: string): string => {
    switch (baseColor) {
      case 'blue': return '#DBEAFE'; // light blue bg
      case 'emerald': return '#D1FAE5'; // light emerald bg
      case 'slate': return '#F1F5F9'; // light slate bg
      default: return '#F1F5F9';
    }
  };

  return (
    <header className={`bg-white sticky top-0 z-50 transition-all duration-200 ${
      isScrolled ? 'shadow-md' : 'shadow-sm border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="relative text-gray-600 hover:text-gray-900"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Search Section - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm transition-colors"
              />
              {searchValue && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button 
                    onClick={() => setSearchValue('')}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Notifications */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {/* Notification Icons */}
            <div className="flex items-center space-x-1 lg:space-x-3">
              {notifications.map((item, index) => (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <item.icon 
                        className="h-6 w-6 transition-colors" 
                        style={{ color: getDarkerColor(item.color) }}
                      />
                      {item.count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getDarkerColor(item.color) }}
                        >
                          {item.count > 9 ? '9+' : item.count}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="flex justify-between items-center">
                      <span>{item.label}</span>
                      {item.count > 0 && (
                        <Badge variant="secondary" className="text-xs"
                          style={{ 
                            backgroundColor: getLighterColor(item.color),
                            color: getDarkerColor(item.color)
                          }}
                        >
                          {item.count} new
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.count > 0 ? (
                      Array(Math.min(item.count, 3)).fill(0).map((_, i) => (
                        <DropdownMenuItem key={i} className="flex flex-col items-start py-2">
                          <div className="font-medium">New {item.label.slice(0, -1)}</div>
                          <div className="text-xs text-gray-500 mt-1">Just now</div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No new {item.label.toLowerCase()}
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-sm cursor-pointer"
                      style={{ color: getDarkerColor('blue') }}
                    >
                      View all
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>

            {/* Mobile search button */}
            <Button 
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(true)}
            >
              <Search className="h-6 w-6 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-3">
            {/* Mobile search */}
            <div className="px-2 py-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search dashboard..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                />
                {searchValue && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button 
                      onClick={() => setSearchValue('')}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile notifications */}
            <div className="grid grid-cols-3 gap-2 px-2 py-3">
              {notifications.map((item, index) => (
                <div key={index} className="relative flex flex-col items-center">
                  <div className="p-3 rounded-full" style={{ backgroundColor: getLighterColor(item.color) }}>
                    <item.icon className="h-6 w-6" style={{ color: getDarkerColor(item.color) }} />
                    {item.count > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: getDarkerColor(item.color) }}
                      >
                        {item.count > 9 ? '9+' : item.count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Mobile export button */}
            <div className="px-2 py-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                <Download className="h-5 w-5 mr-1" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;