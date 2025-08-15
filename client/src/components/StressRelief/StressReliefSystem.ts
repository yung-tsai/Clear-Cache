/**
 * Stress Relief Catharsis System
 * Pure JS implementation for emotional tagging and processing
 */

interface SREntry {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

interface SRHighlight {
  id: string;
  entryId: string;
  type: 'range' | 'block';
  start?: number;
  end?: number;
  blockId?: string | null;
  emotion: 'stress' | 'anger' | 'sad' | 'anxious' | 'happy' | 'neutral' | 'highlight';
  intent?: 'trash' | 'shred' | null;
  state: 'new' | 'processed';
  action?: 'trash' | 'shred' | 'stamp' | null;
  createdAt: number;
  processedAt?: number | null;
}

interface SRQueueItem {
  id: string;
  highlightId: string;
  entryId: string;
  emotion: string;
  state: 'queued' | 'done';
}

export class StressReliefSystem {
  private currentEditor: HTMLElement | null = null;
  private toolbar: HTMLElement | null = null;
  private contextMenu: HTMLElement | null = null;
  private mode: 'compose' | 'process' = 'compose';
  private undoStack: Array<{ action: string; data: any }> = [];

  constructor() {
    this.setupGlobalListeners();
    this.checkTrashDay();
  }

  // Initialize editor with stress relief capabilities
  srInitEditor(rootEl: HTMLElement): void {
    this.currentEditor = rootEl;
    
    // Add required attributes if not present
    if (!rootEl.hasAttribute('data-editor')) {
      rootEl.setAttribute('data-editor', 'true');
    }
    
    // Setup event listeners for this editor
    this.setupEditorListeners(rootEl);
    this.initializeBlockIds(rootEl);
    this.restoreHighlights(rootEl);
  }

  private setupGlobalListeners(): void {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  private setupEditorListeners(editor: HTMLElement): void {
    editor.addEventListener('mouseup', (e) => this.handleEditorMouseUp(e));
    
    // Add paragraph hover listeners
    const paragraphs = editor.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.addEventListener('mouseenter', (e) => this.handleParagraphHover(e));
      p.addEventListener('mouseleave', (e) => this.handleParagraphLeave(e));
    });
  }

