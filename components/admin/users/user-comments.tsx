'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

export function UserComments({ comments, userId }) {
  const [newComment, setNewComment] = useState('')
  const [userComments, setUserComments] = useState(comments)

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

      const addedComment = await response.json()
      setUserComments([...userComments, addedComment])
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

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/users/${userId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setUserComments(userComments.filter(comment => comment.id !== commentId))
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userComments.map((comment, index) => (
            <div key={index} className="flex items-center justify-between">
              <p>{comment.content}</p>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a new comment..."
          />
          <Button onClick={handleAddComment}>Add</Button>
        </div>
      </CardContent>
    </Card>
  )
}

