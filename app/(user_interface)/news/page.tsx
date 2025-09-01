"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Newspaper, DollarSign, Bitcoin, Briefcase } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useI18n } from "@/components/i18n-provider"

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

const NewsCard = ({ article, onArticleSelect }: { article: NewsArticle, onArticleSelect: (article: NewsArticle) => void }) => (
  <motion.div
    layout
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="break-inside-avoid"
    onClick={() => onArticleSelect(article)}
  >
    <Card className="overflow-hidden bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer">
      {article.image ? (
        <div className="relative w-full h-48">
           <Image
            src={article.image}
            alt={article.headline}
            fill
            style={{ objectFit: 'cover' }}
            className="bg-gray-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="relative w-full h-48 bg-gray-900 flex items-center justify-center">
          <Newspaper className="w-16 h-16 text-gray-700" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{article.headline}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 text-sm leading-relaxed">{article.summary.substring(0, 150)}{article.summary.length > 150 && "..."}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-gray-500">
        <Badge variant="secondary">{article.source}</Badge>
        <span>{new Date(article.datetime * 1000).toLocaleDateString()}</span>
      </CardFooter>
    </Card>
  </motion.div>
);

const NewsSkeleton = () => (
  <div className="break-inside-avoid">
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardHeader>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  </div>
)

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("general")
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const { t } = useI18n()

  const newsCategories = [
    { value: "general", label: t("general"), icon: <Newspaper className="w-4 h-4 mr-2" /> },
    { value: "forex", label: t("forex"), icon: <DollarSign className="w-4 h-4 mr-2" /> },
    { value: "crypto", label: t("crypto"), icon: <Bitcoin className="w-4 h-4 mr-2" /> },
    { value: "merger", label: t("mergers"), icon: <Briefcase className="w-4 h-4 mr-2" /> },
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <h1 className="text-3xl font-bold mb-2">{t("marketNews")}</h1>
        <p className="text-gray-400 mb-6">{t("stayUpToDate")}</p>
      </motion.div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="mb-6">
          {newsCategories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="data-[state=active]:bg-gray-700">
              {cat.icon} {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading 
            ? Array.from({ length: 8 }).map((_, i) => <NewsSkeleton key={i} />)
            : news.map((article) => <NewsCard key={article.id} article={article} onArticleSelect={setSelectedArticle} />)
          }
        </div>
        {!loading && news.length === 0 && (
          <div className="text-center py-20 col-span-full">
            <p className="text-gray-500">{t("noNewsFound")}</p>
          </div>
        )}
      </Tabs>
      
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={(isOpen) => !isOpen && setSelectedArticle(null)}>
          <DialogContent className="sm:max-w-[625px] bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{selectedArticle.headline}</DialogTitle>
              <div className="flex items-center text-sm text-gray-400 pt-2">
                <Badge variant="secondary" className="mr-4">{selectedArticle.source}</Badge>
                <span>{new Date(selectedArticle.datetime * 1000).toLocaleString()}</span>
              </div>
            </DialogHeader>
            <div className="py-4">
              {selectedArticle.image && (
                <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={selectedArticle.image}
                    alt={selectedArticle.headline}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="bg-gray-800"
                  />
                </div>
              )}
              <p className="leading-relaxed">{selectedArticle.summary}</p>
            </div>
             <Link href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                {t("readFullStory")}
              </Link>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
