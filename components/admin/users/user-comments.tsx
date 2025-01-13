'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Comment {
  id: string
  content: string
  createdAt: string
}

export function UserComments({ userId }: { userId: string }) {
  const [newComment, setNewComment] = useState('')
  const [userComments, setUserComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchComments()
  }, [userId])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [userComments])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      setUserComments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/users/${userId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const addedComment: Comment = await response.json()
      setUserComments(prevComments => [...prevComments, addedComment])
      setNewComment('')
      toast({
        title: "Success",
        description: "Comment added successfully",
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setUserComments(prevComments => prevComments.filter(comment => comment.id !== commentId))
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
  }

  return (
      <Card className="w-full w-full mx-auto">
        <CardHeader>
          <CardTitle>User Comments History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full border rounded-md p-4 mb-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  Loading comments...
                </div>
            ) : userComments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No comments yet
                </div>
            ) : (
                <div className="space-y-4">
                  {userComments.map((comment) => (
                      <div
                          key={comment.id}
                          className="flex items-start justify-between bg-secondary/50 p-3 rounded-lg"
                      >
                        <div className="flex-1 mr-4">
                          <p className="text-sm text-secondary-foreground">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-8 w-8 hover:bg-destructive/90 hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete comment</span>
                        </Button>
                      </div>
                  ))}
                </div>
            )}
          </ScrollArea>
          <div className="flex items-center space-x-2">
            <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a new comment..."
                className="flex-1"
            />
            <Button onClick={handleAddComment}>Add Comment</Button>
          </div>
        </CardContent>
      </Card>
  )
}

