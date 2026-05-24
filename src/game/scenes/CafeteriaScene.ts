import Phaser from "phaser";
import { gameEvents } from "../events";
import type { Challenge, ScoreResult, Tray } from "../../types/game";
import { trayItems } from "../../systems/scoring";

export class CafeteriaScene extends Phaser.Scene {
  private tray: Tray = {};
  private challenge?: Challenge;
  private students: Phaser.GameObjects.Container[] = [];
  private steam?: Phaser.GameObjects.Particles.ParticleEmitter;
  private activeScene = false;

  constructor() {
    super("CafeteriaScene");
  }

  create() {
    this.activeScene = true;
    this.cameras.main.setBackgroundColor("#9edcf0");
    this.drawCafeteria();
    this.createSteam();
    gameEvents.on("trayChanged", this.onTrayChanged);
    gameEvents.on("challengeChanged", this.onChallengeChanged);
    gameEvents.on("resultReady", this.onResultReady);
    gameEvents.on("cookPulse", this.onCookPulse);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  private cleanup() {
    this.activeScene = false;
    gameEvents.off("trayChanged", this.onTrayChanged);
    gameEvents.off("challengeChanged", this.onChallengeChanged);
    gameEvents.off("resultReady", this.onResultReady);
    gameEvents.off("cookPulse", this.onCookPulse);
    this.students = [];
  }

  private canDraw() {
    return (
      this.activeScene &&
      Boolean(this.sys?.displayList && this.sys?.updateList && this.add)
    );
  }

  private drawCafeteria() {
    if (!this.canDraw()) return;
    const g = this.add.graphics();
    g.fillStyle(0xfff4d6).fillRect(0, 0, 360, 180);
    g.fillStyle(0xf48a3d).fillRect(0, 0, 360, 32);
    g.fillStyle(0x67b778).fillRect(0, 168, 360, 32);
    g.fillStyle(0x7a4d2b).fillRect(22, 110, 316, 48);
    g.fillStyle(0x3d2a20).fillRect(18, 152, 324, 12);
    for (let x = 36; x < 340; x += 52) {
      g.fillStyle(0x3d6fa8).fillRect(x, 48, 34, 28);
      g.fillStyle(0xffffff).fillRect(x + 5, 53, 24, 18);
    }
    this.add
      .text(180, 16, "DAPUR MBGems", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff4d6",
      })
      .setOrigin(0.5);
    this.drawTray();
  }

  private drawTray() {
    if (!this.canDraw()) return;
    this.children.getByName("tray-layer")?.destroy();
    const layer = this.add.container(180, 126).setName("tray-layer");
    layer.add(
      this.add.rectangle(0, 0, 132, 48, 0xe8d5a4).setStrokeStyle(3, 0x3d2a20),
    );
    trayItems(this.tray).forEach((item, index) => {
      const x = -48 + index * 24;
      layer.add(
        this.add
          .rectangle(x, 0, 18, 18, Number(item.color.replace("#", "0x")))
          .setStrokeStyle(2, 0x3d2a20),
      );
    });
  }

  private createSteam() {
    if (!this.canDraw()) return;
    const texture = this.textures.createCanvas("steam-pixel", 4, 4);
    if (texture) {
      texture.context.fillStyle = "#ffffff";
      texture.context.fillRect(0, 0, 4, 4);
      texture.refresh();
    }
    this.steam = this.add.particles(180, 104, "steam-pixel", {
      lifespan: 1300,
      speedY: { min: -24, max: -8 },
      speedX: { min: -8, max: 8 },
      alpha: { start: 0.45, end: 0 },
      scale: { start: 1.4, end: 0.2 },
      frequency: 260,
    });
  }

  private onTrayChanged = (tray: Tray) => {
    if (!this.canDraw()) return;
    this.tray = tray;
    this.drawTray();
  };

  private onChallengeChanged = (challenge: Challenge) => {
    if (!this.canDraw()) return;
    this.challenge = challenge;
    this.students.forEach((student) => student.destroy());
    this.students = challenge.students.map((student, index) => {
      const x = 52 + index * 64;
      const body = this.add
        .rectangle(0, 0, 24, 28, 0x3d6fa8)
        .setStrokeStyle(2, 0x3d2a20);
      const face = this.add
        .rectangle(0, -20, 20, 20, 0xf1b27a)
        .setStrokeStyle(2, 0x3d2a20);
      const name = this.add
        .text(0, 24, student.name, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#3d2a20",
        })
        .setOrigin(0.5);
      const container = this.add.container(x, 92, [body, face, name]);
      this.tweens.add({
        targets: container,
        y: 88,
        duration: 650 + index * 110,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      return container;
    });
  };

  private onResultReady = (result: ScoreResult) => {
    if (!this.canDraw()) return;
    result.reactions.forEach((reaction, index) => {
      const student = this.students[index];
      if (!student) return;
      const color =
        reaction.delta > 20
          ? "#f7cf58"
          : reaction.delta > 0
            ? "#ffffff"
            : "#d85050";
      const text = this.add
        .text(student.x, student.y - 44, reaction.label, {
          fontFamily: "monospace",
          fontSize: "10px",
          color,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: text,
        y: text.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => text.destroy(),
      });
    });
  };

  private onCookPulse = (label: string) => {
    if (!this.canDraw()) return;
    const text = this.add
      .text(180, 76, label, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#d85050",
      })
      .setOrigin(0.5);
    this.steam?.explode(12, 180, 104);
    this.tweens.add({
      targets: text,
      scale: 1.25,
      alpha: 0,
      duration: 750,
      onComplete: () => text.destroy(),
    });
  };
}
