import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Moji Chat API",
      version: "1.0.0",
      description:
        "REST + Socket.IO API cho Moji - ứng dụng chat thời gian thực với nhắn tin, kết bạn, chat nhóm, gửi ảnh, và gọi thoại/video qua WebRTC.",
    },
    servers: [
      { url: "http://localhost:5001/api", description: "Local" },
      {
        url: "https://<your-render-app>.onrender.com/api",
        description: "Production (Render)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Access token JWT, thời hạn 15 phút. Lấy từ response của /auth/signin hoặc /auth/refresh.",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            displayName: { type: "string" },
            email: { type: "string" },
            avatarUrl: { type: "string", nullable: true },
          },
        },
        Message: {
          type: "object",
          properties: {
            _id: { type: "string" },
            conversationId: { type: "string" },
            senderId: { type: "string" },
            content: { type: "string", nullable: true },
            imgUrl: { type: "string", nullable: true },
            type: { type: "string", enum: ["text", "call"] },
            call: {
              type: "object",
              nullable: true,
              properties: {
                callId: { type: "string" },
                callerId: { type: "string" },
                calleeId: { type: "string" },
                callType: { type: "string", enum: ["audio", "video"] },
                status: {
                  type: "string",
                  enum: ["completed", "missed", "rejected", "cancelled"],
                },
                duration: { type: "number" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            type: { type: "string", enum: ["direct", "group"] },
            participants: { type: "array", items: { type: "object" } },
            lastMessage: { type: "object", nullable: true },
            unreadCounts: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Call: {
          type: "object",
          properties: {
            _id: { type: "string" },
            conversationId: { type: "string" },
            callerId: { type: "string" },
            calleeId: { type: "string" },
            type: { type: "string", enum: ["audio", "video"] },
            status: {
              type: "string",
              enum: [
                "ringing",
                "ongoing",
                "completed",
                "missed",
                "rejected",
                "cancelled",
              ],
            },
            duration: { type: "number" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

export default swaggerJsdoc(options);