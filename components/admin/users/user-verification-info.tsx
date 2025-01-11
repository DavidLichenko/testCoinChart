import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UserVerificationInfo({ verification }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold">Front ID</p>
          <Badge variant={verification?.front_id_verif ? "success" : "destructive"}>
            {verification?.front_id_verif ? "Verified" : "Not Verified"}
          </Badge>
        </div>
        <div>
          <p className="font-semibold">Back ID</p>
          <Badge variant={verification?.back_id_verif ? "success" : "destructive"}>
            {verification?.back_id_verif ? "Verified" : "Not Verified"}
          </Badge>
        </div>
        <div>
          <p className="font-semibold">Address</p>
          <p>{verification?.street_address || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">City</p>
          <p>{verification?.city || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Zip Code</p>
          <p>{verification?.zip_code || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

