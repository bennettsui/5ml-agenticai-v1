/**
 * Ziwei Doushu - Transformations & Auxiliary Stars Knowledge Base
 * Four Transformations (四化) and Beneficial/Malefic Stars
 */

const transformations = [
  {
    id: 'luhua',
    number: 1,
    chinese: '祿化',
    pinyin: 'Lu Hua',
    english: 'Wealth Transformation',
    meaning: 'Represents acquisition and satisfaction of desires through external resources',
    character_meaning: '祿 (Lu) originally meant the salary of an ancient Chinese official - livelihood',
    effects: 'Softens and refines star characteristics; leads to optimistic outcomes; brings material abundance',
    positive_effects: ['Wealth accumulation', 'Income increase', 'Resource acquisition', 'Desire fulfillment', 'Material satisfaction'],
    negative_effects: ['Excessive desire for material goods', 'Superficial satisfaction', 'Dependence on external resources'],
    best_with: ['Material system stars (Ziwei, Wuqu, Qisha, Pojun)', 'Spiritual system stars (Tiantong, Taiyin)'],
    interpretation: 'When a star undergoes Lu Transformation, it gains the ability to accumulate, prosper, and manifest physical results. Luck flows easily and resources come without excessive effort. The native enjoys abundance and finds satisfaction through material means.'
  },
  {
    id: 'quanhua',
    number: 2,
    chinese: '權化',
    pinyin: 'Quan Hua',
    english: 'Power Transformation',
    meaning: 'Represents authority, control, and decision-making power over what is obtained',
    character_meaning: '權 (Quan) means authority, power, control, and decision-making ability',
    effects: 'Enhances star influence and power; increases control and authority; strengthens ability to manifest characteristics',
    positive_effects: ['Leadership enhancement', 'Authoritative decision-making', 'Increased influence', 'Empowerment', 'Stronger manifestation'],
    negative_effects: ['With benevolent stars: easier achievement', 'With malefic stars: may require more support or bring difficulty'],
    best_with: ['Most major stars', 'Works best when star needs support to manifest fully'],
    interpretation: 'When a star undergoes Quan Transformation, it gains authority and control. The native takes charge of circumstances and decides their own fate. Previously obtained resources are now managed with control and wisdom. Power and influence expand naturally.'
  },
  {
    id: 'kehua',
    number: 3,
    chinese: '科化',
    pinyin: 'Ke Hua',
    english: 'Distinction Transformation',
    meaning: 'Represents manifestation, visible achievement, and recognition through competence',
    character_meaning: '科 (Ke) originally referred to a diploma or certificate of achievement - recognition and distinction',
    effects: 'Brings recognition and fame; manifests competence visibly; increases reputation and honor; brings academic or professional distinction',
    positive_effects: ['Academic achievement recognition', 'Professional distinction', 'Reputation building', 'Fame and honor', 'Merit recognition'],
    negative_effects: ['With malefic stars: notoriety and negative fame', 'Unwanted recognition', 'Public scandal or dishonor'],
    best_with: ['Scholarly and professional stars', 'Works well with any star for visible recognition'],
    interpretation: 'When a star undergoes Ke Transformation, its qualities become visible and recognized by others. Competence and achievements are acknowledged. The native gains reputation and honor through merit. Good name and distinction follow naturally.'
  },
  {
    id: 'jihua',
    number: 4,
    chinese: '忌化',
    pinyin: 'Ji Hua',
    english: 'Obstacle Transformation',
    meaning: 'Represents obstacles, voids, and inner deficiencies that drive seeking and improvement',
    character_meaning: '忌 (Ji) means obstacle, annoyance, impediment - challenges and troubles',
    effects: 'Creates obstacles and challenges; represents inner voids; brings difficulties; motivates seeking fulfillment',
    positive_effects: ['Motivation for achievement', 'Driving ambition', 'Obstacle overcoming builds character', 'Pushes for improvement'],
    negative_effects: ['Blocks manifestation of star qualities', 'Creates obstacles in palace matters', 'Brings bad luck and complications', 'Losing what you have not yet possessed'],
    best_with: ['Most damaging transformation star', 'Disrupts connection between native and subject matter'],
    interpretation: 'When a star undergoes Ji Transformation, it becomes blocked or restricted. Inner void and dissatisfaction emerge. The native feels unfulfilled and driven to seek. Obstacles appear in manifesting the star\'s qualities. This transformation motivates action but creates challenges.'
  }
];

