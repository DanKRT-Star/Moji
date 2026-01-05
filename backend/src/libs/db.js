import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log('Đã kết nối tới MongoDB');
    } catch (error) {
        console.error('Lỗi kết nối tới MongoDB:', error);
        process.exit(1);
    }
};