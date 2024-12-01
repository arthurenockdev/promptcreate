import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function uploadProjectFiles(projectName, files) {
  try {
    const timestamp = Date.now();
    const projectId = `${projectName}-${timestamp}`;
    const uploads = [];

    // Process files recursively
    const processFiles = async (fileTree, currentPath = '') => {
      for (const [name, content] of Object.entries(fileTree)) {
        const path = currentPath ? `${currentPath}/${name}` : name;
        
        if (content.directory) {
          // Process directory contents
          await processFiles(content.directory, path);
        } else if (content.file) {
          // Convert file contents to blob
          const blob = new Blob([content.file.contents], { type: 'text/plain' });
          const filePath = `${projectId}/${path}`;
          
          // Upload file to Supabase storage
          const { data, error } = await supabase.storage
            .from('projects')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) throw error;
          uploads.push({ path: filePath, url: data.path });
        }
      }
    };

    await processFiles(files);

    // Store project metadata
    const { error: metadataError } = await supabase
      .from('projects')
      .insert([
        {
          id: projectId,
          name: projectName,
          created_at: new Date().toISOString(),
          files: uploads
        }
      ]);

    if (metadataError) throw metadataError;

    return {
      projectId,
      files: uploads
    };
  } catch (error) {
    console.error('Failed to upload project files:', error);
    throw new Error(`Failed to upload project files: ${error.message}`);
  }
}

export async function getProjectFiles(projectId) {
  try {
    // Get project metadata
    const { data: project, error: metadataError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (metadataError) throw metadataError;
    if (!project) throw new Error('Project not found');

    const files = {};

    // Download each file
    for (const file of project.files) {
      const { data, error } = await supabase.storage
        .from('projects')
        .download(file.path);

      if (error) throw error;

      const content = await data.text();
      const pathParts = file.path.replace(`${projectId}/`, '').split('/');
      
      // Reconstruct file tree
      let current = files;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
      
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        file: {
          contents: content
        }
      };
    }

    return {
      project,
      files
    };
  } catch (error) {
    console.error('Failed to get project files:', error);
    throw new Error(`Failed to get project files: ${error.message}`);
  }
}

export async function listProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to list projects:', error);
    throw new Error(`Failed to list projects: ${error.message}`);
  }
}

export async function deleteProject(projectId) {
  try {
    // Get project metadata
    const { data: project, error: metadataError } = await supabase
      .from('projects')
      .select('files')
      .eq('id', projectId)
      .single();

    if (metadataError) throw metadataError;
    if (!project) throw new Error('Project not found');

    // Delete all files from storage
    const { error: storageError } = await supabase.storage
      .from('projects')
      .remove(project.files.map(f => f.path));

    if (storageError) throw storageError;

    // Delete project metadata
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}
