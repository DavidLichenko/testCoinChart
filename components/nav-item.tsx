import LinkBox from "@/components/link_box";

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

const NavItem = () => {
    return (
        <div className="route  flex items-center justify-center gap-6">
            {routes.map((route) => (
                <LinkBox name={route.name} href={route.href} key={route.href} />
            ))}
        </div>
    );
};

export default NavItem;