import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Store, User, Plus, Edit, AlertTriangle, Delete } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface RequestCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  route:any;
}

const RequestCard: React.FC<RequestCardProps> = ({ title, description, icon: Icon,  route }) => {
    const navigate = useNavigate();
  return (
    <Card onClick={()=>navigate({to:route})} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const AllQue: React.FC = () => {
  const requestTypes = [
    {
      title: "Customer Queries",
      description: "Handle customer support requests, complaints, and general inquiries from restaurant patrons",
      icon: MessageCircle,
      badgeVariant: "default" as const,

      route:'/custque'
    },
    {
      title: "Restaurant Onboarding Requests",
      description: "Process new restaurant registration requests and complete onboarding procedures",
      icon: Store,
      badgeVariant: "secondary" as const,
      route:'/pendingoutlets'
    },
    {
      title: "Restaurant Profile Change Request",
      description: "Update restaurant information, contact details, operating hours, and business profile",
      icon: User,
      badgeVariant: "outline" as const,
      route:'/restproreq'
    },
    {
      title: "New Item Request",
      description: "Add new menu items, dishes, and food products to restaurant catalogs",
      icon: Plus,
      badgeVariant: "default" as const,
      route:'/newitemreq'

    },
    {
      title: "Change Item Data Request",
      description: "Modify existing menu item details, pricing, descriptions, and availability",
      icon: Edit,
      badgeVariant: "secondary" as const,
      route:'/itemreq'
      
    },
    {
      title: "Delete Item Data Request",
      description: "Delete dish item request from vendors",
      icon: Delete,
      badgeVariant: "secondary" as const,
      route:'/delitemreq'
      
    },
    {
      title: "Restaurant FSSAI Expirations",
      description: "Monitor and manage Food Safety and Standards Authority of India license renewals",
      icon: AlertTriangle,
      badgeVariant: "destructive" as const,
      route:'/fssaiexp'
      
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Restaurant Management</h1>
        <p className="text-muted-foreground">Manage restaurant requests and administrative tasks</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requestTypes.map((request, index) => (
          <RequestCard
            key={index}
            title={request.title}
            description={request.description}
            icon={request.icon}
            badgeVariant={request.badgeVariant}
            route={request.route}
          />
        ))}
      </div>
    </div>
  );
};

export default AllQue;