/**
 * Converts an array of x,y points to a smooth SVG path string using control points 
 * positioned at the midpoint on the X-axis. This creates a beautifully smooth 
 * curve that never overshoots the data points (similar to d3.curveMonotoneX).
 * 
 * @param {Array<{x: number, y: number}>} points - The data points
 * @returns {string} - The SVG Path 'd' string
 */
export const catmullRom2bezier = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  
  let d = `M ${points[0].x},${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Control points are halfway between x1 and x2
    // This creates an extremely smooth curve without any sharp edges or overshooting
    const cp1x = (p1.x + p2.x) / 2;
    const cp1y = p1.y;
    const cp2x = (p1.x + p2.x) / 2;
    const cp2y = p2.y;
    
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  
  return d;
};
