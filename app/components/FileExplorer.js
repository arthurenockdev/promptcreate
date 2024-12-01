'use client';

import { useState, useEffect } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaChevronRight, FaChevronDown } from 'react-icons/fa';

const FileTreeNode = ({ name, node, path, onFileSelect, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDirectory = !!node.directory;
  const fullPath = path ? `${path}/${name}` : name;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleClick = () => {
    if (isDirectory) {
      toggleOpen();
    } else {
      onFileSelect(fullPath);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer ${
          !isDirectory && selectedFile === fullPath ? 'bg-gray-700' : ''
        }`}
        onClick={handleClick}
      >
        <span className="mr-1">
          {isDirectory ? (
            <span className="mr-1">
              {isOpen ? <FaChevronDown className="inline" /> : <FaChevronRight className="inline" />}
            </span>
          ) : null}
          {isDirectory ? (
            isOpen ? (
              <FaFolderOpen className="inline text-yellow-400" />
            ) : (
              <FaFolder className="inline text-yellow-400" />
            )
          ) : (
            <FaFile className="inline text-blue-400" />
          )}
        </span>
        <span className="ml-1">{name}</span>
      </div>
      {isDirectory && isOpen && (
        <div className="ml-4">
          {Object.entries(node.directory).map(([childName, childNode]) => (
            <FileTreeNode
              key={childName}
              name={childName}
              node={childNode}
              path={fullPath}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ files, onFileSelect, selectedFile }) {
  return (
    <div className="bg-gray-800 text-white p-2 h-full overflow-y-auto">
      <div className="font-bold mb-2">Project Files</div>
      {Object.entries(files).map(([name, node]) => (
        <FileTreeNode
          key={name}
          name={name}
          node={node}
          path=""
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
}
