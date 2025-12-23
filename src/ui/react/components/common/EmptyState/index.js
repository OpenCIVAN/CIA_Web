/**
 * @file index.js
 * @description Public exports for the EmptyState component.
 *
 * @example
 * import { EmptyState } from '@UI/react/components/common/EmptyState';
 * import { IconSearch, IconFolderPlus, IconMessageSquare } from '@UI/react/components/common/Icon';
 *
 * // No search results
 * <EmptyState
 *   icon={IconSearch}
 *   title="No results found"
 *   description="Try adjusting your search or filter criteria"
 * />
 *
 * // Empty list with action
 * <EmptyState
 *   icon={IconFolderPlus}
 *   title="No projects"
 *   description="Create your first project to get started"
 *   action={{ label: 'Create Project', onClick: handleCreate }}
 * />
 */

export { EmptyState } from "./EmptyState";
export { default } from "./EmptyState";
