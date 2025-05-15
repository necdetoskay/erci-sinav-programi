import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Tüm rolleri getir
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (sadece ADMIN, SUPERADMIN ve USER rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("User role:", session.user.role);

    // Tüm rolleri getir
    console.log("Fetching roles...");
    try {
      // Sistem rollerini oluştur
      const systemRoles = [
        { name: "SUPERADMIN" },
        { name: "ADMIN" },
        { name: "USER" },
        { name: "PERSONEL" }
      ];
      console.log("System roles created from enum:", systemRoles);

      // Her sistem rolü için kullanıcı sayısını hesapla
      console.log("Calculating user counts for system roles...");
      const systemUserCounts = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      });
      console.log("System user counts:", systemUserCounts);

      // Özel rolleri veritabanından getir
      console.log("Fetching custom roles...");
      const customRoles = await prisma.customRole.findMany({
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });
      console.log("Custom roles:", customRoles);

      // Sistem rollerini formatla
      const formattedSystemRoles = systemRoles.map(role => {
        let permissions: string[] = [];

        // Varsayılan izinleri ekle
        if (role.name === "SUPERADMIN") {
          permissions = [
            "dashboard_access",
            "exams_view",
            "exams_create",
            "exams_edit",
            "exams_delete",
            "users_view",
            "users_create",
            "users_edit",
            "users_delete",
            "roles_manage"
          ];
        } else if (role.name === "ADMIN") {
          permissions = [
            "dashboard_access",
            "exams_view",
            "exams_create",
            "exams_edit",
            "exams_delete",
            "users_view",
            "users_create",
            "users_edit",
            "users_delete"
          ];
        } else if (role.name === "USER") {
          permissions = ["dashboard_access", "exams_view"];
        } else if (role.name === "PERSONEL") {
          permissions = [];
        }

        // Kullanıcı sayısını bul
        const userCount = systemUserCounts.find((count: any) => count.role === role.name as any);

        return {
          id: role.name,
          name: role.name,
          description: "", // Sistem rolleri için açıklama yok
          permissions,
          userCount: userCount ? userCount._count.id : 0,
          isSystemRole: true
        };
      });

      // Özel rolleri formatla
      const formattedCustomRoles = customRoles.map((role: any) => {
        return {
          id: role.id,
          name: role.name,
          description: role.description || "",
          permissions: role.permissions ? (role.permissions as string[]) : [],
          userCount: role._count.users,
          isSystemRole: false
        };
      });

      // Tüm rolleri birleştir
      const allRoles = [...formattedSystemRoles, ...formattedCustomRoles];

      return NextResponse.json(allRoles);
    } catch (innerError) {
      console.error("Error in inner try block:", innerError);
      throw innerError;
    }
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST: Yeni rol oluştur
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (sadece ADMIN, SUPERADMIN ve USER rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("User role:", session.user.role);

    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Rol adının benzersiz olup olmadığını kontrol et
    const validRoles = ["SUPERADMIN", "ADMIN", "USER", "PERSONEL"];

    if (validRoles.includes(name.toUpperCase())) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 400 }
      );
    }

    // Özel rol adının benzersiz olup olmadığını kontrol et
    const existingCustomRole = await prisma.customRole.findUnique({
      where: {
        name: name.toUpperCase()
      }
    });

    if (existingCustomRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 400 }
      );
    }

    // Yeni özel rol oluştur
    const newRole = await prisma.customRole.create({
      data: {
        name: name.toUpperCase(),
        description: description || null,
        permissions: permissions || []
      }
    });

    console.log("Created new custom role:", newRole);

    return NextResponse.json({
      id: newRole.id,
      name: newRole.name,
      description: newRole.description || "",
      permissions: newRole.permissions as string[] || [],
      userCount: 0,
      isSystemRole: false
    });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
