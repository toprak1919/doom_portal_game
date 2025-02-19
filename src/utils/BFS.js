// src/utils/BFS.js

export function bfsPathfinding(grid, start, end) {
  // grid: 2D array, 0 = walkable, 1 = wall
  // start, end: {x, y} in grid coordinates
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Array(rows).fill(null).map(() => new Array(cols).fill(false));
  const queue = [];
  const prev = {}; // to reconstruct path

  function key(x, y) { return `${x},${y}`; }

  queue.push(start);
  visited[start.y][start.x] = true;
  prev[key(start.x, start.y)] = null;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === end.x && current.y === end.y) {
      break; // found
    }
    for (const dir of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = current.x + dir[0];
      const ny = current.y + dir[1];
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        if (!visited[ny][nx] && grid[ny][nx] === 0) {
          visited[ny][nx] = true;
          queue.push({x:nx, y:ny});
          prev[key(nx,ny)] = current;
        }
      }
    }
  }

  // Reconstruct path
  const path = [];
  let currKey = key(end.x, end.y);
  if (!prev[currKey]) {
    // No path
    return path;
  }
  while (currKey !== null) {
    const [xx, yy] = currKey.split(',').map(Number);
    path.push({ x: xx, y: yy });
    currKey = prev[currKey] ? key(prev[currKey].x, prev[currKey].y) : null;
  }
  return path.reverse(); 
} 