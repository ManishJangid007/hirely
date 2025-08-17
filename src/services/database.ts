import { Candidate, QuestionTemplate, InterviewResult, JobDescription, ThemeSettings, CompleteAppData } from '../types';

export interface DatabaseSchema {
  candidates: Candidate[];
  questionTemplates: QuestionTemplate[];
  positions: string[];
  jobDescriptions: JobDescription[];
  interviewResults: InterviewResult[];
}

export interface AppSettings {
  apiKey?: string;
  geminiApiKey?: string;
  geminiConnected?: boolean;
}

export interface BackupData {
  candidates: Candidate[];
  questionTemplates: QuestionTemplate[];
  positions: string[];
  jobDescriptions: JobDescription[];
  interviewResults: InterviewResult[];
  settings?: AppSettings;
  themeSettings?: ThemeSettings;
  localStorageData?: Record<string, any>;
  lastBackup: string;
}

class DatabaseService {
  private dbName = 'InterviewAppDB';
  private version = 8; // Increment version since we added jdMatchPercentage field to candidates
  private db: IDBDatabase | null = null;
  private backupKey = 'interview_app_backup';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {


      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        const error = new Error('IndexedDB is not supported in this browser');

        reject(error);
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {

        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;

        resolve();
      };

      request.onupgradeneeded = (event) => {

        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('candidates')) {
          const candidateStore = db.createObjectStore('candidates', { keyPath: 'id' });
          candidateStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('questionTemplates')) {
          const templateStore = db.createObjectStore('questionTemplates', { keyPath: 'id' });
          templateStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('positions')) {
          db.createObjectStore('positions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('jobDescriptions')) {
          db.createObjectStore('jobDescriptions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('interviewResults')) {
          const resultStore = db.createObjectStore('interviewResults', { keyPath: 'id' });
          resultStore.createIndex('candidateId', 'candidateId', { unique: false });
          resultStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {

      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Check if database is initialized
  isInitialized(): boolean {
    const initialized = this.db !== null;

    return initialized;
  }

  // Backup and Recovery Methods
  async createBackup(): Promise<void> {
    try {
      const [candidates, templates, positions, jobDescriptions, results, settings] = await Promise.all([
        this.getCandidates(),
        this.getQuestionTemplates(),
        this.getPositions(),
        this.getJobDescriptions(),
        this.getInterviewResults(),
        this.getSettings()
      ]);

      // Get theme settings from localStorage
      const themeSettings: ThemeSettings = {
        theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
        primaryColor: (localStorage.getItem('primaryColor') as any) || 'blue'
      };

      // Get all localStorage data (excluding the backup key itself)
      const localStorageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== this.backupKey) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              // Try to parse as JSON, fallback to string
              try {
                localStorageData[key] = JSON.parse(value);
              } catch {
                localStorageData[key] = value;
              }
            }
          } catch (error) {
            // Silently skip problematic keys
          }
        }
      }

      const backupData: BackupData = {
        candidates,
        questionTemplates: templates,
        positions,
        jobDescriptions,
        interviewResults: results,
        settings,
        themeSettings,
        localStorageData,
        lastBackup: new Date().toISOString()
      };

      localStorage.setItem(this.backupKey, JSON.stringify(backupData));

    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(this.backupKey);
      if (!backupData) {
        return false;
      }

      const backup: BackupData = JSON.parse(backupData);

      // Clear existing data
      await this.clearAllData();

      // Restore data
      for (const candidate of backup.candidates) {
        await this.addCandidate(candidate);
      }

      for (const template of backup.questionTemplates) {
        await this.addQuestionTemplate(template);
      }

      await this.setPositions(backup.positions);

      for (const jobDescription of backup.jobDescriptions || []) {
        await this.addJobDescription(jobDescription);
      }

      for (const result of backup.interviewResults) {
        await this.addInterviewResult(result);
      }

      if (backup.settings) {
        await this.setSettings(backup.settings);
      }

      // Restore theme settings
      if (backup.themeSettings) {
        localStorage.setItem('theme', backup.themeSettings.theme);
        localStorage.setItem('primaryColor', backup.themeSettings.primaryColor);
      }

      // Restore localStorage data
      if (backup.localStorageData) {
        for (const [key, value] of Object.entries(backup.localStorageData)) {
          if (key !== this.backupKey) {
            try {
              if (typeof value === 'string') {
                localStorage.setItem(key, value);
              } else {
                localStorage.setItem(key, JSON.stringify(value));
              }
            } catch (error) {
              // Silently skip problematic keys
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    const stores = ['candidates', 'questionTemplates', 'positions', 'jobDescriptions', 'interviewResults', 'settings'];

    for (const storeName of stores) {
      const store = this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  getBackupInfo(): { exists: boolean; lastBackup?: string } {
    const backupData = localStorage.getItem(this.backupKey);
    if (!backupData) {
      return { exists: false };
    }

    try {
      const backup: BackupData = JSON.parse(backupData);
      return { exists: true, lastBackup: backup.lastBackup };
    } catch {
      return { exists: false };
    }
  }

  // Auto-backup on data changes
  private async autoBackup(): Promise<void> {
    // Create backup every 5 minutes or after significant changes
    await this.createBackup();
  }

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    // Ensure DB is initialized
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('settings');
      const request = store.get('app');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result || { id: 'app' };
        const { id, ...settings } = result;
        resolve(settings as AppSettings);
      };
    });
  }

  async setSettings(settings: AppSettings): Promise<void> {
    // Ensure DB initialized in case caller didn't
    if (!this.db) {
      await this.init().catch(() => { });
    }
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('settings', 'readwrite');
        // Read current settings to merge new values, avoiding overwrites
        const getReq = store.get('app');
        getReq.onerror = () => reject(getReq.error);
        getReq.onsuccess = () => {
          const current = (getReq.result || { id: 'app' }) as any;
          const merged = { ...current, ...settings, id: 'app' };
          const putReq = store.put(merged);
          putReq.onerror = () => reject(putReq.error);
          putReq.onsuccess = async () => {
            await this.autoBackup();
            resolve();
          };
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async getApiKey(): Promise<string | undefined> {
    const settings = await this.getSettings();
    return settings.apiKey;
  }

  async setApiKey(apiKey: string): Promise<void> {
    await this.setSettings({ apiKey });
  }

  async getGeminiApiKey(): Promise<string | undefined> {
    try {
      const settings = await this.getSettings();
      return settings.geminiApiKey;
    } catch (error) {
      console.warn('Failed to get Gemini API key:', error);
      return undefined;
    }
  }

  async setGeminiApiKey(geminiApiKey: string): Promise<void> {
    await this.setSettings({ geminiApiKey });
  }

  async getGeminiConnected(): Promise<boolean | undefined> {
    try {
      const settings = await this.getSettings();
      return settings.geminiConnected;
    } catch (error) {
      console.warn('Failed to get Gemini connection status:', error);
      return false;
    }
  }

  async setGeminiConnected(geminiConnected: boolean): Promise<void> {
    await this.setSettings({ geminiConnected });
  }

  // Candidate operations
  async getCandidates(): Promise<Candidate[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('candidates');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addCandidate(candidate: Candidate): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('candidates', 'readwrite');
      const request = store.add(candidate);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async updateCandidate(candidate: Candidate): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('candidates', 'readwrite');
      const request = store.put(candidate);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async deleteCandidate(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('candidates', 'readwrite');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  // Question Template operations
  async getQuestionTemplates(): Promise<QuestionTemplate[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('questionTemplates');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addQuestionTemplate(template: QuestionTemplate): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('questionTemplates', 'readwrite');
      const request = store.add(template);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async updateQuestionTemplate(template: QuestionTemplate): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('questionTemplates', 'readwrite');
      const request = store.put(template);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async deleteQuestionTemplate(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('questionTemplates', 'readwrite');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  // Positions operations
  async getPositions(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('positions');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const positions = request.result.map((item: any) => item.name);
        resolve(positions);
      };
    });
  }

  async setPositions(positions: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('positions', 'readwrite');

      // Clear existing positions
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);

      clearRequest.onsuccess = () => {
        // Add new positions
        const promises = positions.map((position, index) => {
          return new Promise<void>((resolvePos, rejectPos) => {
            const request = store.add({ id: index.toString(), name: position });
            request.onerror = () => rejectPos(request.error);
            request.onsuccess = () => resolvePos();
          });
        });

        Promise.all(promises).then(async () => {
          await this.autoBackup();
          resolve();
        }).catch(reject);
      };
    });
  }

  // Job Descriptions operations
  async getJobDescriptions(): Promise<JobDescription[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('jobDescriptions');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addJobDescription(jobDescription: JobDescription): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('jobDescriptions', 'readwrite');
      const request = store.add(jobDescription);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async updateJobDescription(id: string, updates: Partial<JobDescription>): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('jobDescriptions', 'readwrite');
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Job Description not found'));
          return;
        }

        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);

        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = async () => {
          await this.autoBackup();
          resolve();
        };
      };
    });
  }

  async deleteJobDescription(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('jobDescriptions', 'readwrite');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  // Interview Results operations
  async getInterviewResults(): Promise<InterviewResult[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('interviewResults');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addInterviewResult(result: InterviewResult): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('interviewResults', 'readwrite');
      const request = store.add(result);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async getInterviewResultByCandidateId(candidateId: string): Promise<InterviewResult | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('interviewResults');
      const index = store.index('candidateId');
      const request = index.get(candidateId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async updateInterviewResult(result: InterviewResult): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('interviewResults', 'readwrite');
      const request = store.put(result);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  async deleteInterviewResult(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('interviewResults', 'readwrite');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.autoBackup();
        resolve();
      };
    });
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const savedCandidates = localStorage.getItem('candidates');
      const savedTemplates = localStorage.getItem('questionTemplates');
      const savedPositions = localStorage.getItem('positions');

      if (savedCandidates) {
        const candidates = JSON.parse(savedCandidates);
        for (const candidate of candidates) {
          await this.addCandidate(candidate);
        }
        localStorage.removeItem('candidates');
      }

      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates);
        for (const template of templates) {
          await this.addQuestionTemplate(template);
        }
        localStorage.removeItem('questionTemplates');
      }

      if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        await this.setPositions(positions);
        localStorage.removeItem('positions');
      }
    } catch (error) {

    }
  }

  // New method for complete data export
  async exportCompleteData(): Promise<CompleteAppData> {
    const [candidates, templates, positions, jobDescriptions, results, settings] = await Promise.all([
      this.getCandidates(),
      this.getQuestionTemplates(),
      this.getPositions(),
      this.getJobDescriptions(),
      this.getInterviewResults(),
      this.getSettings()
    ]);

    // Get theme settings
    const themeSettings: ThemeSettings = {
      theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
      primaryColor: (localStorage.getItem('primaryColor') as any) || 'blue'
    };

    // Get all localStorage data
    const localStorageData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== this.backupKey) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              localStorageData[key] = JSON.parse(value);
            } catch {
              localStorageData[key] = value;
            }
          }
        } catch (error) {
          // Silently skip problematic keys
        }
      }
    }

    return {
      candidates,
      questionTemplates: templates,
      positions,
      jobDescriptions,
      interviewResults: results,
      themeSettings,
      aiSettings: settings,
      localStorageData,
      exportedAt: new Date().toISOString(),
      version: '2.0' // Increment version for new format
    };
  }

  // New method for complete data import
  async importCompleteData(data: CompleteAppData): Promise<void> {
    // Clear existing data
    await this.clearAllData();

    // Import database data
    for (const candidate of data.candidates) {
      await this.addCandidate(candidate);
    }

    for (const template of data.questionTemplates) {
      await this.addQuestionTemplate(template);
    }

    await this.setPositions(data.positions);

    for (const jobDescription of data.jobDescriptions) {
      await this.addJobDescription(jobDescription);
    }

    for (const result of data.interviewResults) {
      await this.addInterviewResult(result);
    }

    // Import AI settings
    if (data.aiSettings) {
      await this.setSettings(data.aiSettings as AppSettings);
    }

    // Import theme settings
    if (data.themeSettings) {
      localStorage.setItem('theme', data.themeSettings.theme);
      localStorage.setItem('primaryColor', data.themeSettings.primaryColor);
    }

    // Import localStorage data
    if (data.localStorageData) {
      for (const [key, value] of Object.entries(data.localStorageData)) {
        if (key !== this.backupKey) {
          try {
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          } catch (error) {
            // Silently skip problematic keys
          }
        }
      }
    }
  }

  // Helper method to get all localStorage keys (for debugging)
  getAllLocalStorageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }

  // Helper method to verify backup completeness
  async verifyBackupCompleteness(): Promise<{ complete: boolean; missing: string[] }> {
    const backupData = localStorage.getItem(this.backupKey);
    if (!backupData) {
      return { complete: false, missing: ['No backup found'] };
    }

    try {
      const backup: BackupData = JSON.parse(backupData);
      const missing: string[] = [];

      // Check if all required data is present
      if (!backup.candidates) missing.push('candidates');
      if (!backup.questionTemplates) missing.push('questionTemplates');
      if (!backup.positions) missing.push('positions');
      if (!backup.jobDescriptions) missing.push('jobDescriptions');
      if (!backup.interviewResults) missing.push('interviewResults');
      if (!backup.themeSettings) missing.push('themeSettings');
      if (!backup.localStorageData) missing.push('localStorageData');

      return {
        complete: missing.length === 0,
        missing
      };
    } catch (error) {
      return { complete: false, missing: ['Invalid backup format'] };
    }
  }
}

export const databaseService = new DatabaseService(); 