const beneficStars = [
  {
    id: 'zuofu',
    chinese: '左輔',
    english: 'Zuofu / Left Benefactor',
    meaning: 'Assistance with parental perspective',
    character_meaning: '左 (Left) + 輔 (Assist) - Left-side assistance',
    nature: 'Beneficial auxiliary star',
    characteristic: 'Offers help as soon as need is recognized; assistance from higher or parental position; active and immediate support',
    benefits: ['Immediate assistance when needed', 'Support from authority figures', 'Parental-like guidance'],
    best_with: ['All major stars', 'Enhances manifestation'],
    house_benefits: ['Any palace benefits from Zuofu presence'],
    interpretation: 'This star brings proactive assistance and support. Help comes readily when challenges appear. The native enjoys backing from superiors and benefactors. Zuofu ensures that resources and support are available when needed.'
  },
  {
    id: 'youbi',
    chinese: '右弼',
    english: 'Youbi / Right Benefactor',
    meaning: 'Gentle and subtle assistance',
    character_meaning: '右 (Right) + 弼 (Assist) - Right-side assistance',
    nature: 'Beneficial auxiliary star',
    characteristic: 'More gentle than Zuofu; assistance often goes unnoticed; earns title of female benefactor; kind, considerate, empathetic',
    benefits: ['Subtle but continuous support', 'Kind and considerate help', 'Gentle guidance', 'Empathetic assistance'],
    best_with: ['All major stars', 'Works particularly well with softer stars'],
    house_benefits: ['Any palace benefits from Youbi presence'],
    interpretation: 'This star brings gentle, quiet support. Help arrives subtly and often goes unrecognized. The native finds allies and supporters everywhere. Youbi represents kindness in the universe working on behalf of the native.'
  },
  {
    id: 'tiankui',
    chinese: '天魁',
    english: 'Tiankui / Heavenly Noble',
    meaning: 'Noble assistance and leadership aura',
    character_meaning: '天 (Heavenly) + 魁 (Chief/Leader) - Heavenly leader',
    nature: 'Beneficial auxiliary star',
    characteristic: 'Known as male benefactor; exudes leadership aura; help comes from recognition of need; higher-level support',
    benefits: ['Heavenly luck and blessings', 'Noble assistance from high places', 'Leadership recognition', 'Exalted support'],
    best_with: ['Leadership and authority stars', 'Enhances prestige'],
    house_benefits: ['Career, authority, reputation palaces benefit most'],
    interpretation: 'This star brings noble and heavenly assistance. Help comes from high places and exalted sources. The native is favored by the heavens and enjoys blessings from above. Recognition and honor follow naturally.'
  },
  {
    id: 'tianyue',
    chinese: '天鉞',
    english: 'Tianyue / Heavenly Ax',
    meaning: 'Assistance requiring active seeking',
    character_meaning: '天 (Heavenly) + 鉞 (Ax/Weapon) - Heavenly power tool',
    nature: 'Beneficial auxiliary star',
    characteristic: 'Help not automatic; must actively seek assistance; requires initiative from native; sword cuts through obstacles',
    benefits: ['Problem-solving ability', 'Cutting through obstacles', 'Tools and resources available', 'Active support when sought'],
    best_with: ['Action-oriented stars', 'Initiative and courage'],
    house_benefits: ['Career, finance, and action-oriented palaces benefit most'],
    interpretation: 'This star brings assistance that requires active seeking. Resources and help are available but must be pursued. The native must take initiative to access support. Tianyue cuts through obstacles and clears the path forward.'
  }
];

