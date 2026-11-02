import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const GIVEAWAYS_FILE = path.join(DATA_DIR, 'giveaways.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

class JsonDatabase {
  constructor() {
    this.giveaways = new Map();
    this.settings = new Map();
    this.isInitialized = false;
    this.writeQueue = Promise.resolve();
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await this.loadGiveaways();
      await this.loadSettings();
      this.isInitialized = true;
      logger.success('JSON veri tabanı başarıyla yüklendi.');
    } catch (err) {
      logger.error('JSON veri tabanı başlatılırken hata oluştu:', err);
      throw err;
    }
  }

  async loadGiveaways() {
    try {
      const data = await fs.readFile(GIVEAWAYS_FILE, 'utf8');
      if (!data.trim()) {
        await this.atomicWrite(GIVEAWAYS_FILE, JSON.stringify([], null, 2));
        this.giveaways.clear();
        return;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new Error('giveaways.json dosyasının içeriği bir dizi olmalıdır.');
      }
      this.giveaways.clear();
      for (const item of parsed) {
        if (item && item.giveawayId) {
          if (!Array.isArray(item.participants)) item.participants = [];
          if (!Array.isArray(item.winners)) item.winners = [];
          item.participants = Array.from(new Set(item.participants));
          this.giveaways.set(item.giveawayId, item);
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        await this.atomicWrite(GIVEAWAYS_FILE, JSON.stringify([], null, 2));
        this.giveaways.clear();
      } else {
        logger.error('giveaways.json okunurken hata oluştu:', err);
        throw err;
      }
    }
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf8');
      if (!data.trim()) {
        await this.atomicWrite(SETTINGS_FILE, JSON.stringify({}, null, 2));
        this.settings.clear();
        return;
      }
      const parsed = JSON.parse(data);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('settings.json dosyasının içeriği bir nesne olmalıdır.');
      }
      this.settings.clear();
      for (const [key, value] of Object.entries(parsed)) {
        this.settings.set(key, value);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        await this.atomicWrite(SETTINGS_FILE, JSON.stringify({}, null, 2));
        this.settings.clear();
      } else {
        logger.error('settings.json okunurken hata oluştu:', err);
        throw err;
      }
    }
  }

  enqueue(task) {
    const next = this.writeQueue.then(() => task(), () => task());
    this.writeQueue = next.catch(err => {
      logger.error('Veri tabanı yazma kuyruğunda hata:', err);
    });
    return next;
  }

  async atomicWrite(filePath, content) {
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      await fs.writeFile(tmpPath, content, 'utf8');
      await fs.rename(tmpPath, filePath);
    } catch (err) {
      try {
        await fs.unlink(tmpPath);
      } catch {}
      throw err;
    }
  }

  async persistGiveaways() {
    const array = Array.from(this.giveaways.values());
    const json = JSON.stringify(array, null, 2);
    JSON.parse(json);
    await this.atomicWrite(GIVEAWAYS_FILE, json);
  }

  async persistSettings() {
    const obj = Object.fromEntries(this.settings.entries());
    const json = JSON.stringify(obj, null, 2);
    JSON.parse(json);
    await this.atomicWrite(SETTINGS_FILE, json);
  }

  getAllGiveaways() {
    return Array.from(this.giveaways.values()).map(g => structuredClone(g));
  }

  getActiveGiveaways() {
    return Array.from(this.giveaways.values())
      .filter(g => g.status === 'active')
      .map(g => structuredClone(g));
  }

  getGiveaway(giveawayId) {
    const item = this.giveaways.get(giveawayId);
    return item ? structuredClone(item) : null;
  }

  async saveGiveaway(giveaway) {
    return this.enqueue(async () => {
      if (!giveaway || !giveaway.giveawayId) {
        throw new Error('Geçersiz çekiliş verisi.');
      }
      if (!Array.isArray(giveaway.participants)) giveaway.participants = [];
      if (!Array.isArray(giveaway.winners)) giveaway.winners = [];
      giveaway.participants = Array.from(new Set(giveaway.participants));

      this.giveaways.set(giveaway.giveawayId, structuredClone(giveaway));
      await this.persistGiveaways();
      return structuredClone(this.giveaways.get(giveaway.giveawayId));
    });
  }

  async updateGiveaway(giveawayId, updateFn) {
    return this.enqueue(async () => {
      const existing = this.giveaways.get(giveawayId);
      if (!existing) return null;

      const cloned = structuredClone(existing);
      const updated = await updateFn(cloned);
      if (!updated) return null;

      if (!Array.isArray(updated.participants)) updated.participants = [];
      if (!Array.isArray(updated.winners)) updated.winners = [];
      updated.participants = Array.from(new Set(updated.participants));

      this.giveaways.set(giveawayId, structuredClone(updated));
      await this.persistGiveaways();
      return structuredClone(updated);
    });
  }

  getSettings(guildId) {
    const item = this.settings.get(guildId);
    return item ? structuredClone(item) : {};
  }

  async setSettings(guildId, newSettings) {
    return this.enqueue(async () => {
      const current = this.settings.get(guildId) || {};
      const updated = { ...current, ...newSettings };
      this.settings.set(guildId, updated);
      await this.persistSettings();
      return structuredClone(updated);
    });
  }
}

export const jsonDatabase = new JsonDatabase();

