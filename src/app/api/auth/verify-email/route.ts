import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const appUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${appUrl}/admin/login?verify=missing`);
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { staff: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/admin/login?verify=expired`);
  }

  await prisma.staff.update({
    where: { id: record.staffId },
    data: { emailVerifiedAt: new Date() },
  });
  await prisma.emailVerificationToken.deleteMany({ where: { staffId: record.staffId } });

  await createSession(record.staffId);

  return NextResponse.redirect(`${appUrl}/admin`);
}
