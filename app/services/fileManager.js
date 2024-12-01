import { uploadProjectFiles } from './supabase';

export class FileManager {
  constructor(webContainerInstance) {
    this.webContainerInstance = webContainerInstance;
    this.files = {};
    this.currentFile = null;
    this.autoSaveInterval = null;
    this.projectName = null;
    this.projectId = null;
    this.onFilesChange = null;
  }

  setOnFilesChange(callback) {
    this.onFilesChange = callback;
  }

  async initialize(projectName, files) {
    this.projectName = projectName;
    this.files = files;
    if (this.onFilesChange) {
      this.onFilesChange(this.files);
    }
  }

  getFiles() {
    return this.files;
  }

  getCurrentFile() {
    return this.currentFile;
  }

  async readFile(path) {
    try {
      return await this.webContainerInstance.fs.readFile(path, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async writeFile(path, content) {
    try {
      await this.webContainerInstance.fs.writeFile(path, content);
      
      // Update our local file tree
      let current = this.files;
      const parts = path.split('/');
      const fileName = parts.pop();
      
      for (const part of parts) {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
      
      current[fileName] = { file: { contents: content } };
      
      if (this.onFilesChange) {
        this.onFilesChange(this.files);
      }
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  setCurrentFile(path) {
    this.currentFile = path;
  }

  startAutoSave(interval = 30000) { // Default to 30 seconds
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      try {
        if (!this.projectName) return;
        
        // Get the current state of all files
        const fileContents = {};
        const processDirectory = async (dir, path = '') => {
          for (const [name, item] of Object.entries(dir)) {
            const fullPath = path ? `${path}/${name}` : name;
            if (item.directory) {
              await processDirectory(item.directory, fullPath);
            } else if (item.file) {
              const content = await this.readFile(fullPath);
              fileContents[fullPath] = content;
            }
          }
        };

        await processDirectory(this.files);
        
        // Upload to Supabase
        const { projectId } = await uploadProjectFiles(this.projectName, this.files);
        this.projectId = projectId;
        
        console.log('Auto-saved project files');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, interval);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  async saveNow() {
    try {
      if (!this.projectName) return;
      const { projectId } = await uploadProjectFiles(this.projectName, this.files);
      this.projectId = projectId;
      console.log('Saved project files');
      return projectId;
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }
}
