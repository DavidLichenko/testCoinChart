"use client"

import {useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Combobox } from "@/components/ui/combobox"

interface User {
  id: string
  name: string | null
  email: string
}

interface AssignToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedUsers: User[]
  onSuccess: () => void
}

export function AssignToDialog({
  open,
  onOpenChange,
  selectedUsers,
  onSuccess,
}: AssignToDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState("")
  const [workers, setWorkers] = useState<{ value: string; label: string }[]>([])
  const { toast } = useToast()

  // Fetch workers when dialog opens
useEffect(() => {
    if (open) {
      fetchWorkers()
    }
  }, [open])

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/users/workers')
      if (!response.ok) throw new Error('Failed to fetch workers')
      const data = await response.json()
      setWorkers(data.map((worker: User) => ({
        value: worker.id,
        label: worker.name || worker.email
      })))
    } catch (error) {
      console.error('Error fetching workers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch workers",
        variant: "destructive",
      })
    }
  }

  const handleAssign = async () => {
    if (!selectedWorkerId) {
      toast({
        title: "Error",
        description: "Please select a worker",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/users/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user.id),
          workerId: selectedWorkerId
        }),
      })

      if (!response.ok) throw new Error('Failed to assign users')

      toast({
        title: "Success",
        description: `Successfully assigned ${selectedUsers.length} users to worker`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning users:', error)
      toast({
        title: "Error",
        description: "Failed to assign users to worker",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Users to Worker</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Selected users: {selectedUsers.length}
            </p>
            <Combobox
              options={workers}
              value={selectedWorkerId}
              onChange={setSelectedWorkerId}
              placeholder="Select a worker"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading}
          >
            {isLoading ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

