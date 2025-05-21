"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuestionPool, Exam } from "@/types/prisma";
import { useAuth } from "@/providers/auth-provider"

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
import {
  Users,
  CheckCircle,
  BookOpen,
  FileText,
  Loader2,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  ChevronRight,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Activity,
  Sparkles,
  Zap,
  Lightbulb,
  PlusCircle,
  ListChecks,
  UserPlus,
  Settings2,
  Pencil,
  Share,
  Shield,
  ShieldCheck,
  Wand2
} from "lucide-react" // Icons
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Sector,
  Area,
  AreaChart
} from "recharts"
import { format, formatDistanceToNow, parseISO } from 'date-fns'; // format fonksiyonu import edildi
import { tr } from 'date-fns/locale'; // Türkçe locale
import { ActivityType, EntityType, getActivityTypeInfo } from "@/lib/activity-logger"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

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


// Sayaç animasyonu için özel hook
function useCountUp(end: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Delay sonrası animasyonu başlat
    timerRef.current = setTimeout(() => {
      const startTime = Date.now();
      const endTime = startTime + duration;

      const updateCount = () => {
        const now = Date.now();
        const progress = Math.min(1, (now - startTime) / duration);
        const currentCount = Math.floor(progress * end);

        if (countRef.current !== currentCount) {
          countRef.current = currentCount;
          setCount(currentCount);
        }

        if (now < endTime) {
          requestAnimationFrame(updateCount);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(updateCount);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [end, duration, delay]);

  return count;
}

// Aktif pie dilimi için özel bileşen
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
        {payload.range}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
        {`${value} katılımcı`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`(${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

function DashboardContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [questionPools, setQuestionPools] = useState<ExtendedQuestionPool[]>([])
  const [exams, setExams] = useState<ExtendedExam[]>([])
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState("30"); // "7", "30", "90" günlük filtreler
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string | null>(null);

  // Tema renklerine göre grafik renkleri
  const isDark = theme === 'dark';
  const PIE_CHART_COLORS = isDark
    ? ['#60a5fa', '#5eead4', '#fcd34d', '#f87171', '#c084fc', '#f472b6', '#a3e635']
    : ['#3b82f6', '#14b8a6', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

  const AREA_CHART_COLORS = isDark
    ? ['rgba(96, 165, 250, 0.7)', 'rgba(94, 234, 212, 0.7)']
    : ['rgba(59, 130, 246, 0.7)', 'rgba(20, 184, 166, 0.7)'];

  // Sayaç animasyonları için değerler
  const totalQuestionPools = useCountUp(questionPools.length, 1500, 300);
  const totalExams = useCountUp(exams.length, 1500, 500);
  const totalAttempts = useCountUp(stats?.overallStats?.totalAttempts ?? 0, 1500, 700);
  const completedAttempts = useCountUp(stats?.overallStats?.completedAttempts ?? 0, 1500, 900);
  const uniqueParticipants = useCountUp(stats?.overallStats?.uniqueParticipants ?? 0, 1500, 1100);

  // Saat güncellemesi için
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Her dakika güncelle

    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingStats(true);
      setIsLoadingActivities(true);
      setRefreshing(true);

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

      // Aktiviteleri getir
      const activitiesUrl = activityFilter
        ? `/api/dashboard/activities?limit=10&type=${activityFilter}`
        : "/api/dashboard/activities?limit=10";

      const activitiesRes = await fetch(activitiesUrl);
      if (!activitiesRes.ok) {
        throw new Error(`Failed to fetch activities: ${activitiesRes.statusText}`);
      }
      const activitiesData = await activitiesRes.json();

      // Aktivite verilerini işle ve uygun formata dönüştür
      const processedActivities = activitiesData.map((activity: any) => {
        const { icon, color } = getActivityTypeInfo(activity.type);
        // Lucide icon component'ini bul
        const IconComponent =
          icon === "FileText" ? FileText :
          icon === "BookOpen" ? BookOpen :
          icon === "CheckCircle" ? CheckCircle :
          icon === "Users" ? Users :
          icon === "Settings2" ? Settings2 :
          icon === "Sparkles" ? Sparkles :
          Activity; // Default icon

        return {
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          user: activity.user?.name || "Sistem",
          time: parseISO(activity.createdAt),
          icon: IconComponent,
          color: color,
          entityId: activity.entityId,
          entityType: activity.entityType
        };
      });

      setActivities(processedActivities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingActivities(false);
      setTimeout(() => setRefreshing(false), 500); // Refresh animasyonu için biraz beklet
    }
  };

  useEffect(() => {
    fetchData();
  }, [activityFilter]);

  // Pie chart için hover işleyicisi
  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  // Filter and sort recent items
  const recentQuestionPools = Array.isArray(questionPools)
    ? [...questionPools].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    : [];

  const recentExams = Array.isArray(exams)
    ? [...exams].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    : [];

  // Kullanıcı adının ilk harfini al (Avatar için)
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  // Aktivite filtresi değiştirme işleyicisi
  const handleActivityFilterChange = (filter: string | null) => {
    setActivityFilter(filter === activityFilter ? null : filter);
  };


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8"> {/* Responsive padding */}
      {/* Header Section with Welcome and Time */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 p-6 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/20 shadow-lg">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback className="bg-primary-foreground text-primary text-xl font-bold">
                {getInitials(user?.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Hoş Geldiniz, {user?.name ? user.name.split(' ')[0] : user?.email?.split('@')[0] || 'Kullanıcı'}
              </h1>
              <div className="flex flex-col gap-1">
                <p className="text-primary-foreground/80 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {format(currentTime, 'PPP', { locale: tr })} - {format(currentTime, 'HH:mm')}
                </p>
                {user?.role === 'ADMIN' && (
                  <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Yönetici olarak sadece kendi oluşturduğunuz içerikleri görüntülüyorsunuz
                  </p>
                )}
                {user?.role === 'SUPERADMIN' && (
                  <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Süper Yönetici olarak tüm sistem verilerini görüntülüyorsunuz
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchData()}
              className="flex items-center gap-2 transition-all hover:shadow-md bg-white/20 text-white hover:bg-white/30"
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Verileri Yenile
            </Button>

            {/* Bildirim sistemi henüz aktif değil - ileride eklenecek */}
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2 transition-all hover:shadow-md bg-white text-primary hover:bg-white/90"
              disabled
              title="Bildirim sistemi yakında eklenecektir"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Bildirimler</span>
              <Badge variant="outline" className="ml-1 border-primary text-primary">Yakında</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Yeni Sınav", icon: PlusCircle, href: "/admin/exams/new", color: "bg-blue-500" },
          // Sınav Sihirbazı geçici olarak kaldırıldı
          { title: "Soru Havuzu Ekle", icon: BookOpen, href: "/question-pools/new", color: "bg-emerald-500" },
          { title: "Personel Ekle", icon: UserPlus, href: "/dashboard/users/new", color: "bg-amber-500" },
          { title: "Ayarlar", icon: Settings2, href: "/dashboard/settings", color: "bg-purple-500" },
        ].map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            }}
            className="relative overflow-hidden"
          >
            <Button
              variant="ghost"
              className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 border rounded-xl hover:bg-background/50"
              asChild
            >
              <a href={action.href}>
                <div className={cn("p-3 rounded-full", action.color.replace("bg-", "bg-opacity-20 text-"))}>
                  <action.icon className={cn("h-6 w-6", action.color.replace("bg-", "text-"))} />
                </div>
                <span className="font-medium">{action.title}</span>
              </a>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Statistics Cards (With Animation) */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {[
          {
            title: "Toplam Soru Havuzu",
            value: questionPools.length,
            displayValue: totalQuestionPools,
            Icon: BookOpen,
            isLoading: false,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-950/30",
            trend: "+5% bu ay",
            trendUp: true
          },
          {
            title: "Toplam Sınav",
            value: exams.length,
            displayValue: totalExams,
            Icon: FileText,
            isLoading: false,
            color: "from-emerald-500 to-emerald-600",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
            trend: "+2 son hafta",
            trendUp: true
          },
          {
            title: "Toplam Sınav Denemesi",
            value: stats?.overallStats?.totalAttempts ?? 0,
            displayValue: totalAttempts,
            Icon: TrendingUp,
            isLoading: isLoadingStats,
            color: "from-amber-500 to-amber-600",
            bgColor: "bg-amber-50 dark:bg-amber-950/30",
            trend: "+12% bu ay",
            trendUp: true
          },
          {
            title: "Tamamlanan Denemeler",
            value: stats?.overallStats?.completedAttempts ?? 0,
            displayValue: completedAttempts,
            Icon: CheckCircle,
            isLoading: isLoadingStats,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-950/30",
            trend: "-3% geçen haftaya göre",
            trendUp: false
          },
          {
            title: "Benzersiz Katılımcı",
            value: stats?.overallStats?.uniqueParticipants ?? 0,
            displayValue: uniqueParticipants,
            Icon: Users,
            isLoading: isLoadingStats,
            color: "from-rose-500 to-rose-600",
            bgColor: "bg-rose-50 dark:bg-rose-950/30",
            trend: "+8 yeni katılımcı",
            trendUp: true
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{
              y: -5,
              transition: { duration: 0.2 },
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            }}
            className="h-full"
          >
            <Card className={cn("dashboard-card h-full overflow-hidden border-t-4 transition-all", `border-t-${item.color.split(" ")[1]}`)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dashboard-title">{item.title}</CardTitle>
                <div className={cn("p-2 rounded-full", item.bgColor)}>
                  <item.Icon className={cn("h-5 w-5 text-gradient bg-gradient-to-br", item.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold dashboard-value">
                  {item.isLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={item.displayValue}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn("bg-gradient-to-r bg-clip-text text-transparent", item.color)}
                      >
                        {item.displayValue}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
                {!item.isLoading && item.trend && (
                  <div className={cn(
                    "text-xs mt-2 flex items-center gap-1",
                    item.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>
                    {item.trendUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3 transform rotate-180" />
                    )}
                    <span>{item.trend}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex justify-center sm:justify-start"
        >
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger
              value="overview"
              className="dashboard-tab flex items-center gap-2"
              onClick={() => setActiveIndex(0)}
            >
              <PieChartIcon className="h-4 w-4" />
              <span>Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="dashboard-tab flex items-center gap-2"
              onClick={() => setActiveIndex(1)}
            >
              <BarChartIcon className="h-4 w-4" />
              <span>Katılımcı İstatistikleri</span>
            </TabsTrigger>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="dashboard-title">Son Eklenen Soru Havuzları</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs flex items-center gap-1" asChild>
                    <a href="/question-pools">
                      Tümünü Gör <ArrowRight className="h-3 w-3" />
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Oluşturan</TableHead>
                        <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(recentQuestionPools) && recentQuestionPools.length > 0 ? (
                        recentQuestionPools.map((pool) => {
                          return (
                            <TableRow
                              key={pool.id}
                              className="group transition-colors hover:bg-muted/30"
                            >
                              <TableCell className="font-medium">{pool.title}</TableCell>
                              <TableCell className="text-muted-foreground">{pool.description?.substring(0, 50)}{pool.description && pool.description.length > 50 ? "..." : ""}</TableCell>
                              <TableCell>{pool.createdBy?.name || "Bilinmiyor"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={`/question-pools/${pool.id}`} title="Görüntüle">
                                      <BookOpen className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={`/question-pools/${pool.id}/edit`} title="Düzenle">
                                      <Pencil className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="dashboard-title">Son Eklenen Sınavlar</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs flex items-center gap-1" asChild>
                    <a href="/admin/exams">
                      Tümünü Gör <ArrowRight className="h-3 w-3" />
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Oluşturan</TableHead>
                        <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {Array.isArray(recentExams) && recentExams.length > 0 ? (
                      recentExams.map((exam) => {
                        return (
                          <TableRow
                            key={exam.id}
                            className="group transition-colors hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">{exam.title}</TableCell>
                            <TableCell className="text-muted-foreground">{exam.description?.substring(0, 50)}{exam.description && exam.description.length > 50 ? "..." : ""}</TableCell>
                            <TableCell>
                              <Badge
                                className="badge"
                                variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}
                              >
                                {exam.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
                              </Badge>
                            </TableCell>
                            <TableCell>{exam.createdBy?.name || "Bilinmiyor"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={`/admin/exams/${exam.id}`} title="Görüntüle">
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={`/admin/exams/${exam.id}/edit`} title="Düzenle">
                                    <Pencil className="h-4 w-4" />
                                  </a>
                                </Button>
                                {exam.status === 'PUBLISHED' && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={`/admin/exams/${exam.id}/share`} title="Paylaş">
                                      <Share className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
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

            {/* Recent Activity Section */}
            <motion.div
              className="mb-6"
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            >
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="dashboard-title">Son Aktiviteler</CardTitle>
                  <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Tüm Aktiviteleri Gör <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Aktiviteler yükleniyor...</span>
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-8">
                      <AnimatePresence>
                        {activities.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            className="relative pl-8 pb-8 last:pb-0"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{
                              scale: 1.01,
                              transition: { duration: 0.2 }
                            }}
                          >
                            {/* Timeline line */}
                            {index < activities.length - 1 && (
                              <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                            )}

                            {/* Icon */}
                            <div className={cn("absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full", activity.color)}>
                              <activity.icon className="h-4 w-4 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{activity.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {activity.type.split('_').join(' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-medium">{activity.user}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(activity.time, { addSuffix: true, locale: tr })}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mb-4 opacity-20" />
                      <p>Henüz aktivite kaydı bulunmuyor.</p>
                      <p className="text-sm mt-1">Sistem kullanıldıkça burada aktiviteler görüntülenecektir.</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-center">
                    <div className="inline-flex gap-2 flex-wrap">
                      <Button
                        variant={activityFilter === "exam_created" || activityFilter === "exam_updated" || activityFilter === "exam_published" ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleActivityFilterChange("exam_created")}
                      >
                        Sınavlar
                      </Button>
                      <Button
                        variant={activityFilter === "question_pool_created" || activityFilter === "question_pool_updated" ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleActivityFilterChange("question_pool_created")}
                      >
                        Soru Havuzları
                      </Button>
                      <Button
                        variant={activityFilter === "user_created" || activityFilter === "user_updated" ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleActivityFilterChange("user_created")}
                      >
                        Kullanıcılar
                      </Button>
                      <Button
                        variant={activityFilter === null ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setActivityFilter(null)}
                      >
                        Tümü
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* New Charts Section */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            >
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="dashboard-title">Sınav Denemeleri</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground mr-2">Zaman Aralığı:</div>
                    <div className="flex border rounded-md overflow-hidden">
                      {[
                        { value: "7", label: "7 Gün" },
                        { value: "30", label: "30 Gün" },
                        { value: "90", label: "90 Gün" }
                      ].map((period) => (
                        <Button
                          key={period.value}
                          variant={timeFilter === period.value ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 rounded-none text-xs px-2 py-1 transition-all",
                            timeFilter === period.value
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setTimeFilter(period.value)}
                        >
                          {period.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-2 h-[350px]"> {/* Yükseklik verildi */}
                  {isLoadingStats ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Yükleniyor...</div>
                  ) : stats?.attemptsOverTime && stats.attemptsOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.attemptsOverTime.slice(-parseInt(timeFilter))} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), "MMM d")} tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <RechartsTooltip
                          labelFormatter={(label) => format(new Date(label), "PP")}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          formatter={(value) => <span className="text-sm font-medium">{value}</span>}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Deneme Sayısı"
                          stroke="#8884d8"
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                          dot={{r: 3}}
                          animationDuration={1000}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          fill={AREA_CHART_COLORS[0]}
                          stroke="none"
                          fillOpacity={0.2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">Veri bulunamadı.</div>
                  )}
                </CardContent>
              </Card>
              <Card className="dashboard-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="dashboard-title">Başarı Puanı Dağılımı</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1"
                    onClick={() => setActivePieIndex(-1)}
                  >
                    <RefreshCw className="h-3 w-3" /> Sıfırla
                  </Button>
                </CardHeader>
                <CardContent className="h-[350px] flex justify-center items-center">
                  {isLoadingStats ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Yükleniyor...</div>
                  ) : stats?.scoreDistribution && stats.scoreDistribution.some(item => item.count > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activePieIndex}
                          activeShape={renderActiveShape}
                          data={stats.scoreDistribution.filter(item => item.count > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={activePieIndex !== -1 ? false : true}
                          label={activePieIndex !== -1 ? undefined : ({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={90}
                          innerRadius={activePieIndex !== -1 ? 60 : 0}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="range"
                          paddingAngle={2}
                          minAngle={1}
                          onMouseEnter={onPieEnter}
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          {stats.scoreDistribution.filter(item => item.count > 0).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                              strokeWidth={activePieIndex === index ? 2 : 0}
                              stroke={activePieIndex === index ? "#fff" : undefined}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [`${value} katılımcı`, name]}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{fontSize: "12px", marginTop: "15px"}}
                          onClick={(data) => {
                            const index = stats.scoreDistribution
                              .filter(item => item.count > 0)
                              .findIndex(item => item.range === data.value);
                            setActivePieIndex(index);
                          }}
                          formatter={(value, entry, index) => (
                            <span
                              className={cn(
                                "cursor-pointer px-2 py-1 rounded transition-colors",
                                activePieIndex === index ? "bg-gray-100 dark:bg-gray-800" : ""
                              )}
                            >
                              {value}
                            </span>
                          )}
                        />
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
                      <RechartsTooltip
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
