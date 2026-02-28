Problem Statement -> What i need to is create a system which merge customer identities based on shared email or phone number 

-> core problem 
Same email OR same phone → same person
Oldest contact becomes primary
Others become secondary
If two primaries get connected → merge them.

installing dependencies 
express typescript ts-node prisma @prisma/client dotenv zod


Folder structure 
src/
 ├── routes/
 │     identify.route.ts
 ├── controllers/
 │     identify.controller.ts
 ├── services/
 │     contact.service.ts
 ├── validators/
 │     identify.validator.ts
 ├── utils/
 ├── app.ts
 └── server.ts


