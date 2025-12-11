"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Newspaper, DollarSign, Bitcoin, Briefcase } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/components/i18n-provider"
import { NewsCategorySidebar } from "./components/NewsCategorySidebar"
import { NewsGrid } from "./components/NewsGrid"

interface NewsArticle {
  id: number
  category: string
  datetime: number
  headline: string
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("general")
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const { t } = useI18n()

  const newsCategories = [
    { value: "general", label: t("general"), icon: <Newspaper className="w-4 h-4" /> },
    { value: "forex", label: t("forex"), icon: <DollarSign className="w-4 h-4" /> },
    { value: "crypto", label: t("crypto"), icon: <Bitcoin className="w-4 h-4" /> },
    { value: "merger", label: t("mergers"), icon: <Briefcase className="w-4 h-4" /> },
  ]

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/news?category=${activeCategory}`)
        if (response.ok) {
          const data: NewsArticle[] = await response.json()
          setNews(data); 
        }
      } catch (error) {
        console.error("Error fetching news:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [activeCategory])

  return (
    <>
      {/* Header */}
      <header className="mb-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {t("marketNews")}
        </h1>
        <p className="text-sm text-white/60 mt-1">{t("stayUpToDate")}</p>
      </header>

      {/* Main layout: sidebar on desktop, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-[260px,minmax(0,1fr)]">
        {/* Sidebar - hidden on mobile, shown on lg screens */}
        <div className="hidden lg:block">
          <NewsCategorySidebar 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory}
            categories={newsCategories}
          />
        </div>

        {/* Mobile category selector - shown only on mobile */}
        <div className="lg:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {newsCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category.value
                    ? "bg-[linear-gradient(135deg,#8b5cf6,#7e22ce)] text-white shadow-[0_0_18px_rgba(126,34,206,0.4)]"
                    : "bg-[#0f1126] text-slate-300 border border-[#121426] hover:border-purple-500/30"
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* News grid */}
        <div>
          <NewsGrid 
            news={news}
            loading={loading}
            onArticleSelect={setSelectedArticle}
            noNewsMessage={t("noNewsFound")}
          />
        </div>
      </div>
      
      {/* Article detail modal */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={(isOpen) => !isOpen && setSelectedArticle(null)}>
          <DialogContent className="sm:max-w-[625px] bg-[#090b1a] border-[#121426] text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl leading-snug">{selectedArticle.headline}</DialogTitle>
              <div className="flex items-center text-sm text-slate-400 pt-2 gap-3">
                <Badge variant="secondary" className="bg-[#0f1126] text-slate-300 border-slate-600">{selectedArticle.source}</Badge>
                <span className="text-xs">{new Date(selectedArticle.datetime * 1000).toLocaleString()}</span>
              </div>
            </DialogHeader>
            <div className="py-4">
              {selectedArticle.image && (
                <div className="relative w-full h-64 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={selectedArticle.image}
                    alt={selectedArticle.headline}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="bg-[#0f1126]"
                  />
                </div>
              )}
              <p className="leading-relaxed text-slate-200 text-sm">{selectedArticle.summary}</p>
            </div>
             <Link href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="inline-block text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                {t("readFullStory")} →
              </Link>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
