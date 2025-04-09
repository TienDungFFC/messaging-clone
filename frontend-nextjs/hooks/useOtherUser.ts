import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { FullConversationType, User } from "@/types";

export default function useOtherUser(conversation: FullConversationType | { users: any[] }) {
  const session = useSession();
  
  const otherUser = useMemo(() => {
    const currentUserEmail = session?.data?.user?.email;
    
    if (!currentUserEmail || !conversation?.users?.length) {
      return undefined;
    }
    
    // Handle junction table structure if needed
    const users = conversation.users.map(userRelation => userRelation.user || userRelation);
    
    const otherUsers = users.filter(user => 
      user.email !== currentUserEmail
    );
    
    return otherUsers[0];
  }, [session?.data?.user?.email, conversation?.users]);
  
  return otherUser;
}
