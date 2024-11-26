self.onmessage = (event) => {
  const { shapes, mousePos, windowWidth, windowHeight } = event.data;

  const updatedShapes = shapes.map(({ x, y, vx, vy, deviationX, deviationY, size, color }) => {
    const dx = x - mousePos.x;
    const dy = y - mousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const repulsionRadius = 100;

    let deviationXUpdated = deviationX * 0.9;
    let deviationYUpdated = deviationY * 0.9;

    if (distance < repulsionRadius && distance > 0) {
      const repulsionStrength = 2;
      deviationXUpdated += (dx / distance) * repulsionStrength;
      deviationYUpdated += (dy / distance) * repulsionStrength;
    }

    const newX = x + vx + deviationXUpdated;
    const newY = y + vy + deviationYUpdated;

    const newVx = newX < 0 || newX > windowWidth ? -vx : vx;
    const newVy = newY < 0 || newY > windowHeight ? -vy : vy;

    return { x: newX, y: newY, vx: newVx, vy: newVy, deviationX: deviationXUpdated, deviationY: deviationYUpdated, size, color };
  });

  self.postMessage(updatedShapes);
};
