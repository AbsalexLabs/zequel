import pg from "pg"

const { Client } = pg

const connectionString =
  process.env.MIGRATION_DB_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL
if (!connectionString) {
  console.error("[migration] no Postgres connection string is set")
  process.exit(1)
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

const migration = `
alter table public.coding_projects
  add column if not exists daytona_sandbox_id text,
  add column if not exists daytona_sandbox_state text,
  add column if not exists daytona_last_synced_at timestamptz;

create unique index if not exists coding_projects_daytona_sandbox_id_key
  on public.coding_projects(daytona_sandbox_id)
  where daytona_sandbox_id is not null;
`

async function main() {
  await client.connect()
  await client.query(migration)
  const { rows } = await client.query(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'coding_projects'
     and column_name like 'daytona%' order by column_name;`,
  )
  console.log("[migration] daytona columns present:", rows.map((r) => r.column_name).join(", "))
  await client.end()
}

main().catch((err) => {
  console.error("[migration] failed:", err.message)
  process.exit(1)
})
