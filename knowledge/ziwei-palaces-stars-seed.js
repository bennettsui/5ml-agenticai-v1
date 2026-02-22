/**
 * Ziwei Doushu - Palace & Star Knowledge Base Seed
 * Compiled from credible sources and traditional texts
 *
 * This data provides comprehensive meanings for:
 * - 12 Palaces (十二宮)
 * - 14 Primary Stars (十四主星)
 * - Palace-specific star interpretations
 */

const palaces = [
  {
    id: 'ming',
    number: 1,
    chinese: '命宮',
    english: 'Life Palace',
    meaning: 'Center of birth chart, representing overall fate and personality',
    governs: ['Personality traits', 'Abilities and talents', 'Temperament', 'Physical appearance', 'Life direction'],
    positive_indicators: 'Natural leadership, positive mindset, strong character, good health, successful life trajectory',
    negative_indicators: 'Obstacles in life direction, lack of confidence, health concerns'
  },
  {
    id: 'xiongdi',
    number: 2,
    chinese: '兄弟宮',
    english: 'Siblings Palace',
    meaning: 'Relationships with siblings and broader peer connections',
    governs: ['Sibling relationships', 'Friendships', 'Colleague relationships', 'Support from peers'],
    positive_indicators: 'Harmonious family relationships, strong social network, trustworthy companions',
    negative_indicators: 'Conflict with siblings, betrayal by friends, isolation'
  },
  {
    id: 'fuqi',
    number: 3,
    chinese: '夫妻宮',
    english: 'Spouse Palace',
    meaning: 'Marriage, romantic relationships, and spousal connections',
    governs: ['Marriage status', 'Spouse personality', 'Romantic relationships', 'Relationship harmony', 'Love prospects'],
    positive_indicators: 'Good spousal luck, harmonious marriage, supportive spouse, romantic fulfillment',
    negative_indicators: 'Marriage difficulties, divorce risk, spousal conflict'
  },
  {
    id: 'zinv',
    number: 4,
    chinese: '子女宮',
    english: 'Children Palace',
    meaning: 'Relationship with children and family lineage',
    governs: ['Children and fertility', 'Parenting style', 'Child-rearing', 'Family lineage'],
    positive_indicators: 'Good fertility, harmonious parent-child relationships, successful children',
    negative_indicators: 'Fertility issues, difficult parenting, strained relationships'
  },
  {
    id: 'caibao',
    number: 5,
    chinese: '財帛宮',
    english: 'Wealth Palace',
    meaning: 'Financial fortune, wealth accumulation, and management',
    governs: ['Financial status', 'Wealth accumulation', 'Income sources', 'Investment fortune', 'Business opportunities'],
    positive_indicators: 'Abundant income, financial stability, successful ventures, wealth accumulation',
    negative_indicators: 'Financial difficulties, poor management, loss of wealth'
  },
  {
    id: 'jieya',
    number: 6,
    chinese: '疾厄宮',
    english: 'Health Palace',
    meaning: 'Physical health, longevity, and bodily conditions',
    governs: ['Physical health', 'Disease susceptibility', 'Longevity', 'Health conditions'],
    positive_indicators: 'Good health, strong constitution, quick recovery, disease resistance',
    negative_indicators: 'Chronic illnesses, weak constitution, slow recovery'
  },
  {
    id: 'qianyi',
    number: 7,
    chinese: '遷移宮',
    english: 'Travel Palace',
    meaning: 'How others perceive you and external presentation',
    governs: ['External image', 'Social perception', 'Travel fortune', 'Migration and relocation'],
    positive_indicators: 'Good reputation, positive perception, successful travel and relocation',
    negative_indicators: 'Poor reputation, negative perception, travel difficulties'
  },
  {
    id: 'puyi',
    number: 8,
    chinese: '僕役宮',
    english: 'Friends Palace',
    meaning: 'Relationships with peers, subordinates, and colleagues',
    governs: ['Peer relationships', 'Colleague interactions', 'Employee relationships', 'Business partnerships'],
    positive_indicators: 'Good peer relationships, loyal employees, trustworthy partners',
    negative_indicators: 'Colleague conflicts, betrayal, difficult partnerships'
  },
  {
    id: 'guanlu',
    number: 9,
    chinese: '官祿宮',
    english: 'Career Palace',
    meaning: 'Career path, work circumstances, and professional development',
    governs: ['Career choice', 'Work attitude', 'Entrepreneurial potential', 'Career advancement', 'Relationships with superiors'],
    positive_indicators: 'Successful career, good job prospects, career advancement, professional achievement',
    negative_indicators: 'Career obstacles, job loss risk, lack of advancement'
  },
  {
    id: 'tianzhai',
    number: 10,
    chinese: '田宅宮',
    english: 'Property Palace',
    meaning: 'Home, property, real estate, and family environment',
    governs: ['Real estate', 'Home environment', 'Living conditions', 'Property ownership', 'Family relationships at home'],
    positive_indicators: 'Good property fortune, comfortable home, real estate success',
    negative_indicators: 'Property difficulties, poor home conditions, real estate losses'
  },
  {
    id: 'fude',
    number: 11,
    chinese: '福德宮',
    english: 'Blessings Palace',
    meaning: 'Mental state, happiness, and spiritual well-being',
    governs: ['Mental health', 'Happiness', 'Life satisfaction', 'Spiritual well-being', 'Quality of life'],
    positive_indicators: 'Good mental health, happiness and contentment, positive outlook',
    negative_indicators: 'Mental distress, unhappiness, dissatisfaction, depression'
  },
  {
    id: 'fuqin',
    number: 12,
    chinese: '父母宮',
    english: 'Parents Palace',
    meaning: 'Relationship with parents and inherited traits',
    governs: ['Parental relationships', 'Parent health and fortune', 'Inheritance', 'Family legacy'],
    positive_indicators: 'Good parental relationships, parent prosperity, positive inheritance',
    negative_indicators: 'Strained relationships, parent misfortune, inheritance problems'
  }
];

