/** DOUBLE GAME — entry point. */
import './style.css';
import { Game } from './game.ts';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
if (!canvas) {
  document.body.innerHTML = '<p style="color:#fff;padding:2rem;">DOUBLE GAME needs a canvas-capable browser.</p>';
} else {
  try {
    const game = new Game(canvas);
    game.showMainMenu();
  } catch (err) {
    console.error(err);
    document.body.innerHTML = `<p style="color:#fff;padding:2rem;font-family:sans-serif;">
      DOUBLE GAME failed to start (WebGL may be unavailable).<br><br>
      <code style="color:#e8b93c">${String(err)}</code></p>`;
  }
}
