// Dùng chung 1 instance Audio cho mỗi loại âm thanh (không tạo mới mỗi lần
// gọi) - tránh rò rỉ bộ nhớ và cho phép dừng đúng instance đang phát khi
// cần (vd: ringback đang kêu thì bị cancel giữa chừng).

const notificationAudio = new Audio("/sounds/notification.mp3");

const sendMessageAudio = new Audio("/sounds/bubble-pop.mp3");

const ringbackAudio = new Audio("/sounds/ringstone.mp3");
ringbackAudio.loop = true;

const ringtoneAudio = new Audio("/sounds/ringtone.mp3");
ringtoneAudio.loop = true;

// .play() trả về Promise, có thể bị trình duyệt reject nếu chưa có tương
// tác người dùng nào trên trang (autoplay policy) - bắt lỗi để tránh
// unhandled rejection làm rối console, không cần báo cho người dùng thấy.
const safePlay = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play().catch((err) => {
    console.error("[sound] Không thể phát âm thanh:", err);
  });
};

const safeStop = (audio: HTMLAudioElement) => {
  audio.pause();
  audio.currentTime = 0;
};

export const playMessageSound = () => safePlay(notificationAudio);
export const playSendMessageSound = () => safePlay(sendMessageAudio);

export const playRingback = () => safePlay(ringbackAudio);
export const stopRingback = () => safeStop(ringbackAudio);

export const playRingtone = () => safePlay(ringtoneAudio);
export const stopRingtone = () => safeStop(ringtoneAudio);