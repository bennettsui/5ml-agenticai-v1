#!/usr/bin/env node

/**
 * Radiance PR - Image Download Script
 * Downloads all images from radiancehk.com and stores them locally
 * Run: node download-images.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Create directories if they don't exist
const publicDir = path.join(__dirname, 'frontend/public/images/radiance');
const casesDir = path.join(publicDir, 'case-studies');
const heroDir = path.join(publicDir, 'hero');
const logosDir = path.join(publicDir, 'logos');

[publicDir, casesDir, heroDir, logosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// All image URLs from radiancehk.com
const images = {
  // Case Study: Lung Fu Shan
  'case-studies/lung-fu-shan': [
    'https://radiancehk.com/wp-content/uploads/2022/09/Lung-Fu-Shan-Environmental-Education-Centre-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Into-the-Woods-Souvenir-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Lung-Fu-Shan-Environmental-Education-Centre-4-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Lung-Fu-Shan-Environmental-Education-Centre-3-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Lung-Fu-Shan-Environmental-Education-Centre-2-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Lung-Fu-Shan-Workout-Guide-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Lung-Fu-Shan-Workout-Guide-2-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Media-tour.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Ecology-in-The-Making-1816-present-Exhibition.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/09/Ecology-in-The-Making-1816-present-Exhibition-2.jpg',
  ],

  // Case Study: Her Own Words Sport
  'case-studies/her-own-words-sport': [
    'https://radiancehk.com/wp-content/uploads/2022/10/HerOwnWords-scaled.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/10/HerOwnWords2-scaled.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/10/HerOwnWords3.jpeg',
    'https://radiancehk.com/wp-content/uploads/2022/10/HerOwnWords4.jpeg',
    'https://radiancehk.com/wp-content/uploads/2022/10/HerOwnWords5.jpeg',
  ],

  // Case Study: FILORGA
  'case-studies/filorga': [
    'https://radiancehk.com/wp-content/uploads/2022/01/NCEF-Shot-SUPER-SERUM.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/01/TIME-FILLER-INTENSIVE-SERUM.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/01/FILORGA-Website-Promotion-scaled.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/01/FILORGA-XMAS-Countdown-Calendar.jpg',
    'https://radiancehk.com/wp-content/uploads/2022/01/6.jpg',
  ],

  // Case Study: Daikin
  'case-studies/daikin': [
    'https://radiancehk.com/wp-content/uploads/2025/02/Daikin.jpg',
  ],

  // Case Study: Venice Biennale
  'case-studies/venice-biennale': [
    'https://radiancehk.com/wp-content/uploads/2025/02/16_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/15_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/14_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/13_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/12_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/11_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/10_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/9_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/8_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/7_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/6_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/5_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/4_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/3_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/2_Radiance.png',
    'https://radiancehk.com/wp-content/uploads/2025/02/1_Radiance.png',
  ],

  // Case Study: Chinese Culture Exhibition
  'case-studies/chinese-culture': [
    'https://radiancehk.com/wp-content/uploads/2025/02/b-3.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/c-3.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/d-3.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/a-3.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/e-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/f-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/g-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/h-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/i-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/j-2.jpg',
  ],

  // Case Study: GP Batteries
  'case-studies/gp-batteries': [
    'https://radiancehk.com/wp-content/uploads/2021/06/GP-Batteries-Minions-collaboration-handheld-fan-1024x683.jpg',
    'https://radiancehk.com/wp-content/uploads/2021/06/GP-Batteries-x-Minions.jpg',
    'https://radiancehk.com/wp-content/uploads/2021/06/GP-Batteries-x-Minions-batteries.jpg',
    'https://radiancehk.com/wp-content/uploads/2021/06/GP超霸電池-x-Minions-小黃人-1-1024x1024.jpg',
    'https://radiancehk.com/wp-content/uploads/2021/06/GP超霸電池-x-Minions-小黃人-2-1024x768.jpg',
    'https://radiancehk.com/wp-content/uploads/2021/06/GP超霸電池-x-Minions-小黃人-3-1024x683.jpg',
  ],

  // Case Study: Richmond Fellowship
  'case-studies/richmond-fellowship': [
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-1.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-3.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-4.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-5.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-6.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-7.jpg',
    'https://radiancehk.com/wp-content/uploads/2025/02/Richmond-8.jpg',
  ],

  // Hero Images
  'hero': [
    'https://radiancehk.com/wp-content/uploads/2024/12/Radiance-3.jpg',
    'https://radiancehk.com/wp-content/uploads/2024/12/Radiance-2.jpg',
    'https://radiancehk.com/wp-content/uploads/2024/12/Radiance-1.jpg',
  ],

  // Client Logos
  'logos': [
    'https://radiancehk.com/wp-content/uploads/2024/12/JC-Cool-Science.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/Nikon.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/Venice-Biennale.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/Hong-Kong-Arts-Development-Council-logo.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/The-University-of-Hong-Kong.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/Filorga.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/UNESCO.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/PMQ.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/Daikin.png',
    'https://radiancehk.com/wp-content/uploads/2024/12/PolyU.png',
  ],
};

// Download function
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https.get(url, { timeout: 5000 }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });
        file.on('error', (err) => {
          fs.unlink(destPath, () => {}); // Delete incomplete file
          reject(err);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject).on('timeout', function() {
      this.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Main download loop
async function downloadAll() {
  let total = 0;
  let downloaded = 0;
  let failed = 0;

  for (const [category, urls] of Object.entries(images)) {
    const categoryDir = path.join(publicDir, category);

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    for (const url of urls) {
      total++;
      const filename = url.split('/').pop().split('?')[0] || `image-${Date.now()}.jpg`;
      const destPath = path.join(categoryDir, filename);

      try {
        await downloadImage(url, destPath);
        downloaded++;
        console.log(`✓ [${downloaded}/${total}] ${category}/${filename}`);
      } catch (error) {
        failed++;
        console.error(`✗ [${downloaded + failed}/${total}] Failed: ${url.substring(0, 60)}... (${error.message})`);
      }

      // Rate limiting: 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Download Complete:`);
  console.log(`  Total:      ${total}`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Success:    ${((downloaded / total) * 100).toFixed(1)}%`);
  console.log(`\nImages saved to: ${publicDir}`);
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run
console.log('Starting image download from radiancehk.com...\n');
downloadAll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
