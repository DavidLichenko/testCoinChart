'use client'

import { useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tabItems = [
  { id: 'home', label: 'Active Orders' },
  { id: 'about', label: 'History' },
  { id: 'services', label: 'VIP' },
  { id: 'chat', label: 'Chat' },
]

export function NavigationMenu({ onTabChange }: { onTabChange: (tabId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const isMobile = useMediaQuery({ maxWidth: 768 })

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange(tabId)
    if (isMobile) {
      toggleMenu()
    }
  }

  const menuVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: '-100%' },
  }

  return (
    <nav className="relative z-[900]">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-[40]"
            onClick={toggleMenu}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="h-6 w-6 z-[1000]" /> : <Menu className="h-6 w-6 " />}
          </Button>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 w-full h-full inset-0 bg-background z-[900]"
              >

                <div className="flex h-full flex-col items-center justify-center space-y-8">
                  <Button
                      variant="ghost"
                      size="icon"
                      className="fixed top-4 right-4 z-[900]"
                      onClick={toggleMenu}
                      aria-label={isOpen ? 'Close menu' : 'Open menu'}
                  >
                    {isOpen ? <X className="h-6 w-6 z-[1000]" /> : <Menu className="h-6 w-6 " />}
                  </Button>
                  {tabItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'default' : 'ghost'}
                      className="text-2xl font-semibold z-[1000]"
                      onClick={() => handleTabClick(item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

    </nav>
  )
}

