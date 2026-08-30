FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host để Vite dev server lắng nghe trên 0.0.0.0 thay vì chỉ localhost
# bên trong container - nếu không, cổng map ra ngoài (host machine) sẽ
# không kết nối được dù container "chạy được"
CMD ["npm", "run", "dev", "--", "--host"]
