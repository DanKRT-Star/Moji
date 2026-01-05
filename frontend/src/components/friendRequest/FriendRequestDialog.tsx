import {useState, useEffect, type Dispatch, type SetStateAction} from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFriendStore } from '@/stores/useFriendStore'
import SentRequests from './SentRequests'
import ReceivedRequest from './ReceivedRequest'

interface FriendRequestDialogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

const FriendRequestDialog = ({open, setOpen} : FriendRequestDialogProps) => {
  const [tab, setTab] = useState("received");
  const { getAllFriendRequests } = useFriendStore();

  useEffect(() => {
    const loadRequests = async () => {
      try {
        await getAllFriendRequests();
      } catch (error) {
        console.error("Failed to load friend requests:", error);
      }
    }
    loadRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lời mời kết bạn</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="received" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Đã nhận</TabsTrigger>
            <TabsTrigger value="sent">Đã gửi</TabsTrigger>
          </TabsList>
          <TabsContent value="received">
            <ReceivedRequest />
          </TabsContent>
          <TabsContent value="sent">
            <SentRequests />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default FriendRequestDialog