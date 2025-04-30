"use client"

import { useUsers } from "@/app/context/UserContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Dashboard() {
  const { users } = useUsers()

  const activeUsers = users.filter((user) => user.status === "ACTIVE").length
  const inactiveUsers = users.filter((user) => user.status === "INACTIVE").length
  const adminUsers = users.filter((user) => user.role === "ADMIN").length

  const recentUsers = users.slice(0, 5)

  return (
    <div className="container mx-auto">
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <p className="text-3xl font-bold">{activeUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Admin Users</h3>
          <p className="text-3xl font-bold">{adminUsers}</p>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Badge variant="default">{activeUsers}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((activeUsers / users.length) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of total users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Users
                </CardTitle>
                <Badge variant="secondary">{inactiveUsers}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((inactiveUsers / users.length) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of total users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Admin Users
                </CardTitle>
                <Badge>{adminUsers}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((adminUsers / users.length) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of total users
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === "ADMIN" ? "default" : "secondary"}
                          >
                            {user.role === "ADMIN" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "ACTIVE"
                                ? "default"
                                : user.status === "INACTIVE"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {user.status === "ACTIVE"
                              ? "Active"
                              : user.status === "INACTIVE"
                              ? "Inactive"
                              : "Deleted"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 