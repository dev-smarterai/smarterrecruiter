import { cronJobs } from "convex/server"

// Note: Vector DB initialization is now a manual process.
// To initialize the vector database, run:
//   npx convex run vectorDbMigration:initDevVectorDb
// or for detailed logs:
//   npx convex run initVectorDb:init

const crons = cronJobs()

export default crons
