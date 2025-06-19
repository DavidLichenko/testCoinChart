"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { ExternalLink, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    name: string
  }
  category: string
}

export default function NewsPage() {
  const { user } = useAuth()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      // Try to fetch from NewsAPI
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=cryptocurrency OR bitcoin OR ethereum OR trading OR finance&sortBy=publishedAt&pageSize=30&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch news")
      }

      const data = await response.json()
      const articlesWithCategory = data.articles.map((article: any) => ({
        ...article,
        id: article.url,
        category: getCategoryFromTitle(article.title),
      }))

      setNews(articlesWithCategory)
    } catch (error) {
      console.error("Error fetching news:", error)
      // If API fails, you could implement a fallback or show an error message
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryFromTitle = (title: string): string => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes("bitcoin") || lowerTitle.includes("btc")) return "bitcoin"
    if (lowerTitle.includes("ethereum") || lowerTitle.includes("eth")) return "ethereum"
    if (lowerTitle.includes("crypto") || lowerTitle.includes("blockchain")) return "crypto"
    if (lowerTitle.includes("trading") || lowerTitle.includes("market")) return "trading"
    return "general"
  }

  const filteredNews = news.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = category === "all" || article.category === category
    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100vh-100px] bg-gray-950 text-white"
    >

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 lg:p-6 space-y-4"
      >
        {/* Filters - More compact */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 border-gray-700 h-9"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 h-9">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="trading">Trading</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* News Grid - More compact */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
                <div className="h-40 bg-gray-700 rounded-t-lg"></div>
                <CardContent className="p-3 space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-700 rounded w-full"></div>
                  <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNews.map((article) => (
              <Card key={article.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors group">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={article.urlToImage || "/placeholder.svg?height=160&width=300"}
                    alt={article.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=160&width=300"
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {article.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2">{article.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <span className="truncate max-w-20">{article.source.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => window.open(article.url, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Read More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredNews.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No news articles found</div>
            <div className="text-gray-500 text-sm">Try adjusting your search or category filter</div>
          </div>
        )}

        {/* Trending Topics - More compact */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "Bitcoin ETF",
                "Ethereum Merge",
                "DeFi Yields",
                "NFT Market",
                "Stablecoin Regulation",
                "Web3 Gaming",
              ].map((topic) => (
                <Badge
                  key={topic}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-600 transition-colors text-xs"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
