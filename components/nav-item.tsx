import LinkBox from "@/components/link_box";
import {useAuth} from "@/components/auth-provider";
import {useI18n} from "@/components/i18n-provider";
import {ChartCandlestickIcon, ListIcon, LucideWalletCards, Newspaper} from "lucide-react";
import {MdOutlineAccountTree} from "react-icons/md";

const NavItem = ({mobile = false }) => {
    const { user } = useAuth();
    const { t } = useI18n();

    const isAdmin =
        user?.role === "OWNER" ||
        user?.role === "CR_MANAGMENT" ||
        user?.role === "TEAMLEAD";

    const routes = [
        { name: t("market"), href: "/market", icon: <ChartCandlestickIcon className={'w-5 h-5 md:w-6 md:h-6 '}/>, color:"hover:bg-gradient-to-t hover:from-primary/60 hover:via-gray-900 hover:to-gray-900", bg:"bg-gradient-to-t from-primary/50 via-gray-900 to-gray-900" },
        { name: t("heroSlideWalletTag"), href: "/wallet" , icon: <LucideWalletCards className={'w-5 h-5 md:w-6 md:h-6 '}/>, color:"hover:bg-gradient-to-t hover:from-emerald-400 hover:via-gray-900 hover:to-gray-900",bg:"bg-gradient-to-t from-green-500 via-gray-900 to-gray-900" },
        { name: t("news"), href: "/news",  icon: <Newspaper className={'w-5 h-5 md:w-6 md:h-6 '}/>, color:"hover:bg-gradient-to-t hover:from-yellow-400 hover:via-gray-900 hover:to-gray-900", bg:"bg-gradient-to-t from-yellow-500 via-gray-900 to-gray-900"},
        // {name:"FAQ", href:"/faq", icon: <ListIcon className={'w-5 h-5 md:w-6 md:h-6 '}/>, color:"hover:bg-gradient-to-t hover:from-blue-500 hover:via-gray-900 hover:to-gray-900", bg:"bg-gradient-to-t from-blue-500 via-gray-900 to-gray-900" },
    ];

    if (isAdmin) {
        routes.push({ name: t("admin"), href: "/admin", icon: <MdOutlineAccountTree className={"w-5 h-5 md:w-6 md:h-6"}/>, color: "hover:bg-gradient-to-t  hover:from-amber-300 hover:via-gray-900 hover:to-gray-900", bg: "bg-gradient-to-t from-orange-400 via-gray-900 to-gray-900 !text-white font-bold"});
    }

    return (
        <nav className={"flex flex-col md:flex-row items-center gap-3 px-2"}>
            {routes.map((route) => (
                <LinkBox name={route.name} href={route.href} icon={route.icon} color={route.color} bg={route.bg} key={route.href} />
            ))}
        </nav>
    );
};

export default NavItem;
