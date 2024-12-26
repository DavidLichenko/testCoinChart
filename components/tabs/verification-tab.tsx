import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function VerificationTab() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>ID Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Front ID</label>
            <Input type="file" className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Back ID</label>
            <Input type="file" className="w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="City" className="w-full" />
          <Input placeholder="Street Address" className="w-full" />
          <Input placeholder="Zip Code" className="w-full" />
          <Button className="w-full">Submit</Button>
        </CardContent>
      </Card>
    </div>
  )
}

