'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { SearchResult } from '@/types/market'

interface MarketSearchProps {
  onSelect: (symbol: string) => void
}

export function MarketSearch({ onSelect }: MarketSearchProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (query: string) => {
    if (!query) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/market-search?query=${query}`)
      const data: SearchResult[] = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search markets..." 
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Markets">
            {results.map((result) => (
              <CommandItem
                key={result.ticker}
                value={result.ticker}
                onSelect={onSelect}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{result.ticker}</span>
                  <span className="text-sm text-muted-foreground">{result.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}

