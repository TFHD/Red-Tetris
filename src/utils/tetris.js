export const PIECES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
};

export const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  0: 'transparent',
};

/**
 * Générateur de pièces Tetris (LCG) basé sur une seed
 * Permet aux deux joueurs d'avoir les mêmes pièces dans le même ordre
 */
export function createPieceGenerator(seed) {
  let current = seed || Date.now();
  const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  return function() {
    // Linear Congruential Generator (LCG)
    // En gros c'est un algo qui génère des nombres aléatoires basé sur une seed
    // nouveau_nombre = (ancien_nombre * a + c) mod m
    // a, c et m sont des constantes (c'est des magics numbers, c'est les constantes officielles de l'algo)
    // m est le modulo 0x7fffffff = INT_MAX
    // a = 1103515245
    // c = 12345
    // m = 0x7fffffff
    current = (current * 1103515245 + 12345) & 0x7fffffff;
    return pieces[current % 7];
  };
}

/**
 * Calcule le score basé sur le nombre de lignes
 */
export function calculateScore(lines) {
  const scoreTable = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };
  return scoreTable[lines] || 0;
}

