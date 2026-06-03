import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/widgets/app-sidebar';
import { Separator } from '@radix-ui/react-separator';
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute("/_authenticated")({
    component: IndexComponent,
    beforeLoad: async ({ context }: any) => {
        const { isLogged } = context.authentication;
        if (!isLogged()) {
            throw redirect({ to: "/login" });
        }
    },
});

function IndexComponent() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                      
                    </div>
                </header>
                <div >
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