  private initializeBlockIds(editor: HTMLElement): void {
    const paragraphs = editor.querySelectorAll('p');
    paragraphs.forEach((p, index) => {
      if (!p.hasAttribute('data-block-id')) {
        p.setAttribute('data-block-id', `block-${Date.now()}-${index}`);
      }
    });
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.currentEditor) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      this.hideToolbar();
      return;
    }

    // Check if selection is within current editor
    const range = selection.getRangeAt(0);
    if (!this.currentEditor.contains(range.commonAncestorContainer)) {
      return;
    }

    this.showInlineToolbar(selection, e);
  }

  private handleEditorMouseUp(e: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Long press detection
    let startTime = Date.now();
    const mouseDownHandler = () => {
      startTime = Date.now();
    };
    
    const mouseUpHandler = () => {
      const duration = Date.now() - startTime;
      if (duration >= 600 && !selection.isCollapsed) {
        this.srWrapSelection({ emotion: 'stress', intent: null });
        this.hideToolbar();
      }
    };

    e.target?.addEventListener('mousedown', mouseDownHandler, { once: true });
    e.target?.addEventListener('mouseup', mouseUpHandler, { once: true });
  }

  private showInlineToolbar(selection: Selection, e: MouseEvent): void {
    if (!this.toolbar) {
      this.createToolbar();
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    
    if (this.toolbar) {
      this.toolbar.style.display = 'block';
      this.toolbar.style.left = `${rect.left + rect.width / 2}px`;
      this.toolbar.style.top = `${rect.top - 40}px`;
    }
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'sr-toolbar mac-window';
    this.toolbar.style.cssText = `
      position: fixed;
      z-index: 1000;
      display: none;
      padding: 4px;
      background: var(--mac-gray);
      border: 1px solid var(--mac-black);
      font-family: "ChicagoFLF", Monaco, monospace;
      font-size: 9px;
    `;

    const emotions = [
      { key: 'stress', label: 'Stress', color: '#ff4444' },
      { key: 'anger', label: 'Anger', color: '#ff6600' },
      { key: 'sad', label: 'Sad', color: '#4444ff' },
      { key: 'highlight', label: 'Highlight', color: '#ffff00' },
      { key: 'trash', label: 'Trash Later', color: '#888888' }
    ];

    emotions.forEach(emotion => {
      const btn = document.createElement('button');
      btn.textContent = emotion.label;
      btn.className = 'mac-button';
      btn.style.cssText = `
        margin: 0 2px;
        padding: 2px 6px;
        font-size: 8px;
        background: ${emotion.color};
        color: ${emotion.key === 'highlight' ? '#000' : '#fff'};
      `;
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const intent = emotion.key === 'trash' ? 'trash' : null;
        const emotionType = emotion.key === 'trash' ? 'stress' : emotion.key as any;
        
        this.srWrapSelection({ emotion: emotionType, intent });
        this.hideToolbar();
      });
      
      this.toolbar.appendChild(btn);
    });

    document.body.appendChild(this.toolbar);
  }

  srWrapSelection({ emotion, intent }: { emotion: string; intent?: string | null }): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !this.currentEditor) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // Normalize selection to contiguous text
    if (this.isMultiNodeSelection(range)) {
      this.showToast('Please select text within a single paragraph');
      return;
    }

    // Create highlight span
    const span = document.createElement('span');
    span.className = 'sr-hl';
    span.setAttribute('data-emotion', emotion);
    if (intent) span.setAttribute('data-intent', intent);
    
    const highlightId = `hl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    span.setAttribute('data-id', highlightId);
    
    // Get text offsets relative to editor
    const editorText = this.currentEditor?.textContent || '';
    const start = this.currentEditor ? this.getTextOffset(this.currentEditor, range.startContainer, range.startOffset) : 0;
    const end = start + selectedText.length;

    try {
      range.surroundContents(span);
      selection.removeAllRanges();
      
      // Persist highlight
      this.persistHighlight({
        id: highlightId,
        entryId: this.getCurrentEntryId(),
        type: 'range',
        start,
        end,
        emotion: emotion as any,
        intent: intent as any,
        state: 'new',
        createdAt: Date.now()
      });

      // Add to queue
      this.addToQueue(highlightId, emotion);
      
      this.showToast(`Marked as ${emotion}`, 'success');
      
    } catch (error) {
      console.error('Error wrapping selection:', error);
      this.showToast('Could not tag selection');
    }
  }

  private handleParagraphHover(e: MouseEvent): void {
    const paragraph = e.target as HTMLElement;
    if (!paragraph.matches('p')) return;

    // Show flag in left gutter
    this.showParagraphFlag(paragraph);
  }

  private handleParagraphLeave(e: MouseEvent): void {
    this.hideParagraphFlag();
  }

  private showParagraphFlag(paragraph: HTMLElement): void {
    const flag = document.querySelector('.sr-paragraph-flag') as HTMLElement;
    if (flag) flag.remove();

    const flagEl = document.createElement('div');
    flagEl.className = 'sr-paragraph-flag';
    flagEl.textContent = '⚑';
    flagEl.style.cssText = `
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 16px;
      color: var(--mac-black);
      z-index: 100;
    `;

    flagEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.showEmotionMenu(paragraph, e);
    });

    paragraph.style.position = 'relative';
    paragraph.appendChild(flagEl);
  }

  private hideParagraphFlag(): void {
    const flag = document.querySelector('.sr-paragraph-flag');
    if (flag) flag.remove();
  }

  private showEmotionMenu(paragraph: HTMLElement, e: MouseEvent): void {
    const menu = document.createElement('div');
    menu.className = 'sr-emotion-menu mac-window';
    menu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      z-index: 1001;
      padding: 4px;
      background: var(--mac-white);
      border: 1px solid var(--mac-black);
    `;

    const emotions = ['stress', 'anger', 'sad', 'anxious', 'highlight'];
    emotions.forEach(emotion => {
      const item = document.createElement('div');
      item.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
      item.className = 'sr-menu-item';
      item.style.cssText = `
        padding: 4px 8px;
        cursor: pointer;
        font-family: "ChicagoFLF", Monaco, monospace;
        font-size: 9px;
      `;
      
      item.addEventListener('click', () => {
        this.srTagBlock(paragraph, emotion);
        menu.remove();
      });
      
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    
    // Remove menu on outside click
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  srTagBlock(blockEl: HTMLElement, emotion: string): void {
    const blockId = blockEl.getAttribute('data-block-id');
    if (!blockId) return;

    blockEl.classList.add(`sr-block-tag--${emotion}`);
    
    const highlightId = `hl_block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.persistHighlight({
      id: highlightId,
      entryId: this.getCurrentEntryId(),
      type: 'block',
      blockId,
      emotion: emotion as any,
      state: 'new',
      createdAt: Date.now()
    });

    this.addToQueue(highlightId, emotion);
    this.showToast(`Paragraph marked as ${emotion}`, 'success');
  }

  private handleContextMenu(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.matches('.sr-hl')) return;

    e.preventDefault();
    this.showHighlightContextMenu(target, e);
  }

  private showHighlightContextMenu(highlight: HTMLElement, e: MouseEvent): void {
    if (this.contextMenu) this.contextMenu.remove();

    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'sr-context-menu mac-window';
    this.contextMenu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      z-index: 1001;
      padding: 4px;
      background: var(--mac-white);
      border: 1px solid var(--mac-black);
    `;

    const actions = [
      { label: 'Remove Tag', action: 'remove' },
      { label: 'Trash Later', action: 'trash' },
      { label: 'Shred Later', action: 'shred' }
    ];

    actions.forEach(({ label, action }) => {
      const item = document.createElement('div');
      item.textContent = label;
      item.className = 'sr-menu-item';
      item.style.cssText = `
        padding: 4px 8px;
        cursor: pointer;
        font-family: "ChicagoFLF", Monaco, monospace;
        font-size: 9px;
      `;
      
      item.addEventListener('click', () => {
        const highlightId = highlight.getAttribute('data-id');
        if (highlightId) {
          if (action === 'remove') {
            this.srRemoveTag(highlightId);
          } else {
            this.updateHighlightIntent(highlightId, action);
          }
        }
        this.contextMenu?.remove();
      });
      
      this.contextMenu.appendChild(item);
    });

    document.body.appendChild(this.contextMenu);
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.hideToolbar();
      this.contextMenu?.remove();
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.sr-toolbar') && !target.closest('.sr-context-menu')) {
      this.hideToolbar();
      this.contextMenu?.remove();
    }
  }

  // Storage methods
  private persistHighlight(highlight: Omit<SRHighlight, 'id'> & { id: string }): void {
    const highlights = this.getHighlights();
    highlights.push(highlight);
    localStorage.setItem('sr_highlights', JSON.stringify(highlights));
  }

  private getHighlights(): SRHighlight[] {
    const stored = localStorage.getItem('sr_highlights');
    return stored ? JSON.parse(stored) : [];
  }

  private addToQueue(highlightId: string, emotion: string): void {
    const queue = this.getQueue();
    const queueItem: SRQueueItem = {
      id: `aq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      highlightId,
      entryId: this.getCurrentEntryId(),
      emotion,
      state: 'queued'
    };
    
    queue.push(queueItem);
    localStorage.setItem('sr_queue', JSON.stringify(queue));
    this.updateStressInbox();
  }

  private getQueue(): SRQueueItem[] {
    const stored = localStorage.getItem('sr_queue');
    return stored ? JSON.parse(stored) : [];
  }

  srRemoveTag(id: string): void {
    // Remove highlight element
    const highlightEl = document.querySelector(`[data-id="${id}"]`);
    if (highlightEl && highlightEl.parentNode) {
      const parent = highlightEl.parentNode;
      while (highlightEl.firstChild) {
        parent.insertBefore(highlightEl.firstChild, highlightEl);
      }
      highlightEl.remove();
    }

    // Remove from storage
    const highlights = this.getHighlights().filter(h => h.id !== id);
    localStorage.setItem('sr_highlights', JSON.stringify(highlights));

    // Remove from queue
    const queue = this.getQueue().filter(q => q.highlightId !== id);
    localStorage.setItem('sr_queue', JSON.stringify(queue));

    this.updateStressInbox();
    this.showToast('Tag removed', 'success');
  }

  private updateHighlightIntent(id: string, intent: string): void {
    const highlights = this.getHighlights();
    const highlight = highlights.find(h => h.id === id);
    if (highlight) {
      highlight.intent = intent as any;
      localStorage.setItem('sr_highlights', JSON.stringify(highlights));
      
      // Update visual indicator
      const highlightEl = document.querySelector(`[data-id="${id}"]`);
      if (highlightEl) {
        highlightEl.setAttribute('data-intent', intent);
      }
      
      this.showToast(`Marked for ${intent}`, 'success');
    }
  }

  // Process actions
  srProcessAction(highlightId: string, action: string): void {
    const highlights = this.getHighlights();
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    // Update highlight state
    highlight.state = 'processed';
    highlight.action = action as any;
    highlight.processedAt = Date.now();

    // Store undo data
    this.undoStack.push({
      action: 'process',
      data: { highlightId, previousState: 'new', previousAction: null }
    });

    // Apply visual effect
    const highlightEl = document.querySelector(`[data-id="${highlightId}"]`);
    if (highlightEl) {
      switch (action) {
        case 'shred':
          highlightEl.classList.add('sr-shredded');
          break;
        case 'trash':
          highlightEl.classList.add('sr-trashed');
          break;
        case 'stamp':
          highlightEl.classList.add('sr-stamped');
          break;
      }
    }

    // Update queue
    const queue = this.getQueue();
    const queueItem = queue.find(q => q.highlightId === highlightId);
    if (queueItem) {
      queueItem.state = 'done';
    }

    // Save changes
    localStorage.setItem('sr_highlights', JSON.stringify(highlights));
    localStorage.setItem('sr_queue', JSON.stringify(queue));
    
    this.updateStressInbox();
    this.showToast(`Item ${action}ed`, 'success');
  }

  // UI Methods
  private hideToolbar(): void {
    if (this.toolbar) {
      this.toolbar.style.display = 'none';
    }
  }

  private showToast(message: string, type: 'success' | 'error' = 'error'): void {
    const toast = document.createElement('div');
    toast.className = 'sr-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1002;
      padding: 8px 12px;
      background: ${type === 'success' ? '#90EE90' : '#FFB6C1'};
      color: var(--mac-black);
      border: 1px solid var(--mac-black);
      font-family: "ChicagoFLF", Monaco, monospace;
      font-size: 9px;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Utility methods
  private isMultiNodeSelection(range: Range): boolean {
    return range.startContainer !== range.endContainer;
  }

  private getTextOffset(editor: HTMLElement, node: Node, offset: number): number {
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      null
    );

    let textOffset = 0;
    let currentNode;

    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }

    return textOffset;
  }

  private getCurrentEntryId(): string {
    // Get entry ID from the editor element or current context
    return this.currentEditor?.getAttribute('data-entry-id') || `entry_${Date.now()}`;
  }

  private restoreHighlights(editor: HTMLElement): void {
    const entryId = this.getCurrentEntryId();
    const highlights = this.getHighlights().filter(h => h.entryId === entryId);
    
    // Restore range highlights
    highlights.filter(h => h.type === 'range').forEach(highlight => {
      // Implementation would restore highlights based on text offsets
      // This is complex and would need careful text reconstruction
    });

    // Restore block highlights
    highlights.filter(h => h.type === 'block').forEach(highlight => {
      const blockEl = editor.querySelector(`[data-block-id="${highlight.blockId}"]`);
      if (blockEl) {
        blockEl.classList.add(`sr-block-tag--${highlight.emotion}`);
      }
    });
  }

  private updateStressInbox(): void {
    // This will be implemented with the sidebar component
    const event = new CustomEvent('sr-queue-updated');
    document.dispatchEvent(event);
  }

  private checkTrashDay(): void {
    const lastReview = localStorage.getItem('sr_lastReview');
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (!lastReview || (now - parseInt(lastReview)) >= sevenDays) {
      const queue = this.getQueue().filter(q => q.state === 'queued');
      if (queue.length > 0) {
        this.showTrashDayBanner();
      }
    }
  }

  private showTrashDayBanner(): void {
    const banner = document.createElement('div');
    banner.className = 'sr-trash-day-banner';
    banner.innerHTML = `
      <div style="background: #FFE4B5; padding: 8px; border: 1px solid var(--mac-black); margin: 8px;">
        <span style="font-family: 'ChicagoFLF', Monaco, monospace; font-size: 9px;">
          🗑️ Trash Day! You have unprocessed emotional tags.
        </span>
        <button class="mac-button" style="margin-left: 8px; font-size: 8px;">Process Now</button>
        <button class="mac-button" style="margin-left: 4px; font-size: 8px;">Snooze</button>
      </div>
    `;

    const processBtn = banner.querySelector('button:first-of-type');
    const snoozeBtn = banner.querySelector('button:last-of-type');

    processBtn?.addEventListener('click', () => {
      this.showPostEntryRitual();
      banner.remove();
    });

    snoozeBtn?.addEventListener('click', () => {
      localStorage.setItem('sr_lastReview', Date.now().toString());
      banner.remove();
    });

    document.body.insertBefore(banner, document.body.firstChild);
  }

  showPostEntryRitual(): void {
    const queue = this.getQueue().filter(q => q.state === 'queued');
    if (queue.length === 0) return;

    const modal = document.createElement('div');
    modal.className = 'sr-ritual-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const window = document.createElement('div');
    window.className = 'mac-window';
    window.style.cssText = `
      width: 400px;
      padding: 16px;
      background: var(--mac-gray);
    `;

    window.innerHTML = `
      <div class="mac-window-title-bar" style="margin: -16px -16px 12px -16px;">
        <span>Post-Entry Ritual</span>
      </div>
      <p style="font-family: 'ChicagoFLF', Monaco, monospace; font-size: 9px; margin-bottom: 12px;">
        You marked ${queue.length} stressful spot${queue.length > 1 ? 's' : ''} — process them now?
      </p>
      <div style="text-align: right;">
        <button class="mac-button sr-process-now" style="margin-right: 8px;">Process Now</button>
        <button class="mac-button sr-process-later">Later</button>
      </div>
    `;

    const processNowBtn = window.querySelector('.sr-process-now');
    const processLaterBtn = window.querySelector('.sr-process-later');

    processNowBtn?.addEventListener('click', () => {
      modal.remove();
      this.showProcessScreen();
    });

    processLaterBtn?.addEventListener('click', () => {
      modal.remove();
    });

    modal.appendChild(window);
    document.body.appendChild(modal);
  }

  private showProcessScreen(): void {
    // Implementation for the retro-styled process screen
    // This will show queued items grouped by emotion with action buttons
    console.log('Process screen would open here');
  }
}

// Initialize CSS styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .sr-hl {
    position: relative;
    padding: 1px 2px;
    margin: 0 1px;
    border-radius: 2px;
  }
  
  .sr-hl[data-emotion="stress"] { background: rgba(255, 68, 68, 0.3); }
  .sr-hl[data-emotion="anger"] { background: rgba(255, 102, 0, 0.3); }
  .sr-hl[data-emotion="sad"] { background: rgba(68, 68, 255, 0.3); }
  .sr-hl[data-emotion="anxious"] { background: rgba(255, 165, 0, 0.3); }
  .sr-hl[data-emotion="highlight"] { background: rgba(255, 255, 0, 0.5); }
  
  .sr-hl[data-intent="trash"]:after {
    content: "🗑";
    font-size: 8px;
    margin-left: 2px;
  }
  
  .sr-hl[data-intent="shred"]:after {
    content: "✂";
    font-size: 8px;
    margin-left: 2px;
  }
  
  .sr-shredded {
    filter: blur(1px);
    opacity: 0.5;
    text-decoration: line-through;
  }
  
  .sr-trashed {
    opacity: 0.3;
    height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
  
  .sr-stamped:after {
    content: "VOID";
    position: absolute;
    top: -2px;
    right: -2px;
    background: red;
    color: white;
    font-size: 6px;
    padding: 1px 2px;
    transform: rotate(15deg);
  }
  
  .sr-block-tag--stress { border-left: 3px solid #ff4444; }
  .sr-block-tag--anger { border-left: 3px solid #ff6600; }
  .sr-block-tag--sad { border-left: 3px solid #4444ff; }
  .sr-block-tag--anxious { border-left: 3px solid #ffaa00; }
  .sr-block-tag--highlight { border-left: 3px solid #ffff00; }
  
  .sr-menu-item:hover {
    background: var(--mac-black);
    color: var(--mac-white);
  }
`;

document.head.appendChild(styleSheet);

// Export for global use
(window as any).StressReliefSystem = StressReliefSystem;