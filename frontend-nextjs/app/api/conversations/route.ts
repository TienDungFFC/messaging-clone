import getCurrentUser from "@/actions/getCurrentUser";
import prisma from "@/libs/prismadb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { userId, isGroup, members, name } = body;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("members:", members);
    if (isGroup && (!members || members.length < 2 || !name)) {
      return new NextResponse("Invalid data", { status: 400 });
    }
    if (isGroup) {
      const newConversation = await prisma.conversation.create({
        data: {
          name,
          isGroup,
          users: {
            create: [
              ...members.map((member: { value: string }) => ({
                userId: member.value,
              })),
              {
                userId: currentUser.id,
              },
            ],
          },
        },
        include: {
          users: {
            include: {
              user: true
            }
          },
        },
      });

      return NextResponse.json(newConversation);
    }
    
    // Find existing 1:1 conversation between the two users
    const existingConversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        AND: [
          {
            users: {
              some: {
                userId: currentUser.id
              }
            }
          },
          {
            users: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    });

    const singleConversation = existingConversations[0];

    if (singleConversation) {
      return NextResponse.json(singleConversation);
    }
    
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          create: [
            {
              userId: currentUser.id,
            },
            {
              userId: userId,
            },
          ],
        },
      },
      include: {
        users: {
          include: {
            user: true
          }
        },
      },
    });

    return NextResponse.json(newConversation);
  } catch (error: any) {
    console.log("error: ", error)
    return new NextResponse("Internal Error", { status: 500 });
  }
}
