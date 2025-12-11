"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NewsArticle {
    id: number;
    category: string;
    datetime: number;
    headline: string;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

const NewsCard = ({ article, onArticleSelect }: { article: NewsArticle, onArticleSelect: (article: NewsArticle) => void }) => (
    <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
        <Card className="overflow-hidden bg-[#090b1a] border border-[#121426] hover:border-purple-500/50 transition-all cursor-pointer h-full flex flex-col" onClick={() => onArticleSelect(article)}>
            {article.image ? (
                <div className="relative w-full h-24">
                    <Image
                        src={article.image}
                        alt={article.headline}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="bg-[#0f1126]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                </div>
            ) : (
                <div className="relative w-full h-24 bg-[#0f1126] flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-slate-600" />
                </div>
            )}
            <CardHeader className="flex-grow pb-1 pt-2">
                <CardTitle className="text-xs leading-tight line-clamp-2">{article.headline}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pb-1 pt-0">
                <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-1">{article.summary.substring(0, 60)}{article.summary.length > 60 && "..."}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-[9px] text-slate-500 pt-1 pb-2">
                <Badge variant="secondary" className="bg-[#0f1126] text-slate-300 border-slate-600 text-[9px] px-1.5 py-0">{article.source}</Badge>
                <span>{new Date(article.datetime * 1000).toLocaleDateString()}</span>
            </CardFooter>
        </Card>
    </motion.div>
);

const NewsSkeleton = () => (
    <div>
        <Card className="overflow-hidden bg-[#090b1a] border border-[#121426] h-full flex flex-col">
            <Skeleton className="h-24 w-full bg-[#0f1126]" />
            <CardHeader className="pb-1 pt-2">
                <Skeleton className="h-3 w-full mb-1 bg-[#0f1126]" />
                <Skeleton className="h-3 w-3/4 bg-[#0f1126]" />
            </CardHeader>
            <CardContent className="pb-1 pt-0">
                <Skeleton className="h-2 w-full bg-[#0f1126]" />
            </CardContent>
            <CardFooter className="flex justify-between pt-1 pb-2">
                <Skeleton className="h-4 w-12 bg-[#0f1126]" />
                <Skeleton className="h-2 w-14 bg-[#0f1126]" />
            </CardFooter>
        </Card>
    </div>
);

type NewsGridProps = {
    news: NewsArticle[];
    loading: boolean;
    onArticleSelect: (article: NewsArticle) => void;
    noNewsMessage: string;
};

const ITEMS_PER_PAGE = 24;

export function NewsGrid({ news, loading, onArticleSelect, noNewsMessage }: NewsGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentNews = news.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {loading
                    ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <NewsSkeleton key={i} />)
                    : currentNews.length > 0 ? currentNews.map((article) => <NewsCard key={article.id} article={article} onArticleSelect={onArticleSelect} />)
                        : (
                            <div className="col-span-full text-center py-12">
                                <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">{noNewsMessage}</p>
                            </div>
                        )
                }
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 bg-[#090b1a] border-[#121426] hover:bg-[#0f1126] hover:border-purple-500/50 disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={`h-8 w-8 p-0 text-xs ${
                                    currentPage === pageNum
                                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#7e22ce] text-white border-transparent"
                                        : "bg-[#090b1a] border-[#121426] hover:bg-[#0f1126] hover:border-purple-500/50"
                                }`}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 bg-[#090b1a] border-[#121426] hover:bg-[#0f1126] hover:border-purple-500/50 disabled:opacity-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
