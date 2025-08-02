export interface DatabaseSchema {
  candidates: Candidate[];
  questionTemplates: QuestionTemplate[];
  positions: string[];
  interviewResults: InterviewResult[];
}

export interface Candidate {
  id: string;
  fullName: string;
  position: string;
  status: 'Not Interviewed' | 'Passed' | 'Rejected' | 'Maybe';
  experience: {
    years: number;
    months: number;
  };
  interviewDate?: string; // ISO string format for the interview date
  questions: Question[];
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  section: string;
  answer?: string;
  isCorrect?: boolean;
  isAnswered: boolean;
}

export interface InterviewResult {
  id: string;
  candidateId: string;
  description: string;
  result: 'Passed' | 'Rejected' | 'Maybe';
  questions: Question[];
  createdAt: string;
}

export interface QuestionSection {
  id: string;
  name: string;
  questions: Question[];
}

export interface QuestionTemplate {
  id: string;
  name: string;
  sections: QuestionSection[];
}

export interface BackupData {
  candidates: Candidate[];
  questionTemplates: QuestionTemplate[];
  positions: string[];
  interviewResults: InterviewResult[];
  lastBackup: string;
}

class DatabaseService {
  private dbName = 'InterviewAppDB';
  private version = 3; // Increment version since we added interviewDate field to Candidate
  private db: IDBDatabase | null = null;
  private backupKey = 'interview_app_backup';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Initializing database...');

      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        const error = new Error('IndexedDB is not supported in this browser');
        console.error('IndexedDB not supported:', error);
        reject(error);
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database initialized successfully, db object:', this.db);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('Database upgrade needed, version:', this.version);
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

        if (!db.objectStoreNames.contains('interviewResults')) {
          const resultStore = db.createObjectStore('interviewResults', { keyPath: 'id' });
          resultStore.createIndex('candidateId', 'candidateId', { unique: false });
          resultStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      console.error('Database not initialized. Current state:', { db: this.db });
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Check if database is initialized
  isInitialized(): boolean {
    const initialized = this.db !== null;
    console.log('Database initialization check:', { db: this.db, initialized });
    return initialized;
  }

  // Backup and Recovery Methods
  async createBackup(): Promise<void> {
    try {
      const [candidates, templates, positions, results] = await Promise.all([
        this.getCandidates(),
        this.getQuestionTemplates(),
        this.getPositions(),
        this.getInterviewResults()
      ]);

      const backupData: BackupData = {
        candidates,
        questionTemplates: templates,
        positions,
        interviewResults: results,
        lastBackup: new Date().toISOString()
      };

      localStorage.setItem(this.backupKey, JSON.stringify(backupData));
      console.log('Backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(this.backupKey);
      if (!backupData) {
        console.log('No backup found');
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

      for (const result of backup.interviewResults) {
        await this.addInterviewResult(result);
      }

      console.log('Backup restored successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    const stores = ['candidates', 'questionTemplates', 'positions', 'interviewResults'];

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
      console.error('Migration failed:', error);
    }
  }
}

export const databaseService = new DatabaseService(); 