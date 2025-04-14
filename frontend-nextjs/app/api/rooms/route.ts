// Renamed from /api/conversations/route.ts
import getCurrentUser from "@/actions/getCurrentUser";
import prisma from "@/libs/prismadb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    console.log("Current User in getConversations:", currentUser);

    const body = await request.json();
    const { userId, isGroup, members, name } = body;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isGroup && (!members || members.length < 2 || !name)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    if (isGroup) {
      const newRoom = await prisma.room.create({
        data: {
          name,
          isGroup,
          participants: {
            create: [
              ...members.map((member: { value: string }) => ({
                user: {
                  connect: { id: member.value }
                }
              })),
              {
                user: {
                  connect: { id: currentUser.id }
                }
              }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          },
          messages: true
        }
      });

      return NextResponse.json(newRoom);
    }

    // Rest of the code updated similarly
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}