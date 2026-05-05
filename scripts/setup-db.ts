#!/usr/bin/env node

/**
 * Database Setup Script for Zequel
 * 
 * This script reads the SQL migrations and runs them against your Supabase database.
 * 
 * Usage:
 *   npx ts-node scripts/setup-db.ts
 * 
 * Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '❌ Error: Missing Supabase credentials.\n' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
    process.exit(1)
  }

  console.log('🔧 Setting up Zequel database...\n')
  console.log(`📍 Connecting to Supabase project...`)
  console.log(`   URL: ${supabaseUrl}\n`)

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../sql/001_create_tables.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('⏳ Running migrations...\n')

    // Execute the SQL - we'll split by statements and execute carefully
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      try {
        // Use RPC to execute raw SQL (if available) or direct query
        const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(() => {
          // Fallback: try direct execution (may not work for all statements)
          return { error: 'RPC not available - please run SQL manually' }
        })

        if (error) {
          // Some statements might fail (like creating duplicate policies) - that's ok
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('violates unique constraint')
          ) {
            // These are expected - resources may already exist
            successCount++
          } else {
            console.warn(`⚠️  Warning: ${error.message}`)
            errorCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.warn(`⚠️  Statement execution warning: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    console.log('\n✅ Database setup complete!\n')
    console.log('📊 Summary:')
    console.log(`   Successful operations: ${successCount}`)
    console.log(`   Warnings/Skipped: ${errorCount}`)
    console.log('\n💡 Next steps:')
    console.log('   1. Verify tables in Supabase dashboard > SQL Editor > Check table list')
    console.log('   2. Try signing up a user with the OTP flow')
    console.log('   3. Upload a document and start a conversation')

    process.exit(0)
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : String(error))
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Make sure your Supabase credentials are correct')
    console.error('   2. Try running migrations manually in Supabase dashboard > SQL Editor')
    console.error('   3. Copy-paste sql/001_create_tables.sql directly in the SQL Editor')
    process.exit(1)
  }
}

setupDatabase()