const stars = [
  {
    id: 'ziwei',
    number: 1,
    chinese: '紫微',
    english: 'Ziwei / Purple Emperor',
    meaning: 'Purple Forbidden Star - Leadership, nobility, authority',
    element: 'Yin Earth',
    archetype: 'The Emperor, Leader, Organizer, Monarch',
    general_nature: 'Leadership, authority, nobility, stability, wisdom, organizational ability',
    key_traits: ['Natural leader', 'Stable personality', 'Wisdom', 'Organizational skills', 'Wealth accumulation'],
    palace_meanings: {
      'ming': { positive: 'Natural leader, strong personality, steady progress, respected position', negative: 'Overly authoritarian, difficult cooperation' },
      'fuqi': { positive: 'Respectable spouse, stable partnership, wealthy marriage', negative: 'Dominant in marriage, spousal oppression' },
      'guanlu': { positive: 'Excellent career prospects, leadership position, career advancement', negative: 'Career pressure, unrealistic expectations' },
      'caibao': { positive: 'Wealth accumulation, good financial status, abundant resources', negative: 'Excessive spending on dignity' }
    }
  },
  {
    id: 'tianji',
    number: 2,
    chinese: '天機',
    english: 'Tianji / Heavenly Secret',
    meaning: 'Smart Star - Intelligence, strategy, adaptability',
    element: 'Yin Wood',
    archetype: 'The Strategist, Assistant, Advisor, Clever Operator',
    general_nature: 'Intelligence, strategy, planning, cleverness, adaptability, quick thinking',
    key_traits: ['Strategic thinker', 'Intelligent and clever', 'Adaptable', 'Problem solver', 'Multiple talents'],
    palace_meanings: {
      'ming': { positive: 'Intelligent, strategic mind, clever problem-solver, resourceful', negative: 'Overthinking, scheming nature, restlessness' },
      'guanlu': { positive: 'Strategic career planning, good adaptability, intellectual work success', negative: 'Career instability, difficulty with commitment' },
      'caibao': { positive: 'Clever financial strategies, good wealth planning, multiple incomes', negative: 'Overly complex planning, financial restlessness' }
    }
  },
  {
    id: 'taiyang',
    number: 3,
    chinese: '太陽',
    english: 'Taiyang / Sun',
    meaning: 'Sun Star - Leadership, masculinity, visionary',
    element: 'Yang Fire',
    archetype: 'The Sun, Leader, Masculine Force, Father-Husband-Son',
    general_nature: 'Leadership, directness, visionary thinking, self-sacrifice, universal love, generosity, warmth',
    key_traits: ['Natural leader', 'Direct and forthright', 'Visionary idealist', 'Generous and selfless', 'Warm personality', 'Famous'],
    palace_meanings: {
      'ming': { positive: 'Natural leader, direct personality, warm character, visionary, famous', negative: 'Too direct, idealistic naivety, overconfident' },
      'guanlu': { positive: 'Excellent career prospects, leadership, visionary work, generous boss', negative: 'Career visibility attracts criticism, idealistic failures' },
      'caibao': { positive: 'Generous with money, idealistic financial goals, good income through fame', negative: 'Over-generous spending, idealistic losses' }
    }
  },
  {
    id: 'wuqu',
    number: 4,
    chinese: '武曲',
    english: 'Wuqu / Finance Star',
    meaning: 'Finance Star - Wealth, discipline, financial expertise',
    element: 'Yin Metal',
    archetype: 'The Merchant, Businessman, Worker, Financial Expert',
    general_nature: 'Financial acumen, wealth accumulation, discipline, decisiveness, inner strength, diligent work',
    key_traits: ['Financial expert', 'Wealth focused', 'Disciplined and cautious', 'Hard worker', 'Decisive', 'Practical'],
    palace_meanings: {
      'ming': { positive: 'Financial acumen, disciplined, wealth accumulation ability, hard-working', negative: 'Too focused on money, rigid, lonely' },
      'caibao': { positive: 'Excellent financial status, wealth accumulation, good management, stable income', negative: 'Difficult wealth despite effort, work-hard-earn-little' },
      'guanlu': { positive: 'Excellent in finance roles, disciplined work ethic, reliable professional', negative: 'Career boredom, difficulty with creativity' }
    }
  },
  {
    id: 'tiantong',
    number: 5,
    chinese: '天同',
    english: 'Tiantong / Caring Star',
    meaning: 'Caring Star - Kindness, benevolence, optimism',
    element: 'Yang Water',
    archetype: 'The Caretaker, Gentle Soul, Junior, Nurturing Figure',
    general_nature: 'Kindness, gentleness, benevolence, optimism, easygoingness, pleasure-seeking, good fortune',
    key_traits: ['Naturally kind', 'Gentle and caring', 'Optimistic', 'Easygoing', 'Pleasure-loving', 'Lucky', 'Lazy tendencies'],
    palace_meanings: {
      'ming': { positive: 'Optimistic, kind, gentle, easygoing, good fortune, content', negative: 'Lazy, lacks ambition, procrastinating' },
      'fuqi': { positive: 'Gentle and caring spouse, easygoing marriage, pleasurable partnership', negative: 'Too easygoing, lacks passion, lazy' },
      'caibao': { positive: 'Good financial fortune, pleasant spending, wealth through luck', negative: 'Lazy management, overspending, lack of discipline' }
    }
  },
  {
    id: 'lianzhen',
    number: 6,
    chinese: '廉貞',
    english: 'Lianzhen / Upright Star',
    meaning: 'Upright Star - Integrity, justice, passion',
    element: 'Yin Fire',
    archetype: 'The Judge, Virgin, Lawyer, Strict Enforcer, Passionate Soul',
    general_nature: 'Strictness, integrity, passion, judgment, justice, double-facedness, sensuality',
    key_traits: ['Strict and upright', 'Passionate nature', 'Judicial mind', 'Double-faced', 'Passionate about justice', 'Sensual', 'Humorous'],
    palace_meanings: {
      'ming': { positive: 'Upright, integrity-focused, passionate about justice, witty', negative: 'Too strict, double-faced, passionate conflicts' },
      'fuqi': { positive: 'Passionate marriage, intense emotional connection, just partnership', negative: 'Passionate arguments, double-faced confusion' },
      'guanlu': { positive: 'Excellent in legal/justice careers, strict standards, passionate work', negative: 'Career punishment, passionate conflicts' }
    }
  },
  {
    id: 'tianfu',
    number: 7,
    chinese: '天府',
    english: 'Tianfu / Treasury Star',
    meaning: 'Treasury Star - Wealth, stability, benevolence',
    element: 'Yang Earth',
    archetype: 'The Treasurer, Senior Official, Beneficent Master, Stabilizer',
    general_nature: 'Wealth and prosperity, stability, benevolence, generosity, official position, leadership',
    key_traits: ['Wealth accumulation', 'Stable nature', 'Benevolent leader', 'Conservative', 'Strong backing', 'Reliable foundation'],
    palace_meanings: {
      'ming': { positive: 'Excellent wealth fortune, stable, benevolent, strong foundation, dignified', negative: 'Too conservative, overly cautious, rigid' },
      'caibao': { positive: 'Excellent wealth fortune, stable foundation, generous resources, good property wealth', negative: 'Conservative means only, difficulty with speculation' },
      'guanlu': { positive: 'Excellent career prospects, stable position, benevolent superior, wealthy career', negative: 'Limited by conservative approach, stuck in positions' }
    }
  },
  {
    id: 'taiyin',
    number: 8,
    chinese: '太陰',
    english: 'Taiyin / Moon Star',
    meaning: 'Moon Star - Femininity, intuition, receptivity',
    element: 'Yin Water',
    archetype: 'The Mother, Feminine Leader, Intuitive Soul, Nurturer',
    general_nature: 'Femininity, intuition, receptivity, passive development, introspection, domestic focus, emotional depth',
    key_traits: ['Intuitive nature', 'Feminine sensibility', 'Emotional depth', 'Nurturing instinct', 'Receptive', 'Domestic oriented', 'Artistic'],
    palace_meanings: {
      'ming': { positive: 'Intuitive, gentle feminine energy, emotional depth, receptive, artistic, good with women', negative: 'Too passive, emotional vulnerability, selfish' },
      'caibao': { positive: 'Good wealth fortune, especially real estate, passive income, artistic ventures', negative: 'Passive accumulation, selfish spending, extravagant' },
      'tianzhai': { positive: 'Excellent real estate fortune, good home, intuitive design, property wealth', negative: 'Selfish home, extravagant spending, emotional complications' }
    }
  },
  {
    id: 'tanlang',
    number: 9,
    chinese: '貪狼',
    english: 'Tanlang / Greedy Wolf',
    meaning: 'Greedy Wolf Star - Desire, peach blossom, curiosity',
    element: 'Yang Wood and Yin Water',
    archetype: 'The Hunter, Extravagant, Flirt, Risk-Taker, Seeker',
    general_nature: 'Desire and appetite, peach blossom luck, communication skills, curiosity, extravagance, libido, risk-taking',
    key_traits: ['Desire-driven', 'Excellent communicator', 'Peach blossom luck', 'Risk-taker', 'Extravagant', 'Charming', 'Curious', 'Sensual'],
    palace_meanings: {
      'ming': { positive: 'Excellent communication, charming, curious, peach blossom luck, popular', negative: 'Greedy, risk-taking, sensual indulgence, impulsive' },
      'fuqi': { positive: 'Excellent marriage charm, strong desire in love, peach blossom, passionate romantic', negative: 'Multiple partners, infidelity risk, sensual temptations' },
      'caibao': { positive: 'Multiple income sources, good communication, desire-driven wealth, speculative gains', negative: 'Greedy losses, extravagant spending, speculative failures' }
    }
  },
  {
    id: 'jumen',
    number: 10,
    chinese: '巨門',
    english: 'Jumen / Gloomy Star',
    meaning: 'Gloomy Star - Eloquence, honesty, complexity',
    element: 'Yin Water',
    archetype: 'The Lawyer, Parliamentarian, Singer, Debater, Truth-Speaker',
    general_nature: 'Eloquence and communication, frankness, duality, betrayal potential, quarrels, notoriety, secrets',
    key_traits: ['Excellent communicator', 'Eloquent speaker', 'Frank and honest', 'Debater nature', 'Negative reputation risk', 'Betrayal risk', 'Quarrelsome'],
    palace_meanings: {
      'ming': { positive: 'Excellent communication, frank and honest, eloquent speaker, powerful voice', negative: 'Gloomy outlook, negative reputation, frank too much, quarrelsome' },
      'fuqi': { positive: 'Excellent marriage communication, frank partnership, good verbal intimacy', negative: 'Marriage quarrels, spousal betrayal, communication conflicts' },
      'guanlu': { positive: 'Excellent career communication, eloquent professional, good in legal/debate careers', negative: 'Career quarrels, workplace betrayal, negative reputation' }
    }
  },
  {
    id: 'tianxiang',
    number: 11,
    chinese: '天相',
    english: 'Tianxiang / Minister Star',
    meaning: 'Minister Star - Support, assistance, appearance',
    element: 'Yang Water',
    archetype: 'The Minister, Assistant, Delegate, Supporter, Benefactor',
    general_nature: 'Support and assistance, high official position, benevolence, stability, loyalty, appearance, inheritance',
    key_traits: ['Supportive nature', 'Benevolent helper', 'Official position', 'Good appearance', 'Loyal supporter', 'Inheritance blessed', 'Stable'],
    palace_meanings: {
      'ming': { positive: 'Supportive and helpful, benevolent, good appearance, stable, loyal, inherited fortune', negative: 'Too supportive, lacking initiative, over-loyal' },
      'guanlu': { positive: 'Good career support, benevolent superiors, stable position, inherited position, loyal', negative: 'Career dependent on support, lacking achievement, stable but stagnant' },
      'tianzhai': { positive: 'Good property fortune, benevolent help, inherited property, stable home', negative: 'Property dependent on support, inherited limitations' }
    }
  },
  {
    id: 'tianliang',
    number: 12,
    chinese: '天梁',
    english: 'Tianliang / Blessing Star',
    meaning: 'Blessing Star - Education, wisdom, protection',
    element: 'Yang Earth and Yang Wood',
    archetype: 'The Teacher, Scholar, Wise Counselor, Protector, Guide',
    general_nature: 'Education and wisdom, stability and support, benevolence, tolerance, forgiveness, scholarly, guidance',
    key_traits: ['Scholarly wisdom', 'Teacher/mentor nature', 'Benevolent protector', 'Tolerant and forgiving', 'Stable foundation', 'Guidance ability', 'Longevity blessed'],
    palace_meanings: {
      'ming': { positive: 'Wisdom and scholarship, good education, benevolent, tolerant, protective, stable, longevity', negative: 'Overly academic, rigid morals, tolerant to point of enabling' },
      'guanlu': { positive: 'Excellent in education/mentoring, wise counsel, protective supervisor, stable, scholarly', negative: 'Rigid career path, overly protective management, academic limitations' },
      'tianzhai': { positive: 'Good property fortune, benevolent home, stable real estate, protective, longevity', negative: 'Rigid standards, overly protective environment, stagnant' }
    }
  },
  {
    id: 'qisha',
    number: 13,
    chinese: '七殺',
    english: 'Qisha / Power Star',
    meaning: 'Power Star - Authority, challenges, courage',
    element: 'Yin Metal and Yang Fire',
    archetype: 'The Military Leader, Warrior, Executive, Risk-Taker, Challenger',
    general_nature: 'Power and authority, challenges and obstacles, courage and resilience, direct action, conflict, heroism',
    key_traits: ['Powerful and commanding', 'Courageous warrior', 'Obstacle overcomer', 'Ambitious', 'Quick tempered', 'Direct and forceful', 'Risk-taker'],
    palace_meanings: {
      'ming': { positive: 'Strong and powerful, courageous, ambitious, obstacle overcoming, resilient, commanding', negative: 'Aggressive, quick-tempered, stubborn, difficult cooperation' },
      'guanlu': { positive: 'Excellent career advancement, powerful executive, courageous professional, ambitious growth', negative: 'Career conflicts, aggressive behavior, risk-taking failures' },
      'caibao': { positive: 'Ambitious wealth building, powerful income, courageous financial risk, speculative gains', negative: 'Aggressive financial behavior, risky investments, financial losses' }
    }
  },
  {
    id: 'pojun',
    number: 14,
    chinese: '破軍',
    english: 'Pojun / Destruction Star',
    meaning: 'Destruction Star - Transformation, disruption, change',
    element: 'Yin Water',
    archetype: 'The Disruptor, Transformer, Betrayer, Restless Seeker, Revolutionary',
    general_nature: 'Transformation and change, disruption of old patterns, destruction and rebuilding, betrayal, loss and gain',
    key_traits: ['Transformative force', 'Change bringer', 'Disruptive energy', 'Restless nature', 'Betrayal risk', 'Revolutionary thinker', 'Loss and rebirth'],
    palace_meanings: {
      'ming': { positive: 'Transformative personality, innovative thinking, adaptable, revolutionary, personal growth', negative: 'Destructive tendencies, constant restlessness, betrayal-prone, chaotic' },
      'guanlu': { positive: 'Career innovation, entrepreneurial disruption, adaptable professional', negative: 'Destructive moves, job losses, career disruption, betrayal' },
      'caibao': { positive: 'Transforming wealth through innovation, cycles of loss/gain, entrepreneurial disruption', negative: 'Destructive spending, financial ruin, constantly disrupted' }
    }
  }
];

module.exports = {
  palaces,
  stars
};
