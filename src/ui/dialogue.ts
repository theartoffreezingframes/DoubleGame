/** Cinematic dialogue runner: typewriter text, choices with tone tags, effects. */
import type { DialogueGraph, DialogueNode, Effect } from '../systems/dialogue-types.ts';
import { Input } from '../core/input.ts';
import { AudioBus } from '../core/audio.ts';

const $ = (id: string) => document.getElementById(id)!;

export class DialogueRunner {
  active = false;
  private graph: DialogueGraph = {};
  private node: DialogueNode | null = null;
  private fullText = '';
  private shownChars = 0;
  private typeTimer = 0;
  private choicesShown = false;

  constructor(
    private input: Input,
    private audio: AudioBus,
    private onEffect: (e: Effect) => void,
    private onEnd: () => void,
  ) {}

  start(graph: DialogueGraph, nodeId: string) {
    this.graph = graph;
    this.active = true;
    $('dialogue').classList.remove('hidden');
    this.enterNode(nodeId);
  }

  private enterNode(nodeId: string) {
    const node = this.graph[nodeId];
    if (!node) {
      this.finish();
      return;
    }
    this.node = node;
    node.effects?.forEach((e) => this.onEffect(e));

    const speakerEl = $('dialogue-speaker');
    const textEl = $('dialogue-text');
    if (node.speaker === 'narrator') {
      speakerEl.textContent = '';
      textEl.style.fontStyle = 'italic';
      textEl.style.color = '#c9c2ae';
    } else {
      speakerEl.textContent = node.speaker.toUpperCase();
      textEl.style.fontStyle = 'normal';
      textEl.style.color = '#f3eedd';
    }
    this.fullText = node.text;
    this.shownChars = 0;
    this.typeTimer = 0;
    this.choicesShown = false;
    textEl.textContent = '';
    $('dialogue-choices').innerHTML = '';
    $('dialogue-continue').style.visibility = 'hidden';
  }

  private showChoices() {
    if (!this.node?.choices || this.choicesShown) return;
    this.choicesShown = true;
    const wrap = $('dialogue-choices');
    wrap.innerHTML = '';
    this.node.choices.forEach((c, idx) => {
      const b = document.createElement('button');
      b.className = 'dlg-choice';
      b.innerHTML = `<span class="num">${idx + 1}</span>${escapeHtml(c.label)}${c.tone ? `<span class="tone">${c.tone}</span>` : ''}`;
      b.addEventListener('click', () => this.pick(idx));
      wrap.appendChild(b);
    });
    $('dialogue-continue').style.visibility = 'hidden';
  }

  private pick(idx: number) {
    if (!this.node?.choices) return;
    const choice = this.node.choices[idx];
    if (!choice) return;
    this.audio.uiSelect();
    choice.effects?.forEach((e) => this.onEffect(e));
    if (choice.next) this.enterNode(choice.next);
    else this.finish();
  }

  private advance() {
    if (!this.node) return;
    if (this.shownChars < this.fullText.length) {
      this.shownChars = this.fullText.length;
      $('dialogue-text').textContent = this.fullText;
      if (this.node.choices) this.showChoices();
      else $('dialogue-continue').style.visibility = 'visible';
      return;
    }
    if (this.node.choices) return; // must click / press number
    this.audio.uiBlip();
    if (this.node.next) this.enterNode(this.node.next);
    else this.finish();
  }

  private finish() {
    this.active = false;
    this.node = null;
    $('dialogue').classList.add('hidden');
    this.onEnd();
  }

  update(dt: number) {
    if (!this.active) return;
    // Typewriter
    if (this.shownChars < this.fullText.length) {
      this.typeTimer += dt;
      const charsPerSec = 46;
      const target = Math.min(this.fullText.length, Math.floor(this.typeTimer * charsPerSec));
      if (target > this.shownChars) {
        this.shownChars = target;
        $('dialogue-text').textContent = this.fullText.slice(0, this.shownChars);
      }
      if (this.shownChars >= this.fullText.length) {
        if (this.node?.choices) this.showChoices();
        else $('dialogue-continue').style.visibility = 'visible';
      }
    }
    // Input: E / Space / click to continue; numbers pick choices
    if (this.input.hit('KeyE') || this.input.hit('Space') || this.input.consumeClick()) {
      this.advance();
    }
    if (this.node?.choices && this.choicesShown) {
      for (let i = 0; i < this.node.choices.length; i++) {
        if (this.input.hit(`Digit${i + 1}`) || this.input.hit(`Numpad${i + 1}`)) {
          this.pick(i);
          break;
        }
      }
    }
  }

  /** Force-end (e.g., loading a save mid-dialogue skips it). */
  abort() {
    if (this.active) this.finish();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
