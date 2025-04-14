import prisma from "@/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversations = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) return [];

  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        lastMessageAt: "desc",
      },
      where: {
        users: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            sender: true,
            seenBy: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc", // hoặc "desc" nếu bạn muốn tin nhắn mới nhất đầu
          },
        },
      },
    });

    return conversations;
  } catch (error) {
    console.error("getConversations error:", error);
    return [];
  }
};

export default getConversations;
