"use client"

import { useEffect, useState, Suspense } from "react"
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
import { QuestionPool, Exam } from "@/types/prisma";

// Genişletilmiş QuestionPool tipi
interface ExtendedQuestionPool extends QuestionPool {
  createdBy?: {
    name: string;
    email: string;
  };
}

// Genişletilmiş Exam tipi
interface ExtendedExam extends Exam {
  createdBy?: {
    name: string;
    email: string;
  };
}
import { Users, CheckCircle, BookOpen, FileText, Loader2 } from "lucide-react" // Icons
import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { format } from 'date-fns'; // format fonksiyonu import edildi
// import { LoadingLink } from "@/components/ui/loading-link"; // Kullanılmıyorsa kaldırılabilir
// import { Button } from "@/components/ui/button" // Kullanılmıyorsa kaldırılabilir

// Interface for the OVERALL stats data
interface OverallStats {
  totalAttempts: number;
  uniqueParticipants: number;
  completedAttempts: number;
}

// Interface for DETAILED participant stats (matching API response)
interface ParticipantStats {
    identifier: string;
    displayName: string;
    isEmail: boolean;
    totalAttempts: number;
    totalCorrect: number;
    totalIncorrect: number;
    averageScore: number | null;
}

// Yeni veri yapıları
interface AttemptsOverTimeData {
  date: string;
  count: number;
}

interface ScoreDistributionData {
  range: string;
  count: number;
}

// Interface for the combined API response
interface DashboardData {
    overallStats: OverallStats;
    participantStats: ParticipantStats[];
    attemptsOverTime?: AttemptsOverTimeData[]; // Yeni alan
    scoreDistribution?: ScoreDistributionData[]; // Yeni alan
}


