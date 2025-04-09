import getCurrentUser from "@/actions/getCurrentUser";
import prisma from "@/libs/prismadb";
import { NextResponse } from "next/server";

interface IParams {
  conversationId?: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId } = params;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          include: {
            seenBy: true,  // ✅ Changed from 'seen' to 'seenBy'
            sender: true
          }
        },
        users: true
      }
    });

    if (!conversation) {
      return new NextResponse("Invalid Id", { status: 400 });
    }

    // find the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!lastMessage) {
      return NextResponse.json(conversation);
    }

    // Check if the user has already seen the message
    const hasAlreadySeen = lastMessage.seenBy.some(
      seen => seen.userId === currentUser.id
    );

    if (hasAlreadySeen) {
      return NextResponse.json(conversation);
    }

    // update seenBy of last message
    const updatedMessage = await prisma.message.update({
      where: {
        id: lastMessage.id,
      },
      include: {
        sender: true,
        seenBy: true,
      },
      data: {
        seenBy: {
          create: {  
            userId: currentUser.id
          },
        },
      },
    });

    return NextResponse.json("Success");
  } catch (error: any) {
    console.log("🚀 ~ file: route.ts:10 ~ POST ~ error:", error.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
