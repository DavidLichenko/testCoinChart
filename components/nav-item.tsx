import LinkBox from "@/components/link_box";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";

const NavItem = () => {
    const { user } = useAuth();
    const { t } = useI18n();

    const isAdmin =
        user?.role === "OWNER" ||
        user?.role === "CR_MANAGMENT" ||
        user?.role === "TEAMLEAD";

    const routes = [
        { name: t("dashboard"), href: "/dashboard" },
        { name: t("transactions"), href: "/transactions" },
        { name: t("market"), href: "/market" },
        { name: t("news"), href: "/news" },
    ];

    if (isAdmin) {
        routes.push({ name: t("admin"), href: "/admin" });
    }

    return (
        <nav className="flex items-center gap-3 px-2">
            {routes.map((route) => (
                <LinkBox name={route.name} href={route.href} key={route.href} />
            ))}
        </nav>
    );
};

export default NavItem;
