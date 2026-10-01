#main dir
docker compose up -d
docker compose stop

#backend
npm run dev

#frontend
npm run dev 

#login
coordinator@campus.edu / password123
student1@campus.edu / password123

#database web UI backend
npx prisma studio

#to seed databse with values 
npm run seed:data