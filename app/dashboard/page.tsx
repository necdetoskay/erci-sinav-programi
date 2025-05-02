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
import { QuestionPool } from "@prisma/client"
import { Exam } from "@prisma/client"
import { Users, CheckCircle, BookOpen, FileText } from "lucide-react" // Icons
// import { motion } from "framer-motion" // Removed framer-motion import
import {
  BarChart,
  Bar,
  Cell, // Import Cell for custom bar colors if needed
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList // To potentially add labels on bars
} from "recharts" // Import recharts components

// Interface for the OVERALL stats data
interface OverallStats {
  totalAttempts: number;
  uniqueParticipants: number;
  completedAttempts: number;
}

// Interface for DETAILED participant stats (matching API response)
interface ParticipantStats {
    identifier: string; // Unique key (email or name)
    displayName: string; // Name to display
    isEmail: boolean; // Identifier type flag
    totalAttempts: number;
    totalCorrect: number;
    totalIncorrect: number;
    averageScore: number | null;
}

// Interface for the combined API response
interface DashboardData {
    overallStats: OverallStats;
    participantStats: ParticipantStats[];
}


export default function Dashboard() {
  // const { users } = useUsers() // Removed user data fetching
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [stats, setStats] = useState<DashboardData | null>(null); // State for combined dashboard data
  const [isLoadingStats, setIsLoadingStats] = useState(true); // Loading state for stats

  useEffect(() => {
    setIsLoadingStats(true); // Start loading stats
    // Fetch Dashboard Stats
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch stats: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: DashboardData) => { // Expect combined data structure
        setStats(data);
      })
      .catch((error) => {
        console.error("Error fetching dashboard stats:", error);
        // Optionally show a toast error here
      })
      .finally(() => {
        setIsLoadingStats(false); // Finish loading stats
      });


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

      {/* Statistics Cards (No Animation) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Soru Havuzu</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionPools.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sınav</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exams.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sınav Denemesi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats?.overallStats?.totalAttempts ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan Denemeler</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats?.overallStats?.completedAttempts ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benzersiz Katılımcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats?.overallStats?.uniqueParticipants ?? 0}
              </div>
            </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="participants">Katılımcı İstatistikleri</TabsTrigger>
          {/* <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger> */}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2"> {/* Use two columns for overview */}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentQuestionPools.length > 0 ? (
                        recentQuestionPools.map((pool) => (
                          <TableRow key={pool.id}>
                            <TableCell>{pool.title}</TableCell>
                            <TableCell>{pool.description?.substring(0, 50)}{pool.description && pool.description.length > 50 ? "..." : ""}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">Henüz soru havuzu eklenmemiş.</TableCell>
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
                        <TableHead>Başlık</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {Array.isArray(recentExams) && recentExams.length > 0 ? (
                      recentExams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell>{exam.title}</TableCell>
                          <TableCell>{exam.description?.substring(0, 50)}{exam.description && exam.description.length > 50 ? "..." : ""}</TableCell>
                          <TableCell>
                            <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                              {exam.status}
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
          </div> {/* Close the grid div */}
        </TabsContent>
         <TabsContent value="participants" className="space-y-4">
           {/* Participant Statistics Chart */}
           <Card>
              <CardHeader>
                <CardTitle>Katılımcı Ortalama Başarı Puanları</CardTitle>
              </CardHeader>
              <CardContent className="pl-2"> {/* Add padding for chart */}
                {isLoadingStats ? (
                   <div className="flex justify-center items-center h-60">Yükleniyor...</div>
                ) : stats && stats.participantStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}> {/* Increased height */}
                    <BarChart data={stats.participantStats} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}> {/* Increased bottom margin */}
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> {/* Lighter grid */}
                      <XAxis
                        dataKey="displayName"
                        angle={-60} // More angle for potentially long names
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 10 }} // Smaller font size for labels
                        height={80} // Increased height for angled labels
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Başarı (%)', angle: -90, position: 'insideLeft', offset: -10, style: {fontSize: '12px', fill: '#666'} }} // Adjusted label
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Ortalama Başarı"]}
                        labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd', padding: '8px 12px' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      {/* Teal color, rounded top, slightly larger bar, animation */}
                      <Bar dataKey="averageScore" name="Ortalama Başarı" fill="#2dd4bf" radius={[4, 4, 0, 0]} barSize={40} animationDuration={800}>
                         {/* Optional: Add labels on top of bars */}
                         {/* <LabelList dataKey="averageScore" position="top" formatter={(value: number) => `${value.toFixed(0)}%`} fontSize={11} fill="#333" /> */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-60 text-muted-foreground">Katılımcı istatistiği bulunamadı.</div>
                )}
              </CardContent>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  )
}
