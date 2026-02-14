import type { KeyboardEvent } from 'react';

/**
 * Returns props for accessible radiogroup keyboard navigation.
 * Arrow keys cycle between items, Home/End jump to first/last.
 */
export function useRadioGroupKeyboard<T>(
  items: T[],
  selectedItem: T,
  onSelect: (item: T) => void,
) {
  function getTabIndex(item: T): 0 | -1 {
    return item === selectedItem ? 0 : -1;
  }

  function handleKeyDown(e: KeyboardEvent, currentIndex: number) {
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    onSelect(items[nextIndex]);

    // Focus the newly selected button
    const radiogroup = (e.currentTarget as HTMLElement).closest('[role="radiogroup"]');
    if (radiogroup) {
      const buttons = radiogroup.querySelectorAll<HTMLElement>('[role="radio"]');
      buttons[nextIndex]?.focus();
    }
  }

  return { getTabIndex, handleKeyDown };
}
