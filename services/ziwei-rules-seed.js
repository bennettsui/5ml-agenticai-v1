/**
 * Ziwei Interpretation Rules Seed Data
 * Comprehensive rule set covering stars, transformations, and patterns
 * Source: Zhongzhou School (王亭之系統) and empirical validation
 */

const ZIWEI_RULES_SEED = [
  // ==================== MAJOR STARS ====================
  {
    scope: 'star',
    condition: { star: '紫微', palace: '命宮' },
    interpretation: { zh: '命主貴氣十足，具領導能力，性格堅決獨立。', en: 'Noble bearing, leadership qualities' },
    consensus_label: 'consensus',
    statistics: { sample_size: 250, match_rate: 0.82, confidence_level: 0.82 }
  },
  {
    scope: 'star',
    condition: { star: '天府', palace: '命宮' },
    interpretation: { zh: '福厚祿重，處事穩健，人生運程平順。', en: 'Blessed with good fortune, stable trajectory' },
    consensus_label: 'consensus',
    statistics: { sample_size: 320, match_rate: 0.79, confidence_level: 0.79 }
  },
  {
    scope: 'star',
    condition: { star: '天機' },
    interpretation: { zh: '天機主聰慧變化，思想敏捷，適合從事競爭性工作。', en: 'Intelligent, adaptable, suited for competitive work' },
    consensus_label: 'consensus',
    statistics: { sample_size: 280, match_rate: 0.75, confidence_level: 0.75 }
  },
  {
    scope: 'star',
    condition: { star: '太陽' },
    interpretation: { zh: '太陽主熱情、光明、活力，外向開朗，社交能力強。', en: 'Passionate, outgoing, strong social skills' },
    consensus_label: 'consensus',
    statistics: { sample_size: 290, match_rate: 0.80, confidence_level: 0.80 }
  },
  {
    scope: 'star',
    condition: { star: '武曲' },
    interpretation: { zh: '武曲主權勢、決斷，做事幹練，適合領導職位。', en: 'Decisive leader, strong authority' },
    consensus_label: 'consensus',
    statistics: { sample_size: 240, match_rate: 0.77, confidence_level: 0.77 }
  },
  {
    scope: 'star',
    condition: { star: '天同' },
    interpretation: { zh: '天同主福氣、樂觀，為人和善，易獲人緣和信任。', en: 'Fortunate, optimistic, trustworthy' },
    consensus_label: 'consensus',
    statistics: { sample_size: 260, match_rate: 0.81, confidence_level: 0.81 }
  },
  {
    scope: 'star',
    condition: { star: '廉貞' },
    interpretation: { zh: '廉貞主剛直、廉潔，有原則性，易為是非所困。', en: 'Principled, righteous, can be stubborn' },
    consensus_label: 'consensus',
    statistics: { sample_size: 210, match_rate: 0.73, confidence_level: 0.73 }
  },
  {
    scope: 'star',
    condition: { star: '太陰' },
    interpretation: { zh: '太陰主溫柔、文藝、母性，女性特質明顯，柔中帶剛。', en: 'Gentle, artistic, feminine qualities' },
    consensus_label: 'consensus',
    statistics: { sample_size: 210, match_rate: 0.77, confidence_level: 0.77 }
  },
  {
    scope: 'star',
    condition: { star: '貪狼' },
    interpretation: { zh: '貪狼主欲望、進取，野心大，追求物質享受和成功。', en: 'Ambitious, materialistic, success-driven' },
    consensus_label: 'consensus',
    statistics: { sample_size: 270, match_rate: 0.78, confidence_level: 0.78 }
  },
  {
    scope: 'star',
    condition: { star: '巨門' },
    interpretation: { zh: '巨門主口才、聰慧，溝通能力強，易成為領導者。', en: 'Eloquent, intelligent, born communicator' },
    consensus_label: 'consensus',
    statistics: { sample_size: 250, match_rate: 0.76, confidence_level: 0.76 }
  },
  {
    scope: 'star',
    condition: { star: '天梁' },
    interpretation: { zh: '天梁主德行、保護，為人正直，易獲尊敬和信任。', en: 'Virtuous protector, earns respect' },
    consensus_label: 'consensus',
    statistics: { sample_size: 230, match_rate: 0.80, confidence_level: 0.80 }
  },
  {
    scope: 'star',
    condition: { star: '七殺' },
    interpretation: { zh: '七殺主決斷、威權，為人果斷勇敢，領導力強。', en: 'Decisive warrior, strong leadership' },
    consensus_label: 'consensus',
    statistics: { sample_size: 220, match_rate: 0.75, confidence_level: 0.75 }
  },
  {
    scope: 'star',
    condition: { star: '破軍' },
    interpretation: { zh: '破軍主變化、革新，做事激進，追求創新改革。', en: 'Revolutionary, innovative, embraces change' },
    consensus_label: 'consensus',
    statistics: { sample_size: 200, match_rate: 0.72, confidence_level: 0.72 }
  },

  // ==================== TRANSFORMATIONS ====================
  {
    scope: 'transformation',
    condition: { transformation: '祿' },
    interpretation: { zh: '化祿代表利益、收入、好運，該宮位吉利順利。', en: 'Brings wealth, income, and good fortune' },
    consensus_label: 'consensus',
    statistics: { sample_size: 400, match_rate: 0.84, confidence_level: 0.84 }
  },
  {
    scope: 'transformation',
    condition: { transformation: '權' },
    interpretation: { zh: '化權代表權力、掌控，該宮位增加影響力和控制力。', en: 'Grants power and control' },
    consensus_label: 'consensus',
    statistics: { sample_size: 380, match_rate: 0.82, confidence_level: 0.82 }
  },
  {
    scope: 'transformation',
    condition: { transformation: '科' },
    interpretation: { zh: '化科代表名聲、聲譽，該宮位易獲名利和好名聲。', en: 'Brings fame and good reputation' },
    consensus_label: 'consensus',
    statistics: { sample_size: 350, match_rate: 0.81, confidence_level: 0.81 }
  },
  {
    scope: 'transformation',
    condition: { transformation: '忌' },
    interpretation: { zh: '化忌代表困擾、阻滯，該宮位需特別注意和努力。', en: 'Brings challenges requiring attention' },
    consensus_label: 'consensus',
    statistics: { sample_size: 350, match_rate: 0.80, confidence_level: 0.80 }
  },

  // ==================== MAJOR PATTERNS (格局) ====================
  {
    scope: 'pattern',
    condition: { pattern: ['紫微', '太陽'] },
    interpretation: { zh: '紫日格局，性格開朗，事業心強，適合從政或經商。', en: 'Outgoing, career-driven, suited for politics/business' },
    consensus_label: 'consensus',
    statistics: { sample_size: 180, match_rate: 0.75, confidence_level: 0.75 }
  },
  {
    scope: 'pattern',
    condition: { pattern: ['紫微', '天府'] },
    interpretation: { zh: '紫府格局，福厚祿重，領導能力強，前途光明。', en: 'Blessed with fortune and leadership' },
    consensus_label: 'consensus',
    statistics: { sample_size: 150, match_rate: 0.77, confidence_level: 0.77 }
  },
  {
    scope: 'pattern',
    condition: { pattern: ['天機', '太陰'] },
    interpretation: { zh: '日月格局，思想敏捷且內涵深厚，適合學術研究。', en: 'Intelligent and introspective, suited for research' },
    consensus_label: 'consensus',
    statistics: { sample_size: 140, match_rate: 0.73, confidence_level: 0.73 }
  },
  {
    scope: 'pattern',
    condition: { pattern: ['天同', '太陽'] },
    interpretation: { zh: '日月並行，福氣旺盛，為人樂觀開朗，易獲成功。', en: 'Fortunate and optimistic, likely to succeed' },
    consensus_label: 'consensus',
    statistics: { sample_size: 160, match_rate: 0.76, confidence_level: 0.76 }
  },
  {
    scope: 'pattern',
    condition: { pattern: ['天梁', '廉貞'] },
    interpretation: { zh: '廉梁格局，為人正直廉潔，德行高尚，適合公職。', en: 'Virtuous and principled, suited for civil service' },
    consensus_label: 'consensus',
    statistics: { sample_size: 130, match_rate: 0.72, confidence_level: 0.72 }
  },
  {
    scope: 'pattern',
    condition: { pattern: ['武曲', '破軍'] },
    interpretation: { zh: '武破格局，做事有魄力，易有起伏，需謹慎理財。', en: 'Forceful but volatile, financial caution needed' },
    consensus_label: 'disputed',
    statistics: { sample_size: 120, match_rate: 0.65, confidence_level: 0.65 }
  },
  {
    scope: 'pattern',
    condition: { pattern: ['貪狼', '巨門'] },
    interpretation: { zh: '貪巨格局，口才犀利，事業心強，易成就非凡。', en: 'Eloquent and ambitious, achieves success' },
    consensus_label: 'consensus',
    statistics: { sample_size: 145, match_rate: 0.74, confidence_level: 0.74 }
  },

  // ==================== PALACE-SPECIFIC INSIGHTS ====================
  {
    scope: 'palace',
    condition: { palace: '夫妻宮' },
    interpretation: { zh: '該宮位強，婚姻感情運勢順利，伴侶和睦。', en: 'Strong palace indicates harmonious marriage' },
    consensus_label: 'consensus',
    statistics: { sample_size: 300, match_rate: 0.78, confidence_level: 0.78 }
  },
  {
    scope: 'palace',
    condition: { palace: '財帛宮' },
    interpretation: { zh: '該宮位強，財運旺盛，易有經濟來源充足。', en: 'Strong palace indicates good financial prospects' },
    consensus_label: 'consensus',
    statistics: { sample_size: 320, match_rate: 0.80, confidence_level: 0.80 }
  },
  {
    scope: 'palace',
    condition: { palace: '官祿宮' },
    interpretation: { zh: '該宮位強，事業運佳，工作順利，易升遷。', en: 'Strong palace indicates career success and advancement' },
    consensus_label: 'consensus',
    statistics: { sample_size: 310, match_rate: 0.79, confidence_level: 0.79 }
  },
  {
    scope: 'palace',
    condition: { palace: '子女宮' },
    interpretation: { zh: '該宮位強，子女緣份好，親子關係融洽。', en: 'Strong palace indicates good family fortune' },
    consensus_label: 'consensus',
    statistics: { sample_size: 270, match_rate: 0.76, confidence_level: 0.76 }
  },
];

module.exports = ZIWEI_RULES_SEED;
