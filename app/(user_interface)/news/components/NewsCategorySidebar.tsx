"use client";

type NewsCategorySidebarProps = {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    categories: Array<{
        value: string;
        label: string;
        icon: React.ReactNode;
    }>;
};

export function NewsCategorySidebar({ activeCategory, onCategoryChange, categories }: NewsCategorySidebarProps) {
    return (
        <aside className="space-y-3">
            <div className="bg-gradient-to-br from-[#090b1a] via-[#0f1126] to-[#6b21a8] rounded-2xl p-5 border border-[#121426] shadow-lg">
                <p className="text-[11px] uppercase tracking-wide text-white/60 mb-4">
                    Categories
                </p>
                <div className="space-y-2">
                    {categories.map((category) => (
                        <button
                            key={category.value}
                            onClick={() => onCategoryChange(category.value)}
                            className={`block w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left ${
                                activeCategory === category.value
                                    ? "bg-[linear-gradient(135deg,#8b5cf6,#7e22ce)] text-white shadow-[0_0_22px_rgba(126,34,206,0.55)]"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex h-5 w-1 rounded-full ${
                                        activeCategory === category.value ? "bg-[#050510]/40" : "bg-white/10"
                                    }`}
                                />
                                <span className="flex items-center gap-2">
                                    {category.icon}
                                    <span>{category.label}</span>
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
