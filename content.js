(function () {
  // =====================
  //   STATE & CONSTANTS
  // =====================
  let state = { folders: [], chatToFolder: {}, chatMetadata: {}, chatNotes: {} };
  let activeMenuChat = null;
  let isUpdatingDOM = false;
  let lastRenderKey = '';
  let activeChatsMap = {};
  
  let currentChatId = null;
  let lastModelResponseCount = 0;
  let isDraggingMinimap = false;

  const updateSaveStatus = (status) => {
    const statusEl = document.getElementById('aura-notes-save-status');
    if (!statusEl) return;
    
    // Clear old classes
    statusEl.className = 'aura-notes-save-indicator';
    statusEl.innerHTML = '';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'aura-save-icon';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'aura-save-text';
    
    if (status === 'autosave') {
      iconSpan.innerHTML = `<svg class="aura-icon-cloud" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-3.64-3.5-3.64-3.5C16.64 8.9 14 7 11 7c-4 0-7 3-7 7 0 .34.04.67.1 1a4.5 4.5 0 0 0 8.4 2.5"/></svg>`;
      textSpan.textContent = 'Tự động lưu';
      statusEl.appendChild(iconSpan);
      statusEl.appendChild(textSpan);
      statusEl.style.opacity = '0.7';
    } else if (status === 'saving') {
      iconSpan.innerHTML = `<div class="aura-spinner-classic"></div>`;
      textSpan.textContent = 'Đang lưu...';
      statusEl.appendChild(iconSpan);
      statusEl.appendChild(textSpan);
      statusEl.style.opacity = '1';
    } else if (status === 'saved') {
      iconSpan.innerHTML = `<svg class="aura-icon-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      textSpan.textContent = 'Đã lưu';
      statusEl.appendChild(iconSpan);
      statusEl.appendChild(textSpan);
      statusEl.style.opacity = '1';
      statusEl.classList.add('saved');
      
      setTimeout(() => {
        statusEl.style.opacity = '0.7';
      }, 1000);
    }
  };

  const showAuraToast = (message, type = 'success') => {
    document.getElementById('aura-global-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'aura-global-toast';
    toast.className = `aura-dynamic-toast ${type}`;
    const icon = type === 'success' ? '✓' : '✗';
    toast.innerHTML = `
      <span class="aura-toast-icon">${icon}</span>
      <span class="aura-toast-message">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  const ensureDraggableItems = (editorEl) => {
    if (!editorEl) return;
    editorEl.querySelectorAll('img, .aura-note-file-card').forEach(item => {
      if (item.getAttribute('draggable') !== 'true') {
        item.setAttribute('draggable', 'true');
      }
    });
  };

  const translations = {
    vi: {
      notePlaceholderGlobal: 'Ghi chú toàn cục dùng chung cho tất cả... Dán (Ctrl+V) hoặc kéo thả ảnh, tệp tin (Zip, PDF, Word, Audio, Video...) vào đây!',
      notePlaceholderSingle: 'Ghi chú nhanh cho cuộc hội thoại này... Dán (Ctrl+V) hoặc kéo thả ảnh, tệp tin (Zip, PDF, Word, Audio, Video...) vào đây!',
      notePlaceholderNone: 'Hãy chọn một cuộc hội thoại để bắt đầu viết ghi chú!',
      outlineEmptySelect: 'Hãy chọn một cuộc hội thoại để xem dàn ý!',
      outlineEmptyList: 'Hội thoại chưa có câu hỏi hoặc trả lời nào.',
      optBtnTooltip: 'Tối ưu hóa prompt nháp bằng Vaxlou AI',
      toastNoKeyTitle: 'Chưa cấu hình API Key!',
      toastNoKeyDesc: 'Vui lòng nhập Gemini API Key trong Cài đặt của Vaxlou Center để kích hoạt tính năng này.',
      optBtnTitleOptimizing: 'Đang tối ưu hóa prompt bằng AI... ⏳',
      optBtnTitleNormal: 'Tối ưu hóa Prompt thông minh (Vaxlou Optimizer)',
      optErrorExtension: 'Lỗi kết nối tiện ích: ',
      optErrorFailed: 'Lỗi tối ưu hóa prompt: ',
      optErrorNoConnection: 'Không thể kết nối đến Gemini API',
      optErrorEmptyInput: 'Vui lòng nhập nội dung nháp vào khung chat trước khi tối ưu hóa! ✍️',
      optBtnOptimizing: 'Đang tối ưu...',
      optStatusDone: 'Đã tối ưu!',
      optStatusFailed: 'Lỗi tối ưu!',
      ctxCopyImage: 'Sao chép ảnh',
      ctxCutImage: 'Cắt ảnh',
      ctxDeleteImage: 'Xóa ảnh',
      toastCopiedImageSuccess: 'Đã sao chép ảnh vào bộ nhớ tạm! 📋',
      toastCutImageSuccess: 'Đã cắt ảnh vào bộ nhớ tạm! ✂️',
      toastCopiedImageError: 'Không thể sao chép ảnh.',
      toastDeletedImageSuccess: 'Đã xóa ảnh! 🗑️',
      noteClearConfirm: 'Xóa sạch ghi chú này?',
      noteCopiedBtn: 'Đã chép! ✓',
      noteCopyBtn: 'Sao chép',
      noteSaving: 'Đang lưu...',
      noteSaved: 'Đã lưu ✓',
      noteSelectChatFirst: 'Hãy chọn một cuộc hội thoại để ghi chú...',
      folderCtxCreateSub: 'Tạo thư mục con',
      folderCtxRename: 'Đổi tên',
      folderCtxExpandAll: 'Mở rộng tất cả',
      folderCtxCollapseAll: 'Thu gọn tất cả',
      folderCtxDeleteDir: 'Xóa thư mục',
      folderPromptSub: 'Tên thư mục con:',
      folderPromptRename: 'Đổi tên:',
      folderConfirmDeleteDir: 'Xóa thư mục "{name}"? Tất cả thư mục con và hội thoại bên trong sẽ trở về danh sách chung.',
      settingsStatusTesting: 'Đang kết nối thử nghiệm... ⏳',
      settingsStatusConnectionError: 'Kết nối thất bại. Lỗi: ',
      settingsStatusConnectionSuccess: 'Kết nối thành công! API hoạt động hoàn hảo. 🟢',
      settingsStatusSuccess: 'Đã lưu cấu hình thành công! ✨'
    }
  };

  const applyLanguage = () => {
    const t = translations.vi;

    // 1. Dynamic placeholders based on current state
    const editor = document.getElementById('aura-notes-editor');
    if (editor) {
      const scopeChk = document.getElementById('aura-note-scope-chk');
      const isGlobal = scopeChk ? !scopeChk.checked : true;
      if (isGlobal) {
        editor.setAttribute('placeholder', t.notePlaceholderGlobal);
      } else {
        if (currentChatId) {
          editor.setAttribute('placeholder', t.notePlaceholderSingle);
        } else {
          editor.setAttribute('placeholder', t.notePlaceholderNone);
        }
      }
    }

    // 2. Outline list placeholder
    const listEl = document.getElementById('aura-outline-list');
    if (listEl && listEl.querySelector('.aura-outline-empty')) {
      const emptyEl = listEl.querySelector('.aura-outline-empty');
      if (currentChatId) {
        emptyEl.textContent = t.outlineEmptyList;
      } else {
        emptyEl.textContent = t.outlineEmptySelect;
      }
    }

    // 3. Prompt Optimizer Button tooltip
    const optBtn = document.getElementById('aura-prompt-optimizer-btn');
    if (optBtn) {
      const curText = (optBtn.textContent || '').trim();
      if (curText === '✨' || curText === t.optBtnTooltip || curText === 'Tối ưu hóa prompt nháp bằng Vaxlou AI') {
        optBtn.title = t.optBtnTooltip;
      }
    }

    // 4. Set saving status back to default (Autosave indicator)
    const saveStatus = document.getElementById('aura-notes-save-status');
    if (saveStatus) {
      updateSaveStatus('autosave');
    }
  };

  const getFolderColor = folder => {
    return '#9ca3af';
  };

  const SVG = {
    folder: (color = 'currentColor', open = false) => open
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h20M2 5h6l2 3h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    chat: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    plus: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    trash: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    edit: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
    close: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    menu: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`,
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    scroll: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`
  };

  // =====================
  //   STORAGE
  // =====================
  const loadState = () => new Promise(resolve => {
    chrome.storage.local.get(['gemini_aura_organizer_data'], result => {
      if (result.gemini_aura_organizer_data) {
        state = result.gemini_aura_organizer_data;
        if (!state.folders)      state.folders = [];
        if (!state.chatToFolder) state.chatToFolder = {};
        if (!state.chatMetadata) state.chatMetadata = {};
        if (!state.chatNotes)    state.chatNotes = {};
        
        if (!state.settings) {
          state.settings = { uiLanguage: 'vi' };
        }
        state.settings.uiLanguage = 'vi';
        
        // Migrate to multi-key settings if not exists
        if (!state.settings.apiKeys || !Array.isArray(state.settings.apiKeys)) {
          state.settings.apiKeys = [
            { key: state.settings.apiKey || '', model: state.settings.model || 'gemini-3.1-flash-lite' },
            { key: '', model: 'gemini-3.1-flash-lite' }
          ];
        }
        while (state.settings.apiKeys.length < 2) {
          state.settings.apiKeys.push({ key: '', model: 'gemini-3.1-flash-lite' });
        }
        if (state.settings.apiKeys.length > 2) {
          state.settings.apiKeys = state.settings.apiKeys.slice(0, 2);
        }
        if (typeof state.settings.activeKeyIndex !== 'number' || state.settings.activeKeyIndex < 0 || state.settings.activeKeyIndex >= 2) {
          state.settings.activeKeyIndex = 0;
        }
        
        saveState();

        // Migration: parentId and stripping emojis
        state.folders.forEach(f => {
          if (!('parentId' in f)) f.parentId = null;
          f.name = f.name.replace(/\s*[💼📚🌱]$/, '').trim();
        });
      } else {
        state.folders = [
          { id: 'f_work',     name: 'Công việc', parentId: null, collapsed: false },
          { id: 'f_study',    name: 'Học tập',   parentId: null, collapsed: false },
          { id: 'f_personal', name: 'Cá nhân',   parentId: null, collapsed: false },
        ];
        state.chatToFolder = {};
        state.chatMetadata = {};
        state.chatNotes = {};
        state.settings = {
          uiLanguage: 'vi',
          apiKeys: [
            { key: '', model: 'gemini-3.1-flash-lite' },
            { key: '', model: 'gemini-3.1-flash-lite' }
          ],
          activeKeyIndex: 0,
          enableFollowups: true,
          enableOptimizer: true
        };
        saveState();
      }
      resolve();
    });
  });

  const saveState = () => chrome.storage.local.set({ gemini_aura_organizer_data: state });

  // =====================
  //   DOM DETECTION
  // =====================
  const findChatLinks = () => {
    const nav = document.querySelector('nav, [role="navigation"], aside, [class*="sidebar"], [class*="navigation"]');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('a[href*="/app/"], a[href*="/c/"]'))
      .filter(l =>
        !l.classList.contains('aura-chat-item') &&
        !l.closest('#aura-folders-section') &&
        !l.closest('#gb') &&
        !l.closest('[class*="OneGoogleBar"]') &&
        !l.closest('header') &&
        !l.closest('#aura-right-drawer')
      );
  };

  const getChatId = href => {
    if (!href) return null;
    const m = href.match(/\/(app|c)\/([a-zA-Z0-9_-]+)/);
    return m ? m[2] : null;
  };

  const getChatRowWrapper = link => {
    let curr = link;
    while (curr && curr.parentElement) {
      if (curr.tagName === 'LI' || curr.getAttribute('role') === 'listitem' || curr.parentElement.getAttribute('role') === 'list') return curr;
      curr = curr.parentElement;
    }
    return link;
  };

  function isSectionMisplaced() {
    const s = document.getElementById('aura-folders-section');
    if (!s) return false;
    if (s.closest('#gb') || s.closest('[class*="OneGoogleBar"]') || s.closest('header')) return true;
    
    const container = getHistoryListContainer();
    if (!container) return false;
    
    const target = getInjectionTarget(container);
    const expectedParent = (target && target.parent) ? target.parent : container;
    
    if (s.parentElement !== expectedParent) {
      return true;
    }
    return false;
  }

  const getHistoryListContainer = () => {
    const links = findChatLinks();
    if (links.length > 0) {
      const firstRow = getChatRowWrapper(links[0]);
      if (firstRow && firstRow.parentElement) return firstRow.parentElement;
    }
    return document.querySelector('nav ul[role="list"]')
        || document.querySelector('nav [class*="conversation"]')
        || document.querySelector('nav')
        || document.querySelector('[role="navigation"]')
        || document.querySelector('aside')
        || document.querySelector('[class*="sidebar"] ul')
        || document.querySelector('[class*="sidebar"]');
  };

  const getInjectionTarget = container => {
    const nav = container.closest('nav, [role="navigation"], aside, [class*="sidebar"], [class*="navigation"]')
             || document.querySelector('nav, [role="navigation"], aside, [class*="sidebar"], [class*="navigation"]');
    if (nav) {
      if (container && nav.contains(container)) {
        if (container.tagName === 'NAV' || container.tagName === 'ASIDE') {
          return { parent: container, reference: container.firstChild };
        }
        if (container.parentElement === nav) {
          return { parent: nav, reference: container };
        }
        let curr = container;
        while (curr && curr.parentElement && curr.parentElement !== nav) {
          curr = curr.parentElement;
        }
        if (curr && curr.parentElement === nav) {
          return { parent: nav, reference: curr };
        }
      }
      return { parent: nav, reference: nav.firstChild };
    }
    return { parent: container.parentElement || document.body, reference: container };
  };

  // Helper for scrolling chat
  const getChatScrollContainer = () => {
    const firstQuery = document.querySelector('user-query');
    if (!firstQuery) return null;
    let parent = firstQuery.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return document.querySelector('main') || window;
  };

  // Helper to determine if an img element is a user-content image (e.g. in notes editor, chat messages, or uploads)
  const isContentImage = (img) => {
    if (!img) return false;
    // Skip very small images (like tiny action icons, user avatar badges, or reaction widgets)
    const rect = (img && typeof img.getBoundingClientRect === 'function')
      ? img.getBoundingClientRect()
      : { width: 100, height: 100 };
    if (rect.width > 0 && rect.width < 24) return false;
    if (rect.height > 0 && rect.height < 24) return false;
    
    // Exclude Google header bar elements
    if (img.closest('#gb, .gb_a, header')) return false;
    return true;
  };

  // Time formatter
  const getRelativeTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 0) return 'vừa xong';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins}m trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h trước`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hôm qua';
    if (days < 30) return `${days} ngày trước`;
    return new Date(ts).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  // =====================
  //   INJECT SECTION
  // =====================
  const injectFoldersSection = () => {
    isUpdatingDOM = true;
    try {
      if (isSectionMisplaced()) {
        const existing = document.getElementById('aura-folders-section');
        if (existing) existing.remove();
      }

      const container = getHistoryListContainer();
      if (!container) return;

      // Bulletproof slide-out folder error fix: dynamically check if sidebar container is visually collapsed
      const sidebarEl = container.closest('nav, [role="navigation"], aside, [class*="sidebar"]') || container;
      const rect = (sidebarEl && typeof sidebarEl.getBoundingClientRect === 'function')
        ? sidebarEl.getBoundingClientRect()
        : { width: 260, height: 500 };
      const isSidebarCollapsed = rect.width < 150 || rect.height === 0 || (sidebarEl && window.getComputedStyle(sidebarEl).display === 'none');

      let section = document.getElementById('aura-folders-section');
      if (isSidebarCollapsed) {
        if (section) {
          if (section.style && typeof section.style.setProperty === 'function') {
            section.style.setProperty('display', 'none', 'important');
          } else if (section.style) {
            section.style.display = 'none';
          }
        }
        return;
      }

      if (!section) {
        section = document.createElement('div');
        section.id = 'aura-folders-section';

        const target = getInjectionTarget(container);
        if (target && target.parent && !target.parent.closest('#gb') && !target.parent.closest('[class*="OneGoogleBar"]')) {
          target.parent.insertBefore(section, target.reference);
        } else {
          container.prepend(section);
        }
      } else {
        if (section.style && typeof section.style.setProperty === 'function') {
          section.style.setProperty('display', 'block', 'important');
        } else if (section.style) {
          section.style.display = 'block';
        }
      }

      renderFolders(section);
    } catch (err) {
      console.error('[Vaxlou] injectFoldersSection error:', err);
    } finally {
      setTimeout(() => { isUpdatingDOM = false; }, 50);
    }
  };

  // =====================
  //   TREE HELPERS
  // =====================
  const getFolderKids = (parentId) =>
    state.folders.filter(f => f.parentId === (parentId || null));

  const getChatsInFolder = (folderId) => {
    const currentURL = window.location.pathname;
    return Object.keys(state.chatToFolder)
      .filter(cid => state.chatToFolder[cid] === folderId)
      .map(cid => {
        const a = activeChatsMap[cid];
        const s = state.chatMetadata?.[cid];
        if (a) return { ...a };
        if (s) return { ...s, isActive: currentURL.includes(cid) };
        return null;
      }).filter(Boolean);
  };

  // Recursive HTML builder for one folder node
  const buildFolderHTML = (folder, depth, isLastChild = false) => {
    const color = getFolderColor(folder);
    const rowPad  = 12 + depth * 16;
    const chatPad = rowPad + 26; // Mathematically aligns with folder label (icon 16px + margin 10px)
    const treeIndent = rowPad + 8;
    const subFolders = getFolderKids(folder.id);
    const chats = getChatsInFolder(folder.id);

    const isOpen = !folder.collapsed;
    let html = `
      <div class="aura-folder-row ${isLastChild ? 'aura-last-child' : ''}" data-folder-id="${folder.id}" data-depth="${depth}" style="padding-left:${rowPad}px">
        <span class="aura-folder-color-icon">${SVG.folder(color, isOpen)}</span>
        <span class="aura-folder-label">${folder.name}</span>
        <div class="aura-folder-row-actions">
          <button class="aura-folder-row-btn more" title="Tùy chọn">${SVG.menu}</button>
        </div>
      </div>
    `;

    if (!folder.collapsed) {
      const parentCenter = 12 + depth * 16 + 8;
      html += `<div class="aura-folder-children" data-parent="${folder.id}" style="--tree-indent:${treeIndent}px; --parent-center-${depth}:${parentCenter}px; --parent-center:${parentCenter}px">`;

      subFolders.forEach((sf, sfIdx) => {
        const isSfLast = (sfIdx === subFolders.length - 1) && (chats.length === 0);
        html += buildFolderHTML(sf, depth + 1, isSfLast);
      });

      if (chats.length === 0 && subFolders.length === 0) {
        html += `<div class="aura-folder-empty-hint aura-last-child" style="padding-left:${chatPad}px">Kéo hội thoại vào đây</div>`;
      } else {
        chats.forEach((chat, chatIdx) => {
          const isChatLast = (chatIdx === chats.length - 1);
          const href  = chat.href || `/app/${chat.id}`;
          const title = (chat.title || 'Không tên').trim();
          const meta = state.chatMetadata?.[chat.id];
          const timeStr = meta && meta.lastActive ? getRelativeTime(meta.lastActive) : '';
          const timeHTML = timeStr ? `<span class="aura-chat-item-time">${timeStr}</span>` : '';
          
          html += `
            <a class="aura-chat-item ${chat.isActive ? 'active' : ''} ${isChatLast ? 'aura-last-child' : ''}" href="${href}" data-id="${chat.id}" style="padding-left:${chatPad}px">
              <span class="aura-chat-item-title-container">
                <span class="aura-chat-item-title">${title}</span>
                ${timeHTML}
              </span>
              <span class="aura-chat-item-remove">${SVG.close}</span>
            </a>`;
        });
      }

      html += `</div>`;
    }

    if (depth === 0) {
      return `<div class="aura-folder-card" data-card-folder-id="${folder.id}">${html}</div>`;
    }
    return html;
  };

  // =====================
  //   RENDER SIDEBAR FOLDERS
  // =====================
  const renderFolders = section => {
    isUpdatingDOM = true;
    try {
      const links = findChatLinks();
      const currentURL = window.location.pathname;

      activeChatsMap = {};
      let metaUpdated = false;
      links.forEach(link => {
        const href = link.getAttribute('href');
        const id   = getChatId(href);
        if (!id) return;
        const ts    = link.querySelector('span') || link;
        const title = (ts.textContent || ts.innerText || '').trim() || 'Hội thoại không tên';
        activeChatsMap[id] = { id, title, href, isActive: currentURL.includes(id), element: link };
        
        if (!state.chatMetadata) state.chatMetadata = {};
        const ex = state.chatMetadata[id];
        if (!ex) {
          state.chatMetadata[id] = { id, title, href, createdAt: Date.now(), lastActive: Date.now(), bookmarks: [] };
          metaUpdated = true;
        } else if (ex.title !== title || ex.href !== href) {
          state.chatMetadata[id].title = title;
          state.chatMetadata[id].href = href;
          metaUpdated = true;
        }
      });
      if (metaUpdated) saveState();

      links.forEach(link => {
        const id  = getChatId(link.getAttribute('href'));
        if (!id) return;
        const row = getChatRowWrapper(link);
        row.style.display = (state.chatToFolder[id] && state.folders.some(f => f.id === state.chatToFolder[id])) ? 'none' : '';
      });

      links.forEach(link => {
        const id  = getChatId(link.getAttribute('href'));
        if (!id) return;
        const row = getChatRowWrapper(link);
        row.setAttribute('draggable', 'true');
        if (!row.dataset.auraDragBound) {
          row.dataset.auraDragBound = 'true';
          row.addEventListener('dragstart', e => {
            const ts = link.querySelector('span') || link;
            e.dataTransfer.setData('application/json', JSON.stringify({ id, title: (ts.textContent||'').trim(), href: link.getAttribute('href') }));
            e.dataTransfer.effectAllowed = 'move';
            row.classList.add('aura-native-dragging');
          });
          row.addEventListener('dragend', () => {
            row.classList.remove('aura-native-dragging');
            document.querySelectorAll('.aura-drag-over').forEach(el => el.classList.remove('aura-drag-over'));
          });
        }
        if (!row.querySelector('.aura-quick-assign-btn')) {
          const btn = document.createElement('button');
          btn.className = 'aura-quick-assign-btn';
          btn.innerHTML = SVG.menu;
          btn.title = 'Gộp vào sổ ghi chú';
          btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); showQuickAssignMenu(btn, id, link); });
          (row.querySelector('div:last-child') || row).appendChild(btn);
        }
      });

      const key = `${getChatId(currentURL)}_${links.length}_${JSON.stringify(state)}`;
      if (key === lastRenderKey && section.innerHTML !== '') { return; }
      lastRenderKey = key;

      const rootFolders = getFolderKids(null);
      let html = `<div class="aura-folders-list" id="aura-folders-list">`;

      rootFolders.forEach(f => { html += buildFolderHTML(f, 0); });

      const addFolderText = 'Thêm thư mục';
      html += `<button class="aura-add-folder-btn" id="aura-add-folder">${SVG.plus}<span>${addFolderText}</span></button>`;
      html += `</div>`;
      section.innerHTML = html;
      bindEvents(section);
      applyLanguage();
    } catch (err) {
      console.error('[Vaxlou] renderFolders error:', err);
    } finally {
      setTimeout(() => { isUpdatingDOM = false; }, 50);
    }
  };

  // =====================
  //   BIND EVENTS
  // =====================
  const bindEvents = section => {
    section.querySelector('#aura-add-folder')?.addEventListener('click', () => {
      const name = prompt('Tên sổ ghi chú mới:');
      if (name?.trim()) {
        state.folders.push({ id: 'f_' + Date.now(), name: name.trim(), parentId: null, collapsed: false });
        saveState(); renderFolders(section);
      }
    });

    section.querySelectorAll('.aura-folder-row').forEach(row => {
      const folderId = row.dataset.folderId;
      const childrenEl = section.querySelector(`.aura-folder-children[data-parent="${folderId}"]`);

      row.addEventListener('click', e => {
        if (e.target.closest('.aura-folder-row-btn')) return;
        const f = state.folders.find(x => x.id === folderId);
        if (f) { f.collapsed = !f.collapsed; saveState(); renderFolders(section); }
      });

      // Open Context Menu on three dots click
      row.querySelector('.more')?.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        showFolderContextMenu(e, folderId);
      });

      // Open Context Menu on Right Click (Standard Context Menu)
      row.addEventListener('contextmenu', e => {
        showFolderContextMenu(e, folderId);
      });

      const makeDrop = (zone) => {
        if (!zone) return;
        zone.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); row.classList.add('aura-drag-over'); });
        zone.addEventListener('dragleave', e => {
          if (!row.contains(e.relatedTarget) && !childrenEl?.contains(e.relatedTarget))
            row.classList.remove('aura-drag-over');
        });
        zone.addEventListener('drop', e => {
          e.preventDefault(); e.stopPropagation(); row.classList.remove('aura-drag-over');
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data?.id) {
              state.chatToFolder[data.id] = folderId;
              if (!state.chatMetadata) state.chatMetadata = {};
              if (!state.chatMetadata[data.id]) {
                state.chatMetadata[data.id] = { id: data.id, title: data.title || 'Không tên', href: data.href || `/app/${data.id}`, createdAt: Date.now(), lastActive: Date.now(), bookmarks: [] };
              }
              const tf = state.folders.find(x => x.id === folderId);
              if (tf) tf.collapsed = false;
              saveState(); renderFolders(section);
            }
          } catch(err) { console.error('[Vaxlou] drop:', err); }
        });
      };
      makeDrop(row);
    });

    section.querySelectorAll('.aura-chat-item').forEach(item => {
      const id = item.dataset.id;
      item.setAttribute('draggable', 'true');
      item.addEventListener('click', e => {
        if (e.target.closest('.aura-chat-item-remove')) return;
        e.preventDefault(); e.stopPropagation();
        const native = activeChatsMap[id]?.element;
        if (native) native.click(); else window.location.href = item.getAttribute('href');
      });
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id, title: item.querySelector('.aura-chat-item-title')?.textContent?.trim(), href: item.getAttribute('href') }));
        item.style.opacity = '0.4';
      });
      item.addEventListener('dragend', () => { item.style.opacity = ''; });
      item.querySelector('.aura-chat-item-remove')?.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        delete state.chatToFolder[id];
        saveState(); renderFolders(section);
      });
    });
  };

  // =====================
  //   QUICK ASSIGN MENU
  // =====================
  const buildFolderMenuItems = (parentId, depth, currentFolderId) => {
    let html = '';
    getFolderKids(parentId).forEach((f, i) => {
      const color = getFolderColor(f);
      const indent = 10 + depth * 14;
      html += `<div class="aura-menu-item ${currentFolderId === f.id ? 'active' : ''}" data-folder-id="${f.id}" style="padding-left:${indent}px">
        ${SVG.folder(color)}<span>${f.name}</span>
      </div>`;
      html += buildFolderMenuItems(f.id, depth + 1, currentFolderId);
    });
    return html;
  };

  const showQuickAssignMenu = (anchorEl, chatId, linkEl) => {
    closeQuickAssignMenu();
    const ts = linkEl.querySelector('span') || linkEl;
    activeMenuChat = { id: chatId, title: (ts.textContent||'').trim(), href: linkEl.getAttribute('href') };
    anchorEl.classList.add('active');

    const menu = document.createElement('div');
    menu.id = 'aura-assign-menu';
    menu.className = 'aura-assign-menu';
    const rect = anchorEl.getBoundingClientRect();
    menu.style.top  = `${rect.bottom + 4}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 192)}px`;

    const curFolderId = state.chatToFolder[chatId];
    const titleText = 'Gộp vào sổ ghi chú';
    const emptyText = 'Chưa có sổ ghi chú nào';
    const removeGroupText = 'Đưa ra ngoài';
    const newFolderText = 'Sổ ghi chú mới...';
    const promptText = 'Tên sổ ghi chú mới:';

    let html = `<div class="aura-menu-title">${titleText}</div>`;

    if (state.folders.length === 0) {
      html += `<div class="aura-menu-item" style="opacity:.5;pointer-events:none">${emptyText}</div>`;
    } else {
      html += buildFolderMenuItems(null, 0, curFolderId);
    }
    if (curFolderId) {
      html += `<div class="aura-menu-divider"></div><div class="aura-menu-item text-danger" data-action="remove">${SVG.close}<span>${removeGroupText}</span></div>`;
    }
    html += `<div class="aura-menu-divider"></div><div class="aura-menu-item" data-action="new">${SVG.plus}<span>${newFolderText}</span></div>`;
    menu.innerHTML = html;
    document.body.appendChild(menu);

    menu.querySelectorAll('.aura-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const fid = item.dataset.folderId, action = item.dataset.action;
        if (fid) {
          state.chatToFolder[chatId] = fid;
          if (!state.chatMetadata) state.chatMetadata = {};
          if (!state.chatMetadata[chatId]) {
            state.chatMetadata[chatId] = { id: activeMenuChat.id, title: activeMenuChat.title, href: activeMenuChat.href, createdAt: Date.now(), lastActive: Date.now(), bookmarks: [] };
          }
          const tf = state.folders.find(x => x.id === fid); if (tf) tf.collapsed = false;
        } else if (action === 'remove') {
          delete state.chatToFolder[chatId];
        } else if (action === 'new') {
          const name = prompt(promptText);
          if (name?.trim()) {
            const newId = 'f_' + Date.now();
            state.folders.push({ id: newId, name: name.trim(), parentId: null, collapsed: false });
            state.chatToFolder[chatId] = newId;
            if (!state.chatMetadata) state.chatMetadata = {};
            state.chatMetadata[chatId] = { id: activeMenuChat.id, title: activeMenuChat.title, href: activeMenuChat.href, createdAt: Date.now(), lastActive: Date.now(), bookmarks: [] };
          }
        }
        saveState(); closeQuickAssignMenu();
        const sec = document.getElementById('aura-folders-section');
        if (sec) renderFolders(sec);
      });
    });

    setTimeout(() => document.addEventListener('click', closeMenuOutside), 10);
  };

  const closeQuickAssignMenu = () => {
    document.getElementById('aura-assign-menu')?.remove();
    document.querySelectorAll('.aura-quick-assign-btn.active').forEach(b => b.classList.remove('active'));
    document.removeEventListener('click', closeMenuOutside);
    activeMenuChat = null;
  };

  const closeMenuOutside = e => {
    if (!e.target.closest('#aura-assign-menu') && !e.target.closest('.aura-quick-assign-btn')) closeQuickAssignMenu();
  };

  // ====================================================
  //   📝 PREMIUM FEATURE: QUICK NOTES & BOOKMARKS DRAWER
  // ====================================================
  // Helper to insert image at the current caret cursor position
  const insertImageAtCursor = (editorEl, dataUrl) => {
    editorEl.focus();

    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'aura-note-attached-img';
    img.setAttribute('draggable', 'true');

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorEl.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(img);

        // Add a space after the image so typing after it works easily
        const space = document.createTextNode('\u00A0');
        img.parentNode.insertBefore(space, img.nextSibling);

        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        editorEl.appendChild(img);
        editorEl.appendChild(document.createTextNode('\u00A0'));
      }
    } else {
      editorEl.appendChild(img);
      editorEl.appendChild(document.createTextNode('\u00A0'));
    }

    editorEl.dispatchEvent(new Event('input'));
  };


  const injectRightDrawer = () => {
    let drawer = document.getElementById('aura-right-drawer');
    if (drawer) return;

    // 1. Create right drawer
    drawer = document.createElement('div');
    drawer.id = 'aura-right-drawer';
    drawer.innerHTML = `
      <div class="aura-drawer-header">
        <div class="aura-drawer-tabs">
          <button class="aura-drawer-tab active" data-tab="notes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Ghi chú
          </button>
          <button class="aura-drawer-tab" data-tab="outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Dàn ý
          </button>
          <button class="aura-drawer-tab" data-tab="settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Cài đặt
          </button>
        </div>
      </div>
      <div class="aura-drawer-body">
        <!-- Notes Tab -->
        <div class="aura-notes-view active" id="aura-notes-view">
          

          <div class="aura-settings-card aura-notes-editor-card" style="flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 250px;">
            <div class="aura-notes-editor-container" style="flex: 1; display: flex; flex-direction: column;">
              <div class="aura-notes-toolbar" id="aura-notes-toolbar">
                <select class="aura-tb-select" id="aura-tb-size" title="Kích cỡ">
                  <option value="2">2</option>
                  <option value="5">5</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="13">13</option>
                  <option value="15">15</option>
                  <option value="16" selected>16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="24">24</option>
                  <option value="32">32</option>
                  <option value="40">40</option>
                  <option value="50">50</option>
                  <option value="60">60</option>
                </select>
                <div class="aura-tb-btn-group">
                  <button class="aura-tb-btn" id="aura-tb-bold" title="In đậm (Ctrl+B)"><b>B</b></button>
                  <button class="aura-tb-btn" id="aura-tb-italic" title="In nghiêng (Ctrl+I)"><i>I</i></button>
                  <button class="aura-tb-btn" id="aura-tb-underline" title="Gạch chân (Ctrl+U)"><u>U</u></button>
                  <button class="aura-tb-btn" id="aura-tb-strike" title="Gạch ngang"><s>S</s></button>
                  <button type="button" class="aura-tb-btn" id="aura-tb-attach" title="Đính kèm tệp tin (Zip, PDF, Word, Audio, Video...)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  <input type="file" id="aura-tb-file-input" style="display: none;" multiple>
                </div>
                <label class="aura-switch vertical" id="aura-tb-scope-toggle" title="Ghi chú theo hội thoại">
                  <input type="checkbox" id="aura-note-scope-chk">
                  <span class="aura-switch-slider"></span>
                </label>
                <div class="aura-tb-color-container" id="aura-tb-color-container" title="Màu chữ">
                  <input type="color" class="aura-tb-color-picker" id="aura-tb-color-picker" value="#ffffff">
                  <input type="text" class="aura-tb-color-hex" id="aura-tb-color-hex" value="#FFFFFF" placeholder="#HEX">
                </div>
                <div class="aura-tb-trash-zone" id="aura-tb-trash-zone">
                  <span class="aura-tb-trash-icon-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </span>
                  <span class="aura-tb-trash-label">Kéo vào đây để xóa</span>
                </div>
              </div>
              <div class="aura-notes-editor" id="aura-notes-editor" contenteditable="true" placeholder="Viết ghi chú nhanh tại đây... Dán (Ctrl+V) hoặc kéo thả ảnh trực tiếp vào đây!"></div>
            </div>
            <div class="aura-notes-actions" style="margin-top: 0; padding-top: 4px;">
              <span class="aura-notes-save-indicator" id="aura-notes-save-status">Tự động lưu...</span>
              <button class="aura-notes-btn" id="aura-note-btn-clear">Xóa sạch</button>
              <button class="aura-notes-btn primary" id="aura-note-btn-copy">Sao chép</button>
            </div>
          </div>
        </div>

        <!-- Outline Tab -->
        <div class="aura-outline-view" id="aura-outline-view">
          <div class="aura-settings-card aura-outline-filter-card" style="margin-bottom: 2px;">
            <div class="aura-settings-field">
              <label class="aura-settings-label">Bộ Lọc Dàn Ý</label>
              <div class="aura-select-wrapper">
                <select id="aura-outline-filter" class="aura-settings-select">
                  <option value="all">Tất cả</option>
                  <option value="prompts">Chỉ câu hỏi của tôi</option>
                  <option value="responses">Chỉ câu trả lời của Gemini</option>
                </select>
              </div>
            </div>
          </div>
          <div class="aura-outline-list-container" style="flex: 1; overflow-y: auto; padding: 4px;">
            <div class="aura-outline-list" id="aura-outline-list">
              <div class="aura-outline-empty">Hãy chọn một cuộc hội thoại để xem dàn ý!</div>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div class="aura-settings-view" id="aura-settings-view">
          <!-- Section 1: API & AI Engine -->
          <div class="aura-settings-section">
            <div class="aura-settings-sec-header">🔑 CẤU HÌNH API KEY</div>
            <div class="aura-settings-slots-container" id="aura-settings-slots-container">
              <!-- Slot 0 -->
              <div class="aura-settings-slot-row active" data-slot="0" id="aura-slot-row-0">
                <div class="aura-settings-slot-header">
                  <label class="aura-slot-radio-label">
                    <input type="radio" name="aura-active-slot" value="0" id="aura-active-slot-0" checked>
                    <span class="aura-slot-title">Khóa 1 (Đang chọn)</span>
                  </label>
                </div>
                <div class="aura-settings-slot-inputs">
                  <div class="aura-api-key-wrapper">
                    <input type="password" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="aura-settings-input aura-masked-key aura-slot-key-input" data-slot="0" id="aura-slot-key-0" placeholder="Nhập API Key 1...">
                    <button type="button" class="aura-settings-btn-icon aura-slot-toggle-key-btn" data-slot="0" id="aura-slot-toggle-0">👁️</button>
                  </div>
                  <div class="aura-select-wrapper">
                    <select class="aura-settings-select aura-slot-model-select" data-slot="0" id="aura-slot-model-0">
                    </select>
                  </div>
                </div>
              </div>
              
              <!-- Slot 1 -->
              <div class="aura-settings-slot-row" data-slot="1" id="aura-slot-row-1">
                <div class="aura-settings-slot-header">
                  <label class="aura-slot-radio-label">
                    <input type="radio" name="aura-active-slot" value="1" id="aura-active-slot-1">
                    <span class="aura-slot-title">Khóa 2</span>
                  </label>
                </div>
                <div class="aura-settings-slot-inputs">
                  <div class="aura-api-key-wrapper">
                    <input type="password" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="aura-settings-input aura-masked-key aura-slot-key-input" data-slot="1" id="aura-slot-key-1" placeholder="Nhập API Key 2...">
                    <button type="button" class="aura-settings-btn-icon aura-slot-toggle-key-btn" data-slot="1" id="aura-slot-toggle-1">👁️</button>
                  </div>
                  <div class="aura-select-wrapper">
                    <select class="aura-settings-select aura-slot-model-select" data-slot="1" id="aura-slot-model-1">
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Section 2: Features -->
          <div class="aura-settings-section">
            <div class="aura-settings-sec-header">⚙️ TÙY CHỌN TÍNH NĂNG</div>
            <div class="aura-settings-card">
              <!-- Follow-ups Toggle -->
              <div class="aura-settings-toggle-row">
                <div class="aura-toggle-meta">
                  <div class="aura-toggle-title">Gợi ý Follow-up</div>
                  <div class="aura-toggle-desc">Tự động đề xuất các câu hỏi tiếp theo bám sát ngữ cảnh hội thoại</div>
                </div>
                <label class="aura-switch">
                  <input type="checkbox" id="aura-settings-enable-followups" checked>
                  <span class="aura-switch-slider"></span>
                </label>
              </div>

              <div class="aura-settings-item-divider"></div>

              <!-- Prompt Optimizer Toggle -->
              <div class="aura-settings-toggle-row">
                <div class="aura-toggle-meta">
                  <div class="aura-toggle-title">Tối ưu hóa Prompt ✨</div>
                  <div class="aura-toggle-desc">Thêm nút tối ưu hóa cấu trúc, phong cách và ngôn ngữ cho Prompt nháp</div>
                </div>
                <label class="aura-switch">
                  <input type="checkbox" id="aura-settings-enable-optimizer" checked>
                  <span class="aura-switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="aura-settings-actions">
            <button class="aura-notes-btn" id="aura-settings-btn-test">Kiểm tra kết nối</button>
            <button class="aura-notes-btn primary" id="aura-settings-btn-save">Lưu cấu hình</button>
          </div>
          
          <div class="aura-settings-status-msg" id="aura-settings-status"></div>
          
          <!-- API Limits Dashboard & Usage Links -->
          <div class="aura-api-limits-shortcuts">
            <div class="aura-rate-title" style="margin-bottom: 10px;">📊 HẠN MỨC & MỨC SỬ DỤNG API</div>
            <div class="aura-api-links-container" style="display: flex; gap: 10px; width: 100%;">
              <a href="https://aistudio.google.com/rate-limit" target="_blank" class="aura-api-shortcut-card" title="Xem hạn mức Google AI Studio">
                <div class="aura-api-shortcut-icon google-color">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div class="aura-api-shortcut-meta">
                  <span class="aura-api-shortcut-name">Google AI Studio</span>
                  <span class="aura-api-shortcut-desc">Xem hạn mức API</span>
                </div>
              </a>
              <a href="https://console.groq.com/settings/organization/usage" target="_blank" class="aura-api-shortcut-card" title="Xem mức sử dụng GroqCloud">
                <div class="aura-api-shortcut-icon groq-color">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <div class="aura-api-shortcut-meta">
                  <span class="aura-api-shortcut-name">GroqCloud Usage</span>
                  <span class="aura-api-shortcut-desc">Xem thống kê cuộc gọi</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // 2. Create Floating toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'aura-right-drawer-toggle';
    toggleBtn.innerHTML = `◀`;
    toggleBtn.title = 'Mở Vaxlou Center';

    document.body.appendChild(drawer);
    document.body.appendChild(toggleBtn);

    // Bind Toggle drawer open/close
    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggleBtn.innerHTML = isOpen ? '▶' : '◀';
      document.body.classList.toggle('aura-drawer-open', isOpen);
    });

    // Bind Tab switching
    drawer.querySelectorAll('.aura-drawer-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        drawer.querySelectorAll('.aura-drawer-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const mode = tab.dataset.tab;
        document.getElementById('aura-notes-view').classList.remove('active');
        document.getElementById('aura-outline-view').classList.remove('active');
        document.getElementById('aura-settings-view').classList.remove('active');

        if (mode === 'notes') {
          document.getElementById('aura-notes-view').classList.add('active');
        } else if (mode === 'outline') {
          document.getElementById('aura-outline-view').classList.add('active');
          renderOutlineList();
        } else if (mode === 'settings') {
          document.getElementById('aura-settings-view').classList.add('active');
          loadSettingsForm();
        }
      });
    });

    // Bind Note scope toggle checkbox
    const scopeChk = document.getElementById('aura-note-scope-chk');
    if (scopeChk) {
      scopeChk.checked = state.noteScopeIsSingle || false;
      scopeChk.addEventListener('change', () => {
        state.noteScopeIsSingle = scopeChk.checked;
        saveState();
        updateDrawerNote();
      });
    }

    // Bind Notes editor auto-save on input
    const editor = document.getElementById('aura-notes-editor');
    const statusEl = document.getElementById('aura-notes-save-status');
    let saveTimeout = null;

    const saveNoteContent = () => {
      if (!editor) return;
      updateSaveStatus('saving');
      
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const isGlobal = scopeChk ? !scopeChk.checked : true;
        const noteContent = editor.innerHTML;
        if (isGlobal) {
          state.chatNotes.global = noteContent;
        } else if (currentChatId) {
          state.chatNotes[currentChatId] = noteContent;
        }
        saveState();
        
        updateSaveStatus('saved');
      }, 600);
    };

    // Active element being dragged
    let activeDraggedElement = null;

    const initDragToDeleteController = (editorEl) => {
      const toolbar = document.getElementById('aura-notes-toolbar');
      const trashZone = document.getElementById('aura-tb-trash-zone');
      if (!editorEl || !toolbar || !trashZone) return;

      // 1. Listen for dragstart inside editor (Capturing phase)
      editorEl.addEventListener('dragstart', (e) => {
        const item = e.target.closest('img, .aura-note-file-card');
        if (item) {
          activeDraggedElement = item;
          item.classList.add('aura-dragging');
          toolbar.classList.add('aura-toolbar-delete-mode');
          
          e.dataTransfer.setData('text/plain', ''); // Required for Firefox / Chrome drag engines
          e.dataTransfer.effectAllowed = 'move';
        }
      }, true);

      // 2. Listen for dragend inside editor
      editorEl.addEventListener('dragend', (e) => {
        const item = e.target.closest('img, .aura-note-file-card');
        if (item) {
          item.classList.remove('aura-dragging');
        }
        toolbar.classList.remove('aura-toolbar-delete-mode');
        trashZone.classList.remove('aura-drag-over');
        activeDraggedElement = null;
      }, true);

      // 3. Dragover on trash zone
      trashZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        trashZone.classList.add('aura-drag-over');
      });

      // 4. Dragleave on trash zone
      trashZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        trashZone.classList.remove('aura-drag-over');
      });

      // 5. Drop on trash zone
      trashZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        trashZone.classList.remove('aura-drag-over');
        toolbar.classList.remove('aura-toolbar-delete-mode');

        if (activeDraggedElement) {
          const elToDelete = activeDraggedElement;
          activeDraggedElement = null;

          // iOS-style delete animation
          elToDelete.classList.add('aura-ios-deleting');
          
          setTimeout(() => {
            elToDelete.remove();
            saveNoteContent();
            editorEl.dispatchEvent(new Event('input'));
            showAuraToast('Đã xóa thành công!', 'success');
          }, 300);
        }
      });
    };

    let activeLightboxImgEl = null;
    let activePreviewCardEl = null;

    const decodeBase64ToText = (dataUrl) => {
      try {
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
      } catch (err) {
        console.error('[Vaxlou] Decode error:', err);
        return '';
      }
    };

    const copyBase64ImageToClipboard = async (dataUrl) => {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        showAuraToast('Đã sao chép ảnh vào bộ nhớ tạm!', 'success');
      } catch (err) {
        console.error('[Vaxlou] Copy image error:', err);
        showAuraToast('Không thể sao chép ảnh.', 'error');
      }
    };

    const injectLightboxAndPreviewModals = () => {
      if (!document.getElementById('aura-lightbox')) {
        const lightbox = document.createElement('div');
        lightbox.id = 'aura-lightbox';
        lightbox.className = 'aura-lightbox';
        lightbox.innerHTML = `
          <div class="aura-lightbox-backdrop"></div>
          <div class="aura-lightbox-content">
            <img class="aura-lightbox-img" src="" alt="Lightbox View">
            <div class="aura-lightbox-toolbar">
              <button class="aura-lightbox-btn copy" id="aura-lightbox-btn-copy">${SVG.copy}<span>Sao chép</span></button>
              <button class="aura-lightbox-btn" id="aura-lightbox-btn-download">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                <span>Tải xuống</span>
              </button>
              <button class="aura-lightbox-btn close" id="aura-lightbox-btn-delete" style="border-color:rgba(239,68,68,0.25); color:#f87171;">${SVG.trash}<span>Xóa</span></button>
              <button class="aura-lightbox-btn close" id="aura-lightbox-btn-close">${SVG.close}<span>Đóng</span></button>
            </div>
          </div>
        `;
        document.body.appendChild(lightbox);
        lightbox.querySelector('.aura-lightbox-backdrop').addEventListener('click', closeLightbox);
        lightbox.querySelector('#aura-lightbox-btn-close').addEventListener('click', closeLightbox);
        lightbox.querySelector('#aura-lightbox-btn-copy').addEventListener('click', () => {
          if (activeLightboxImgEl) copyBase64ImageToClipboard(activeLightboxImgEl.src);
        });
        lightbox.querySelector('#aura-lightbox-btn-download').addEventListener('click', () => {
          if (activeLightboxImgEl) {
            const a = document.createElement('a');
            a.href = activeLightboxImgEl.src;
            a.download = 'vaxlou_note_image_' + Date.now() + '.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            showAuraToast('Đã tải xuống ảnh!', 'success');
          }
        });
        lightbox.querySelector('#aura-lightbox-btn-delete').addEventListener('click', () => {
          if (activeLightboxImgEl) {
            if (confirm('Xóa ảnh này khỏi ghi chú?')) {
              const img = activeLightboxImgEl;
              closeLightbox();
              img.classList.add('aura-ios-deleting');
              setTimeout(() => {
                img.remove();
                if (editor) {
                  editor.dispatchEvent(new Event('input'));
                }
                showAuraToast('Đã xóa ảnh thành công!', 'success');
              }, 300);
            }
          }
        });
      }

      if (!document.getElementById('aura-file-preview-modal')) {
        const previewModal = document.createElement('div');
        previewModal.id = 'aura-file-preview-modal';
        previewModal.className = 'aura-file-preview-modal';
        previewModal.innerHTML = `
          <div class="aura-file-preview-backdrop"></div>
          <div class="aura-file-preview-content">
            <div class="aura-file-preview-header">
              <div class="aura-file-preview-title">Xem trước tệp tin</div>
              <div class="aura-file-preview-actions">
                <button class="aura-file-preview-btn" id="aura-file-preview-btn-copy" style="background:rgba(48,135,255,0.15); border-color:rgba(48,135,255,0.3); color:#60a5fa;">${SVG.copy}<span>Sao chép chữ</span></button>
                <button class="aura-file-preview-btn" id="aura-file-preview-btn-download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  <span>Tải xuống</span>
                </button>
                <button class="aura-file-preview-btn close" id="aura-file-preview-btn-delete" style="border-color:rgba(239,68,68,0.25); color:#f87171; background:rgba(239,68,68,0.05);">${SVG.trash}<span>Xóa</span></button>
                <button class="aura-file-preview-btn close" id="aura-file-preview-btn-close">${SVG.close}<span>Đóng</span></button>
              </div>
            </div>
            <div class="aura-file-preview-body"></div>
          </div>
        `;
        document.body.appendChild(previewModal);
        previewModal.querySelector('.aura-file-preview-backdrop').addEventListener('click', closeFilePreview);
        previewModal.querySelector('#aura-file-preview-btn-close').addEventListener('click', closeFilePreview);
        previewModal.querySelector('#aura-file-preview-btn-copy').addEventListener('click', () => {
          if (activePreviewCardEl) {
            const dl = activePreviewCardEl.querySelector('.aura-file-card-download');
            const dataUrl = dl ? dl.getAttribute('href') : '';
            if (dataUrl && dataUrl.startsWith('data:')) {
              navigator.clipboard.writeText(decodeBase64ToText(dataUrl));
              showAuraToast('Đã sao chép nội dung tệp!', 'success');
            }
          }
        });
        previewModal.querySelector('#aura-file-preview-btn-download').addEventListener('click', () => {
          if (activePreviewCardEl) {
            const dl = activePreviewCardEl.querySelector('.aura-file-card-download');
            if (dl) {
              dl.click();
              showAuraToast('Đã tải xuống tệp!', 'success');
            }
          }
        });
        previewModal.querySelector('#aura-file-preview-btn-delete').addEventListener('click', () => {
          if (activePreviewCardEl) {
            if (confirm('Xóa tệp đính kèm này khỏi ghi chú?')) {
              const card = activePreviewCardEl;
              closeFilePreview();
              card.classList.add('aura-ios-deleting');
              setTimeout(() => {
                card.remove();
                if (editor) {
                  editor.dispatchEvent(new Event('input'));
                }
                showAuraToast('Đã xóa tệp!', 'success');
              }, 300);
            }
          }
        });
      }
    };

    const showLightbox = (imgEl) => {
      const lightbox = document.getElementById('aura-lightbox');
      if (!lightbox) return;
      activeLightboxImgEl = imgEl;
      const img = lightbox.querySelector('.aura-lightbox-img');
      if (img) img.src = imgEl.src;
      lightbox.classList.add('active');
    };

    const closeLightbox = () => {
      const lightbox = document.getElementById('aura-lightbox');
      if (lightbox) lightbox.classList.remove('active');
      activeLightboxImgEl = null;
    };

    const showFilePreview = (cardEl) => {
      const previewModal = document.getElementById('aura-file-preview-modal');
      if (!previewModal) return;
      activePreviewCardEl = cardEl;
      const filename = cardEl.getAttribute('data-filename') || 'Tệp đính kèm';
      const dl = cardEl.querySelector('.aura-file-card-download');
      const dataUrl = dl ? dl.getAttribute('href') : '';
      
      const title = previewModal.querySelector('.aura-file-preview-title');
      if (title) {
        title.textContent = filename;
        title.title = filename;
      }

      const body = previewModal.querySelector('.aura-file-preview-body');
      if (body) {
        body.innerHTML = '';
        let classType = 'generic';
        cardEl.classList.forEach(cls => {
          if (cls.startsWith('aura-file-')) classType = cls.replace('aura-file-', '');
        });

        if (classType === 'audio') {
          body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:20px; padding:40px;">
              <span style="font-size:64px;">🎵</span>
              <div style="font-size:16px; font-weight:600; color:#fff; text-align:center;">${filename}</div>
              <audio controls src="${dataUrl}" style="width:100%; max-width:500px;"></audio>
            </div>
          `;
        } else if (classType === 'video') {
          body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:20px; padding:10px;">
              <video controls src="${dataUrl}" style="width:100%; max-height:450px; border-radius:8px; background:#000;"></video>
              <div style="font-size:14px; font-weight:500; color:#aaa; text-align:center;">${filename}</div>
            </div>
          `;
        } else {
          const previewPre = cardEl.querySelector('.aura-file-card-text-preview pre');
          if (previewPre && dataUrl.startsWith('data:')) {
            const fullText = decodeBase64ToText(dataUrl);
            const safeText = fullText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            body.innerHTML = `<pre class="aura-file-preview-text">${safeText || 'Tệp trống'}</pre>`;
            const copyBtn = document.getElementById('aura-file-preview-btn-copy');
            if (copyBtn) copyBtn.style.display = 'inline-flex';
          } else {
            body.innerHTML = `
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:20px; padding:40px;">
                <span style="font-size:64px;">📄</span>
                <div style="font-size:16px; font-weight:600; color:#fff; text-align:center;">${filename}</div>
                <div style="font-size:12px; color:#aaa; text-align:center;">Xem trước không khả dụng cho định dạng này. Vui lòng tải xuống để xem chi tiết!</div>
                <a href="${dataUrl}" download="${filename}" class="aura-file-preview-btn" style="text-decoration:none; background:#3087ff; border-color:#3087ff;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  <span>Tải xuống tệp</span>
                </a>
              </div>
            `;
            const copyBtn = document.getElementById('aura-file-preview-btn-copy');
            if (copyBtn) copyBtn.style.display = 'none';
          }
        }
      }
      previewModal.classList.add('active');
    };

    const closeFilePreview = () => {
      const previewModal = document.getElementById('aura-file-preview-modal');
      if (previewModal) {
        previewModal.classList.remove('active');
        previewModal.querySelectorAll('audio, video').forEach(media => {
          try { media.pause(); } catch (err) {}
        });
      }
      activePreviewCardEl = null;
    };



    const initPreviewControllers = (editorEl) => {
      if (!editorEl) return;
      editorEl.addEventListener('click', (e) => {
        const img = e.target.closest('img');
        if (img && img.classList.contains('aura-note-attached-img')) {
          if (img.classList.contains('aura-dragging')) return;
          e.preventDefault();
          e.stopPropagation();
          showLightbox(img);
        }
      });

      editorEl.addEventListener('dblclick', (e) => {
        const card = e.target.closest('.aura-note-file-card');
        if (card) {
          e.preventDefault();
          e.stopPropagation();
          showFilePreview(card);
        }
      });
    };

    if (editor) {
      injectLightboxAndPreviewModals();
      initDragToDeleteController(editor);
      initPreviewControllers(editor);
      ensureDraggableItems(editor);
      
      editor.addEventListener('input', () => {
        ensureDraggableItems(editor);
        saveNoteContent();
      });
      editor.addEventListener('blur', saveNoteContent);
      editor.addEventListener('keyup', saveNoteContent);

      // Paste clipboard file support (all formats)
      editor.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              handleIncomingFile(file);
            }
          }
        }
      });

      // Drop file support (Drag-in all formats)
      editor.addEventListener('dragover', (e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
        }
      });

      editor.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          e.preventDefault();
          for (const file of files) {
            handleIncomingFile(file);
          }
        }
      });

      // Selection range tracking for dropdown styling commands
      let savedRange = null;
      const saveSelection = () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (editor.contains(range.commonAncestorContainer)) {
            savedRange = range.cloneRange();
          }
        }
      };

      const restoreSelection = () => {
        if (savedRange) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(savedRange);
        } else {
          editor.focus();
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      };

      editor.addEventListener('mouseup', saveSelection);
      editor.addEventListener('keyup', saveSelection);
      editor.addEventListener('focus', saveSelection);
      const applyCustomFontSize = (sizeVal) => {
        restoreSelection();
        editor.focus();
        
        // Use a temporary unique font size value (e.g., '7') to let the browser wrap the selection
        document.execCommand('fontSize', false, '7');
        
        // Replace the temporary <font size="7"> element with a styled <span>
        const fontEls = editor.querySelectorAll('font[size="7"]');
        fontEls.forEach(fontEl => {
          const span = document.createElement('span');
          span.style.fontSize = sizeVal + 'px';
          // Move all child nodes
          while (fontEl.firstChild) {
            span.appendChild(fontEl.firstChild);
          }
          fontEl.parentNode.replaceChild(span, fontEl);
        });
        
        saveSelection();
        editor.dispatchEvent(new Event('input'));
      };

      const sizeSel = document.getElementById('aura-tb-size');
      if (sizeSel) {
        sizeSel.addEventListener('change', () => {
          applyCustomFontSize(sizeSel.value);
        });
      }

      // Bidirectional HEX Color Picker binding
      const hexPicker = document.getElementById('aura-tb-color-picker');
      const hexInput = document.getElementById('aura-tb-color-hex');
      
      if (hexPicker && hexInput) {
        // Sync color picker -> hex text and apply foreColor style
        hexPicker.addEventListener('input', () => {
          const colorVal = hexPicker.value;
          hexInput.value = colorVal.toUpperCase();
          
          restoreSelection();
          editor.focus();
          document.execCommand('foreColor', false, colorVal);
          saveSelection();
          editor.dispatchEvent(new Event('input'));
        });
        
        // Sync hex text -> color picker and apply foreColor style on typing
        hexInput.addEventListener('input', () => {
          let value = hexInput.value.trim();
          if (value && !value.startsWith('#')) {
            value = '#' + value;
          }
          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            hexPicker.value = value;
            
            restoreSelection();
            editor.focus();
            document.execCommand('foreColor', false, value);
            saveSelection();
            editor.dispatchEvent(new Event('input'));
          }
        });
      }

      const bindFormatBtn = (id, command) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', () => {
            restoreSelection();
            document.execCommand(command, false, null);
            saveSelection();
            editor.dispatchEvent(new Event('input'));
          });
        }
      };

      bindFormatBtn('aura-tb-bold', 'bold');
      bindFormatBtn('aura-tb-italic', 'italic');
      bindFormatBtn('aura-tb-underline', 'underline');
      bindFormatBtn('aura-tb-strike', 'strikeThrough');

      // Vaxlou File Attachment Engine
      function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      }

      function insertNodeAtCursor(editorEl, node) {
        editorEl.focus();
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editorEl.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            range.insertNode(node);
            
            // Add a space after so typing after it works easily
            const space = document.createTextNode('\u00A0');
            node.parentNode.insertBefore(space, node.nextSibling);
            
            const newRange = document.createRange();
            newRange.setStartAfter(space);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            editorEl.appendChild(node);
            editorEl.appendChild(document.createTextNode('\u00A0'));
          }
        } else {
          editorEl.appendChild(node);
          editorEl.appendChild(document.createTextNode('\u00A0'));
        }
        saveNoteContent();
        editorEl.dispatchEvent(new Event('input'));
      }

      function handleIncomingFile(file) {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        
        // 1. If image, use existing reader and insertImageAtCursor
        if (file.type.indexOf('image') === 0 || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
          const reader = new FileReader();
          reader.onload = (event) => {
            insertImageAtCursor(editor, event.target.result);
          };
          reader.readAsDataURL(file);
          return;
        }

        // 2. Otherwise, determine details based on extension
        let emoji = '📄';
        let classType = 'generic';
        
        if (ext === 'pdf') {
          emoji = '📕';
          classType = 'pdf';
        } else if (['doc', 'docx'].includes(ext)) {
          emoji = '📘';
          classType = 'word';
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
          emoji = '📗';
          classType = 'excel';
        } else if (['ppt', 'pptx'].includes(ext)) {
          emoji = '📙';
          classType = 'ppt';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
          emoji = '📦';
          classType = 'zip';
        } else if (['exe', 'msi', 'bat', 'cmd'].includes(ext)) {
          emoji = '⚙️';
          classType = 'exe';
        } else if (['mp3', 'wav', 'm4a', 'flac', 'ogg'].includes(ext) || file.type.indexOf('audio') === 0) {
          emoji = '🎵';
          classType = 'audio';
        } else if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext) || file.type.indexOf('video') === 0) {
          emoji = '🎥';
          classType = 'video';
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          
          // Create wrapper card element
          const card = document.createElement('div');
          card.className = `aura-note-file-card aura-file-${classType}`;
          card.setAttribute('contenteditable', 'false');
          card.setAttribute('data-filename', file.name);
          card.setAttribute('draggable', 'true');
          
          let mediaHTML = '';
          if (classType === 'audio') {
            mediaHTML = `
              <div class="aura-file-card-media-wrapper">
                <audio controls src="${dataUrl}" class="aura-note-embedded-audio"></audio>
              </div>
            `;
          } else if (classType === 'video') {
            mediaHTML = `
              <div class="aura-file-card-media-wrapper">
                <video controls src="${dataUrl}" class="aura-note-embedded-video"></video>
              </div>
            `;
          }

          card.innerHTML = `
            <div class="aura-file-card-inner">
              <span class="aura-file-card-icon">${emoji}</span>
              <div class="aura-file-card-details">
                <div class="aura-file-card-name" title="${file.name}">${file.name}</div>
                <div class="aura-file-card-size">${formatBytes(file.size)}</div>
              </div>
              <a href="${dataUrl}" download="${file.name}" class="aura-file-card-download" title="Tải xuống">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              </a>
            </div>
            ${mediaHTML}
          `;

          insertNodeAtCursor(editor, card);

          // Extra feature: If text-based file, read first 300 characters and show as preview snippet
          const textExtensions = ['txt', 'js', 'py', 'json', 'csv', 'html', 'css', 'md', 'ts', 'go', 'c', 'cpp', 'java', 'xml', 'yaml', 'yml'];
          if (textExtensions.includes(ext) || file.type.startsWith('text/')) {
            const textReader = new FileReader();
            textReader.onload = (txtEvent) => {
              const textContent = txtEvent.target.result;
              const textPreview = textContent.substring(0, 300);
              const safePreview = textPreview
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
              
              const previewDiv = document.createElement('div');
              previewDiv.className = 'aura-file-card-text-preview';
              previewDiv.innerHTML = `<pre>${safePreview}${textContent.length > 300 ? '...' : ''}</pre>`;
              card.appendChild(previewDiv);
              
              // Trigger auto-save to store text preview
              saveNoteContent();
              editor.dispatchEvent(new Event('input'));
            };
            textReader.readAsText(file);
          }
        };
        reader.readAsDataURL(file);
      }

      // Bind file input attachment triggers
      const attachBtn = document.getElementById('aura-tb-attach');
      const fileInput = document.getElementById('aura-tb-file-input');
      if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
          const files = fileInput.files;
          if (files && files.length > 0) {
            for (const file of files) {
              handleIncomingFile(file);
            }
            fileInput.value = '';
          }
        });
      }

      // Prevent loss of focus on notes editor when clicking toolbar elements
      const tbItems = document.querySelectorAll('.aura-tb-btn');
      tbItems.forEach(item => {
        item.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Retain editor selection/focus!
        });
      });
    }

    // Bind notes buttons
    const clearBtn = document.getElementById('aura-note-btn-clear');
    if (clearBtn && editor) {
      clearBtn.addEventListener('click', () => {
        const t = translations.vi;
        if (confirm(t.noteClearConfirm || 'Xóa sạch ghi chú này?')) {
          editor.innerHTML = '';
          editor.dispatchEvent(new Event('input'));
        }
      });
    }

    const copyBtn = document.getElementById('aura-note-btn-copy');
    if (copyBtn && editor) {
      copyBtn.addEventListener('click', () => {
        const t = translations.vi;
        navigator.clipboard.writeText(editor.innerText);
        copyBtn.textContent = t.noteCopiedBtn || 'Đã chép! ✓';
        copyBtn.style.background = '#059669';
        setTimeout(() => {
          copyBtn.textContent = t.noteCopyBtn || 'Sao chép';
          copyBtn.style.background = '';
        }, 1500);
      });
    }

    // Bind Outline filter dropdown
    const filterSelect = document.getElementById('aura-outline-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        renderOutlineList();
      });
    }

    const updateRateLimitHighlight = (model) => {
      const rowLite = document.getElementById('aura-rate-row-lite');
      const rowFlash = document.getElementById('aura-rate-row-flash');
      const rowPro = document.getElementById('aura-rate-row-pro');
      
      if (rowLite) rowLite.classList.remove('aura-rate-active-row');
      if (rowFlash) rowFlash.classList.remove('aura-rate-active-row');
      if (rowPro) rowPro.classList.remove('aura-rate-active-row');
      
      if (model === 'gemini-2.5-flash-lite' || model === 'gemini-3.1-flash-lite') {
        rowLite?.classList.add('aura-rate-active-row');
      } else if (model === 'gemini-2.5-flash') {
        rowFlash?.classList.add('aura-rate-active-row');
      } else if (model === 'gemini-3.5-flash') {
        rowPro?.classList.add('aura-rate-active-row');
      }
    };

    // Bind API Settings helpers
    const detectAndPopulateModels = (slotIdx, keyVal) => {
      const modelSelect = document.getElementById(`aura-slot-model-${slotIdx}`);
      if (!modelSelect) return;
      
      const cleaned = (keyVal || '').trim();
      const isGroq = cleaned.startsWith('gsk_');
      
      // Save current selection to restore if it belongs to the same provider
      const currentVal = modelSelect.value;
      modelSelect.innerHTML = '';
      
      if (isGroq) {
        const models = [
          { value: 'llama-3.3-70b-versatile', text: 'Llama 3.3 70B Versatile' },
          { value: 'llama-3.1-8b-instant', text: 'Llama 3.1 8B Instant' },
          { value: 'qwen/qwen3-32b', text: 'Qwen 3 32B' },
          { value: 'openai/gpt-oss-20b', text: 'GPT-OSS 20B' },
          { value: 'openai/gpt-oss-120b', text: 'GPT-OSS 120B' }
        ];
        models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.value;
          opt.textContent = m.text;
          modelSelect.appendChild(opt);
        });
        if (models.some(m => m.value === currentVal)) {
          modelSelect.value = currentVal;
        } else {
          modelSelect.value = 'llama-3.3-70b-versatile';
        }
      } else {
        const models = [
          { value: 'gemini-3.1-flash-lite', text: 'Gemini 3.1 Flash Lite' },
          { value: 'gemini-2.5-flash-lite', text: 'Gemini 2.5 Flash Lite' },
          { value: 'gemini-3.5-flash', text: 'Gemini 3.5 Flash' },
          { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash' },
          { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro' }
        ];
        models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.value;
          opt.textContent = m.text;
          modelSelect.appendChild(opt);
        });
        if (models.some(m => m.value === currentVal)) {
          modelSelect.value = currentVal;
        } else {
          modelSelect.value = 'gemini-3.1-flash-lite';
        }
      }
    };

    const loadSettingsForm = () => {
      if (!state.settings) return;
      
      const activeIdx = (typeof state.settings.activeKeyIndex === 'number') ? state.settings.activeKeyIndex : 0;
      
      // Load all 2 slots
      for (let i = 0; i < 2; i++) {
        const keyInput = document.getElementById(`aura-slot-key-${i}`);
        const modelSelect = document.getElementById(`aura-slot-model-${i}`);
        const radioInput = document.getElementById(`aura-active-slot-${i}`);
        const slotRow = document.getElementById(`aura-slot-row-${i}`);
        const slotProfile = state.settings.apiKeys[i];
        
        if (keyInput && slotProfile) {
          keyInput.value = slotProfile.key || '';
          keyInput.type = 'password';
        }
        
        const toggleKeyBtn = document.getElementById(`aura-slot-toggle-${i}`);
        if (toggleKeyBtn) {
          toggleKeyBtn.textContent = '👁️';
        }
        
        if (modelSelect && slotProfile) {
          detectAndPopulateModels(i, slotProfile.key);
          modelSelect.value = slotProfile.model || 'gemini-3.1-flash-lite';
        }
        
        if (radioInput && slotRow) {
          const isCurrentActive = (activeIdx === i);
          radioInput.checked = isCurrentActive;
          
          if (isCurrentActive) {
            slotRow.classList.add('active');
            const titleSpan = slotRow.querySelector('.aura-slot-title');
            if (titleSpan) titleSpan.textContent = `Khóa ${i + 1} (Đang chọn)`;
            
            // Highlight current active model limits
            if (modelSelect) {
              updateRateLimitHighlight(modelSelect.value);
            }
          } else {
            slotRow.classList.remove('active');
            const titleSpan = slotRow.querySelector('.aura-slot-title');
            if (titleSpan) titleSpan.textContent = `Khóa ${i + 1}`;
          }
        }
      }
      
      const enableFollowupsCheckbox = document.getElementById('aura-settings-enable-followups');
      if (enableFollowupsCheckbox) {
        enableFollowupsCheckbox.checked = (state.settings.enableFollowups !== false);
      }
      
      const enableOptimizerCheckbox = document.getElementById('aura-settings-enable-optimizer');
      if (enableOptimizerCheckbox) {
        enableOptimizerCheckbox.checked = (state.settings.enableOptimizer !== false);
      }
      
      const statusEl = document.getElementById('aura-settings-status');
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="aura-status-badge-modern idle">
            <span class="aura-status-pulse blue"></span>
            <span class="aura-status-text">Sẵn sàng kiểm tra kết nối API</span>
          </div>
        `;
      }
    };

    // Bind Change Key slots visibility toggle buttons
    for (let i = 0; i < 2; i++) {
      const toggleBtn = document.getElementById(`aura-slot-toggle-${i}`);
      const keyInput = document.getElementById(`aura-slot-key-${i}`);
      if (toggleBtn && keyInput) {
        toggleBtn.addEventListener('click', () => {
          const isVisible = (keyInput.type === 'text');
          if (isVisible) {
            keyInput.type = 'password';
            toggleBtn.textContent = '👁️';
          } else {
            keyInput.type = 'text';
            toggleBtn.textContent = '🔒';
          }
        });
      }
      
      // Auto-detect and populate provider model list in real-time
      if (keyInput) {
        keyInput.addEventListener('input', (e) => {
          detectAndPopulateModels(i, e.target.value);
        });
      }
      
      // Auto-highlight rate limits if user changes the select of the ACTIVE slot
      const modelSelect = document.getElementById(`aura-slot-model-${i}`);
      if (modelSelect) {
        modelSelect.addEventListener('change', () => {
          const activeIdx = (state.settings && typeof state.settings.activeKeyIndex === 'number') ? state.settings.activeKeyIndex : 0;
          if (i === activeIdx) {
            updateRateLimitHighlight(modelSelect.value);
          }
        });
      }
      
      // Active radio change event
      const radioInput = document.getElementById(`aura-active-slot-${i}`);
      if (radioInput) {
        radioInput.addEventListener('change', () => {
          if (radioInput.checked) {
            state.settings.activeKeyIndex = i;
            saveState();
            
            for (let j = 0; j < 2; j++) {
              const rowEl = document.getElementById(`aura-slot-row-${j}`);
              if (rowEl) {
                if (j === i) {
                  rowEl.classList.add('active');
                  const titleSpan = rowEl.querySelector('.aura-slot-title');
                  if (titleSpan) titleSpan.textContent = `Khóa ${j + 1} (Đang chọn)`;
                  
                  const activeModelSelect = document.getElementById(`aura-slot-model-${j}`);
                  if (activeModelSelect) {
                    updateRateLimitHighlight(activeModelSelect.value);
                  }
                } else {
                  rowEl.classList.remove('active');
                  const titleSpan = rowEl.querySelector('.aura-slot-title');
                  if (titleSpan) titleSpan.textContent = `Khóa ${j + 1}`;
                }
              }
            }
          }
        });
      }
    }

    // Auto-save toggle followups changes
    const enableFollowupsCheckbox = document.getElementById('aura-settings-enable-followups');
    if (enableFollowupsCheckbox) {
      enableFollowupsCheckbox.addEventListener('change', () => {
        if (!state.settings) state.settings = {};
        state.settings.enableFollowups = enableFollowupsCheckbox.checked;
        saveState();
        
        // Refresh active followups suggestions
        if (currentChatId) {
          const responses = Array.from(document.querySelectorAll('model-response'));
          if (responses.length > 0) {
            delete responses[responses.length - 1].dataset.auraSuggestionsBound;
          }
          updateSmartSuggestions(currentChatId);
        }
      });
    }

    // Auto-save prompt optimizer toggle changes
    const enableOptimizerCheckbox = document.getElementById('aura-settings-enable-optimizer');
    if (enableOptimizerCheckbox) {
      enableOptimizerCheckbox.addEventListener('change', () => {
        if (!state.settings) state.settings = {};
        state.settings.enableOptimizer = enableOptimizerCheckbox.checked;
        saveState();
        
        if (state.settings.enableOptimizer) {
          injectPromptOptimizerButton();
        } else {
          document.getElementById('aura-prompt-optimizer-btn')?.remove();
        }
      });
    }

    const saveBtn = document.getElementById('aura-settings-btn-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const enableFollowupsCheckbox = document.getElementById('aura-settings-enable-followups');
        const enableOptimizerCheckbox = document.getElementById('aura-settings-enable-optimizer');
        const statusEl = document.getElementById('aura-settings-status');
        
        if (!state.settings) state.settings = {};
        
        // Save keys and models for all 2 slots
        for (let i = 0; i < 2; i++) {
          const keyInput = document.getElementById(`aura-slot-key-${i}`);
          const modelSelect = document.getElementById(`aura-slot-model-${i}`);
          if (keyInput) state.settings.apiKeys[i].key = keyInput.value.trim();
          if (modelSelect) state.settings.apiKeys[i].model = modelSelect.value;
        }
        
        const activeRadio = document.querySelector('input[name="aura-active-slot"]:checked');
        if (activeRadio) {
          state.settings.activeKeyIndex = parseInt(activeRadio.value, 10);
        }
        
        state.settings.enableFollowups = enableFollowupsCheckbox ? enableFollowupsCheckbox.checked : true;
        state.settings.enableOptimizer = enableOptimizerCheckbox ? enableOptimizerCheckbox.checked : true;
        state.settings.optimizerLanguage = 'vi';
        state.settings.uiLanguage = 'vi';
        
        saveState();
        
        // Immediately reload form to show locked state
        loadSettingsForm();
        applyLanguage();
        
        if (statusEl) {
          statusEl.innerHTML = `
            <div class="aura-status-badge-modern success">
              <span class="aura-status-pulse green"></span>
              <span class="aura-status-text">Đã lưu cấu hình thành công! ✨</span>
            </div>
          `;
        }
        
        // Refresh active followups suggestions
        if (currentChatId) {
          const responses = Array.from(document.querySelectorAll('model-response'));
          if (responses.length > 0) {
            delete responses[responses.length - 1].dataset.auraSuggestionsBound;
            updateSmartSuggestions(currentChatId);
          }
        }
      });
    }

    const runConnectionTest = () => {
      const activeRadio = document.querySelector('input[name="aura-active-slot"]:checked');
      const activeIdx = activeRadio ? parseInt(activeRadio.value, 10) : 0;
      
      const keyInput = document.getElementById(`aura-slot-key-${activeIdx}`);
      const modelSelect = document.getElementById(`aura-slot-model-${activeIdx}`);
      const statusEl = document.getElementById('aura-settings-status');
      
      const apiKey = keyInput ? keyInput.value.trim() : '';
      const model = modelSelect ? modelSelect.value : 'gemini-3.1-flash-lite';
      
      if (!apiKey) {
        if (statusEl) {
          statusEl.innerHTML = `
            <div class="aura-status-badge-modern error">
              <span class="aura-status-pulse red"></span>
              <span class="aura-status-text">Vui lòng nhập API Key trước khi kiểm tra!</span>
            </div>
          `;
        }
        showAuraToast('Vui lòng nhập API Key trước khi kiểm tra!', 'error');
        return;
      }
      
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="aura-status-badge-modern testing">
            <span class="aura-status-pulse amber"></span>
            <span class="aura-status-text">Đang kết nối thử nghiệm...</span>
          </div>
        `;
      }
      
      chrome.runtime.sendMessage({
        action: 'callGeminiAPI',
        apiKey: apiKey,
        model: model,
        prompt: 'Hello! Respond with "OK" if you can read this.'
      }, response => {
        if (chrome.runtime.lastError) {
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="aura-status-badge-modern error" title="${chrome.runtime.lastError.message}">
                <span class="aura-status-pulse red"></span>
                <span class="aura-status-text">Kết nối thất bại. Di chuột vào đây để xem chi tiết.</span>
              </div>
            `;
          }
          return;
        }
        if (response && response.success) {
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="aura-status-badge-modern success">
                <span class="aura-status-pulse green"></span>
                <span class="aura-status-text">Kết nối thành công! API hoạt động tốt.</span>
              </div>
            `;
          }
        } else {
          if (statusEl) {
            const errMsg = response ? response.error : 'Không có phản hồi';
            statusEl.innerHTML = `
              <div class="aura-status-badge-modern error" title="${errMsg}">
                <span class="aura-status-pulse red"></span>
                <span class="aura-status-text">Kết nối thất bại. Di chuột vào đây để xem chi tiết.</span>
              </div>
            `;
          }
        }
      });
    };

    const testBtn = document.getElementById('aura-settings-btn-test');
    if (testBtn) {
      testBtn.addEventListener('click', runConnectionTest);
    }
    const testSmallBtn = document.getElementById('aura-settings-btn-test-small');
    if (testSmallBtn) {
      testSmallBtn.addEventListener('click', runConnectionTest);
    }

    updateDrawerNote();
    loadSettingsForm();
    applyLanguage();
  };

  const updateDrawerNote = () => {
    const editor = document.getElementById('aura-notes-editor');
    const scopeChk = document.getElementById('aura-note-scope-chk');
    const statusEl = document.getElementById('aura-notes-save-status');
    if (!editor) return;

    if (!state.chatNotes) state.chatNotes = {};

    const t = translations.vi;

    const isGlobal = scopeChk ? !scopeChk.checked : true;
    if (isGlobal) {
      editor.innerHTML = state.chatNotes.global || '';
      editor.contentEditable = "true";
      editor.setAttribute('placeholder', t.notePlaceholderGlobal || 'Ghi chú toàn cục dùng chung cho tất cả các cuộc hội thoại... Dán (Ctrl+V) hoặc kéo thả ảnh trực tiếp vào đây!');
    } else {
      if (currentChatId) {
        editor.innerHTML = state.chatNotes[currentChatId] || '';
        editor.contentEditable = "true";
        editor.setAttribute('placeholder', t.notePlaceholderSingle || 'Ghi chú nhanh cho cuộc hội thoại này... Dán (Ctrl+V) hoặc kéo thả ảnh trực tiếp vào đây!');
      } else {
        editor.innerHTML = '';
        editor.contentEditable = "false";
        editor.setAttribute('placeholder', t.noteSelectChatFirst || 'Hãy chọn một cuộc hội thoại để ghi chú...');
      }
    }
    ensureDraggableItems(editor);
  };

  // Scroll to chat message based on text match
  const scrollToChatMessage = (targetText) => {
    if (!targetText) return;
    const elements = Array.from(document.querySelectorAll('user-query, model-response'));
    let bestMatch = null;
    const cleanTarget = targetText.trim().toLowerCase();

    for (const el of elements) {
      const elText = el.textContent.trim().toLowerCase();
      if (elText.includes(cleanTarget) || cleanTarget.includes(elText)) {
        bestMatch = el;
        break;
      }
    }

    if (bestMatch) {
      bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bestMatch.classList.add('aura-bubble-glow');
      setTimeout(() => bestMatch.classList.remove('aura-bubble-glow'), 1200);
    }
  };

  const showFolderContextMenu = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    
    closeFolderContextMenu();
    
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const lang = (state.settings && state.settings.uiLanguage) || 'vi';
    const t = translations[lang] || translations.vi;
    
    const menu = document.createElement('div');
    menu.id = 'aura-folder-context-menu';
    menu.className = 'aura-folder-context-menu';
    
    // Position menu near cursor
    const x = Math.min(e.clientX, window.innerWidth - 210);
    const y = Math.min(e.clientY, window.innerHeight - 340);
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;
    
    menu.innerHTML = `
      <div class="aura-context-item add-sub">${SVG.plus}<span>${t.folderCtxCreateSub || 'Tạo thư mục con'}</span></div>
      <div class="aura-context-item rename">${SVG.edit}<span>${t.folderCtxRename || 'Đổi tên'}</span></div>
      <div class="aura-context-item expand-all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <span>${t.folderCtxExpandAll || 'Mở rộng tất cả'}</span>
      </div>
      <div class="aura-context-item collapse-all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        <span>${t.folderCtxCollapseAll || 'Thu gọn tất cả'}</span>
      </div>
      <div class="aura-context-divider"></div>
      <div class="aura-context-item delete text-danger">${SVG.trash}<span>${t.folderCtxDeleteDir || 'Xóa thư mục'}</span></div>
    `;
    
    document.body.appendChild(menu);
    
    // Bind click events on context menu items
    menu.querySelector('.add-sub').addEventListener('click', () => {
      const name = prompt(t.folderPromptSub || 'Tên thư mục con:');
      if (name?.trim()) {
        folder.collapsed = false;
        state.folders.push({ id: 'f_' + Date.now(), name: name.trim(), parentId: folderId, collapsed: false });
        saveState();
        renderFolders(document.getElementById('aura-folders-section'));
      }
      closeFolderContextMenu();
    });
    
    menu.querySelector('.rename').addEventListener('click', () => {
      const name = prompt(t.folderPromptRename || 'Đổi tên:', folder.name);
      if (name?.trim()) {
        folder.name = name.trim();
        saveState();
        renderFolders(document.getElementById('aura-folders-section'));
      }
      closeFolderContextMenu();
    });
    
    menu.querySelector('.expand-all').addEventListener('click', () => {
      const setCollapsed = (fid, collapsed) => {
        const f = state.folders.find(x => x.id === fid);
        if (f) f.collapsed = collapsed;
        state.folders.filter(x => x.parentId === fid).forEach(x => setCollapsed(x.id, collapsed));
      };
      setCollapsed(folderId, false);
      saveState();
      renderFolders(document.getElementById('aura-folders-section'));
      closeFolderContextMenu();
    });
    
    menu.querySelector('.collapse-all').addEventListener('click', () => {
      const setCollapsed = (fid, collapsed) => {
        const f = state.folders.find(x => x.id === fid);
        if (f) f.collapsed = collapsed;
        state.folders.filter(x => x.parentId === fid).forEach(x => setCollapsed(x.id, collapsed));
      };
      setCollapsed(folderId, true);
      saveState();
      renderFolders(document.getElementById('aura-folders-section'));
      closeFolderContextMenu();
    });
    
    menu.querySelector('.delete').addEventListener('click', () => {
      const getAllDescendantIds = (pid) => {
        const kids = state.folders.filter(x => x.parentId === pid).map(x => x.id);
        return kids.concat(...kids.map(getAllDescendantIds));
      };
      const toDelete = [folderId, ...getAllDescendantIds(folderId)];
      const confirmMsg = (t.folderConfirmDeleteDir || 'Xóa thư mục "{name}"? Tất cả thư mục con và hội thoại bên trong sẽ trở về danh sách chung.').replace('{name}', folder.name);
      if (confirm(confirmMsg)) {
        toDelete.forEach(did => {
          Object.keys(state.chatToFolder).forEach(cid => { if (state.chatToFolder[cid] === did) delete state.chatToFolder[cid]; });
        });
        state.folders = state.folders.filter(x => !toDelete.includes(x.id));
        saveState();
        renderFolders(document.getElementById('aura-folders-section'));
      }
      closeFolderContextMenu();
    });
    
    // Listen click outside to close menu
    setTimeout(() => document.addEventListener('click', closeContextMenuOutside), 10);
  };

  
  const closeFolderContextMenu = () => {
    document.getElementById('aura-folder-context-menu')?.remove();
    document.removeEventListener('click', closeContextMenuOutside);
  };
  
  const closeContextMenuOutside = e => {
    if (!e.target.closest('#aura-folder-context-menu')) closeFolderContextMenu();
  };


  // ====================================================
  //   🗺_ PREMIUM CHAT OUTLINE (SEMANTIC MINIMAP OUTLINE)
  // ====================================================
  const getChatOutline = () => {
    const elements = Array.from(document.querySelectorAll('user-query, model-response'));
    const outline = [];
    
    elements.forEach((el) => {
      if (el.tagName === 'USER-QUERY') {
        let text = el.textContent.replace(/⭐/g, '').trim();
        // Remove accessibility/screen-reader prefixes like "Bạn đã nói:" or "You said:"
        text = text.replace(/^(Bạn đã nói|You said|Bạn đã nói:|You said:)\s*/i, '').trim();
        
        if (text) {
          let displayText = text.replace(/\s+/g, ' ');
          if (displayText.length > 50) {
            displayText = displayText.substring(0, 47) + '...';
          }
          
          outline.push({
            type: 'prompt',
            text: `Bạn - "${displayText}"`,
            element: el,
            level: 1
          });
        }
      } else {
        // It's a model-response. Let's find headings inside it.
        const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        if (headings.length === 0) {
          // Fallback: No headings inside the response, let's extract a preview of the response text
          let text = el.textContent.trim();
          if (text) {
            text = text.replace(/\s+/g, ' '); // Clean up multiple spaces/newlines
            if (text.length > 60) {
              text = text.substring(0, 57) + '...';
            }
            outline.push({
              type: 'heading', // Use 'heading' type so it matches the filter for Gemini responses
              text: `Gemini: ${text}`,
              element: el,
              level: 2
            });
          }
        } else {
          headings.forEach(h => {
            let text = h.textContent.trim();
            if (!text) return;
            
            text = text.replace(/^[-*•\d.]+\s+/, '');
            
            let level = 2;
            if (h.tagName === 'H1') level = 1;
            else if (h.tagName === 'H2') level = 2;
            else if (h.tagName === 'H3') level = 3;
            else if (h.tagName === 'H4') level = 4;
            else level = 3;
            
            outline.push({
              type: 'heading',
              text: text,
              element: h,
              level: level
            });
          });
        }
      }
    });
    
    return outline;
  };

  const renderOutlineList = () => {
    const container = document.getElementById('aura-outline-list');
    if (!container) return;

    if (!currentChatId) {
      container.innerHTML = `<div class="aura-outline-empty">Hãy chọn một cuộc hội thoại để xem dàn ý!</div>`;
      return;
    }

    const outline = getChatOutline();
    if (outline.length === 0) {
      container.innerHTML = `<div class="aura-outline-empty">Không tìm thấy tiêu đề hoặc câu hỏi nào trong cuộc hội thoại này!</div>`;
      return;
    }

    const filterSelect = document.getElementById('aura-outline-filter');
    const filter = filterSelect ? filterSelect.value : 'all';

    let filtered = outline;
    if (filter === 'responses') {
      filtered = outline.filter(item => item.type === 'heading');
    } else if (filter === 'prompts') {
      filtered = outline.filter(item => item.type === 'prompt');
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="aura-outline-empty">Không có mục nào khớp với bộ lọc hiện tại!</div>`;
      return;
    }

    let html = '';
    filtered.forEach((item, idx) => {
      const isPrompt = item.type === 'prompt';
      const itemClass = isPrompt ? 'prompt' : `heading-l${item.level}`;
      const bullet = isPrompt ? '💬' : '↳';
      
      html += `
        <div class="aura-outline-item ${itemClass}" data-index="${idx}">
          <span class="aura-outline-bullet">${bullet}</span>
          <span class="aura-outline-text">${item.text}</span>
        </div>
      `;
    });
    container.innerHTML = html;

    // Bind click events on outline items to scroll
    container.querySelectorAll('.aura-outline-item').forEach((itemEl, idx) => {
      itemEl.addEventListener('click', () => {
        const item = filtered[idx];
        if (item && item.element) {
          item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          item.element.classList.add('aura-bubble-glow');
          setTimeout(() => item.element.classList.remove('aura-bubble-glow'), 1200);
        }
      });
    });
  };


  // ====================================================
  //   🗺️ PREMIUM FEATURE: VS CODE-LIKE MINIMAP
  // ====================================================
  const injectMinimap = () => {
    let minimap = document.getElementById('aura-minimap');
    if (!minimap) {
      minimap = document.createElement('div');
      minimap.id = 'aura-minimap';
      minimap.innerHTML = `<div id="aura-minimap-viewport"></div>`;
      document.body.appendChild(minimap);

      // Handle dragging on minimap to scroll
      const viewport = document.getElementById('aura-minimap-viewport');
      
      const handleMinimapScroll = (clientY) => {
        const container = getChatScrollContainer();
        if (!container) return;

        const rect = minimap.getBoundingClientRect();
        const y = clientY - rect.top;
        const ratio = Math.max(0, Math.min(1, y / rect.height));

        container.scrollTop = ratio * (container.scrollHeight - container.clientHeight);
      };

      minimap.addEventListener('mousedown', e => {
        isDraggingMinimap = true;
        handleMinimapScroll(e.clientY);
        e.preventDefault();
      });

      document.addEventListener('mousemove', e => {
        if (!isDraggingMinimap) return;
        handleMinimapScroll(e.clientY);
      });

      document.addEventListener('mouseup', () => {
        isDraggingMinimap = false;
      });
    }

    updateMinimapTicks();
  };

  const updateMinimapTicks = () => {
    const minimap = document.getElementById('aura-minimap');
    const container = getChatScrollContainer();
    if (!minimap) return;

    if (!container || !currentChatId) {
      minimap.style.opacity = '0';
      minimap.style.pointerEvents = 'none';
      return;
    }

    minimap.style.opacity = '1';
    minimap.style.pointerEvents = 'auto';

    // Clear old ticks
    minimap.querySelectorAll('.aura-minimap-tick').forEach(t => t.remove());

    const bubbles = Array.from(document.querySelectorAll('user-query, model-response'));
    if (bubbles.length === 0) return;

    const SH = container.scrollHeight;
    const CH = container.clientHeight;
    const ST = container.scrollTop;

    const minimapHeight = minimap.clientHeight;
    const containerRect = container.getBoundingClientRect();

    bubbles.forEach(bubble => {
      const bubbleRect = bubble.getBoundingClientRect();
      // Calculate top position of the bubble relative to the scroll container's content
      const relativeTop = bubbleRect.top - containerRect.top + ST;
      const bubbleHeight = bubbleRect.height;

      // Calculate percentage values
      const topPct = (relativeTop / SH) * minimapHeight;
      const heightPct = Math.max(2, (bubbleHeight / SH) * minimapHeight);

      const tick = document.createElement('div');
      const isPrompt = bubble.tagName === 'USER-QUERY';
      tick.className = `aura-minimap-tick ${isPrompt ? 'prompt' : 'response'}`;
      tick.style.top = `${topPct}px`;
      tick.style.height = `${heightPct}px`;
      
      const cleanText = bubble.textContent.replace(/⭐/g, '').trim().substring(0, 80) + '...';
      tick.title = cleanText;

      minimap.appendChild(tick);
    });

    // Update viewport highlighter box position and height
    const viewport = document.getElementById('aura-minimap-viewport');
    if (viewport) {
      const vpHeight = Math.max(8, (CH / SH) * minimapHeight);
      const vpTop = (ST / SH) * minimapHeight;
      
      viewport.style.height = `${vpHeight}px`;
      viewport.style.top = `${vpTop}px`;
    }
  };

      const renderSuggestionsLoading = () => {
        removeSuggestionChips();

        const responses = Array.from(document.querySelectorAll('model-response'));
        if (responses.length === 0) return;
        const lastResponse = responses[responses.length - 1];

        const container = document.createElement('div');
        container.id = 'aura-suggestion-chips-container';
        container.className = 'aura-followups-container';

        container.innerHTML = `
          <div class="aura-followups-header">
            <span class="aura-followups-title">Follow-ups · Vaxlou <span class="aura-followups-badge">Đang tạo gợi ý... ⚡</span></span>
          </div>
          <div class="aura-followups-list" style="padding: 14px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;">
            <div class="aura-followups-loading-spinner" style="display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #6366f1; border-radius: 50%; animation: aura-spin 1s linear infinite; margin-right: 8px; vertical-align: middle;"></div>
            Đang tạo gợi ý hội thoại bằng AI...
          </div>
        `;

        lastResponse.appendChild(container);
      };

      const updateSmartSuggestions = (chatId) => {
        if (state.settings && state.settings.enableFollowups === false) {
          removeSuggestionChips();
          return;
        }

        const responses = Array.from(document.querySelectorAll('model-response'));
        if (responses.length === 0) {
          removeSuggestionChips();
          return;
        }

        const lastResponse = responses[responses.length - 1];
        
        // Check if suggestion chips already generated for this exact block
        if (lastResponse.dataset.auraSuggestionsBound) {
          return;
        }

        // Reset old marks
        responses.forEach(r => delete r.dataset.auraSuggestionsBound);
        lastResponse.dataset.auraSuggestionsBound = 'true';

        const text = lastResponse.textContent.trim();
        const cleanText = text.replace(/Follow-ups · Vaxlou.*/s, '').trim();

        const activeIdx = (state.settings && typeof state.settings.activeKeyIndex === 'number') ? state.settings.activeKeyIndex : 0;
        const activeProfile = (state.settings && state.settings.apiKeys) ? state.settings.apiKeys[activeIdx] : null;
        const apiKey = activeProfile ? activeProfile.key : '';
        const model = (activeProfile && activeProfile.model) ? activeProfile.model : 'gemini-3.1-flash-lite';

        if (apiKey && apiKey.trim()) {
          // 1. Show premium loading state
          renderSuggestionsLoading();
          
          const systemPrompt = `Bạn là chuyên gia gợi ý hội thoại thông minh (Smart Follow-up Generator) cho tiện ích Vaxlou.
    Dựa trên phản hồi cuối cùng của AI dưới đây, hãy đề xuất 3 câu gợi ý tiếp theo cực kỳ tự nhiên, thông minh, ngắn gọn, thiết thực và hữu ích cho người dùng.

    Quy định nghiêm ngặt:
    1. Viết gợi ý bằng chính ngôn ngữ của đoạn hội thoại (Ví dụ: Tiếng Việt tự nhiên, không sáo rỗng, không máy móc).
    2. Tuyệt đối KHÔNG sử dụng các từ ngữ chung chung như "ngày", "chủ đề này", "khía cạnh này", "Bách hôm", "đoạn trên". Mọi từ khóa phải được thay thế cụ thể, tự nhiên dựa trên ngữ cảnh thực tế của cuộc trò chuyện.
    3. Mỗi gợi ý phải bắt đầu bằng 1 emoji phù hợp và KHÔNG vượt quá 15 từ.
    4. Trả về đúng 3 dòng, mỗi dòng là một gợi ý duy nhất, KHÔNG chứa số thứ tự (như 1., 2., 3.), KHÔNG chứa dấu gạch đầu dòng, KHÔNG giải thích gì thêm.`;

          const fullPrompt = `${systemPrompt}\n\nPhản hồi của AI:\n"""\n${cleanText}\n"""\n\nHãy tạo 3 câu gợi ý tiếp theo:`;

          chrome.runtime.sendMessage({
            action: 'callGeminiAPI',
            apiKey: apiKey,
            model: model,
            prompt: fullPrompt
          }, response => {
            if (response && response.success && response.text) {
              const lines = response.text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
                .map(line => line.replace(/^([^\w\s\d]+)\s*[-*•\d.]+\s*/, '$1 ').trim());
                
              if (lines.length >= 3) {
                renderSuggestionChips(lines.slice(0, 3), true);
                return;
              }
            }
            
            // Error or format issue -> Fall back to local suggestions
            const hasCode = cleanText.includes('```') || cleanText.includes('<code>');
            const localSuggestions = generateSuggestions(cleanText, hasCode);
            renderSuggestionChips(localSuggestions, false);
          });
        } else {
          // No API configured -> Fall back to local suggestions
          const hasCode = cleanText.includes('```') || cleanText.includes('<code>');
          const localSuggestions = generateSuggestions(cleanText, hasCode);
          renderSuggestionChips(localSuggestions, false);
        }
      };

      const extractKeywords = (text) => {
        if (!text) return [];

        // 1. Clean up the text: remove code blocks, inline code, HTML tags, punctuation
        let cleanText = text
          .replace(/```[\s\S]*?```/g, '') // remove code blocks
          .replace(/`[^`]+`/g, '')        // remove inline code
          .replace(/<[^>]+>/g, ' ')       // remove html tags
          .replace(/[\[\]\(\)#\*_\-\+\=\\\/\|\{\}:;"',.?!~@$%^&<>•“”]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const originalWords = cleanText.split(' ').map(w => w.trim()).filter(Boolean);
        const words = originalWords.map(w => w.toLowerCase());
        
        // Comprehensive Vietnamese and English stop-words
        const stopWords = new Set([
          // Vietnamese stop words (pronouns, prepositions, conjunctions, very common particles)
          'và', 'của', 'các', 'những', 'để', 'là', 'thì', 'mà', 'có', 'trong', 'cho', 'được', 'với', 'từ', 'này', 'đó', 
          'sau', 'trên', 'dưới', 'ra', 'vào', 'lên', 'lại', 'qua', 'đã', 'đang', 'sẽ', 'cũng', 'như', 'nhưng', 'chỉ', 
          'hơn', 'nhiều', 'ít', 'rất', 'quá', 'một', 'hai', 'ba', 'bốn', 'năm', 'này', 'kia', 'nào', 'ai', 'gì', 'sao', 
          'đâu', 'thế', 'vậy', 'nếu', 'tuy', 'nhờ', 'vì', 'nên', 'bởi', 'tại', 'nhất', 'hết', 'mọi', 'mỗi', 'từng', 'cả', 
          'chúng', 'tôi', 'bạn', 'anh', 'chị', 'em', 'nó', 'họ', 'ta', 'mình', 'ấy', 'thêm', 'làm', 'phải', 'muốn',
          'đoạn', 'bản', 'khối', 'phần', 'mục', 'câu', 'hỏi', 'trả', 'lời', 'cách', 'việc', 'sự', 'nơi', 'khí', 'bộ',
          'cái', 'chi', 'ở', 'đây', 'đó', 'kia', 'nay', 'xong', 'rồi', 'vừa', 'mới', 'tự', 'đi', 'xem', 'thấy', 'vẫn', 
          'chưa', 'thoải', 'mái', 'gõ', 'chỉ', 'đấy', 'trọn', 'hạ', 'gục', 'nhé', 'nhỉ', 'nha', 'ơi', 'à', 'hả', 'ư', 'chăng',
          'ngày', 'tháng', 'năm', 'hôm', 'nay', 'qua', 'mai', 'kia', 'đợt', 'lần', 'lúc', 'khi', 'giờ', 'phút', 'giây', 
          'tuần', 'thứ', 'sáng', 'trưa', 'chiều', 'tối', 'đêm', 'chào', 'hello', 'hi', 'bác', 'ông', 'bà', 'con', 'cháu',
          'admin', 'user', 'gemini', 'aura', 'ai', 'bot', 'sao', 'đâu', 'cần', 'nên', 'hãy', 'đừng', 'không', 'cảm', 'ơn',
          'thanks', 'thank', 'yes', 'no', 'ok', 'okay', 'đến', 'về', 'mang', 'đưa', 'lấy', 'cho', 'nói', 'đọc', 'viết',
          'chạy', 'học', 'dùng', 'sử', 'dụng', 'biết', 'nghĩ', 'hiểu', 'nhìn', 'nghe', 'số', 'lượng', 'khá', 'hơi', 'cực',
          'chục', 'trăm', 'nghìn', 'triệu', 'tỷ',
          // English stop words
          'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 
          'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 
          'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 
          'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 
          'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
          'you', 'your', 'my', 'me', 'we', 'our', 'us', 'they', 'them', 'he', 'she', 'it', 'his', 'her', 'its', 'this', 'that'
        ]);

        const candidates = {};
        const originalCaseMap = {}; // Maps lowercase keyword -> original cased keyword (most frequent version)
        const originalCaseCounts = {}; // Maps lowercase -> { originalCase: count }

        const trackOriginalCase = (lowerText, originalText) => {
          if (!originalCaseCounts[lowerText]) originalCaseCounts[lowerText] = {};
          originalCaseCounts[lowerText][originalText] = (originalCaseCounts[lowerText][originalText] || 0) + 1;
          
          // Keep track of the one with the highest frequency
          let bestOriginal = originalText;
          let maxCount = 0;
          for (const opt in originalCaseCounts[lowerText]) {
            if (originalCaseCounts[lowerText][opt] > maxCount) {
              maxCount = originalCaseCounts[lowerText][opt];
              bestOriginal = opt;
            }
          }
          originalCaseMap[lowerText] = bestOriginal;
        };

        for (let i = 0; i < words.length; i++) {
          let w1 = words[i];
          let origW1 = originalWords[i];
          
          // Skip numeric tokens and single characters
          if (stopWords.has(w1) || w1.length < 2 || /^\d+$/.test(w1)) continue;

          // Single word candidate (only if at least 3 characters)
          if (w1.length >= 3) {
            candidates[w1] = (candidates[w1] || 0) + 1;
            trackOriginalCase(w1, origW1);
          }

          // Adjacent bigram candidate
          if (i < words.length - 1) {
            let w2 = words[i+1];
            let origW2 = originalWords[i+1];
            
            if (!stopWords.has(w2) && w2.length >= 2 && !/^\d+$/.test(w2)) {
              const bigramLower = w1 + ' ' + w2;
              const bigramOrig = origW1 + ' ' + origW2;
              candidates[bigramLower] = (candidates[bigramLower] || 0) + 4; // Give bigrams 4x higher baseline score
              trackOriginalCase(bigramLower, bigramOrig);
            }
          }
        }

        // Rank candidates by their accumulated score
        return Object.keys(candidates)
          .sort((a, b) => candidates[b] - candidates[a])
          .map(k => originalCaseMap[k] || k);
      };

      const generateSuggestions = (text, hasCode) => {
        const kws = extractKeywords(text);
        const kw1 = kws[0] || 'chủ đề này';
        const kw2 = kws[1] || 'các khía cạnh cốt lõi';
        const kw3 = kws[2] || 'chi tiết liên quan';
        
        // Lowercase text for matching categories
        const lowerText = text.toLowerCase();

        // 1. Code / Programming Category
        // Requires hasCode is true, and text actually contains technical coding words
        if (hasCode && (
          lowerText.includes('code') || lowerText.includes('mã') || lowerText.includes('function') || 
          lowerText.includes('class') || lowerText.includes('hàm') || lowerText.includes('lập trình') || 
          lowerText.includes('const ') || lowerText.includes('def ') || lowerText.includes('import ')
        )) {
          let lang = 'đoạn code';
          if (lowerText.includes('javascript') || lowerText.includes('const ') || lowerText.includes('let ') || lowerText.includes('console.log')) lang = 'JavaScript';
          else if (lowerText.includes('python') || lowerText.includes('def ') || lowerText.includes('import ')) lang = 'Python';
          else if (lowerText.includes('java') || lowerText.includes('public class ')) lang = 'Java';
          else if (lowerText.includes('html') || lowerText.includes('</div>')) lang = 'HTML/CSS';
          else if (lowerText.includes('cpp') || lowerText.includes('#include')) lang = 'C++';
          else if (lowerText.includes('sql') || lowerText.includes('select ') || lowerText.includes('insert ')) lang = 'SQL';
          
          return [
            `⚡ Tối ưu hiệu năng và bộ nhớ cho ${lang} này`,
            `🧪 Thiết kế các ca kiểm thử (Unit Tests) cho ${lang} trên`,
            `🛡️ Phân tích các lỗ hổng bảo mật tiềm ẩn trong ${lang} này`,
            `📝 Bổ sung chú thích giải thích logic phức tạp của ${lang}`,
            `🔄 Chuyển đổi ${lang} này sang một ngôn ngữ lập trình khác`,
            `🧩 Refactor ${lang} trên theo nguyên lý Clean Code và SOLID`,
            `🐞 Tạo danh sách các edge cases có thể gây lỗi cho ${lang}`,
            `💡 Hướng dẫn tôi cách debug nhanh hoặc ghi log cho ${lang} này`
          ];
        }

        // 2. Music / Art / Celebrity / Entertainment Category (HIGH PRIORITY for arts & show)
        if (
          lowerText.includes("ca sĩ") || lowerText.includes("nghệ sĩ") || lowerText.includes("diễn viên") || 
          lowerText.includes("nhạc sĩ") || lowerText.includes("bài hát") || lowerText.includes("mv") || 
          lowerText.includes("album") || lowerText.includes("âm nhạc") || lowerText.includes("sản phẩm âm nhạc") || 
          lowerText.includes("bản hit") || lowerText.includes("showbiz") || lowerText.includes("concert") || 
          lowerText.includes("liveshow") || lowerText.includes("đạo diễn") || lowerText.includes("phim") ||
          lowerText.includes("tác phẩm") || lowerText.includes("nghệ thuật") || lowerText.includes("ca khúc")
        ) {
          return [
            `🎵 Tìm hiểu thêm về phong cách nghệ thuật và các tác phẩm nổi bật của "${kw1}"`,
            `🎤 Những cột mốc quan trọng nhất trong hành trình sự nghiệp của "${kw1}" là gì?`,
            `💿 Có những dự án nghệ thuật hoặc hoạt động mới nhất nào về "${kw1}" không?`,
            `🌟 Phân tích sức ảnh hưởng của "${kw1}" đối với người hâm mộ hoặc nền nghệ thuật đương đại`,
            `🎼 Danh sách các sản phẩm/tác phẩm thành công nhất tạo nên tên tuổi của "${kw1}"`,
            `💬 Những câu chuyện hậu trường hoặc thông tin thú vị bên lề về "${kw1}"`,
            `🎬 Đề xuất một số sản phẩm nghệ thuật nổi bật đáng xem/nghe thử của "${kw1}"`
          ];
        }

        // 3. Error / Technical Debugging Category
        // Ensure it is about a system error, not just a casual error
        if (
          (lowerText.includes("error") || lowerText.includes("fail") || lowerText.includes("lỗi") || 
           lowerText.includes("exception") || lowerText.includes("crash") || lowerText.includes("bug")) && 
          (lowerText.includes("hệ thống") || lowerText.includes("mã") || lowerText.includes("chương trình") || 
           lowerText.includes("cài đặt") || lowerText.includes("setup") || lowerText.includes("server") || 
           lowerText.includes("ứng dụng") || lowerText.includes("phần mềm"))
        ) {
          return [
            `🔍 Phân tích sâu nguyên nhân gốc rễ dẫn đến lỗi "${kw1}"`,
            `🛠️ Đề xuất giải pháp sửa lỗi nhanh và viết mã phòng ngừa cho "${kw1}"`,
            `📈 Cách tối ưu hóa hệ thống để tránh gặp lại lỗi "${kw1}"`,
            `🧪 Viết một kịch bản kiểm thử để mô phỏng và tái hiện lỗi "${kw1}"`,
            `🛡️ Hướng dẫn cách xử lý ngoại lệ an toàn khi gặp "${kw1}"`,
            `💡 Lỗi "${kw1}" này có thể gây ra những tác dụng phụ nào khác?`
          ];
        }

        // 4. Translation / Language Category
        if (
          lowerText.includes("dịch") || lowerText.includes("translate") || lowerText.includes("tiếng") || 
          lowerText.includes("ngôn ngữ") || lowerText.includes("grammar") || lowerText.includes("vocabulary") ||
          lowerText.includes("phát âm") || lowerText.includes("từ vựng")
        ) {
          return [
            `🔄 Dịch văn bản trên sang một giọng điệu tự nhiên, chuẩn bản xứ hơn`,
            `✍️ Phân tích các cấu trúc ngữ pháp và từ vựng nâng cao dùng trong "${kw1}"`,
            `🗣️ Đề xuất 5 mẫu câu giao tiếp thông dụng có cùng ngữ nghĩa với "${kw1}"`,
            `🧠 Giải thích sự khác biệt sắc thái nghĩa giữa "${kw1}" và từ đồng nghĩa`,
            `📚 Viết một đoạn đối thoại ngắn thực tế sử dụng cụm từ "${kw1}"`
          ];
        }

        // 5. Writing / Creative Content Category
        if (
          lowerText.includes("email") || lowerText.includes("viết bài") || lowerText.includes("soạn thảo") || 
          lowerText.includes("bài blog") || lowerText.includes("kịch bản") || lowerText.includes("content") || 
          lowerText.includes("viết thư") || lowerText.includes("resume") || lowerText.includes("chỉnh sửa cv")
        ) {
          return [
            `✍️ Viết lại đoạn trên với phong cách chuyên nghiệp / thuyết phục hơn`,
            `🔥 Đề xuất 5 tiêu đề cuốn hút cho chủ đề "${kw1}"`,
            `📱 Chuyển đổi bài viết trên thành bài đăng ngắn gọn trên LinkedIn/Facebook`,
            `📧 Soạn một email gửi đối tác dựa trên các ý chính của "${kw1}"`,
            `🎯 Phân tích đối tượng độc giả mục tiêu phù hợp nhất cho bài viết`,
            `📈 Tóm tắt bài viết trên thành 3 gạch đầu dòng cô đọng nhất`
          ];
        }

        // 6. Planning / Business / Product Category
        // Requires strong business keywords to avoid false positives
        if (
          lowerText.includes("chiến lược") || lowerText.includes("kế hoạch marketing") || 
          lowerText.includes("doanh thu") || lowerText.includes("khởi nghiệp") || lowerText.includes("startup") || 
          lowerText.includes("kinh doanh") || lowerText.includes("swot") || lowerText.includes("kpi") || 
          lowerText.includes("okr") || lowerText.includes("tài chính") || lowerText.includes("bán hàng") ||
          lowerText.includes("đối thủ cạnh tranh")
        ) {
          return [
            `📊 Phác thảo mô hình SWOT hoặc Canvas chi tiết áp dụng cho "${kw1}"`,
            `🎯 Xác định chân dung khách hàng mục tiêu cho giải pháp "${kw1}"`,
            `⚠️ Phân tích 3 rủi ro lớn nhất của chiến lược "${kw1}" và giải pháp dự phòng`,
            `📈 Đề xuất các chỉ số KPI/OKR để đo lường mức độ thành công của "${kw1}"`,
            `🚀 Xây dựng lộ trình triển khai 3 giai đoạn cho dự án "${kw1}"`,
            `💡 Đề xuất các kênh Marketing chi phí thấp nhưng hiệu quả cho "${kw1}"`
          ];
        }

        // 7. Math / Data / Analytics Category
        if (
          lowerText.includes("phương trình") || lowerText.includes("đạo hàm") || lowerText.includes("thống kê") || 
          lowerText.includes("dữ liệu") || lowerText.includes("data") || lowerText.includes("công thức") || 
          lowerText.includes("excel") || lowerText.includes("sql") || lowerText.includes("analytics") ||
          lowerText.includes("biểu đồ")
        ) {
          return [
            `📈 Hướng dẫn từng bước giải chi tiết công thức "${kw1}"`,
            `📊 Đề xuất cách thiết kế Dashboard hoặc biểu đồ cho dữ liệu "${kw1}"`,
            `🧪 Phân tích các biến số ảnh hưởng nhất trong dữ liệu này`,
            `🛠️ Viết câu lệnh SQL hoặc mã Python để làm sạch và xử lý tập dữ liệu`,
            `💡 Làm thế nào để áp dụng kết quả phân tích "${kw1}" vào thực tế?`
          ];
        }

        // 8. General Dynamic Keyword-Based Category (General Fallback)
        const result = [
          `💡 Đưa ra ví dụ thực tế sinh động để minh họa cho "${kw1}"`,
          `🧠 Giải thích chi tiết nguyên lý hoạt động đằng sau "${kw1}"`,
          `❓ Sự khác biệt lớn nhất giữa "${kw1}" và "${kw2}" là gì?`,
          `🛠️ Những công cụ hoặc phương pháp hỗ trợ tốt nhất cho "${kw1}"?`,
          `⚡ Những sai lầm phổ biến nhất thường mắc phải khi áp dụng "${kw1}"?`,
          `🔮 Xu hướng phát triển và tương lai của "${kw1}" trong 5 năm tới?`,
          `⚖️ So sánh ưu điểm và nhược điểm của việc ứng dụng "${kw1}"`,
          `📚 Đề xuất các nguồn tài liệu, sách uy tín để nghiên cứu về "${kw1}"`,
          `🎯 Làm thế nào để kết hợp giữa "${kw1}" và "${kw2}" hiệu quả nhất?`
        ];

        if (kw3 && kw3 !== 'chi tiết liên quan') {
          result.push(`🔬 Phân tích mối liên hệ tương quan giữa "${kw1}" và "${kw3}"`);
        }

        return result;
      };

      const renderSuggestionChips = (suggestions, isAIActive = false) => {
        removeSuggestionChips();

        const responses = Array.from(document.querySelectorAll('model-response'));
        if (responses.length === 0) return;
        const lastResponse = responses[responses.length - 1];

        const container = document.createElement('div');
        container.id = 'aura-suggestion-chips-container';
        container.className = 'aura-followups-container';

        // If using local fallback, we shuffle and slice 3 suggestions for display
        // If using AI, the AI generated exactly 3, so we display them all
        const picked = isAIActive ? suggestions : suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);

        let listHTML = '';
        picked.forEach(s => {
          const cleanText = s.replace(/^[^\w]*/, '').trim();
          listHTML += `
            <div class="aura-followup-item" data-query="${cleanText}">
              <span class="aura-followup-arrow">↳</span>
              <span class="aura-followup-text">${s}</span>
            </div>
          `;
        });

        const badgeHTML = isAIActive
          ? `<span class="aura-followups-badge">AI Active ⚡</span>`
          : `<span class="aura-followups-badge offline" title="Nhấp để cấu hình Gemini API Key">Offline (Kích hoạt AI) ⚙️</span>`;

        container.innerHTML = `
          <div class="aura-followups-header">
            <span class="aura-followups-title">Follow-ups · Vaxlou ${badgeHTML}</span>
            <div class="aura-followups-actions">
              <button class="aura-followups-btn refresh" title="Đổi gợi ý">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              </button>
            </div>
          </div>
          <div class="aura-followups-list">
            ${listHTML}
          </div>
        `;

        lastResponse.appendChild(container);

        // Bind click events on items
        container.querySelectorAll('.aura-followup-item').forEach(item => {
          item.addEventListener('click', () => {
            submitFollowUpQuery(item.dataset.query);
          });
        });

        // Bind offline badge click to open settings in right drawer
        if (!isAIActive) {
          const offlineBadge = container.querySelector('.aura-followups-badge.offline');
          if (offlineBadge) {
            offlineBadge.addEventListener('click', (e) => {
              e.stopPropagation();
              const drawer = document.getElementById('aura-right-drawer');
              const toggleBtn = document.getElementById('aura-right-drawer-toggle');
              if (drawer && !drawer.classList.contains('open')) {
                if (toggleBtn) toggleBtn.click();
              }
              // Activate settings tab
              const tab = drawer?.querySelector('.aura-drawer-tab[data-tab="settings"]');
              if (tab) tab.click();
              
              // Focus Key input
              setTimeout(() => {
                const keyInput = document.getElementById('aura-settings-api-key');
                if (keyInput) {
                  keyInput.focus();
                  keyInput.classList.add('aura-settings-highlight');
                  setTimeout(() => keyInput.classList.remove('aura-settings-highlight'), 1500);
                }
              }, 300);
            });
          }
        }

        // Bind refresh button click
        container.querySelector('.aura-followups-btn.refresh')?.addEventListener('click', (e) => {
          e.stopPropagation();
          delete lastResponse.dataset.auraSuggestionsBound;
          updateSmartSuggestions(currentChatId);
        });
      };

      const removeSuggestionChips = () => {
        document.getElementById('aura-suggestion-chips-container')?.remove();
      };

      const placeCursorAtEnd = (el) => {
        el.focus();
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        } else if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      };

      const submitFollowUpQuery = (queryText) => {
        const textarea = document.querySelector('div[contenteditable="true"]:not(#aura-notes-editor)') || document.querySelector('textarea');
        if (!textarea) return;

        const cleanedText = queryText.replace(/^[^\w]*/, '').trim();

        if (textarea.tagName === 'DIV') {
          textarea.innerHTML = `<p>${cleanedText}</p>`;
        } else {
          textarea.value = cleanedText;
        }

        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));

        // Focus and place cursor at the end so user can edit and send
        placeCursorAtEnd(textarea);

        // Scroll to the bottom to prepare for transition
        const scrollContainer = getChatScrollContainer();
        if (scrollContainer) {
          setTimeout(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }, 10);
        }

        // Remove chips so it doesn't clutter
        removeSuggestionChips();
      };


      // ====================================================
      //   ACTIVE CHAT LIFECYCLE MONITOR
      // ====================================================
      const monitorActiveChatLifecycle = () => {
        const currentURL = window.location.pathname;
        const activeId = getChatId(currentURL);

        if (activeId !== currentChatId) {
          currentChatId = activeId;
          lastModelResponseCount = 0;
          
          if (activeId) {
            // Set metadata timestamps if it's a new or existing chat
            if (!state.chatMetadata) state.chatMetadata = {};
            if (!state.chatMetadata[activeId]) {
              state.chatMetadata[activeId] = {
                id: activeId,
                title: document.title || 'Đang tải...',
                href: currentURL,
                createdAt: Date.now(),
                lastActive: Date.now(),
                bookmarks: []
              };
            } else {
              state.chatMetadata[activeId].lastActive = Date.now();
            }
            
            saveState();

            // Initialize features for this specific chat
            injectRightDrawer();
            updateDrawerNote();
            if (document.getElementById('aura-outline-view')?.classList.contains('active')) {
              renderOutlineList();
            }
          } else {
            // Home page or static page - Hide drawer toggle
            document.getElementById('aura-right-drawer')?.classList.remove('open');
            document.body.classList.remove('aura-drawer-open');
            const toggle = document.getElementById('aura-right-drawer-toggle');
            if (toggle) {
              toggle.style.right = '-40px'; // hide offscreen
            }
            removeSuggestionChips();
            updateDrawerNote();
          }
        }

        // Continuous checks for current active chat DOM changes
        if (currentChatId) {
          // Show/move toggle button back on screen if hidden
          const toggle = document.getElementById('aura-right-drawer-toggle');
          if (toggle && toggle.style.right === '-40px') {
            toggle.style.right = '0';
          }

          updateSmartSuggestions(currentChatId);


          // If outline tab is active, refresh it
          const outlineView = document.getElementById('aura-outline-view');
          if (outlineView && outlineView.classList.contains('active')) {
            renderOutlineList();
          }
        }
      };


      // ====================================================
      //   🪄 PREMIUM FEATURE: PROMPT OPTIMIZER
      // ====================================================
      const findNativeAttachmentButton = () => {
        const querySelectors = 'button, g-icon-button, [role="button"], [aria-label]';
        // 1. Search inside the chat input container first (local-first design)
        const inputContainer = document.querySelector('chat-input, .chat-input, [class*="input-area"], [class*="prompt-box"], form');
        if (inputContainer) {
          const buttons = Array.from(inputContainer.querySelectorAll(querySelectors));
          for (const btn of buttons) {
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (
              ariaLabel.includes('add files') || 
              ariaLabel.includes('tải tệp lên') || 
              ariaLabel.includes('đính kèm') ||
              ariaLabel.includes('upload') ||
              ariaLabel.startsWith('add')
            ) {
              return btn;
            }
          }
          for (const btn of buttons) {
            if (
              btn.innerHTML.includes('plus') || 
              btn.innerHTML.includes('add') || 
              btn.textContent.trim() === '+' ||
              btn.querySelector('svg')
            ) {
              return btn;
            }
          }
        }

        // 2. Look for buttons containing a plus SVG next to contenteditable/textarea
        const inputArea = document.querySelector('div[contenteditable="true"]:not(#aura-notes-editor)') || document.querySelector('textarea');
        if (inputArea) {
          const form = inputArea.closest('form') || inputArea.closest('.input-area-container') || inputArea.parentElement;
          if (form) {
            const formBtns = Array.from(form.querySelectorAll(querySelectors));
            for (const btn of formBtns) {
              const svg = btn.querySelector('svg');
              if (svg) {
                const path = svg.querySelector('path');
                if (path) {
                  const d = path.getAttribute('d') || '';
                  if (d.includes('M19') || d.includes('M12') || d.includes('M5') || d.toLowerCase().includes('plus')) {
                    return btn;
                  }
                }
              }
              if (btn.innerHTML.includes('plus') || btn.textContent.trim() === '+') {
                return btn;
              }
            }
            // Fallback: return the first button in the form
            if (formBtns.length > 0) return formBtns[0];
          }
        }

        // 3. Global fallback but with strict exclusions to prevent matching top bar/menus
        const globalButtons = Array.from(document.querySelectorAll(querySelectors));
        for (const btn of globalButtons) {
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          if (btn.closest('#gb') || btn.closest('header') || btn.closest('[class*="profile"]') || btn.closest('[class*="menu"]') || btn.closest('[class*="avatar"]')) {
            continue;
          }
          if (
            ariaLabel.includes('add files') || 
            ariaLabel.includes('tải tệp lên') || 
            ariaLabel.includes('đính kèm') ||
            ariaLabel.includes('upload')
          ) {
            return btn;
          }
        }
        return null;
      };

      const injectPromptOptimizerButton = () => {
        if (state.settings && state.settings.enableOptimizer === false) {
          document.getElementById('aura-prompt-optimizer-btn')?.remove();
          return;
        }

        // If it exists, check if it's misplaced (e.g., inside the notes drawer or folders sidebar)
        const existingBtn = document.getElementById('aura-prompt-optimizer-btn');
        if (existingBtn) {
          if (existingBtn.closest('#aura-right-drawer') || existingBtn.closest('#aura-folders-section')) {
            existingBtn.remove();
          } else {
            return;
          }
        }

        const nativeBtn = findNativeAttachmentButton();
        const inputArea = document.querySelector('div[contenteditable="true"]:not(#aura-notes-editor)') || document.querySelector('textarea');
        if (!inputArea) return; // No chat input on this page

        const optBtn = document.createElement('button');
        optBtn.id = 'aura-prompt-optimizer-btn';
        optBtn.type = 'button';
        optBtn.title = 'Tối ưu hóa Prompt thông minh (Vaxlou Optimizer) ✨';
        
        // Premium custom AI Sparkles SVG - size adjusted to 18px to match native weights perfectly
        optBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"/>
            <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>
          </svg>
        `;

        // Dynamic style copying to match the native button perfectly!
        if (nativeBtn) {
          try {
            const computed = window.getComputedStyle(nativeBtn);
            if (computed.width && computed.width !== 'auto') {
              optBtn.style.width = computed.width;
            }
            if (computed.height && computed.height !== 'auto') {
              optBtn.style.height = computed.height;
            }
            if (computed.margin && computed.margin !== 'auto') {
              optBtn.style.margin = computed.margin;
            }
            if (computed.padding && computed.padding !== 'auto') {
              optBtn.style.padding = computed.padding;
            }
            if (computed.alignSelf) {
              optBtn.style.alignSelf = computed.alignSelf;
            }
            if (computed.verticalAlign) {
              optBtn.style.verticalAlign = computed.verticalAlign;
            }
            if (computed.display) {
              optBtn.style.display = computed.display;
            }
          } catch (err) {
            console.warn('[Vaxlou] Failed to copy computed styles from native button:', err);
          }
        }

        if (nativeBtn && nativeBtn.parentElement) {
          try {
            nativeBtn.parentElement.style.setProperty('display', 'flex', 'important');
            nativeBtn.parentElement.style.setProperty('flex-direction', 'row', 'important');
            nativeBtn.parentElement.style.setProperty('align-items', 'center', 'important');
          } catch (e) {
            console.warn('[Vaxlou] Failed to apply flex row style to native container:', e);
          }
          nativeBtn.after(optBtn);
        } else {
          inputArea.parentElement.insertBefore(optBtn, inputArea);
        }

        // Bind optimizer click trigger
        optBtn.addEventListener('click', e => {
          e.stopPropagation();
          e.preventDefault();
          togglePromptOptimizerMenu(optBtn);
        });
      };

      let activeOptimizerMenu = null;

      const togglePromptOptimizerMenu = (anchorBtn) => {
        if (activeOptimizerMenu) {
          closePromptOptimizerMenu();
          return;
        }

        const menu = document.createElement('div');
        menu.id = 'aura-prompt-optimizer-menu';
        menu.className = 'aura-prompt-optimizer-menu';

        menu.innerHTML = `
          <div class="aura-opt-header">Tối ưu hóa Prompt ✨</div>
          <div class="aura-opt-item" data-type="clarify">
            <span class="aura-opt-icon">✨</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Làm rõ & Cấu trúc</div>
              <div class="aura-opt-desc">Thêm vai trò, bối cảnh, nhiệm vụ cụ thể</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="context">
            <span class="aura-opt-icon">💡</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Thêm ngữ cảnh & Chi tiết</div>
              <div class="aura-opt-desc">Làm rõ giả định, ràng buộc thực tế</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="technical">
            <span class="aura-opt-icon">💻</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Lập trình & Kỹ thuật</div>
              <div class="aura-opt-desc">Yêu cầu Clean Code, Edge cases, Unit Tests</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="creative">
            <span class="aura-opt-icon">✍️</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Sáng tạo & Thuyết phục</div>
              <div class="aura-opt-desc">Tinh chỉnh tông giọng, diễn đạt lôi cuốn</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="image">
            <span class="aura-opt-icon">🎨</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Tạo Ảnh (Nano Banana Pro/2)</div>
              <div class="aura-opt-desc">Tối ưu cho Nano Banana Pro/2 trên Gemini</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="video">
            <span class="aura-opt-icon">🎬</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Tạo Video (Google Veo 3)</div>
              <div class="aura-opt-desc">Ngôn ngữ điện ảnh, chuyển động camera Veo</div>
            </div>
          </div>
          
            </div>
          </div>
          <div class="aura-opt-item" data-type="data">
            <span class="aura-opt-icon">📊</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Phân tích Dữ liệu & SQL</div>
              <div class="aura-opt-desc">Excel, SQL, phân tích số liệu chuyên sâu</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="marketing">
            <span class="aura-opt-icon">📈</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Marketing & SEO</div>
              <div class="aura-opt-desc">Chiến lược kinh doanh, phễu bán hàng, từ khóa</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="academic">
            <span class="aura-opt-icon">🎓</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Học thuật & Nghiên cứu</div>
              <div class="aura-opt-desc">Báo cáo khoa học, dịch thuật chuyên ngành</div>
            </div>
          </div>
          <div class="aura-opt-item" data-type="concise">
            <span class="aura-opt-icon">🎯</span>
            <div class="aura-opt-meta">
              <div class="aura-opt-title">Ngắn gọn & Trọng tâm</div>
              <div class="aura-opt-desc">Lược bỏ từ thừa, tập trung ý cốt lõi</div>
            </div>
          </div>
        `;

        document.body.appendChild(menu);
        activeOptimizerMenu = menu;

        // Smart positioning: flip below button if not enough space above
        const rect = anchorBtn.getBoundingClientRect();
        const menuWidth = 280;
        const menuHeight = menu.offsetHeight || 450;
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;

        let top;
        if (spaceAbove >= menuHeight + 8) {
          top = rect.top + window.scrollY - menuHeight - 8;
        } else {
          top = rect.bottom + window.scrollY + 8;
        }
        const left = rect.left + window.scrollX - (menuWidth - rect.width) / 2;

        menu.style.top = `${top}px`;
        menu.style.left = `${Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10))}px`;

        menu.querySelectorAll('.aura-opt-item').forEach(item => {
          item.addEventListener('click', () => {
            const type = item.dataset.type;
            handleOptimizePrompt(type, anchorBtn);
            closePromptOptimizerMenu();
          });
        });

        setTimeout(() => {
          document.addEventListener('click', closeOptimizerMenuOutside);
        }, 10);
      };

      const closePromptOptimizerMenu = () => {
        if (activeOptimizerMenu) {
          activeOptimizerMenu.remove();
          activeOptimizerMenu = null;
        }
        document.removeEventListener('click', closeOptimizerMenuOutside);
      };

      const closeOptimizerMenuOutside = (e) => {
        if (activeOptimizerMenu && !activeOptimizerMenu.contains(e.target) && !e.target.closest('#aura-prompt-optimizer-btn')) {
          closePromptOptimizerMenu();
        }
      };

      const handleOptimizePrompt = (type, anchorBtn) => {
        const t = translations.vi;

        const inputArea = document.querySelector('div[contenteditable="true"]:not(#aura-notes-editor)') || document.querySelector('textarea');
        if (!inputArea) return;

        let draftText = '';
        if (inputArea.tagName === 'DIV') {
          draftText = inputArea.innerText.trim();
        } else {
          draftText = inputArea.value.trim();
        }

        if (!draftText) {
          alert('Vui lòng nhập nội dung nháp vào khung chat trước khi tối ưu hóa! ✍️');
          return;
        }

        // Secure API check
        const activeIdx = (state.settings && typeof state.settings.activeKeyIndex === 'number') ? state.settings.activeKeyIndex : 0;
        const activeProfile = (state.settings && state.settings.apiKeys) ? state.settings.apiKeys[activeIdx] : null;
        const apiKey = activeProfile ? activeProfile.key : '';
        
        if (!apiKey || !apiKey.trim()) {
          showApiKeyWarningToast();
          return;
        }

        const systemPrompts = {
          clarify: `Bạn là chuyên gia kỹ thuật prompt (Prompt Engineer). Hãy viết lại prompt nháp của người dùng dưới đây để làm cho nó rõ ràng hơn, có cấu trúc chặt chẽ hơn. Hãy phân bổ cấu trúc gồm: Vai trò (Role), Bối cảnh (Context), Nhiệm vụ cụ thể (Task), Định dạng đầu ra mong muốn (Output format) nếu phù hợp. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          context: `Bạn là chuyên gia kỹ thuật prompt (Prompt Engineer). Hãy phân tích prompt nháp dưới đây và bổ sung thêm các chi tiết, ngữ cảnh thực tế, giả định hữu ích và các ràng buộc/giới hạn cần thiết để AI có thể đưa ra câu trả lời sâu sắc và chuẩn xác nhất. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          technical: `Bạn là chuyên gia kỹ thuật prompt cho lập trình viên. Hãy tối ưu hóa prompt dưới đây để yêu cầu AI viết mã nguồn/giải pháp kỹ thuật chất lượng cao. Hãy làm nổi bật các yêu cầu về: Clean Code, tối ưu hóa hiệu năng, xử lý lỗi/edge cases, viết Unit Tests, và giải thích kiến trúc nếu cần. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          creative: `Bạn là chuyên gia viết lách và sáng tạo nội dung. Hãy tối ưu hóa prompt nháp dưới đây để AI tạo ra nội dung sáng tạo, có chiều sâu, lôi cuốn người đọc. Điều chỉnh tông giọng, cách tiếp cận, cấu trúc phân đoạn và các yếu tố thu hút độc giả (hooks). Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          image: `Bạn là chuyên gia kỹ thuật prompt cho AI tạo ảnh Nano Banana Pro/2 tích hợp trong Google Gemini. Nano Banana Pro/2 hiểu ngôn ngữ tự nhiên cực kỳ xuất sắc và KHÔNG cần các từ khóa kỹ thuật phức tạp (như "8k", "photorealistic"). Hãy chuyển đổi yêu cầu nháp của người dùng thành một prompt tạo ảnh nghệ thuật bằng tiếng Anh tự nhiên, giàu chi tiết và sống động. Prompt cần mô tả rõ ràng: Chủ thể (Subject), Bối cảnh xung quanh (Background/Setting), Phong cách nghệ thuật (ví dụ: cinematic photo, digital art, oil painting, studio portrait), Màu sắc chủ đạo, Ánh sáng, và Bố cục/Góc máy. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Anh, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          video: `Bạn là chuyên gia kỹ thuật prompt cho mô hình tạo video Google Veo (Veo 3) tích hợp trong Gemini. Google Veo tối ưu nhất khi nhận các chỉ dẫn mô tả chuyển động tự nhiên và ngôn ngữ điện ảnh chuẩn xác. Hãy chuyển đổi ý tưởng nháp dưới đây thành một prompt tạo video tiếng Anh chuyên nghiệp. Prompt cần mô tả chi tiết bằng tiếng Anh: Hoạt cảnh/Chuyển động chính (Main action/Scene), Chuyển động của camera (ví dụ: cinematic slow tracking shot, smooth panning, dramatic zoom), Phong cách hình ảnh (ví dụ: 35mm cinematic film look, photorealistic render), Ánh sáng & Bầu không khí (Lighting & Mood), và nhịp điệu của cảnh quay. Tuyệt đối chỉ trả về nội dung prompt bằng tiếng Anh, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
data: `Bạn là chuyên gia khoa học dữ liệu và kỹ sư phân tích số liệu xuất sắc. Hãy tối ưu hóa prompt nháp dưới đây thành một prompt hướng dẫn AI thực hiện phân tích dữ liệu chuyên sâu, thiết kế cấu trúc cơ sở dữ liệu (Database Schema), viết truy vấn SQL tối ưu hiệu năng hoặc viết công thức Excel/Google Sheets phức tạp. Yêu cầu định hình rõ: Mục tiêu phân tích, Kiểu dữ liệu đầu vào, Phương pháp xử lý, các giả định biên/edge cases và định dạng bảng biểu/biểu đồ kết quả mong muốn. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          marketing: `Bạn là giám đốc Marketing và chuyên gia tối ưu hóa SEO kỳ cựu. Hãy tối ưu hóa prompt nháp dưới đây thành một prompt hướng dẫn AI xây dựng chiến lược kinh doanh, phễu marketing, chân dung khách hàng, kịch bản bán hàng thu hút hoặc bài viết chuẩn SEO có thứ hạng cao. Yêu cầu làm rõ: Đối tượng mục tiêu, Hành vi tâm lý khách hàng, Kênh phân phối, Danh sách từ khóa SEO, Cấu trúc bài viết và Kêu gọi hành động (Call-to-action). Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          academic: `Bạn là giáo sư và nhà nghiên cứu học thuật xuất sắc. Hãy tối ưu hóa prompt nháp dưới đây thành một prompt hướng dẫn AI dịch thuật chuyên ngành, tóm tắt tài liệu khoa học, viết báo cáo nghiên cứu hoặc giải thích các khái niệm học thuật phức tạp một cách sâu sắc, khách quan và khoa học. Yêu cầu làm rõ: Văn phong học thuật chuẩn mực, cấu trúc rõ ràng, sử dụng luận cứ/luận chứng xác đáng, tránh các thiên kiến và từ ngữ sáo rỗng. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`,
          concise: `Bạn là chuyên gia tối giản hóa prompt. Hãy phân tích prompt nháp dưới đây, loại bỏ toàn bộ các từ ngữ thừa thãi, rườm rà nhưng vẫn giữ trọn vẹn ý định và từ khóa cốt lõi của người dùng để AI trả lời nhanh chóng và đi thẳng vào trọng tâm. Tuyệt đối chỉ trả về nội dung prompt mới bằng tiếng Việt, KHÔNG chứa bất kỳ lời chào, lời dẫn, giải thích hay định dạng markdown bọc ngoài nào.`
        };

        const systemPrompt = systemPrompts[type] || systemPrompts.clarify;
        const finalPrompt = `${systemPrompt}\n\nPrompt nháp cần tối ưu hóa:\n"""\n${draftText}\n"""\n\nNội dung prompt đã tối ưu hóa:`;

        // Visual loading state
        anchorBtn.classList.add('loading');
        anchorBtn.disabled = true;
        anchorBtn.title = 'Đang tối ưu hóa prompt bằng AI... ⏳';

        const model = (activeProfile && activeProfile.model) ? activeProfile.model : 'gemini-3.1-flash-lite';

        chrome.runtime.sendMessage({
          action: 'callGeminiAPI',
          apiKey: apiKey,
          model: model,
          prompt: finalPrompt
        }, response => {
          anchorBtn.classList.remove('loading');
          anchorBtn.disabled = false;
          anchorBtn.title = 'Tối ưu hóa Prompt thông minh (Vaxlou Optimizer)';

          if (chrome.runtime.lastError) {
            alert('Lỗi kết nối tiện ích: ' + chrome.runtime.lastError.message);
            return;
          }

          if (response && response.success && response.text) {
            let optimizedText = response.text.trim();
            optimizedText = optimizedText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');

            // Drop-in replacement for Gemini input text block
            if (inputArea.tagName === 'DIV') {
              inputArea.innerHTML = `<p>${optimizedText.replace(/\n/g, '<br>')}</p>`;
            } else {
              inputArea.value = optimizedText;
            }

            // Trigger native React state bindings
            inputArea.dispatchEvent(new Event('input', { bubbles: true }));
            inputArea.dispatchEvent(new Event('change', { bubbles: true }));

            placeCursorAtEnd(inputArea);
          } else {
            alert('Lỗi tối ưu hóa prompt: ' + (response ? response.error : 'Không thể kết nối đến Gemini API'));
          }
        });
      };



  const showApiKeyWarningToast = () => {
    document.getElementById('aura-warning-toast')?.remove();

    const lang = (state.settings && state.settings.uiLanguage) || 'vi';
    const t = translations[lang] || translations.vi;

    const toast = document.createElement('div');
    toast.id = 'aura-warning-toast';
    toast.className = 'aura-toast-warning';
    toast.innerHTML = `
      <span style="font-size: 16px; display:flex; align-items:center;">🔑</span>
      <div style="flex-grow: 1;">
        <strong style="display: block; font-size: 13px; font-weight:600; margin-bottom: 2px;">${t.toastNoKeyTitle || 'Chưa cấu hình API Key!'}</strong>
        <span style="font-size: 11px; opacity: 0.85; line-height:1.35; display:block;">${t.toastNoKeyDesc || 'Vui lòng nhập API Key trong Cài đặt của Vaxlou Center để kích hoạt tính năng này.'}</span>
      </div>
      <button class="aura-toast-close-btn">&times;</button>
    `;
    document.body.appendChild(toast);

    toast.addEventListener('click', (e) => {
      if (e.target.classList.contains('aura-toast-close-btn')) {
        toast.remove();
        return;
      }
      toast.remove();
      
      const drawer = document.getElementById('aura-right-drawer');
      const toggleBtn = document.getElementById('aura-right-drawer-toggle');
      if (drawer && !drawer.classList.contains('open')) {
        if (toggleBtn) toggleBtn.click();
      }
      
      const tab = drawer?.querySelector('.aura-drawer-tab[data-tab="settings"]');
      if (tab) tab.click();
      
      setTimeout(() => {
        const configuredContainer = document.getElementById('aura-settings-api-key-configured-container');
        if (configuredContainer && !configuredContainer.classList.contains('aura-hidden')) {
          const changeKeyBtn = document.getElementById('aura-settings-btn-change-key');
          if (changeKeyBtn) changeKeyBtn.click();
        }
        
        const keyInput = document.getElementById('aura-settings-api-key');
        if (keyInput) {
          keyInput.focus();
          keyInput.classList.add('aura-settings-highlight');
          setTimeout(() => keyInput.classList.remove('aura-settings-highlight'), 1500);
        }
      }, 300);
    });

    setTimeout(() => {
      toast.remove();
    }, 6000);
  };


  // =====================
  //   INIT
  // =====================
  const init = async () => {
    await loadState();


    let observerBound = false;

    const runSetup = () => {
      const container = getHistoryListContainer();
      if (container) {
        injectFoldersSection();
        if (!observerBound) {
          const obs = new MutationObserver(() => {
            if (isUpdatingDOM) return;
            requestAnimationFrame(() => {
              const sec = document.getElementById('aura-folders-section');
              if (sec) renderFolders(sec); else injectFoldersSection();
            });
          });
          obs.observe(container, { childList: true, subtree: false });
          observerBound = true;
        }
      }

      // Check current active chat states
      monitorActiveChatLifecycle();
      injectPromptOptimizerButton();
    };

    runSetup();
    setInterval(runSetup, 1500);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
