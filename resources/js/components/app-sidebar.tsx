import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, LifeBuoy, Radio, Shield } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, home } from '@/routes';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminSupportIndex } from '@/routes/admin/support';
import { index as supportIndex } from '@/routes/support';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth, localization } = usePage().props;
    const mainNavItems: NavItem[] = [
        {
            title: 'Live',
            href: home(),
            icon: Radio,
        },
        {
            title: 'Studio',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Contact admin',
            href: supportIndex(),
            icon: LifeBuoy,
        },
    ];

    if (auth.user?.is_admin) {
        mainNavItems.push({
            title: 'Admin',
            href: adminDashboard(),
            icon: Shield,
        });
        mainNavItems.push({
            title: 'Support',
            href: adminSupportIndex(),
            icon: LifeBuoy,
        });
    }

    return (
        <Sidebar
            collapsible="icon"
            side={localization.isRtl ? 'right' : 'left'}
            variant="inset"
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={home()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <LanguageSwitcher variant="sidebar" align="start" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
