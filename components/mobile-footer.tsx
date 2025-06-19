import Link from "next/link";
import {Button} from "@/components/ui/button";
import {BarChart3, FileText, Home, Newspaper, User} from "lucide-react";

const MobileFooter = () => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
            <div className="flex justify-around py-2">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                        <Home className="w-5 h-5"/>
                        <span className="text-xs">Dashboard</span>
                    </Button>
                </Link>
                <Link href="/transactions">
                    <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                        <FileText className="w-5 h-5"/>
                        <span className="text-xs">Transactions</span>
                    </Button>
                </Link>
                <Link href="/">
                    <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-purple-400">
                        <BarChart3 className="w-5 h-5"/>
                        <span className="text-xs">Trade</span>
                    </Button>
                </Link>
                <Link href="/news">
                    <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                        <Newspaper className="w-5 h-5"/>
                        <span className="text-xs">News</span>
                    </Button>
                </Link>
                <Link href="/profile">
                    <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                        <User className="w-5 h-5"/>
                        <span className="text-xs">Profile</span>
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default MobileFooter;


{/* Mobile Bottom Navigation */
}