const maleficStars = [
  {
    id: 'huoxing',
    chinese: '火星',
    english: 'Huo Xing / Fire Star',
    meaning: 'Brings impacts and sudden changes',
    character_meaning: '火 (Fire) + 星 (Star) - Fire star',
    nature: 'Malefic auxiliary star',
    characteristic: 'Increases twists and turns in life; brings variability and unexpected difficulties; hot and explosive nature',
    effects: ['Obstacles and setbacks', 'Unexpected troubles', 'Sudden changes', 'Variable outcomes', 'Instability'],
    combinations: ['Combined with beneficial stars: mitigated effect', 'Combined with malefic stars: compounded problems'],
    house_damage: ['Any palace is disrupted by Fire Star presence'],
    interpretation: 'This star brings fiery obstacles and sudden disruptions. Plans are derailed by unexpected circumstances. The native faces unpredictable challenges that test resilience. Fire Star brings heat and turbulence to any palace.'
  },
  {
    id: 'lingxing',
    chinese: '鈴星',
    english: 'Ling Xing / Sting Star',
    meaning: 'Brings obstacles and disturbances',
    character_meaning: '鈴 (Bell/Sting) + 星 (Star) - Stinging bell',
    nature: 'Malefic auxiliary star',
    characteristic: 'Similar to Fire Star; increases twists and turns; brings pain and sting; creates disturbances and discord',
    effects: ['Obstacles and setbacks', 'Painful experiences', 'Disturbing influences', 'Disruptive changes', 'Complications'],
    combinations: ['Generally negative regardless of combination', 'Severity depends on palace and other stars'],
    house_damage: ['Any palace is compromised by Ling Star presence'],
    interpretation: 'This star brings stinging pain and disturbances. What seems smooth becomes complicated. The native experiences setbacks and painful learnings. Ling Star represents the sting of consequences and reality checks.'
  },
  {
    id: 'qiangyang',
    chinese: '羊刃',
    english: 'Qiangyang / Blade',
    meaning: 'Represents conflicts and disputes',
    character_meaning: '羊 (Sheep/Ram) + 刃 (Blade) - Cutting blade',
    nature: 'Malefic auxiliary star',
    characteristic: 'Brings quarrels and conflicts; sharp nature causes wounds; creates discord and fighting; cutting and separation',
    effects: ['Quarrels and arguments', 'Conflicts and disputes', 'Sharp-tongued communications', 'Cutting remarks and wounds', 'Separation and division'],
    combinations: ['Exacerbates conflict-prone palaces', 'Can indicate relationship breakdown'],
    house_damage: ['Relationship palaces (Spouse, Friends) suffer most'],
    interpretation: 'This star brings sharp words and cutting conflicts. Harmony is disrupted by arguments and disputes. The native faces quarrels and must defend their position. Blade represents the wounding power of sharp words and sharp actions.'
  },
  {
    id: 'tuoluo',
    chinese: '陀羅',
    english: 'Tuoluo / Spinning',
    meaning: 'Represents obstacles and entanglement',
    character_meaning: '陀 (Spinning) + 羅 (Net/Trap) - Spinning net/trap',
    nature: 'Malefic auxiliary star',
    characteristic: 'Creates entanglement and complications; blocks progress with spinning obstruction; traps and binding',
    effects: ['Entanglement and complications', 'Progress blocked', 'Spiraling problems', 'Trapped situations', 'Binding commitments'],
    combinations: ['Typically negative effect', 'Can indicate karmic entanglement'],
    house_damage: ['Creates stagnation in any palace it touches'],
    interpretation: 'This star brings entanglement and binding situations. Progress is blocked by spinning complications. The native feels trapped and caught. Tuoluo represents the spiraling problems that keep one stuck and unable to move forward.'
  }
];

module.exports = {
  transformations,
  beneficStars,
  maleficStars
};
