/**
 * @file index.jsx
 * @description Public exports for FilesTab.
 */

// Main FilesTab exports
export { FilesPanelContent, default } from './FilesTab';
export { FilesTabV2 } from './FilesTabV2';

// Hooks
export { useFilesTab, canVisualize } from './hooks/useFilesTab';

// Components
export { FileItemList, FileItemGrid, getFileTypeConfig } from './components/FileItem';
export { FileThumbnail } from './components/FileThumbnail';
export { FileContextMenu } from './components/FileContextMenu';
export { UploadDropzone } from './components/UploadDropzone';
export { DatasetTreeItem } from './components/DatasetTreeItem';
export { FolderNode } from './components/FolderNode';

// Section organisms
export { StarredSection, TabbedFilesBrowser, CompactFilesPanel } from './sections';