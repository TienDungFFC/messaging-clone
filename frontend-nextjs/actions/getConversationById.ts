import prisma from "@/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversationById = async (conversationId: string) => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return null;
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    return conversation;
  } catch (error: any) {
    console.log(error, 'ERROR_CONVERSATION_GET_BY_ID');
    return null;
  }
};

export default getConversationById;
