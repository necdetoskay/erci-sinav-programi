import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// PUT: Rol güncelleme
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (sadece ADMIN ve USER rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("User role:", session.user.role);

    const roleId = params.id;
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Sistem rolü mü yoksa özel rol mü kontrol et
    const validSystemRoles = ["ADMIN", "USER", "PERSONEL"];
    const isSystemRole = validSystemRoles.includes(roleId);

    if (isSystemRole) {
      // Sistem rollerini güncelleyemezsiniz
      return NextResponse.json(
        { error: "System roles cannot be modified" },
        { status: 400 }
      );
    } else {
      // Özel rol güncelleme
      // Rolün var olup olmadığını kontrol et
      const existingRole = await prisma.customRole.findUnique({
        where: {
          id: roleId
        }
      });

      if (!existingRole) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      // Yeni ad mevcut rolden farklıysa ve başka bir rolle çakışıyorsa kontrol et
      if (name.toUpperCase() !== existingRole.name) {
        // Sistem rolleriyle çakışma kontrolü
        if (validSystemRoles.includes(name.toUpperCase())) {
          return NextResponse.json(
            { error: "Role with this name already exists" },
            { status: 400 }
          );
        }

        // Diğer özel rollerle çakışma kontrolü
        const existingCustomRole = await prisma.customRole.findUnique({
          where: {
            name: name.toUpperCase()
          }
        });

        if (existingCustomRole && existingCustomRole.id !== roleId) {
          return NextResponse.json(
            { error: "Role with this name already exists" },
            { status: 400 }
          );
        }
      }

      // Özel rolü güncelle
      const updatedRole = await prisma.customRole.update({
        where: {
          id: roleId
        },
        data: {
          name: name.toUpperCase(),
          description: description || null,
          permissions: permissions || []
        },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      return NextResponse.json({
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description || "",
        permissions: updatedRole.permissions as string[] || [],
        userCount: updatedRole._count.users,
        isSystemRole: false
      });
    }
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Rol silme
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (sadece ADMIN ve USER rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("User role:", session.user.role);

    const roleId = params.id;

    // Sistem rolü mü yoksa özel rol mü kontrol et
    const validSystemRoles = ["ADMIN", "USER", "PERSONEL"];
    const isSystemRole = validSystemRoles.includes(roleId);

    if (isSystemRole) {
      // Sistem rollerini silemezsiniz
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 400 }
      );
    } else {
      // Özel rol silme
      // Rolün var olup olmadığını kontrol et
      const existingRole = await prisma.customRole.findUnique({
        where: {
          id: roleId
        },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (!existingRole) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      // Bu role sahip kullanıcı sayısını kontrol et
      if (existingRole._count.users > 0) {
        return NextResponse.json(
          { error: "Cannot delete role that is assigned to users" },
          { status: 400 }
        );
      }

      // Özel rolü sil
      await prisma.customRole.delete({
        where: {
          id: roleId
        }
      });

      console.log("Deleted custom role:", roleId);

      return NextResponse.json({
        message: "Role deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
