Fabric mode (real Hyperledger Fabric)

Prereqs
- Node 12.x for server (see .nvmrc)
- Docker + docker-compose
- Fabric network up with matching connection profiles

Setup
1) cd web-app/servers
2) cp .env.fabric.example .env.fabric and edit values as needed
3) npm install (ensures dotenv-cli is available)
4) npm install fabric-network@^1.4.5 fabric-client@^1.4.5 fabric-ca-client@^1.4.5 --save-optional

Run
1) Ensure your Fabric network is running and connection JSON paths in .env.fabric are correct
2) Use Node 12: nvm use (loads from .nvmrc)
3) npm run start:fabric

Notes
- On first start, the server enrolls admins for each org (SKIP_FABRIC_ENROLL=false)
- ALLOW_DEV_LOGIN=false forces real JWT usage
- Use the UI or Postman to sign up users per org, then create/transact products
