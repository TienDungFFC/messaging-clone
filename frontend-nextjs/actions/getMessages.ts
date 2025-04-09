import prisma from "@/libs/prismadb";

const getMessage = async (conversationId: string) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true, 
            email: true,
            image: true,
          }
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages.map(message => ({
      ...message,
      sender: message.sender || { 
        id: "unknown",
        name: "Unknown User", 
        email: null,
        image: null
      }
    }));
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

export default getMessage;
