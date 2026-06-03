import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { 
  Users, 
  UserCheck, 
  Building2, 
  CreditCard, 
  FileText, 
  TrendingUp,
  Settings,
  ChevronRight,
  Star,
  Award,
  Clock
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

// Dashboard Component
const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekendDays, setWeekendDays] = useState([0]); // Sunday by default

  const toggleWeekendDay = (dayIndex:any) => {
    setWeekendDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Navigation cards data
  const navigationCards = [
    {
      title: "Employees",
      description: "Manage employee profiles, personal information, and employment details",
      icon: Users,
      route: "/employees",
      color: "bg-blue-500",
      stats: "1,470 Total"
    },
    {
      title: "Roles",
      description: "Define job roles, responsibilities, and role hierarchies",
      icon: UserCheck,
      route: "/roles",
      color: "bg-green-500",
      stats: "24 Active Roles"
    },
    {
      title: "Departments",
      description: "Organize departments, teams, and organizational structure",
      icon: Building2,
      route: "/departments",
      color: "bg-purple-500",
      stats: "12 Departments"
    },
    {
      title: "Payout History",
      description: "Track salary payments, bonuses, and compensation history",
      icon: CreditCard,
      route: "/payout-history",
      color: "bg-orange-500",
      stats: "₹2.4M This Month"
    },
    {
      title: "Offer Letter Templates",
      description: "Create and manage standardized offer letter templates",
      icon: FileText,
      route: "/templates",
      color: "bg-pink-500",
      stats: "8 Templates"
    }
  ];
const navigate = useNavigate();
  const handleNavigation = (route:any) => {
    navigate({ to: route });
    // In a real app, you would use router.push(route) or similar
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className=" mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">HR Dashboard</h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,470</div>
              <div className="text-sm opacity-80 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +2.3% from last month
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Male</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">882</div>
              <div className="text-sm opacity-80">60% of workforce</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Female</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">588</div>
              <div className="text-sm opacity-80">40% of workforce</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Active Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,353</div>
              <div className="text-sm opacity-80">92.0% active rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigationCards.map((card, index) => (
              <Card 
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
                onClick={() => handleNavigation(card.route)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${card.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{card.description}</p>
                  <div className="text-sm font-medium text-gray-500">{card.stats}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Due for Promotion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">72</div>
              <div className="text-sm text-gray-500">4.9% of total employees</div>
              <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">Review pending promotions this quarter</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                Job Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Level 1</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">543</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Level 2</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">534</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Level 3</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">218</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                Calendar Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" />
                    Weekend Days
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {dayNames.map((day, index) => (
                      <div key={day} className="flex items-center space-x-2 p-1">
                        <Switch
                          id={`day-${index}`}
                          checked={weekendDays.includes(index)}
                          onCheckedChange={() => toggleWeekendDay(index)}
                        />
                        <Label htmlFor={`day-${index}`} className="text-xs">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) setSelectedDate(date);
                    }}
                    className="rounded-md border-0 shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;