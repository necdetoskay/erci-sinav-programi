import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 * Sistem sağlık kontrolü API'si
 * Veritabanı bağlantısını ve diğer sistem bileşenlerini kontrol eder
 */
export async function GET() {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "disconnected",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  try {
    // Veritabanı bağlantısını kontrol et
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.database = "connected";
  } catch (error) {
    console.error("Veritabanı bağlantı hatası:", error);
    healthStatus.status = "error";
    healthStatus.database = "error";
    
    // Hata detaylarını ekle (sadece development ortamında)
    if (process.env.NODE_ENV === "development") {
      (healthStatus as any).error = error instanceof Error ? error.message : String(error);
    }
    
    return NextResponse.json(healthStatus, { status: 500 });
  }

  return NextResponse.json(healthStatus);
}
