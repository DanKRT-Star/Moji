import { useFriendStore } from '@/stores/useFriendStore';
import FriendRequestItem from './FriendRequestItem';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const ReceivedRequest = () => {
    const {acceptRequest, declineRequest, loading, receivedList} = useFriendStore();

    if (!receivedList || receivedList.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Bạn chưa có lời mời kết bạn nào
            </p>
        )
    }

    const handleAccept = async (requestId: string) => {
        try {
            await acceptRequest(requestId);
            toast.success("Đã chấp nhận lời mời kết bạn");
        } catch (error) {
            console.error("Failed to accept friend request:", error);
        }
    }

    const handleDecline = async (requestId: string) => {
        try {
            await declineRequest(requestId);
            toast.info("Đã từ chối lời mời kết bạn");
        } catch (error) {
            console.error("Failed to decline friend request:", error);
        }
    }

    return (
        <div className='space-y-3 mt-4'>
            {receivedList.map((request) => (
                <FriendRequestItem
                    key={request._id}
                    requestInfo={request}
                    type="received"
                    actions={
                        <div className='flex items-center gap-2'>
                            <Button
                                size="sm"
                                variant= "primary"
                                disabled={loading}
                                onClick={() => handleAccept(request._id)}
                            >
                                Chấp nhận
                            </Button>
                            <Button
                                size="sm"
                                variant= "destructiveOutline"
                                disabled={loading}
                                onClick={() => handleDecline(request._id)}
                            >
                                Từ chối
                            </Button>
                        </div>
                    }
                />
            ))}
        </div>
    )
}

export default ReceivedRequest