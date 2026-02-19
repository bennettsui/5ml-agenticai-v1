'use strict';

/**
 * Simple Markdown table parser
 * Extracts pipe-delimited tables into structured JSON arrays
 */

function parseMarkdownTable(markdown) {
  const lines = markdown.split('\n');
  const tables = [];
  let currentTable = null;
  let headerParsed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table header row (contains |)
    if (line.includes('|') && !headerParsed) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 0) {
        currentTable = {
          headers: cells,
          rows: [],
        };
        headerParsed = true;
        continue;
      }
    }

    // Separator row (contains dashes and pipes)
    if (line.includes('|') && line.includes('-') && currentTable && !currentTable.rows.length) {
      continue;
    }

    // Data row
    if (line.includes('|') && currentTable && headerParsed) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length === currentTable.headers.length) {
        const row = {};
        currentTable.headers.forEach((header, idx) => {
          row[header.toLowerCase().replace(/\s+/g, '_')] = cells[idx];
        });
        currentTable.rows.push(row);
      }
    }

    // End of table (blank line or non-table content)
    if ((line === '' || !line.includes('|')) && currentTable && currentTable.rows.length > 0) {
      tables.push(currentTable);
      currentTable = null;
      headerParsed = false;
    }
  }

  // Don't forget the last table
  if (currentTable && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Extract specific sections from Markdown (by header)
 */
function extractMarkdownSection(markdown, sectionTitle) {
  const regex = new RegExp(`^### ${sectionTitle}.*?$([\\s\\S]*?)(?=^###|$)`, 'm');
  const match = markdown.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract bullet list items
 */
function extractBulletList(markdown) {
  const lines = markdown.split('\n');
  const items = [];
  for (const line of lines) {
    if (line.match(/^\s*-\s+/)) {
      items.push(line.replace(/^\s*-\s+/, '').trim());
    }
  }
  return items;
}

module.exports = {
  parseMarkdownTable,
  extractMarkdownSection,
  extractBulletList,
};
