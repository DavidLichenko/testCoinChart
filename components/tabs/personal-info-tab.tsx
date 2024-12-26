import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function PersonalInfoTab() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm sm:text-base">
            <p><strong className="inline-block w-24">Name:</strong> John Doe</p>
            <p><strong className="inline-block w-24">Email:</strong> john.doe@example.com</p>
            <p><strong className="inline-block w-24">Address:</strong> 123 Main St</p>
            <p><strong className="inline-block w-24">City:</strong> New York</p>
            <p><strong className="inline-block w-24">Created At:</strong> 01/01/2023</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Button>Change Photo</Button>
        </CardContent>
      </Card>
    </div>
  )
}

