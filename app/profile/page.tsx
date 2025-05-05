"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Profil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
              <AvatarFallback>{session?.user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{session?.user?.name}</h2>
              <p className="text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div>
              <h3 className="font-medium mb-2">Rol</h3>
              <p className="text-muted-foreground capitalize">{session?.user?.role || "Kullanıcı"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
