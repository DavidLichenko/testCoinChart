import LinkBox from "@/components/link_box";
import { useAuth } from "@/components/auth-provider";

const NavItem = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'OWNER' || user?.role === 'CR_MANAGMENT' || user?.role === 'TEAMLEAD';

    const routes = [
        {
           name: "Dashboard",
           href: "/dashboard"
        },
        {
            name: "Transactions",
            href: "/transactions"
        },
        {
            name: "Market",
            href: "/market"
        },
        {
            name: "News",
            href: "/news"
        }
    ]

    if (isAdmin) {
        routes.push({ name: "Admin", href: "/admin" });
    }

    return (
        <div className="route  flex items-center justify-center gap-6">
            {routes.map((route) => (
                <LinkBox name={route.name} href={route.href} key={route.href} />
            ))}
        </div>
    );
};

export default NavItem;