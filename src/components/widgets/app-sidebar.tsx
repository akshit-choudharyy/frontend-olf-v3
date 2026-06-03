"use client"

import * as React from "react"
import {
  AudioWaveform,

  Book,

  Command,
  Contact,
  DoorOpenIcon,

  File,

  GalleryVerticalEnd,

  MicIcon,

  OctagonAlert,

  SquareTerminal,
  Train,
  Users,
  Wallet,
} from "lucide-react"

import { NavMain } from "../../components/widgets/nav-main"
import logo from "@/assets/images/logo.png"
import { NavUser } from "@/components/widgets/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {

  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      collapsible: false, // Set playground as non-collapsible
      // Removed the items array for Playground
    },
    {
      title: "Orders",
      url: "/orders",
      icon: Users,
      items: [
        {
          title: "Orders",
          url: "/orders",
        },
        {
          title: "Active Orders",
          url: "/orders/active",
        },
        {
          title: "Customers",
          url: "#",
        },

      ],
    },
    {
      title: "Outlets",
      url: "/outlets",
      icon: DoorOpenIcon,
      items: [
        {
          title: "Outlets",
          url: "/outlets",
        },
        {
          title: "All Outlets",
          url: "/alloutlets",
        },
        {
          title: "Vendors",
          url: "/vendors",
        },
        {
          title: "Inactive Outlets",
          url: "/inactiveoutlets",
        },
        {
          title: "Pending Outlets",
          url: "/pendingoutlets",
        },


        {
          title: "Deleted Outlets",
          url: "/deletedoutlets",
        },

      ],
    },

    {
      title: "Withdrawl Requests",
      url: "/requests",
      icon: Wallet,
      collapsible: false, // Set playground as non-collapsible
      // Removed the items array for Playground
    },

    {
      title: "Railway Stations",
      url: "/stations",
      icon: Train,
      items: [
        {
          title: "Railway Stations",
          url: "/stations",
        },
        {
          title: "Trains",
          url: "/trains",
        },


      ],
    },
    {
      title: "Oueries",
      url: "/allque",
      icon: Contact,
      collapsible: false, // Set playground as non-collapsible
      // Removed the items array for Playground
    },



    {
      title: "Human Resources",
      url: "/hr",
      icon: MicIcon,
      collapsible: false, // Set playground as non-collapsible
      // Removed the items array for Playground
    },


    {
      title: "Blogs",
      url: "/blogs",
      icon: Book,
      collapsible: false, // Set playground as non-collapsible
      // Removed the items array for Playground
    },

    {
      title: "Complaints",
      url: "/complaints",
      icon: OctagonAlert,
      collapsible: false, // Set playground as non-collapsible
      // Removed the items array for Playground
    },

    {
      title: "Reports",
      url: "/reports",
      icon: File,
      items: [
        {
          title: "Complaint Feedback",
          url: "/complaint-reports",
        },
        // {
        //   title: "Employee Feedback",
        //   url: "/trains",
        // },
      ],
    },

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const userdata = localStorage.getItem("persist:root");
  const parsedData = userdata ? JSON.parse(userdata) : null;
  const user = JSON.parse(parsedData.auth).user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center  ">
          <img
            src={logo}
            alt="Company Logo"
            className="h-16 w-full"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}