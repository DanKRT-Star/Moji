import { uploadImageFromBuffer } from "../middlewares/uploadMiddleWare.js";
import User from "../models/User.js";

export const authMe = (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({user});
    } catch (error) {
        console.log('Lỗi khi gọi authMe', error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const searchUsersByUsername = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username || username.trim() === '') {
            return res.status(400).json({ message: "Cần cung cấp username" });
        }
        const user = await User.findOne({username}).select('_id username displayName avatarUrl');
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Lỗi khi tìm kiếm user theo username", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file
        const userId = req.user._id

        if (!file) {
            return res.status(400).json({message: "No file uploaded"});
        }

        const result = await uploadImageFromBuffer(file.buffer);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true
            }
        ).select("avatarUrl");

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({message: "Avatar return null"});
        }

        return res.status(200).json({avatarUrl: updatedUser.avatarUrl})
    } catch (error) {
        console.error("Lỗi xảy ra khi upload avatar:", error)
        return res.status(500).json({message: "Upload failed"})
    }
}