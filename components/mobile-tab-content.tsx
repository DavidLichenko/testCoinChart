import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'

interface MobileTabContentProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function MobileTabContent({ isOpen, onClose, title, children }: MobileTabContentProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] w-[95%] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-4 max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

