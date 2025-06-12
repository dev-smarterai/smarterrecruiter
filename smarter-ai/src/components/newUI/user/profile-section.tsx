import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

interface ProfileSectionProps {
  name: string
  email: string
  phone: string
  avatar: string
  profileUrl?: string
  hasInterview?: boolean
}

const ProfileSection = ({ 
  name, 
  email, 
  phone, 
  avatar, 
  profileUrl = "/profile",
  hasInterview = false
}: ProfileSectionProps) => {
  return (
    <Card className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4 font-sans">Manage Profile</h2>
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-200">
          <img src={avatar || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-lg font-semibold font-sans">{name}</h3>
        <p className="text-sm text-gray-500 mb-2 font-sans">{email}</p>
        <div className="flex items-center text-sm text-gray-500 mb-4 font-sans">
          <Mail className="h-4 w-4 mr-2" />
          <span>{phone}</span>
        </div>
        {!hasInterview && (
          <p className="text-sm text-amber-600 mb-3 font-sans text-center">
            Interview not yet conducted or analyzed
          </p>
        )}
        <Link href={profileUrl}>
          <Button className="bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-md font-sans">Edit Profile</Button>
        </Link>
      </div>
    </Card>
  )
}

export default ProfileSection
