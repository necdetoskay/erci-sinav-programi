"use client"

import { useEffect, useState } from "react"
// import { useUsers } from "@/app/context/UserContext" // Removed unused import
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
import { QuestionPool } from "@prisma/client" // Assuming QuestionPool type exists
import { Exam } from "@prisma/client" // Assuming Exam type exists

export default function Dashboard() {
  // const { users } = useUsers() // Removed user data fetching
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([])
  const [exams, setExams] = useState<Exam[]>([])

  useEffect(() => {
    // Fetch Question Pools
    fetch("/api/question-pools")
      .then((res) => res.json())
      .then((data) => setQuestionPools(data))
      .catch((error) => console.error("Error fetching question pools:", error))

    // Fetch Exams (Assuming an endpoint exists, adjust if needed)
    fetch("/api/admin/exams") // Adjust API endpoint if necessary
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((error) => console.error("Error fetching exams:", error))
  }, [])

  // Removed user statistics calculations
  // const activeUsers = users.filter((user) => user.status === "ACTIVE").length
  // const inactiveUsers = users.filter((user) => user.status === "INACTIVE").length
  // const adminUsers = users.filter((user) => user.role === "ADMIN").length
  // const recentUsers = users.slice(0, 5)

  // Add recent question pools and exams
  // Ensure data is an array before slicing
  const recentQuestionPools = Array.isArray(questionPools) ? questionPools.slice(-5).reverse() : []; // Get last 5 and reverse for recent first
  const recentExams = Array.isArray(exams) ? exams.slice(-5).reverse() : []; // Get last 5 and reverse for recent first


  return (
    <div className="container mx-auto">
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
      {/* Removed user statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Adjusted grid columns */}
         {/* Soru Havuzu Kartı */}
         <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-gray-800">Toplam Soru Havuzu</h3>
          <p className="text-3xl font-bold dark:text-gray-800">{questionPools.length}</p>
        </div>
        {/* Sınav Kartı */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-gray-800">Toplam Sınav</h3>
          <p className="text-3xl font-bold dark:text-gray-800">{exams.length}</p>
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
          {/* Removed user statistics percentage cards */}
          <div className="grid gap-4 grid-cols-1"> {/* Adjusted grid columns */}
             {/* Removed Recent Users Table */}
             {/* Recent Question Pools Table */}
             <Card>
              <CardHeader>
                <CardTitle>Son Eklenen Soru Havuzları</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Açıklama</TableHead>
                      {/* Soru Sayısı sütunu kaldırıldı */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentQuestionPools.length > 0 ? (
                      recentQuestionPools.map((pool) => (
                        <TableRow key={pool.id}>
                          <TableCell>{pool.title}</TableCell> {/* name -> title */}
                          <TableCell>{pool.description?.substring(0, 50)}{pool.description && pool.description.length > 50 ? "..." : ""}</TableCell>
                          {/* Soru Sayısı hücresi kaldırıldı */}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">Henüz soru havuzu eklenmemiş.</TableCell> {/* colSpan güncellendi */}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* Recent Exams Table */}
            <Card>
              <CardHeader>
                <CardTitle>Son Eklenen Sınavlar</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead> {/* İsim -> Başlık */}
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Durum</TableHead> {/* Add Status column */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {/* Ensure recentExams is an array before mapping */}
                  {Array.isArray(recentExams) && recentExams.length > 0 ? (
                    recentExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>{exam.title}</TableCell> {/* name -> title */}
                        <TableCell>{exam.description?.substring(0, 50)}{exam.description && exam.description.length > 50 ? "..." : ""}</TableCell>
                        <TableCell>
                          <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                            {exam.status} {/* Display exam status */}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Henüz sınav eklenmemiş.</TableCell>
                      </TableRow>
                    )}
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