function DashboardContent() {
  const [questionPools, setQuestionPools] = useState<ExtendedQuestionPool[]>([])
  const [exams, setExams] = useState<ExtendedExam[]>([])
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#DD4477', '#66AB8C'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingStats(true);

        // İstatistikleri getir
        const statsRes = await fetch("/api/dashboard/stats");
        if (!statsRes.ok) {
          throw new Error(`Failed to fetch stats: ${statsRes.statusText}`);
        }
        const statsData = await statsRes.json();
        setStats(statsData);

        // Soru havuzlarını getir
        const poolsRes = await fetch("/api/question-pools");
        if (!poolsRes.ok) {
          throw new Error(`Failed to fetch question pools: ${poolsRes.statusText}`);
        }
        const poolsData = await poolsRes.json();
        setQuestionPools(poolsData);

        // Sınavları getir
        const examsRes = await fetch("/api/admin/exams");
        if (!examsRes.ok) {
          throw new Error(`Failed to fetch exams: ${examsRes.statusText}`);
        }
        const examsData = await examsRes.json();
        // API yanıtı bir nesne içinde exams dizisi döndürüyor
        if (examsData && examsData.exams) {
          setExams(examsData.exams);
        } else {
          console.error("Unexpected exams data format:", examsData);
          setExams([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchData();
  }, [])

  // Konsola veri yapılarını yazdır (hata ayıklama için)
  useEffect(() => {
    console.log("Question Pools:", questionPools);
    console.log("Exams:", exams);
  }, [questionPools, exams]);

  const recentQuestionPools = Array.isArray(questionPools) ? questionPools.slice(-5).reverse() : [];
  const recentExams = Array.isArray(exams) ? exams.slice(-5).reverse() : [];


  return (
    <div className="container mx-auto py-6"> {/* Ana container'a biraz padding eklendi */}
      <div className="flex justify-between items-center mb-8"> {/* Alt boşluk artırıldı */}
        <h1 className="text-4xl font-bold">Dashboard</h1>
      </div>

      {/* Statistics Cards (With Animation) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8"> {/* Boşluklar ve alt boşluk artırıldı */}
        {[
          { title: "Toplam Soru Havuzu", value: questionPools.length, Icon: BookOpen, isLoading: false },
          { title: "Toplam Sınav", value: exams.length, Icon: FileText, isLoading: false },
          { title: "Toplam Sınav Denemesi", value: stats?.overallStats?.totalAttempts ?? 0, Icon: Users, isLoading: isLoadingStats },
          { title: "Tamamlanan Denemeler", value: stats?.overallStats?.completedAttempts ?? 0, Icon: CheckCircle, isLoading: isLoadingStats },
          { title: "Benzersiz Katılımcı", value: stats?.overallStats?.uniqueParticipants ?? 0, Icon: Users, isLoading: isLoadingStats },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dashboard-title">{item.title}</CardTitle>
                <item.Icon className="h-5 w-5 dashboard-icon" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold dashboard-value">
                  {item.isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : item.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6"> {/* Sekmeler arası boşluk artırıldı */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
          <TabsList>
            <TabsTrigger value="overview" className="dashboard-tab">Genel Bakış</TabsTrigger>
            <TabsTrigger value="participants" className="dashboard-tab">Katılımcı İstatistikleri</TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="overview" className="space-y-6">
          <motion.div
            className="grid gap-6" // Ana grid için tek sütun, içindeki gridler 2 sütun olacak
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
          >
            {/* Recent Tables Section */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            >
              <Card className="dashboard-card">
                <CardHeader><CardTitle className="dashboard-title">Son Eklenen Soru Havuzları</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Başlık</TableHead><TableHead>Açıklama</TableHead><TableHead>Oluşturan</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {Array.isArray(recentQuestionPools) && recentQuestionPools.length > 0 ? (
                        recentQuestionPools.map((pool) => {
                          console.log("Rendering pool:", pool); // Hata ayıklama için
                          return (
                            <TableRow key={pool.id}>
                              <TableCell className="text-foreground">{pool.title}</TableCell>
                              <TableCell className="text-foreground">{pool.description?.substring(0, 50)}{pool.description && pool.description.length > 50 ? "..." : ""}</TableCell>
                              <TableCell className="text-foreground">{pool.createdBy?.name || "Bilinmiyor"}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            {Array.isArray(recentQuestionPools)
                              ? "Henüz soru havuzu eklenmemiş."
                              : "Soru havuzu verileri yüklenirken bir hata oluştu."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="dashboard-card">
                <CardHeader><CardTitle className="dashboard-title">Son Eklenen Sınavlar</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Başlık</TableHead><TableHead>Açıklama</TableHead><TableHead>Durum</TableHead><TableHead>Oluşturan</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {Array.isArray(recentExams) && recentExams.length > 0 ? (
                      recentExams.map((exam) => {
                        console.log("Rendering exam:", exam); // Hata ayıklama için
                        return (
                          <TableRow key={exam.id}>
                            <TableCell className="text-foreground">{exam.title}</TableCell>
                            <TableCell className="text-foreground">{exam.description?.substring(0, 50)}{exam.description && exam.description.length > 50 ? "..." : ""}</TableCell>
                            <TableCell><Badge className="badge" variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>{exam.status}</Badge></TableCell>
                            <TableCell className="text-foreground">{exam.createdBy?.name || "Bilinmiyor"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          {Array.isArray(recentExams)
                            ? "Henüz sınav eklenmemiş."
                            : "Sınav verileri yüklenirken bir hata oluştu."}
                        </TableCell>
                      </TableRow>
                    )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

            {/* New Charts Section */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            >
              <Card className="dashboard-card">
                <CardHeader><CardTitle className="dashboard-title">Sınav Denemeleri (Son 30 Gün)</CardTitle></CardHeader>
                <CardContent className="pl-2 h-[350px]"> {/* Yükseklik verildi */}
                  {isLoadingStats ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Yükleniyor...</div>
                  ) : stats?.attemptsOverTime && stats.attemptsOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.attemptsOverTime} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), "MMM d")} tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip
                          labelFormatter={(label) => format(new Date(label), "PP")}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="count" name="Deneme Sayısı" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 6 }} dot={{r: 3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">Veri bulunamadı.</div>
                  )}
                </CardContent>
              </Card>
              <Card className="dashboard-card">
                <CardHeader><CardTitle className="dashboard-title">Başarı Puanı Dağılımı</CardTitle></CardHeader>
                <CardContent className="h-[350px] flex justify-center items-center">
                  {isLoadingStats ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Yükleniyor...</div>
                  ) : stats?.scoreDistribution && stats.scoreDistribution.some(item => item.count > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.scoreDistribution.filter(item => item.count > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, count }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100} // Outer radius ayarlandı
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="range"
                          paddingAngle={2}
                          minAngle={1}
                        >
                          {stats.scoreDistribution.filter(item => item.count > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} katılımcı`, name]}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: "12px", marginTop: "15px"}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">Puan dağılım verisi bulunamadı.</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="dashboard-card">
              <CardHeader><CardTitle className="dashboard-title">Katılımcı Ortalama Başarı Puanları</CardTitle></CardHeader>
              <CardContent className="pl-2 h-[400px]"> {/* Yükseklik verildi */}
                {isLoadingStats ? (
                   <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Yükleniyor...</div>
                ) : stats && stats.participantStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.participantStats} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="displayName" angle={-60} textAnchor="end" interval={0} tick={{ fontSize: 10 }} height={80} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} label={{ value: 'Başarı (%)', angle: -90, position: 'insideLeft', offset: -10, style: {fontSize: '12px', fill: '#666'} }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Ortalama Başarı"]}
                        labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd', padding: '8px 12px' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="averageScore" name="Ortalama Başarı" fill="#2dd4bf" radius={[4, 4, 0, 0]} barSize={30} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-muted-foreground">Katılımcı istatistiği bulunamadı.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
         </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /> Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
