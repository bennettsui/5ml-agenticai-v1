/**
 * seed-sources.js
 *
 * One-time script: inserts source-registry-seed.json into tender_source_registry table.
 * Safe to re-run — uses ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node use-cases/hk-sg-tender-intelligence/scripts/seed-sources.js
 *   node use-cases/hk-sg-tender-intelligence/scripts/seed-sources.js --dry-run
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

const seedData = require(path.join(__dirname, '../data/source-registry-seed.json'));

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Exiting.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  const sources = seedData.sources.filter(s =>
    // Only seed ingestion sources — skip reference-only and stage_2_only for now
    !['reference_only', 'stage_2_only'].includes(s.status)
  );

  console.log(`\n🌱 Seeding ${sources.length} sources into tender_source_registry`);
  if (DRY_RUN) console.log('   (DRY RUN — no DB writes)\n');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const src of sources) {
    const row = {
      source_id:            src.source_id,
      name:                 src.name,
      organisation:         src.organisation || null,
      owner_type:           src.owner_type,
      jurisdiction:         src.jurisdiction,
      source_type:          src.source_type,
      access:               src.access || 'public',
      priority:             src.priority || 2,
      status:               src.status,
      discovery_hub_url:    src.discovery_hub_url || null,
      feed_url:             src.feed_url || null,
      ingest_method:        src.ingest_method || null,
      update_pattern:       src.update_pattern || null,
      field_map:            src.field_map ? JSON.stringify(src.field_map) : null,
      scraping_config:      src.scraping_config ? JSON.stringify(src.scraping_config) : null,
      category_tags_default: src.category_tags_default || [],
      parsing_notes:        src.parsing_notes || null,
      legal_notes:          src.legal_notes || null,
      notes:                src.notes || null,
      tags:                 src.tags || [],
    };

    if (DRY_RUN) {
      console.log(`  [DRY] Would insert: ${row.source_id} (${row.status})`);
      inserted++;
      continue;
    }

    try {
      const result = await pool.query(
        `INSERT INTO tender_source_registry (
          source_id, name, organisation, owner_type, jurisdiction, source_type,
          access, priority, status, discovery_hub_url, feed_url, ingest_method,
          update_pattern, field_map, scraping_config, category_tags_default,
          parsing_notes, legal_notes, notes, tags,
          created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          NOW(), NOW()
        )
        ON CONFLICT (source_id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          feed_url = EXCLUDED.feed_url,
          field_map = EXCLUDED.field_map,
          scraping_config = EXCLUDED.scraping_config,
          updated_at = NOW()
        RETURNING (xmax = 0) AS was_inserted`,
        [
          row.source_id, row.name, row.organisation, row.owner_type, row.jurisdiction,
          row.source_type, row.access, row.priority, row.status, row.discovery_hub_url,
          row.feed_url, row.ingest_method, row.update_pattern,
          row.field_map, row.scraping_config,
          row.category_tags_default, row.parsing_notes, row.legal_notes, row.notes, row.tags,
        ]
      );

      const wasInserted = result.rows[0]?.was_inserted;
      if (wasInserted) {
        console.log(`  ✅ Inserted: ${row.source_id}`);
        inserted++;
      } else {
        console.log(`  🔁 Updated: ${row.source_id} (already existed)`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ❌ Error on ${row.source_id}: ${err.message}`);
      errors++;
    }
  }

  await pool.end();

  console.log(`\n📊 Summary:`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Skipped (reference/stage-2): ${seedData.sources.length - sources.length}`);

  if (errors > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
