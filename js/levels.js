/**
 * Stage levels definitions for Osho Shutujin
 */
export const LEVELS = [
  {
    id: 'honjin',
    title: '本陣：王将出陣',
    subtitle: '公式クラシック配置',
    difficulty: '★★★★★',
    difficultyLevel: 5,
    minMoves: 81,
    description: 'ハナヤマ「かつのう 王将出陣」の公式初期配置。最深部に鎮座する王将を81手で出陣させよ。',
    pieces: [
      { id: 'ou', name: '王将', w: 2, h: 2, x: 1, y: 3, type: 'king' },
      { id: 'kin-l', name: '金将', w: 1, h: 2, x: 0, y: 3, type: 'v-kin' },
      { id: 'kin-r', name: '金将', w: 1, h: 2, x: 3, y: 3, type: 'v-kin' },
      { id: 'gin', name: '銀将', w: 2, h: 1, x: 1, y: 2, type: 'h-gin' },
      { id: 'kaku', name: '角行', w: 1, h: 2, x: 0, y: 1, type: 'v-kaku' },
      { id: 'hisha', name: '飛車', w: 1, h: 2, x: 3, y: 1, type: 'v-hisha' },
      { id: 'kei', name: '桂馬', w: 1, h: 1, x: 1, y: 1, type: 's-kei' },
      { id: 'kyo', name: '香車', w: 1, h: 1, x: 2, y: 1, type: 's-kyo' },
      { id: 'fu-l', name: '歩兵', w: 1, h: 1, x: 0, y: 0, type: 's-fu' },
      { id: 'fu-r', name: '歩兵', w: 1, h: 1, x: 3, y: 0, type: 's-fu' },
    ]
  },
  {
    id: 'chukyu',
    title: '前哨戦：包囲突破',
    subtitle: '中級編・中盤の実戦',
    difficulty: '★★★☆☆',
    difficultyLevel: 3,
    minMoves: 35,
    description: '王将が中段まで進撃。密集した左右の守りを切り崩し、出陣への突破口を開け。',
    pieces: [
      { id: 'ou', name: '王将', w: 2, h: 2, x: 1, y: 2, type: 'king' },
      { id: 'kin-l', name: '金将', w: 1, h: 2, x: 0, y: 0, type: 'v-kin' },
      { id: 'kin-r', name: '金将', w: 1, h: 2, x: 3, y: 3, type: 'v-kin' },
      { id: 'gin', name: '銀将', w: 2, h: 1, x: 2, y: 0, type: 'h-gin' },
      { id: 'kaku', name: '角行', w: 1, h: 2, x: 0, y: 2, type: 'v-kaku' },
      { id: 'hisha', name: '飛車', w: 1, h: 2, x: 3, y: 1, type: 'v-hisha' },
      { id: 'kei', name: '桂馬', w: 1, h: 1, x: 0, y: 4, type: 's-kei' },
      { id: 'kyo', name: '香車', w: 1, h: 1, x: 1, y: 4, type: 's-kyo' },
      { id: 'fu-l', name: '歩兵', w: 1, h: 1, x: 2, y: 1, type: 's-fu' },
      { id: 'fu-r', name: '歩兵', w: 1, h: 1, x: 2, y: 4, type: 's-fu' },
    ]
  },
  {
    id: 'shojin',
    title: '初陣：出陣の刻',
    subtitle: '初級編・突撃の演習',
    difficulty: '★☆☆☆☆',
    difficultyLevel: 1,
    minMoves: 15,
    description: '王将はすでに城門の眼前！歩兵と銀将を巧みに退かせ、見事に出陣を果たせ。',
    pieces: [
      { id: 'ou', name: '王将', w: 2, h: 2, x: 1, y: 1, type: 'king' },
      { id: 'kin-l', name: '金将', w: 1, h: 2, x: 0, y: 3, type: 'v-kin' },
      { id: 'kin-r', name: '金将', w: 1, h: 2, x: 3, y: 3, type: 'v-kin' },
      { id: 'gin', name: '銀将', w: 2, h: 1, x: 2, y: 0, type: 'h-gin' },
      { id: 'kaku', name: '角行', w: 1, h: 2, x: 1, y: 3, type: 'v-kaku' },
      { id: 'hisha', name: '飛車', w: 1, h: 2, x: 3, y: 1, type: 'v-hisha' },
      { id: 'kei', name: '桂馬', w: 1, h: 1, x: 2, y: 4, type: 's-kei' },
      { id: 'kyo', name: '香車', w: 1, h: 1, x: 2, y: 3, type: 's-kyo' },
      { id: 'fu-l', name: '歩兵', w: 1, h: 1, x: 0, y: 0, type: 's-fu' },
      { id: 'fu-r', name: '歩兵', w: 1, h: 1, x: 1, y: 0, type: 's-fu' },
    ]
  },
  {
    id: 'shingeki',
    title: '激闘：盤上の攻防',
    subtitle: '上級編・55手',
    difficulty: '★★★★☆',
    difficultyLevel: 4,
    minMoves: 55,
    description: '中盤の最大のヤマ場。王将を左右へ巧みに潜り込ませながら出口への道筋を見出せ。',
    pieces: [
      { id: 'ou', name: '王将', w: 2, h: 2, x: 2, y: 3, type: 'king' },
      { id: 'kin-l', name: '金将', w: 1, h: 2, x: 0, y: 3, type: 'v-kin' },
      { id: 'kin-r', name: '金将', w: 1, h: 2, x: 3, y: 1, type: 'v-kin' },
      { id: 'gin', name: '銀将', w: 2, h: 1, x: 0, y: 0, type: 'h-gin' },
      { id: 'kaku', name: '角行', w: 1, h: 2, x: 1, y: 1, type: 'v-kaku' },
      { id: 'hisha', name: '飛車', w: 1, h: 2, x: 2, y: 1, type: 'v-hisha' },
      { id: 'kei', name: '桂馬', w: 1, h: 1, x: 2, y: 0, type: 's-kei' },
      { id: 'kyo', name: '香車', w: 1, h: 1, x: 0, y: 1, type: 's-kyo' },
      { id: 'fu-l', name: '歩兵', w: 1, h: 1, x: 3, y: 0, type: 's-fu' },
      { id: 'fu-r', name: '歩兵', w: 1, h: 1, x: 0, y: 2, type: 's-fu' },
    ]
  }
];
