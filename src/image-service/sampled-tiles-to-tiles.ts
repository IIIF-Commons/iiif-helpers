import { ImageTile } from '@iiif/parser/presentation-3/types';

export function sampledTilesToTiles(width: number, height: number, sampledTiles: ImageTile[]): ImageTile[] {
  const maxDim = width > height ? width : height;
  const len = sampledTiles.length;
  const newTiles: ImageTile[] = [];

  for (let i = 0; i < len; i++) {
    const tile = sampledTiles[i];
    if (!tile) continue;
    if (tile.scaleFactors.length === 0) continue;

    let lastSize = tile.scaleFactors[0];
    if (!lastSize) continue;

    let curWidth = maxDim / lastSize;
    const scaleFactors = [lastSize];
    while (curWidth >= tile.width) {
      lastSize = lastSize * 2;
      scaleFactors.push(lastSize);
      curWidth = curWidth / 2;
    }

    newTiles.push({
      ...tile,
      scaleFactors,
    });
  }

  return newTiles;
}
