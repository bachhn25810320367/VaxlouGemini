/* ============================================================
   Vaxlou v2.0 — Main Content Script
   ============================================================ */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  //   CONSTANTS & STATE
  // ═══════════════════════════════════════════════════════════
  const STORAGE_KEY = 'vaxlou_v2_data';
  const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

  const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'qwen/qwen3-32b',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
  ];
  const GEMINI_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro'
  ];

  const REFUSAL_PATTERNS = [
    /tôi không thể giúp/i,
    /tôi chỉ là một mô hình ngôn ngữ/i,
    /i cannot (help|assist)/i,
    /i['']m (just )?a (language model|ai)/i,
    /as an ai,? i (cannot|can['']t|don['']t)/i,
    /không thể thực hiện yêu cầu/i,
    /vượt quá khả năng của tôi/i,
    /không được phép (làm|thực hiện|giúp)/i,
    /điều này nằm ngoài khả năng/i,
  ];

  const TRANSLATIONS = {
    vi: {
      // Bookmark bar
      toggle_sidebar_open: 'Mở thanh bên',
      toggle_sidebar_close: 'Đóng thanh bên',
      bento_menu: 'Thực đơn Bento',
      add_chat_to_file: 'Thêm chat vào file',
      add_chat_title: 'Thêm cuộc trò chuyện hiện tại vào thư mục',
      chat_options: 'Thao tác',
      chat_options_title: 'Tùy chọn cuộc trò chuyện',
      other_functions: 'Các chức năng khác',
      other_functions_title: 'Mở các chức năng bổ sung (Ghi chú, Dàn ý, Cài đặt)',
      breadcrumbs_title: 'Đường dẫn thư mục của cuộc trò chuyện',
      
      // Bento menu
      open_notes: 'Mở Ghi chú',
      open_outline: 'Mở Dàn ý',
      open_condenser: 'Mở Cô đọng',
      open_settings: 'Mở Cài đặt',
      create_new_folder: 'Tạo thư mục mới',
      
      // Notes tab
      tab_notes: 'Ghi chú',
      tab_outline: 'Dàn ý',
      tab_condenser: 'Cô đọng',
      tab_settings: 'Cài đặt',
      notes_bold: 'In đậm (Ctrl+B)',
      notes_italic: 'In nghiêng (Ctrl+I)',
      notes_underline: 'Gạch chân (Ctrl+U)',
      notes_strike: 'Gạch ngang',
      notes_by_chat: 'Theo chat',
      notes_placeholder_global: 'Ghi chú toàn cục... Dán (Ctrl+V) hoặc kéo thả ảnh vào đây!',
      notes_placeholder_chat: 'Ghi chú cho cuộc trò chuyện này... Dán (Ctrl+V) hoặc kéo thả ảnh vào đây!',
      notes_auto_save: 'Tự động lưu',
      notes_clear: 'Xóa sạch',
      notes_copy: 'Sao chép',
      confirm_clear_notes: 'Xóa sạch ghi chú này?',
      
      // Outline tab
      outline_all: 'Tất cả',
      outline_prompts: 'Chỉ câu hỏi của tôi',
      outline_responses: 'Chỉ câu trả lời Gemini',
      outline_empty: 'Chọn một cuộc hội thoại để xem dàn ý!',
      outline_you: 'Bạn',
      outline_no_content: 'Chưa có nội dung nào trong cuộc hội thoại này!',
      outline_no_match: 'Không có mục nào khớp bộ lọc!',
      gemini_said: 'Gemini đã nói',
      
      // Condenser tab
      condenser_title: '⚡ AI Context Condenser',
      condenser_subtitle: 'Cô đọng hội thoại dài thành bản tóm tắt thông minh để mở chat mới siêu nhẹ.',
      condenser_btn_start: '⚡ Bắt đầu cô đọng với AI',
      condenser_progress_analyzing: 'Đang phân tích các lượt chat...',
      condenser_progress_extracting: 'Đang trích xuất hội thoại...',
      condenser_progress_ai: 'AI đang cô đọng dữ liệu...',
      condenser_result_header: '📝 Kết quả cô đọng (Markdown)',
      condenser_copy_tooltip: 'Sao chép kết quả',
      condenser_output_placeholder: 'Bản tóm tắt sẽ hiển thị ở đây...',
      condenser_btn_continue: '🚀 Mở chat mới & Tiếp tục công việc',
      condenser_select_chat: 'Hãy chọn một cuộc hội thoại để sử dụng bộ cô đọng!',
      condenser_turns_count: '💬 Số lượt hội thoại hiện tại: <b>{count} lượt</b>',
      condenser_api_ready: '🟢 API Key sẵn sàng ({provider})',
      condenser_api_missing: '🔴 Chưa cấu hình API Key (Vào Cài đặt để thiết lập)',
      
      // Settings tab
      settings_title: 'Giao diện & Phím tắt',
      settings_theme: 'Chủ đề màu sắc',
      settings_theme_teal: 'Ocean Teal & Cyan (Mặc định)',
      settings_theme_emerald: 'Forest Emerald & Lime (Xanh lục bảo)',
      settings_theme_amber: 'Sunset Amber & Gold (Vàng nắng)',
      settings_theme_sapphire: 'Sapphire & Azure (Xanh sapphire)',
      settings_theme_rose: 'Rose Quartz & Blossom (Hồng thạch anh)',
      settings_theme_terracotta: 'Terracotta & Sun (Đỏ đất nung)',
      settings_theme_bronze: 'Bronze & Gold (Đồng cổ điển)',
      settings_theme_slate: 'Slate & Platinum (Xám tinh thể)',
      settings_lang: 'Ngôn ngữ (Language)',
      
      settings_shortcut_panel: 'Bật/tắt Panel chính',
      settings_shortcut_sidebar: 'Đóng/Mở Sidebar trái',
      settings_shortcut_bento: 'Thực đơn Bento (⠿)',
      settings_shortcut_add_chat: 'Thêm chat vào file',
      settings_shortcut_chat_options: 'Thao tác trò chuyện',
      
      settings_adv_title: 'Cấu hình AI & API nâng cao',
      settings_api_title: 'API Key (Overload Handler)',
      settings_key_gemini: 'Khóa 1 (Gemini)',
      settings_key_groq: 'Khóa 2 (Groq)',
      settings_active_model: 'Lựa chọn Model hoạt động',
      
      settings_api_mgmt: 'Quản lý API',
      settings_api_google_desc: 'Xem hạn mức',
      settings_api_groq_desc: 'Thống kê usage',
      
      settings_btn_test: 'Kiểm tra kết nối',
      settings_btn_save: 'Lưu',
      settings_status_saving: 'Đang kết nối thử...',
      settings_status_testing: 'Đang kiểm tra...',
      settings_status_test_success: 'Kết nối thành công! 🟢',
      settings_status_test_fail: 'Kết nối thất bại',
      settings_status_no_key: 'Chưa nhập API key!',
      
      // Context menus (Folders)
      folder_create_sub: 'Tạo thư mục con',
      folder_rename: 'Đổi tên',
      folder_expand_all: 'Mở rộng tất cả',
      folder_collapse_all: 'Thu gọn tất cả',
      folder_delete: 'Xóa thư mục',
      
      // Context menus (Assign Chat)
      assign_to_folder_title: 'Thêm vào thư mục',
      assign_no_folders: 'Chưa có thư mục',
      assign_remove: 'Gỡ khỏi thư mục',
      assign_new_folder: 'Thư mục mới...',
      
      // Prompts and Dialogs
      prompt_new_folder: 'Tên thư mục mới:',
      prompt_sub_folder: 'Tên thư mục con:',
      prompt_rename_folder: 'Tên thư mục mới:',
      confirm_delete_folder: 'Xóa thư mục "{folderName}"? Các chat bên trong sẽ về danh sách chung.',
      
      // Toasts
      toast_no_chat_id: 'Không tìm thấy ID cuộc trò chuyện!',
      toast_expand_sidebar: 'Vui lòng mở rộng thanh bên để thực hiện!',
      toast_open_chat_to_add: 'Hãy mở một cuộc trò chuyện để thêm!',
      toast_added_to: 'Đã thêm vào "{folderName}"! 📁',
      toast_removed_from: 'Đã gỡ khỏi thư mục.',
      toast_created_folder: 'Đã tạo thư mục "{folderName}"! 📁',
      toast_deleted_notes: 'Đã xóa ghi chú!',
      toast_copied: 'Đã sao chép!',
      toast_copy_failed: 'Không thể sao chép.',
      toast_setup_api: 'Vui lòng thiết lập API Key trong tab Cài đặt!',
      toast_empty_chat: 'Cuộc hội thoại trống rỗng!',
      toast_condense_failed: 'Cô đọng thất bại: ',
      toast_condense_success: 'Cô đọng thành công! ✨',
      toast_empty_summary: 'Nội dung cô đọng rỗng!',
      toast_continued_new_chat: 'Đã chuyển sang chat mới để tiếp tục! 🚀',
      toast_continue_fail_copied: 'Không thể tự chuyển tiếp. Đã sao chép prompt, hãy dán vào chat mới!',
      toast_saved_config: 'Đã lưu cấu hình! ✨',
      toast_canvas_max: 'Đã phóng to Canvas! 🖥️',
      toast_canvas_min: 'Đã thu nhỏ Canvas!',
      toast_insert_success: 'Ngữ cảnh đã được chèn vào khung chat! 🚀',
      toast_copied_context: 'Đã sao chép context! Paste vào chat mới để tiếp tục.',
      
      // AI prompts
      condense_prompt_template: `Hãy cô đọng toàn bộ cuộc trò chuyện dưới đây thành một bản tóm tắt ngữ cảnh siêu ngắn gọn nhưng đầy đủ thông tin để người dùng tiếp tục công việc ở một cuộc trò chuyện mới.

Bản tóm tắt PHẢI tuân thủ cấu trúc sau:
1. **Nhiệm vụ chính**: (Nhiệm vụ đang thực hiện là gì, mục tiêu cụ thể ra sao).
2. **Những việc ĐÃ HOÀN THÀNH**: (Tóm tắt cực kỳ ngắn gọn các file đã tạo/sửa hoặc các bước đã làm, kết quả đã chạy).
3. **Các đoạn code quan trọng hoặc cấu trúc mấu chốt**: (Chỉ giữ lại các đoạn code đặc biệt quan trọng nếu có, tránh rườm rà).
4. **Vấn đề/Lỗi hiện tại (nếu có)**: (Các lỗi đang gặp phải hoặc điểm nghẽn đang xử lý dở dang).
5. **Bước tiếp theo cần làm**: (Chỉ dẫn cụ thể bước tiếp theo cho mô hình AI mới tiếp quản cuộc trò chuyện).

Hãy trả lời trực tiếp dưới dạng Markdown ngắn gọn nhất có thể, tập trung vào tính kỹ thuật và độ súc tích (không chào hỏi xã giao, không rườm rà).

Cuộc trò chuyện:`,
      continue_prompt_template: `Tôi đang tiếp tục công việc từ một cuộc trò chuyện trước. Dưới đây là toàn bộ bản tóm tắt ngữ cảnh đã được cô đọng:

{summaryText}

Hãy tiếp tục thực hiện bước tiếp theo từ đúng điểm bị gián đoạn.`
    },
    en: {
      // Bookmark bar
      toggle_sidebar_open: 'Open sidebar',
      toggle_sidebar_close: 'Close sidebar',
      bento_menu: 'Bento Menu',
      add_chat_to_file: 'Add chat to file',
      add_chat_title: 'Add current chat to a folder',
      chat_options: 'Actions',
      chat_options_title: 'Chat options',
      other_functions: 'Other Tools',
      other_functions_title: 'Open additional functions (Notes, Outline, Settings)',
      breadcrumbs_title: 'Folder path of the conversation',
      
      // Bento menu
      open_notes: 'Open Notes',
      open_outline: 'Open Outline',
      open_condenser: 'Open Condenser',
      open_settings: 'Open Settings',
      create_new_folder: 'Create new folder',
      
      // Notes tab
      tab_notes: 'Notes',
      tab_outline: 'Outline',
      tab_condenser: 'Condenser',
      tab_settings: 'Settings',
      notes_bold: 'Bold (Ctrl+B)',
      notes_italic: 'Italic (Ctrl+I)',
      notes_underline: 'Underline (Ctrl+U)',
      notes_strike: 'Strikethrough',
      notes_by_chat: 'By chat',
      notes_placeholder_global: 'Global notes... Paste (Ctrl+V) or drag and drop images here!',
      notes_placeholder_chat: 'Notes for this chat... Paste (Ctrl+V) or drag and drop images here!',
      notes_auto_save: 'Auto-saved',
      notes_clear: 'Clear',
      notes_copy: 'Copy',
      confirm_clear_notes: 'Clear all notes in this section?',
      
      // Outline tab
      outline_all: 'All',
      outline_prompts: 'Only my prompts',
      outline_responses: 'Only Gemini responses',
      outline_empty: 'Select a conversation to view outline!',
      outline_you: 'You',
      outline_no_content: 'No content in this conversation yet!',
      outline_no_match: 'No items match the filter!',
      gemini_said: 'Gemini said',
      
      // Condenser tab
      condenser_title: '⚡ AI Context Condenser',
      condenser_subtitle: 'Condense long chat history into a smart summary for a lightweight new chat.',
      condenser_btn_start: '⚡ Start AI Condensation',
      condenser_progress_analyzing: 'Analyzing chat turns...',
      condenser_progress_extracting: 'Extracting conversation...',
      condenser_progress_ai: 'AI is condensing data...',
      condenser_result_header: '📝 Condenser Result (Markdown)',
      condenser_copy_tooltip: 'Copy results',
      condenser_output_placeholder: 'Summary will display here...',
      condenser_btn_continue: '🚀 Open new chat & Continue',
      condenser_select_chat: 'Select a conversation to use the condenser!',
      condenser_turns_count: '💬 Current turns: <b>{count} turns</b>',
      condenser_api_ready: '🟢 API Key ready ({provider})',
      condenser_api_missing: '🔴 API Key not configured (Go to Settings to set up)',
      
      // Settings tab
      settings_title: 'Appearance & Shortcuts',
      settings_theme: 'Color Theme',
      settings_theme_teal: 'Ocean Teal & Cyan (Default)',
      settings_theme_emerald: 'Forest Emerald & Lime (Green)',
      settings_theme_amber: 'Sunset Amber & Gold (Yellow)',
      settings_theme_sapphire: 'Sapphire & Azure (Blue)',
      settings_theme_rose: 'Rose Quartz & Blossom (Pink)',
      settings_theme_terracotta: 'Terracotta & Sun (Clay Orange)',
      settings_theme_bronze: 'Bronze & Gold (Classic Gold)',
      settings_theme_slate: 'Slate & Platinum (Stealth Slate)',
      settings_lang: 'Language',
      
      settings_shortcut_panel: 'Toggle Main Panel',
      settings_shortcut_sidebar: 'Open/Close Left Sidebar',
      settings_shortcut_bento: 'Bento Menu (⠿)',
      settings_shortcut_add_chat: 'Add Chat to File',
      settings_shortcut_chat_options: 'Chat Actions',
      
      settings_adv_title: 'Advanced AI & API Config',
      settings_api_title: 'API Key (Overload Handler)',
      settings_key_gemini: 'Key 1 (Gemini)',
      settings_key_groq: 'Key 2 (Groq)',
      settings_active_model: 'Active AI Model',
      
      settings_api_mgmt: 'API Management',
      settings_api_google_desc: 'View limits',
      settings_api_groq_desc: 'Usage stats',
      
      settings_btn_test: 'Test Connection',
      settings_btn_save: 'Save',
      settings_status_saving: 'Testing connection...',
      settings_status_testing: 'Checking...',
      settings_status_test_success: 'Connected successfully! 🟢',
      settings_status_test_fail: 'Connection failed',
      settings_status_no_key: 'Please enter API key!',
      
      // Context menus (Folders)
      folder_create_sub: 'Create subfolder',
      folder_rename: 'Rename',
      folder_expand_all: 'Expand all',
      folder_collapse_all: 'Collapse all',
      folder_delete: 'Delete folder',
      
      // Context menus (Assign Chat)
      assign_to_folder_title: 'Add to Folder',
      assign_no_folders: 'No folders available',
      assign_remove: 'Remove from folder',
      assign_new_folder: 'New folder...',
      
      // Prompts and Dialogs
      prompt_new_folder: 'New folder name:',
      prompt_sub_folder: 'Subfolder name:',
      prompt_rename_folder: 'New folder name:',
      confirm_delete_folder: 'Delete folder "{folderName}"? Chats inside will be moved to general list.',
      
      // Toasts
      toast_no_chat_id: 'Chat ID not found!',
      toast_expand_sidebar: 'Please expand native sidebar to execute!',
      toast_open_chat_to_add: 'Please open a conversation to add!',
      toast_added_to: 'Added to "{folderName}"! 📁',
      toast_removed_from: 'Removed from folder.',
      toast_created_folder: 'Folder "{folderName}" created! 📁',
      toast_deleted_notes: 'Notes cleared!',
      toast_copied: 'Copied!',
      toast_copy_failed: 'Failed to copy.',
      toast_setup_api: 'Please set API Key in Settings tab!',
      toast_empty_chat: 'Chat conversation is empty!',
      toast_condense_failed: 'Condensation failed: ',
      toast_condense_success: 'Condense successful! ✨',
      toast_empty_summary: 'Condensation result is empty!',
      toast_continued_new_chat: 'Redirected to new chat! 🚀',
      toast_continue_fail_copied: 'Failed to redirect. Copied summary, paste into a new chat!',
      toast_saved_config: 'Settings saved! ✨',
      toast_canvas_max: 'Canvas maximized! 🖥️',
      toast_canvas_min: 'Canvas minimized!',
      toast_insert_success: 'Context injected into prompt box! 🚀',
      toast_copied_context: 'Context copied! Paste into new chat to continue.',
      
      // AI prompts
      condense_prompt_template: `Please condense the entire conversation below into a very concise but highly informative context summary for the user to continue their work in a new chat.

The summary MUST follow this structure:
1. **Main Task**: (What task is being performed, what is the specific goal).
2. **COMPLETED Steps**: (Extremely brief summary of files created/edited, steps done, or results run).
3. **Key Code Snippets or Architecture**: (Keep only absolutely crucial code if any, avoid bloat).
4. **Current Issues/Bugs (if any)**: (Bugs encountered or active bottlenecks being worked on).
5. **Next Steps**: (Specific instructions for the new AI model taking over the conversation).

Please reply directly in Markdown format as concisely as possible, focusing on technical details and brevity (no greetings, no fluff).

Conversation:`,
      continue_prompt_template: `I am continuing work from a previous conversation. Below is the full condensed context summary:

{summaryText}

Please proceed with the next step from the exact point of interruption.`
    }
  };

  let currentActiveTab = 'notes';

  const t = (key, params = {}) => {
    const lang = state.settings.uiLanguage || 'vi';
    let val = TRANSLATIONS[lang]?.[key] || TRANSLATIONS['vi']?.[key] || key;
    Object.keys(params).forEach(pk => {
      val = val.replace(`{${pk}}`, params[pk]);
    });
    return val;
  };

  let state = {
    folders: [],
    chatToFolder: {},
    chatMetadata: {},
    chatNotes: {},
    settings: {
      uiLanguage: 'vi',
      apiKeys: [
        { key: '', model: DEFAULT_MODEL, provider: 'gemini' },
        { key: '', model: 'llama-3.3-70b-versatile', provider: 'groq' }
      ],
      activeKeyIndex: 0
    }
  };

  let currentChatId = null;
  let isUpdatingDOM = false;
  let folderPanelOpen = false;
  let rightPanelOpen = false;
  let lastRenderKey = '';
  let obsTimeout = null;
  let roTimeout = null;
  let saveNoteTimeout = null;
  let lastRefusalCheckId = null; // track last checked response


  // ═══════════════════════════════════════════════════════════
  //   STORAGE
  // ═══════════════════════════════════════════════════════════
  const loadState = () => new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY], result => {
      if (result[STORAGE_KEY]) {
        const saved = result[STORAGE_KEY];
        state.folders      = saved.folders      || [];
        state.chatToFolder = saved.chatToFolder || {};
        state.chatMetadata = saved.chatMetadata || {};
        state.chatNotes    = saved.chatNotes    || {};
        // Merge settings carefully
        if (saved.settings) {
          state.settings.apiKeys = saved.settings.apiKeys || state.settings.apiKeys;
          state.settings.activeKeyIndex = saved.settings.activeKeyIndex ?? 0;
          state.settings.themeColor = saved.settings.themeColor || 'teal-cyan';
          state.settings.shortcutTogglePanel = saved.settings.shortcutTogglePanel || 'Alt+N';
          state.settings.shortcutSidebar = saved.settings.shortcutSidebar || 'Alt+S';
          state.settings.shortcutBento = saved.settings.shortcutBento || 'Alt+B';
          state.settings.shortcutAddChat = saved.settings.shortcutAddChat || 'Alt+A';
          state.settings.shortcutChatOptions = saved.settings.shortcutChatOptions || 'Alt+O';
          state.settings.mentionPrefix = saved.settings.mentionPrefix || '@';
          
          if (state.settings.apiKeys[0] && !GEMINI_MODELS.includes(state.settings.apiKeys[0].model)) {
            state.settings.apiKeys[0].model = DEFAULT_MODEL;
            saveState();
          }
          if (state.settings.apiKeys[1] && !GROQ_MODELS.includes(state.settings.apiKeys[1].model)) {
            state.settings.apiKeys[1].model = 'llama-3.3-70b-versatile';
            saveState();
          }
        } else {
          state.settings = {
            uiLanguage: 'vi',
            apiKeys: [
              { key: '', model: DEFAULT_MODEL, provider: 'gemini' },
              { key: '', model: 'llama-3.3-70b-versatile', provider: 'groq' }
            ],
            activeKeyIndex: 0,
            themeColor: 'teal-cyan',
            shortcutTogglePanel: 'Alt+N',
            shortcutSidebar: 'Alt+S',
            shortcutBento: 'Alt+B',
            shortcutAddChat: 'Alt+A',
            shortcutChatOptions: 'Alt+O',
            mentionPrefix: '@'
          };
          saveState();
        }
        // Migration: ensure parentId exists
        state.folders.forEach(f => { if (!('parentId' in f)) f.parentId = null; });
      } else {
        // Default folders
        state.folders = [
          { id: 'f_work',     name: 'Công việc', parentId: null, collapsed: false },
          { id: 'f_study',    name: 'Học tập',   parentId: null, collapsed: false },
          { id: 'f_personal', name: 'Cá nhân',   parentId: null, collapsed: false },
        ];
        state.settings = {
          uiLanguage: 'vi',
          apiKeys: [
            { key: '', model: DEFAULT_MODEL, provider: 'gemini' },
            { key: '', model: 'llama-3.3-70b-versatile', provider: 'groq' }
          ],
          activeKeyIndex: 0,
          themeColor: 'teal-cyan',
          shortcutTogglePanel: 'Alt+N',
          shortcutSidebar: 'Alt+S',
          shortcutBento: 'Alt+B',
          shortcutAddChat: 'Alt+A',
          shortcutChatOptions: 'Alt+O',
          mentionPrefix: '@'
        };
        saveState();
      }
      resolve();
    });
  });

  const saveState = () => {
    chrome.storage.local.set({ [STORAGE_KEY]: state });
  };

  const applyTheme = () => {
    const theme = state.settings.themeColor || 'teal-cyan';
    const classesToRemove = Array.from(document.body.classList).filter(c => c.startsWith('v-theme-'));
    classesToRemove.forEach(c => document.body.classList.remove(c));
    document.body.classList.add(`v-theme-${theme}`);
  };



  // ═══════════════════════════════════════════════════════════
  //   TOAST
  // ═══════════════════════════════════════════════════════════
  const showToast = (message, type = 'success') => {
    document.getElementById('v-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'v-toast';
    toast.className = `v-toast ${type}`;
    const icon = type === 'success' ? '✓' : '✗';
    toast.innerHTML = `<span class="v-toast-icon">${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  };

  // ═══════════════════════════════════════════════════════════
  //   SPA NAVIGATION (Direct click simulation + fallback)
  // ═══════════════════════════════════════════════════════════
  const navigateToChat = (href, chatId) => {
    // 1. Try to find the native sidebar link for this chat and click it
    const nativeLinks = Array.from(document.querySelectorAll('nav a, aside a, [role="navigation"] a'));
    const nativeLink = nativeLinks.find(a => {
      const linkHref = a.getAttribute('href') || '';
      return chatId && linkHref.includes(chatId);
    });

    if (nativeLink) {
      nativeLink.click();
      return;
    }

    // 2. Fallback: hard navigate to load the chat page
    window.location.href = href;
  };

  // ═══════════════════════════════════════════════════════════
  //   CHAT DETECTION HELPERS
  // ═══════════════════════════════════════════════════════════
  const getChatId = href => {
    if (!href) return null;
    const m = href.match(/\/(app|c)\/([a-zA-Z0-9_-]+)/);
    return m ? m[2] : null;
  };

  const getCurrentChatId = () => getChatId(window.location.pathname);

  const findChatLinks = () => {
    const nav = document.querySelector('nav, [role="navigation"], aside');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('a[href*="/app/"], a[href*="/c/"]'))
      .filter(l =>
        !l.closest('#v-folder-panel') &&
        !l.closest('#v-right-panel') &&
        !l.closest('#gb') &&
        !l.closest('header')
      );
  };

  const getChatRowWrapper = link => {
    let curr = link;
    while (curr && curr.parentElement) {
      if (curr.tagName === 'LI' ||
          curr.getAttribute('role') === 'listitem' ||
          curr.parentElement.getAttribute('role') === 'list') return curr;
      curr = curr.parentElement;
    }
    return link;
  };

  const getChatScrollContainer = () => {
    const firstQuery = document.querySelector('user-query, message-content');
    if (firstQuery) {
      let p = firstQuery.parentElement;
      while (p) {
        const s = window.getComputedStyle(p);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
        p = p.parentElement;
      }
    }
    return document.querySelector('main') || window;
  };

  // ═══════════════════════════════════════════════════════════
  //   SVG ICONS
  // ═══════════════════════════════════════════════════════════
  const SVG = {
    chevronRight: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    folder: (open) => open
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    plus: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    close: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    dots: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
    trash: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    edit: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    note: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    outline: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    settings: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    ai: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/></svg>`,
    eye: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    maximize: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
    minimize: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>`,
    robot: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
    arrowRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    hamburger: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    dotsVertical: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`,
    condenser: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16M4 14h16M12 3v18M12 3l-4 4m4-4l4 4M12 21l-4-4m4 4l4-4"/></svg>`,
    sidebarOpen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/><path d="M13 15l3-3-3-3"/></svg>`,
    sidebarClose: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/><path d="M16 15l-3-3 3-3"/></svg>`
  };

  // ═══════════════════════════════════════════════════════════
  //   FOLDER SIDEBAR — INJECT & RENDER
  // ═══════════════════════════════════════════════════════════
  let activeDropdownFolderId = null;

  const isVaxlouElement = (el) => {
    if (!el) return false;
    if (el.id && el.id.startsWith('v-')) return true;
    if (el.className && typeof el.className === 'string') {
      return el.className.split(/\s+/).some(c => c.startsWith('v-'));
    }
    return false;
  };

  const openNativeSidebar = () => {
    const elms = Array.from(document.querySelectorAll('button, [role="button"]'));
    const openBtn = elms.find(b => {
      if (isVaxlouElement(b)) return false;
      const label = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase();
      const hasOpenKeyword = label.includes('mở') || label.includes('expand') || label.includes('show') || label.includes('menu') || label.includes('sidebar') || label.includes('thanh bên') || label.includes('navigation');
      const isNotClose = !label.includes('đóng') && !label.includes('collapse') && !label.includes('hide') && !label.includes('thu gọn') && !label.includes('close');
      const isNotChatBtn = !label.includes('chat') && !label.includes('trò chuyện') && !label.includes('mới') && !label.includes('new') && !label.includes('hội thoại');
      return hasOpenKeyword && isNotClose && isNotChatBtn;
    });
    if (openBtn) {
      openBtn.click();
    }
  };

  const closeNativeSidebar = () => {
    // 1. Try to find the button with class close-sidenav-button
    const closeSidenavBtn = document.querySelector('.close-sidenav-button');
    if (closeSidenavBtn && (closeSidenavBtn.offsetWidth > 0 || closeSidenavBtn.offsetHeight > 0)) {
      closeSidenavBtn.click();
      return;
    }

    // 2. Fallback to general lookup
    const elms = Array.from(document.querySelectorAll('button, [role="button"]'));
    const closeBtn = elms.find(b => {
      if (isVaxlouElement(b)) return false;
      const label = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase();
      const hasCloseKeyword = label.includes('đóng') || label.includes('collapse') || label.includes('hide') || label.includes('menu') || label.includes('sidebar') || label.includes('thanh bên') || label.includes('navigation') || label.includes('thu gọn') || label.includes('close');
      const isNotOpen = !label.includes('mở') && !label.includes('expand') && !label.includes('show');
      const isNotChatBtn = !label.includes('chat') && !label.includes('trò chuyện') && !label.includes('mới') && !label.includes('new') && !label.includes('hội thoại');
      return hasCloseKeyword && isNotOpen && isNotChatBtn;
    });
    if (closeBtn) {
      closeBtn.click();
    }
  };

  const isNativeSidebarClosed = () => {
    // 1. If close-sidenav-button is visible, sidebar is definitely OPEN (not closed)
    const closeSidenavBtn = document.querySelector('.close-sidenav-button');
    if (closeSidenavBtn && (closeSidenavBtn.offsetWidth > 0 || closeSidenavBtn.offsetHeight > 0)) {
      return false;
    }

    // 2. Fallback to general lookup
    const elms = Array.from(document.querySelectorAll('button, [role="button"]'));
    const openBtn = elms.find(b => {
      if (isVaxlouElement(b)) return false;
      const label = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase();
      const hasOpenKeyword = label.includes('mở') || label.includes('expand') || label.includes('show') || label.includes('menu') || label.includes('sidebar') || label.includes('thanh bên') || label.includes('navigation');
      const isNotClose = !label.includes('đóng') && !label.includes('collapse') && !label.includes('hide') && !label.includes('thu gọn') && !label.includes('close');
      const isNotChatBtn = !label.includes('chat') && !label.includes('trò chuyện') && !label.includes('mới') && !label.includes('new') && !label.includes('hội thoại');
      return hasOpenKeyword && isNotClose && isNotChatBtn;
    });
    return !!(openBtn && (openBtn.offsetWidth > 0 || openBtn.offsetHeight > 0));
  };

  const updateSidebarToggleButtonIcon = () => {
    const btn = document.getElementById('v-bb-sidebar-toggle-btn');
    if (!btn) return;
    const closed = isNativeSidebarClosed();
    btn.innerHTML = closed ? SVG.sidebarOpen : SVG.sidebarClose;
    btn.title = closed ? "Mở thanh bên" : "Đóng thanh bên";
  };

  const buildBreadcrumbsHTML = (chatId) => {
    const folderId = state.chatToFolder[chatId];
    if (!folderId) return null;

    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return null;

    const path = [folder];
    let parentId = folder.parentId;
    while (parentId) {
      const parent = state.folders.find(f => f.id === parentId);
      if (parent) {
        path.unshift(parent);
        parentId = parent.parentId;
      } else {
        break;
      }
    }

    const chatMeta = state.chatMetadata[chatId];
    let chatTitle = chatMeta ? chatMeta.title : '';
    if (!chatTitle || chatTitle === 'Đang tải...') {
      let docTitle = document.title || 'Hội thoại';
      docTitle = docTitle.replace(/\s*-\s*Gemini/i, '').replace(/Gemini/i, '').trim();
      chatTitle = docTitle || 'Hội thoại';
    }

    const foldersHTML = path.map(f => {
      return `<span class="v-breadcrumb-parent" style="color: var(--v-text-muted); font-weight: 500; font-size: 13px;">${escapeHtml(f.name)}</span>`;
    }).join(' <span class="v-breadcrumb-separator" style="color: var(--v-text-dim); margin: 0 4px; font-size: 11px;">&gt;</span>');

    return `${foldersHTML} <span class="v-breadcrumb-separator" style="color: var(--v-text-dim); margin: 0 4px; font-size: 11px;">&gt;</span> <span class="v-breadcrumb-current" style="color: var(--v-accent-text); font-weight: 600; font-size: 13px;">${escapeHtml(chatTitle)}</span>`;
  };

  const updateBookmarkBarBreadcrumbs = () => {
    const container = document.getElementById('v-bb-logo-container');
    if (!container) return;

    const curId = getCurrentChatId();
    const breadcrumbsHTML = curId ? buildBreadcrumbsHTML(curId) : null;

    if (breadcrumbsHTML) {
      if (container.innerHTML !== breadcrumbsHTML) {
        container.innerHTML = breadcrumbsHTML;
        container.title = "Đường dẫn thư mục của cuộc trò chuyện";
      }
    } else {
      const defaultLogoHTML = `
        <svg class="v-gemini-sparkle" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <defs>
            <linearGradient id="v-gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#9ab5fe"/>
              <stop offset="50%" stop-color="#ffb5a7"/>
              <stop offset="100%" stop-color="#e995fe"/>
            </linearGradient>
          </defs>
          <path d="M12 3c.1 0 .3 0 .4.1.2.1.3.3.4.5l1.2 4.5 4.5 1.2c.2.1.4.2.5.4.1.2.1.4.1.6a1 1 0 0 1-.6.9l-4.5 1.2-1.2 4.5c-.1.2-.3.4-.5.5s-.4.1-.6.1a1 1 0 0 1-.9-.6l-1.2-4.5-4.5-1.2a1 1 0 0 1-.6-.9c0-.2 0-.4.1-.6.1-.2.3-.3.5-.4l4.5-1.2 1.2-4.5c.1-.2.3-.4.5-.5.1-.1.3-.1.4-.1z" fill="url(#v-gemini-grad)"/>
          <path d="M19 14.5c.1 0 .2 0 .3.1.1.1.2.2.3.3l.6 2.3 2.3.6a.7.7 0 0 1 .4.6.7.7 0 0 1-.4.6l-2.3.6-.6 2.3a.7.7 0 0 1-.6.4c-.1 0-.2 0-.3-.1a.7.7 0 0 1-.3-.3l-.6-2.3-2.3-.6a.7.7 0 0 1-.4-.6c0-.2.1-.3.4-.6l2.3-.6.6-2.3c.1-.2.2-.3.3-.3z" fill="url(#v-gemini-grad)"/>
        </svg>
        <span class="v-gemini-text">Gemini</span>
      `;
      if (container.querySelector('.v-gemini-text') === null) {
        container.innerHTML = defaultLogoHTML;
        container.removeAttribute('title');
      }
    }
  };

  const getChatLinkTitle = (link) => {
    try {
      const cloned = link.cloneNode(true);
      cloned.querySelector('.v-quick-assign-btn')?.remove();
      cloned.querySelectorAll('button, [role="button"], svg, span[class*="icon"]').forEach(el => el.remove());
      const text = cloned.textContent.trim().replace(/\s+/g, ' ');
      return text || 'Hội thoại không tên';
    } catch (e) {
      return 'Hội thoại không tên';
    }
  };

  const clickNativeChatOptions = () => {
    const curId = getCurrentChatId();
    if (!curId) {
      showToast(t('toast_no_chat_id'), 'error');
      return;
    }

    const tryClickOptions = () => {
      // 1. Try to find the active chat row's 3-dot menu button in the native sidebar
      const activeLink = document.querySelector(`nav a[href*="${curId}"], aside a[href*="${curId}"], [role="navigation"] a[href*="${curId}"]`);
      if (activeLink) {
        const row = getChatRowWrapper(activeLink);
        if (row) {
          const btn = row.querySelector('button[aria-label*="tùy chọn" i], button[aria-label*="more" i], button[aria-label*="options" i], button[aria-label*="thao tác" i], button[class*="options"], button[class*="more"]');
          if (btn) {
            btn.click();
            return true;
          }
        }
      }

      // 2. Fallback: Search the entire page for any native button with matching aria-label or class
      const generalBtns = Array.from(document.querySelectorAll('button[aria-label*="tùy chọn" i], button[aria-label*="more" i], button[aria-label*="options" i], button[aria-label*="thao tác" i]'));
      const chatOptionBtn = generalBtns.find(b => {
        if (b.id?.startsWith('v-') || b.className?.includes('v-')) return false;
        return true;
      });

      if (chatOptionBtn) {
        chatOptionBtn.click();
        return true;
      }

      return false;
    };

    // If options clicked successfully, stop
    if (tryClickOptions()) return;

    // If sidebar is closed, try opening it first
    const elms = Array.from(document.querySelectorAll('button, [role="button"]'));
    const openBtn = elms.find(b => {
      if (isVaxlouElement(b)) return false;
      const label = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase();
      const hasOpenKeyword = label.includes('mở') || label.includes('expand') || label.includes('show') || label.includes('menu') || label.includes('sidebar') || label.includes('thanh bên') || label.includes('navigation');
      const isNotClose = !label.includes('đóng') && !label.includes('collapse') && !label.includes('hide') && !label.includes('thu gọn') && !label.includes('close');
      const isNotChatBtn = !label.includes('chat') && !label.includes('trò chuyện') && !label.includes('mới') && !label.includes('new') && !label.includes('hội thoại');
      return hasOpenKeyword && isNotClose && isNotChatBtn;
    });

    const isClosed = openBtn && (openBtn.offsetWidth > 0 || openBtn.offsetHeight > 0);

    if (isClosed) {
      openBtn.click();
      setTimeout(() => {
        if (!tryClickOptions()) {
          showToast(t('toast_expand_sidebar'), 'warning');
        }
      }, 150);
    } else {
      showToast(t('toast_expand_sidebar'), 'warning');
    }
  };

  const injectBookmarkBar = () => {
    if (document.getElementById('v-bookmark-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'v-bookmark-bar';
    bar.innerHTML = `
      <div class="v-bb-left">
        <button class="v-bb-logo" id="v-bb-sidebar-toggle-btn" title="${t('toggle_sidebar_open')}">${SVG.sidebarOpen}</button>
        <div class="v-bb-logo-gemini" id="v-bb-logo-container">
          <svg class="v-gemini-sparkle" viewBox="0 0 24 24" width="18" height="18" fill="none">
            <defs>
              <linearGradient id="v-gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#9ab5fe"/>
                <stop offset="50%" stop-color="#ffb5a7"/>
                <stop offset="100%" stop-color="#e995fe"/>
              </linearGradient>
            </defs>
            <path d="M12 3c.1 0 .3 0 .4.1.2.1.3.3.4.5l1.2 4.5 4.5 1.2c.2.1.4.2.5.4.1.2.1.4.1.6a1 1 0 0 1-.6.9l-4.5 1.2-1.2 4.5c-.1.2-.3.4-.5.5s-.4.1-.6.1a1 1 0 0 1-.9-.6l-1.2-4.5-4.5-1.2a1 1 0 0 1-.6-.9c0-.2 0-.4.1-.6.1-.2.3-.3.5-.4l4.5-1.2 1.2-4.5c.1-.2.3-.4.5-.5.1-.1.3-.1.4-.1z" fill="url(#v-gemini-grad)"/>
            <path d="M19 14.5c.1 0 .2 0 .3.1.1.1.2.2.3.3l.6 2.3 2.3.6a.7.7 0 0 1 .4.6.7.7 0 0 1-.4.6l-2.3.6-.6 2.3a.7.7 0 0 1-.6.4c-.1 0-.2 0-.3-.1a.7.7 0 0 1-.3-.3l-.6-2.3-2.3-.6a.7.7 0 0 1-.4-.6c0-.2.1-.3.4-.6l2.3-.6.6-2.3c.1-.2.2-.3.3-.3z" fill="url(#v-gemini-grad)"/>
          </svg>
          <span class="v-gemini-text">Gemini</span>
        </div>
        <button class="v-bb-logo" id="v-bb-logo-btn" title="${t('bento_menu')}" style="margin-left: 6px;">⠿</button>
      </div>
      <div class="v-bb-folders" id="v-bb-folders-container"></div>
      <div class="v-bb-right">
        <button class="v-bb-action-btn" id="v-bb-add-chat-btn" title="${t('add_chat_title')}">${SVG.plus} ${t('add_chat_to_file')}</button>
        <button class="v-bb-action-btn" id="v-bb-chat-options-btn" title="${t('chat_options_title')}">${SVG.dotsVertical} ${t('chat_options')}</button>
        <button class="v-bb-action-btn" id="v-bb-right-panel-btn" title="${t('other_functions_title')}">${SVG.note} ${t('other_functions')}</button>
      </div>
    `;
    document.body.appendChild(bar);

    // Global Dropdown Portal
    if (!document.getElementById('v-bb-global-dropdown')) {
      const gDropdown = document.createElement('div');
      gDropdown.id = 'v-bb-global-dropdown';
      gDropdown.className = 'v-bb-dropdown';
      document.body.appendChild(gDropdown);
    }

    bar.querySelector('#v-bb-sidebar-toggle-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (isNativeSidebarClosed()) {
        openNativeSidebar();
      } else {
        closeNativeSidebar();
      }
      setTimeout(updateSidebarToggleButtonIcon, 150);
    });
    bar.querySelector('#v-bb-logo-btn').addEventListener('click', e => {
      e.stopPropagation();
      const btn = bar.querySelector('#v-bb-logo-btn');
      const wasActive = btn.classList.contains('active');
      closeAllMenus();
      if (!wasActive) {
        showBentoMenu(e);
      }
    });
    bar.querySelector('#v-bb-add-chat-btn').addEventListener('click', e => {
      e.stopPropagation();
      const curId = getCurrentChatId();
      if (!curId) {
        showToast(t('toast_open_chat_to_add'), 'error');
        return;
      }
      const btn = bar.querySelector('#v-bb-add-chat-btn');
      const wasActive = btn.classList.contains('active');
      closeAllMenus();
      if (!wasActive) {
        showQuickAssignMenu(btn, curId);
      }
    });
    bar.querySelector('#v-bb-chat-options-btn').addEventListener('click', e => {
      e.stopPropagation();
      clickNativeChatOptions();
    });
    bar.querySelector('#v-bb-right-panel-btn').addEventListener('click', () => toggleRightPanel());

    // Init toggle icon state
    updateSidebarToggleButtonIcon();

    renderBookmarkBar();
  };

  const showBentoMenu = (e) => {
    closeAllMenus();
    const bentoBtn = document.getElementById('v-bb-logo-btn');
    if (bentoBtn) bentoBtn.classList.add('active');

    const menu = document.createElement('div');
    menu.id = 'v-bento-menu';
    menu.className = 'v-context-menu';
    const rect = document.getElementById('v-bb-logo-btn').getBoundingClientRect();
    menu.style.cssText = `top:${rect.bottom + 6}px;left:${rect.left}px`;
    
    menu.innerHTML = `
      <div class="v-context-item" data-action="notes">${SVG.note}<span>${t('open_notes')}</span></div>
      <div class="v-context-item" data-action="outline">${SVG.outline}<span>${t('open_outline')}</span></div>
      <div class="v-context-item" data-action="condenser">${SVG.condenser}<span>${t('open_condenser')}</span></div>
      <div class="v-context-item" data-action="settings">${SVG.settings}<span>${t('open_settings')}</span></div>
      <div class="v-context-divider"></div>
      <div class="v-context-item" data-action="new-folder">${SVG.plus}<span>${t('create_new_folder')}</span></div>
    `;
    document.body.appendChild(menu);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'notes') { toggleRightPanel(true); switchTab('notes'); }
      else if (action === 'outline') { toggleRightPanel(true); switchTab('outline'); }
      else if (action === 'condenser') { toggleRightPanel(true); switchTab('condenser'); }
      else if (action === 'settings') { toggleRightPanel(true); switchTab('settings'); }
      else if (action === 'new-folder') { addFolder(); }
      closeAllMenus();
    });

    setTimeout(() => document.addEventListener('click', outsideClose, { once: true }), 10);
    function outsideClose(ev) {
      if (!menu.contains(ev.target)) closeAllMenus();
    }
  };

  const getFolderKids = (parentId) =>
    state.folders.filter(f => f.parentId === (parentId || null));

  const getChatsInFolder = (folderId) => {
    const currentURL = window.location.pathname;
    return Object.keys(state.chatToFolder)
      .filter(cid => state.chatToFolder[cid] === folderId)
      .map(cid => {
        const meta = state.chatMetadata[cid];
        if (!meta) return null;
        return { ...meta, isActive: currentURL.includes(cid) };
      }).filter(Boolean);
  };

  const renderBookmarkBar = () => {
    const container = document.getElementById('v-bb-folders-container');
    if (!container) return;

    const links = findChatLinks();
    const currentURL = window.location.pathname;

    links.forEach(link => {
      const href = link.getAttribute('href');
      const id   = getChatId(href);
      if (!id) return;

      const title = getChatLinkTitle(link);

      if (!state.chatMetadata[id]) {
        state.chatMetadata[id] = { id, title, href, createdAt: Date.now(), lastActive: Date.now() };
      } else {
        state.chatMetadata[id].title = title;
        state.chatMetadata[id].href  = href;
      }

      const row = getChatRowWrapper(link);
      const inFolder = state.chatToFolder[id] && state.folders.some(f => f.id === state.chatToFolder[id]);
      if (inFolder) {
        row.style.setProperty('display', 'none', 'important');
      } else {
        row.style.removeProperty('display');
      }

      if (!row.dataset.vDragBound) {
        row.dataset.vDragBound = 'true';
        row.setAttribute('draggable', 'true');
        row.addEventListener('dragstart', e => {
          e.dataTransfer.setData('application/json', JSON.stringify({ id, title, href }));
          e.dataTransfer.effectAllowed = 'move';
          row.classList.add('v-native-dragging');
        });
        row.addEventListener('dragend', () => {
          row.classList.remove('v-native-dragging');
          document.querySelectorAll('.v-bb-folder-btn.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
      }

      if (!row.dataset.vQuickBound) {
        row.dataset.vQuickBound = 'true';
        const btn = document.createElement('button');
        btn.className = 'v-quick-assign-btn';
        btn.innerHTML = SVG.dots;
        btn.title = 'Thêm vào thư mục';
        btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); showQuickAssignMenu(btn, id); });
        (row.querySelector('div:last-child') || row).appendChild(btn);
      }
    });

    const cacheKey = `bb_${currentURL}_${links.length}_${state.folders.length}_${Object.keys(state.chatToFolder).length}_${activeDropdownFolderId}`;
    if (cacheKey === lastRenderKey && container.innerHTML !== '') return;
    lastRenderKey = cacheKey;

    const rootFolders = state.folders.filter(f => f.parentId === null);
    
    let html = '';
    rootFolders.forEach(folder => {
      const chats = getChatsInFolder(folder.id);
      const subFolders = state.folders.filter(f => f.parentId === folder.id);
      const count = chats.length + subFolders.reduce((acc, sf) => acc + getChatsInFolder(sf.id).length, 0);
      const isDropdownOpen = activeDropdownFolderId === folder.id;
      const folderIcon = count > 0 ? SVG.folder(true) : SVG.folder(false);

      html += `
        <div class="v-bb-folder-wrapper" data-folder-id="${folder.id}">
          <button class="v-bb-folder-btn ${isDropdownOpen ? 'active' : ''}" data-folder-id="${folder.id}">
            <span class="v-bb-folder-icon">${folderIcon}</span>
            <span>${escapeHtml(folder.name)}</span>
            ${count > 0 ? `<span class="v-folder-badge" style="margin-left:4px; font-size:9px;">${count}</span>` : ''}
          </button>
        </div>
      `;
    });

    container.innerHTML = html;
    bindBookmarkBarEvents(container);
  };

  const renderDropdownContent = (folderId, dropdownEl) => {
    const chats = getChatsInFolder(folderId);
    const kids = state.folders.filter(f => f.parentId === folderId);
    
    let html = '';
    
    kids.forEach(kid => {
      const kidChats = getChatsInFolder(kid.id);
      const isKidCollapsed = kid.collapsed || false;
      const folderIcon = isKidCollapsed ? SVG.folder(false) : SVG.folder(true);

      html += `
        <div class="v-bb-subfolder-header" data-folder-id="${kid.id}">
          <span class="v-subfolder-toggle-icon">${folderIcon}</span>
          <span>${escapeHtml(kid.name)}</span>
        </div>
      `;

      if (!isKidCollapsed) {
        kidChats.forEach(chat => {
          const title = (chat.title || 'Không tên').trim();
          const href = chat.href || `/app/${chat.id}`;
          html += `
            <div class="v-bb-chat-item ${chat.isActive ? 'active' : ''}" data-chat-id="${chat.id}" data-href="${href}" draggable="true" style="padding-left:18px;">
              <span class="v-bb-chat-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
              <span class="v-bb-chat-remove" data-remove-id="${chat.id}" title="Gỡ khỏi thư mục">${SVG.close}</span>
            </div>
          `;
        });
      }
    });

    if (chats.length === 0 && kids.length === 0) {
      html += `<div class="v-bb-dropdown-empty">Kéo chat thả vào đây</div>`;
    } else {
      chats.forEach(chat => {
        const title = (chat.title || 'Không tên').trim();
        const href  = chat.href || `/app/${chat.id}`;
        html += `
          <div class="v-bb-chat-item ${chat.isActive ? 'active' : ''}" data-chat-id="${chat.id}" data-href="${href}" draggable="true">
            <span class="v-bb-chat-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
            <span class="v-bb-chat-remove" data-remove-id="${chat.id}" title="Gỡ khỏi thư mục">${SVG.close}</span>
          </div>
        `;
      });
    }
    
    dropdownEl.innerHTML = html;

    // Drag-and-drop & Collapse/Expand click on subfolders
    dropdownEl.querySelectorAll('.v-bb-subfolder-header').forEach(header => {
      const subId = header.dataset.folderId;
      
      header.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const subFolder = state.folders.find(f => f.id === subId);
        if (subFolder) {
          subFolder.collapsed = !subFolder.collapsed;
          saveState();
          renderDropdownContent(folderId, dropdownEl);
        }
      });

      header.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        header.classList.add('drag-over');
      });
      
      header.addEventListener('dragleave', () => {
        header.classList.remove('drag-over');
      });
      
      header.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        header.classList.remove('drag-over');
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data?.id) {
            state.chatToFolder[data.id] = subId;
            saveState();
            renderDropdownContent(folderId, dropdownEl);
            renderBookmarkBar();
            showToast(`Đã thêm vào "${state.folders.find(f => f.id === subId)?.name}"! 📁`);
          }
        } catch (err) {}
      });
    });

    // Chat items inside dropdown: click & drag
    dropdownEl.querySelectorAll('.v-bb-chat-item').forEach(item => {
      const id = item.dataset.chatId;
      const href = item.dataset.href;
      const title = item.querySelector('.v-bb-chat-title').textContent;

      item.addEventListener('click', e => {
        if (e.target.closest('.v-bb-chat-remove')) return;
        e.preventDefault(); e.stopPropagation();
        navigateToChat(href, id);
        closeGlobalDropdown();
      });

      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id, title, href }));
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('v-chat-item-dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('v-chat-item-dragging');
      });

      item.querySelector('.v-bb-chat-remove')?.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        delete state.chatToFolder[id];
        saveState();
        renderDropdownContent(folderId, dropdownEl);
        renderBookmarkBar();
      });
    });
  };

  let hoverFolderTimeout = null;

  const handleOutsideClick = (e) => {
    if (!e.target.closest('.v-bb-folder-btn') && 
        !e.target.closest('#v-bb-global-dropdown') && 
        !e.target.closest('.v-context-menu')) {
      closeGlobalDropdown();
    }
  };

  const closeGlobalDropdown = (skipAllMenus = false) => {
    activeDropdownFolderId = null;
    const gDropdown = document.getElementById('v-bb-global-dropdown');
    if (gDropdown) {
      gDropdown.classList.remove('open');
      gDropdown.style.display = 'none';
    }
    document.querySelectorAll('.v-bb-folder-btn').forEach(b => b.classList.remove('active'));
    document.removeEventListener('click', handleOutsideClick);
    if (!skipAllMenus) {
      closeAllMenus(true);
    }
  };

  const bindBookmarkBarEvents = (container) => {
    const gDropdown = document.getElementById('v-bb-global-dropdown');

    const openGlobalDropdown = (folderId, btn) => {
      // Close the previous dropdown and clean up its listeners
      closeGlobalDropdown();

      activeDropdownFolderId = folderId;
      btn.classList.add('active');

      if (gDropdown) {
        renderDropdownContent(folderId, gDropdown);

        const rect = btn.getBoundingClientRect();
        gDropdown.style.position = 'fixed';
        gDropdown.style.top = `${rect.bottom + 5}px`;
        gDropdown.style.left = `${rect.left}px`;
        gDropdown.style.display = 'flex';
        gDropdown.classList.add('open');

        const dropRect = gDropdown.getBoundingClientRect();
        if (dropRect.right > window.innerWidth) {
          gDropdown.style.left = `${window.innerWidth - dropRect.width - 12}px`;
        }

        // Add the global outside click listener with a small delay
        setTimeout(() => {
          document.removeEventListener('click', handleOutsideClick);
          document.addEventListener('click', handleOutsideClick);
        }, 50);
      }
    };

    container.querySelectorAll('.v-bb-folder-wrapper').forEach(wrapper => {
      const folderId = wrapper.dataset.folderId;
      const btn = wrapper.querySelector('.v-bb-folder-btn');

      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (activeDropdownFolderId === folderId) {
          closeGlobalDropdown();
        } else {
          openGlobalDropdown(folderId, btn);
        }
      });

      btn.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        showFolderContextMenu(e, folderId);
      });

      btn.addEventListener('dragover', e => {
        e.preventDefault(); e.stopPropagation();
        btn.classList.add('drag-over');

        if (!hoverFolderTimeout && activeDropdownFolderId !== folderId) {
          hoverFolderTimeout = setTimeout(() => {
            openGlobalDropdown(folderId, btn);
          }, 600);
        }
      });

      btn.addEventListener('dragleave', e => {
        btn.classList.remove('drag-over');
        clearTimeout(hoverFolderTimeout);
        hoverFolderTimeout = null;
      });

      btn.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        btn.classList.remove('drag-over');
        clearTimeout(hoverFolderTimeout);
        hoverFolderTimeout = null;

        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data?.id) {
            state.chatToFolder[data.id] = folderId;
            if (!state.chatMetadata[data.id]) {
              state.chatMetadata[data.id] = { id: data.id, title: data.title || 'Không tên', href: data.href || `/app/${data.id}`, createdAt: Date.now(), lastActive: Date.now() };
            }
            saveState();
            openGlobalDropdown(folderId, btn);
            showToast(`Đã thêm vào "${state.folders.find(f => f.id === folderId)?.name}"! 📁`);
          }
        } catch (err) {}
      });
    });

    if (gDropdown && !gDropdown.dataset.vDragBound) {
      gDropdown.dataset.vDragBound = 'true';
      
      gDropdown.addEventListener('dragover', e => {
        e.preventDefault(); e.stopPropagation();
      });
      gDropdown.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        const activeId = activeDropdownFolderId;
        if (!activeId) return;
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data?.id) {
            state.chatToFolder[data.id] = activeId;
            if (!state.chatMetadata[data.id]) {
              state.chatMetadata[data.id] = { id: data.id, title: data.title || 'Không tên', href: data.href || `/app/${data.id}`, createdAt: Date.now(), lastActive: Date.now() };
            }
            saveState();
            renderDropdownContent(activeId, gDropdown);
            renderBookmarkBar();
            showToast(`Đã thêm vào thư mục! 📁`);
          }
        } catch (err) {}
      });
    }
  };

  // ═══════════════════════════════════════════════════════════
  //   FOLDER CRUD
  // ═══════════════════════════════════════════════════════════
  const addFolder = (parentId = null) => {
    const name = prompt(parentId ? t('prompt_sub_folder') : t('prompt_new_folder'));
    if (!name?.trim()) return;
    state.folders.push({ id: 'f_' + Date.now(), name: name.trim(), parentId, collapsed: false });
    saveState();
    renderBookmarkBar();
  };

  const escapeHtml = str => str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ═══════════════════════════════════════════════════════════
  //   FOLDER CONTEXT MENU
  // ═══════════════════════════════════════════════════════════
  const showFolderContextMenu = (e, folderId) => {
    e.preventDefault(); e.stopPropagation();
    closeAllMenus();

    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;

    const menu = document.createElement('div');
    menu.id = 'v-folder-ctx';
    menu.className = 'v-context-menu';
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 220);
    menu.style.cssText = `top:${y}px;left:${x}px`;

    menu.innerHTML = `
      <div class="v-context-item" data-action="add-sub">${SVG.plus}<span>${t('folder_create_sub')}</span></div>
      <div class="v-context-item" data-action="rename">${SVG.edit}<span>${t('folder_rename')}</span></div>
      <div class="v-context-item" data-action="expand">${SVG.folder(true)}<span>${t('folder_expand_all')}</span></div>
      <div class="v-context-item" data-action="collapse">${SVG.folder(false)}<span>${t('folder_collapse_all')}</span></div>
      <div class="v-context-divider"></div>
      <div class="v-context-item danger" data-action="delete">${SVG.trash}<span>${t('folder_delete')}</span></div>
    `;
    document.body.appendChild(menu);

    menu.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      if (action === 'add-sub') addFolder(folderId);
      else if (action === 'rename') {
        const name = prompt(t('prompt_rename_folder') || 'Đổi tên:', folder.name);
        if (name?.trim()) { folder.name = name.trim(); saveState(); renderBookmarkBar(); }
      } else if (action === 'expand' || action === 'collapse') {
        const setCollapsed = (fid, val) => {
          const f = state.folders.find(x => x.id === fid);
          if (f) f.collapsed = val;
          state.folders.filter(x => x.parentId === fid).forEach(x => setCollapsed(x.id, val));
        };
        setCollapsed(folderId, action === 'collapse');
        saveState(); renderBookmarkBar();
      } else if (action === 'delete') {
        const getAllDescendants = pid => {
          const kids = state.folders.filter(x => x.parentId === pid).map(x => x.id);
          return [...kids, ...kids.flatMap(getAllDescendants)];
        };
        const toDelete = [folderId, ...getAllDescendants(folderId)];
        if (confirm(t('confirm_delete_folder', { folderName: folder.name }))) {
          toDelete.forEach(did => {
            Object.keys(state.chatToFolder).forEach(cid => {
              if (state.chatToFolder[cid] === did) delete state.chatToFolder[cid];
            });
          });
          state.folders = state.folders.filter(f => !toDelete.includes(f.id));
          saveState(); renderBookmarkBar();
        }
      }
      closeAllMenus();
    });

    setTimeout(() => document.addEventListener('click', outsideClose, { once: true }), 10);

    function outsideClose(ev) {
      if (!menu.contains(ev.target)) closeAllMenus();
    }
  };

  // ═══════════════════════════════════════════════════════════
  //   QUICK-ASSIGN MENU
  // ═══════════════════════════════════════════════════════════
  const showQuickAssignMenu = (anchorEl, chatId) => {
    closeAllMenus();
    anchorEl.classList.add('active');

    const menu = document.createElement('div');
    menu.id = 'v-assign-menu';
    menu.className = 'v-context-menu';
    const rect = anchorEl.getBoundingClientRect();
    menu.style.cssText = `top:${rect.bottom + 4}px;left:${Math.min(rect.left, window.innerWidth - 200)}px`;

    const curFolder = state.chatToFolder[chatId];
    const buildItems = (parentId = null, depth = 0) => {
      let html = '';
      state.folders.filter(f => f.parentId === (parentId || null)).forEach(f => {
        const pad = 10 + depth * 12;
        html += `<div class="v-context-item ${curFolder === f.id ? 'active' : ''}" data-folder-id="${f.id}" style="padding-left:${pad}px">${SVG.folder(false)}<span>${escapeHtml(f.name)}</span></div>`;
        html += buildItems(f.id, depth + 1);
      });
      return html;
    };

    let html = `<div class="v-context-title">${t('assign_to_folder_title')}</div>`;
    if (state.folders.length === 0) {
      html += `<div class="v-context-item" style="opacity:.5;pointer-events:none">${t('assign_no_folders')}</div>`;
    } else {
      html += buildItems();
    }
    if (curFolder) {
      html += `<div class="v-context-divider"></div><div class="v-context-item danger" data-action="remove">${SVG.close}<span>${t('assign_remove')}</span></div>`;
    }
    html += `<div class="v-context-divider"></div><div class="v-context-item" data-action="new">${SVG.plus}<span>${t('assign_new_folder')}</span></div>`;

    menu.innerHTML = html;
    document.body.appendChild(menu);

    menu.addEventListener('click', e => {
      const item = e.target.closest('[data-folder-id], [data-action]');
      if (!item) return;
      const fid = item.dataset.folderId;
      const action = item.dataset.action;

      if (fid) {
        state.chatToFolder[chatId] = fid;
        const tf = state.folders.find(f => f.id === fid);
        if (tf) tf.collapsed = false;
        showToast(t('toast_added_to', { folderName: tf?.name || '' }));
      } else if (action === 'remove') {
        delete state.chatToFolder[chatId];
        showToast(t('toast_removed_from'));
      } else if (action === 'new') {
        const name = prompt(t('prompt_new_folder'));
        if (name?.trim()) {
          const newId = 'f_' + Date.now();
          state.folders.push({ id: newId, name: name.trim(), parentId: null, collapsed: false });
          state.chatToFolder[chatId] = newId;
          showToast(t('toast_created_folder', { folderName: name.trim() }));
        }
      }
      saveState();
      closeAllMenus();
      renderBookmarkBar();
    });

    setTimeout(() => document.addEventListener('click', outsideClose, { once: true }), 10);

    function outsideClose(ev) {
      if (!menu.contains(ev.target)) closeAllMenus();
    }
  };

  const closeAllMenus = (skipGlobalDropdown = false) => {
    document.getElementById('v-folder-ctx')?.remove();
    document.getElementById('v-assign-menu')?.remove();
    document.getElementById('v-bento-menu')?.remove();
    document.querySelectorAll('.v-quick-assign-btn.active, .v-bb-logo.active, .v-bb-action-btn.active').forEach(b => b.classList.remove('active'));
    if (!skipGlobalDropdown) {
      closeGlobalDropdown(true);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //   RIGHT PANEL — INJECT
  // ═══════════════════════════════════════════════════════════
  const injectRightPanel = () => {
    if (document.getElementById('v-right-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'v-right-panel';
    panel.innerHTML = `
      <div class="v-panel-tabs">
        <button class="v-panel-tab active" data-tab="notes">${SVG.note} ${t('tab_notes')}</button>
        <button class="v-panel-tab" data-tab="outline">${SVG.outline} ${t('tab_outline')}</button>
        <button class="v-panel-tab" data-tab="condenser">${SVG.condenser} ${t('tab_condenser')}</button>
        <button class="v-panel-tab" data-tab="settings">${SVG.settings} ${t('tab_settings')}</button>
      </div>
      <div class="v-panel-body">
        <!-- Notes Tab -->
        <div class="v-tab-content active" id="v-tab-notes">
          <div class="v-notes-toolbar" id="v-notes-toolbar">
            <button class="v-tb-btn" id="v-tb-bold" title="${t('notes_bold')}"><b>B</b></button>
            <button class="v-tb-btn" id="v-tb-italic" title="${t('notes_italic')}"><i>I</i></button>
            <button class="v-tb-btn" id="v-tb-underline" title="${t('notes_underline')}"><u>U</u></button>
            <button class="v-tb-btn" id="v-tb-strike" title="${t('notes_strike')}"><s>S</s></button>
            <label class="v-tb-scope-label" title="${t('notes_by_chat')}">
              <label class="v-switch">
                <input type="checkbox" id="v-note-scope-chk">
                <span class="v-switch-slider"></span>
              </label>
              ${t('notes_by_chat')}
            </label>
          </div>
          <div class="v-notes-editor" id="v-notes-editor" contenteditable="true" data-placeholder="${t('notes_placeholder_global')}"></div>
          <div class="v-notes-footer">
            <span class="v-save-indicator" id="v-save-indicator">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-3.64-3.5-3.64-3.5C16.64 8.9 14 7 11 7c-4 0-7 3-7 7"/></svg>
              ${t('notes_auto_save')}
            </span>
            <button class="v-notes-action-btn" id="v-note-clear">${t('notes_clear')}</button>
            <button class="v-notes-action-btn primary" id="v-note-copy">${t('notes_copy')}</button>
          </div>
        </div>

        <!-- Outline Tab -->
        <div class="v-tab-content" id="v-tab-outline">
          <div class="v-outline-filter-bar">
            <select class="v-outline-select" id="v-outline-filter">
              <option value="all">${t('outline_all')}</option>
              <option value="prompts">${t('outline_prompts')}</option>
              <option value="responses">${t('outline_responses')}</option>
            </select>
          </div>
          <div class="v-outline-list" id="v-outline-list">
            <div class="v-outline-empty">${t('outline_empty')}</div>
          </div>
        </div>

        <!-- Condenser Tab -->
        <div class="v-tab-content" id="v-tab-condenser">
          <div class="v-condenser-header">
            <div class="v-condenser-title">${t('condenser_title')}</div>
            <div class="v-condenser-subtitle">${t('condenser_subtitle')}</div>
          </div>
          <div class="v-condenser-status-card" id="v-condenser-status"></div>
          <div class="v-condenser-body">
            <button class="v-notes-action-btn primary" id="v-btn-condense" style="width: 100%; height: 36px; font-weight: 600; margin-bottom: 12px;">
              ${t('condenser_btn_start')}
            </button>
            <div class="v-condenser-progress" id="v-condenser-progress" style="display:none;">
              <div class="v-condenser-spinner"></div>
              <span id="v-condenser-progress-text">${t('condenser_progress_analyzing')}</span>
            </div>
            <div class="v-condenser-output-container" id="v-condenser-output-box" style="display:none; flex: 1; display: flex; flex-direction: column; min-height: 0;">
              <div class="v-condenser-output-header" style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--v-text-muted); margin-bottom: 6px;">
                <span>${t('condenser_result_header')}</span>
                <button class="v-icon-btn" id="v-condenser-copy-btn" title="${t('condenser_copy_tooltip')}" style="width: 24px; height: 24px;">${SVG.copy}</button>
              </div>
              <div class="v-condenser-output-editor" id="v-condenser-output-text" contenteditable="true" placeholder="${t('condenser_output_placeholder')}" style="flex: 1; background: rgba(0,0,0,0.25); border: 1px solid var(--v-border); border-radius: var(--v-radius-xs); padding: 10px; font-size: 12px; line-height: 1.5; color: var(--v-text); overflow-y: auto; outline: none; min-height: 120px;"></div>
              <button class="v-notes-action-btn primary" id="v-btn-condense-continue" style="width: 100%; height: 36px; font-weight: 600; margin-top: 10px;">
                ${t('condenser_btn_continue')}
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div class="v-tab-content" id="v-tab-settings">
          <div class="v-settings-body">

            <!-- Interface & Shortcuts Card -->
            <div class="v-settings-card">
              <div class="v-settings-card-title">🎨 ${t('settings_title')}</div>
              <div class="v-settings-field">
                <label class="v-settings-label">${t('settings_theme')}</label>
                <select class="v-settings-select" id="v-setting-theme">
                  <option value="teal-cyan">${t('settings_theme_teal')}</option>
                  <option value="emerald-lime">${t('settings_theme_emerald')}</option>
                  <option value="amber-gold">${t('settings_theme_amber')}</option>
                  <option value="sapphire-azure">${t('settings_theme_sapphire')}</option>
                  <option value="rose-blossom">${t('settings_theme_rose')}</option>
                  <option value="terracotta-sun">${t('settings_theme_terracotta')}</option>
                  <option value="bronze-gold">${t('settings_theme_bronze')}</option>
                  <option value="slate-platinum">${t('settings_theme_slate')}</option>
                </select>
              </div>
              <div class="v-settings-field">
                <label class="v-settings-label">${t('settings_lang')}</label>
                <select class="v-settings-select" id="v-setting-lang">
                  <option value="vi">Tiếng Việt (Vietnamese)</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div class="v-settings-shortcuts-list">
                <div class="v-settings-shortcut-row">
                  <label class="v-settings-label">${t('settings_shortcut_panel')}</label>
                  <input type="text" class="v-settings-input" id="v-setting-shortcut" placeholder="Alt+N" autocomplete="off">
                </div>
                <div class="v-settings-shortcut-row">
                  <label class="v-settings-label">${t('settings_shortcut_sidebar')}</label>
                  <input type="text" class="v-settings-input" id="v-setting-shortcut-sidebar" placeholder="Alt+S" autocomplete="off">
                </div>
                <div class="v-settings-shortcut-row">
                  <label class="v-settings-label">${t('settings_shortcut_bento')}</label>
                  <input type="text" class="v-settings-input" id="v-setting-shortcut-bento" placeholder="Alt+B" autocomplete="off">
                </div>
                <div class="v-settings-shortcut-row">
                  <label class="v-settings-label">${t('settings_shortcut_add_chat')}</label>
                  <input type="text" class="v-settings-input" id="v-setting-shortcut-add-chat" placeholder="Alt+A" autocomplete="off">
                </div>
                <div class="v-settings-shortcut-row">
                  <label class="v-settings-label">${t('settings_shortcut_chat_options')}</label>
                  <input type="text" class="v-settings-input" id="v-setting-shortcut-chat-options" placeholder="Alt+O" autocomplete="off">
                </div>
              </div>
            </div>

            <!-- Advanced Accordion Trigger -->
            <div class="v-accordion-header" id="v-adv-settings-trigger">
              <span>⚙️ ${t('settings_adv_title')}</span>
              <span class="v-accordion-chevron">▼</span>
            </div>

            <!-- Advanced Content Area (Collapsed by default) -->
            <div class="v-accordion-content" id="v-adv-settings-content" style="display: none; flex-direction: column; gap: 12px;">
              <!-- API Key Card -->
              <div class="v-settings-card">
                <div class="v-settings-card-title">🔑 ${t('settings_api_title')}</div>
                <div class="v-settings-field">
                  <label class="v-settings-label">${t('settings_key_gemini')}</label>
                  <div class="v-api-key-row">
                    <input type="password" class="v-settings-input" id="v-key-0" placeholder="AIza..." autocomplete="off">
                  </div>
                </div>
                <div class="v-settings-field">
                  <label class="v-settings-label">${t('settings_key_groq')}</label>
                  <div class="v-api-key-row">
                    <input type="password" class="v-settings-input" id="v-key-1" placeholder="gsk_..." autocomplete="off">
                  </div>
                </div>
                <div class="v-settings-field" style="margin-top:12px">
                  <label class="v-settings-label">${t('settings_active_model')}</label>
                  <select class="v-settings-select" id="v-active-model"></select>
                </div>
              </div>

              <!-- API Links Card -->
              <div class="v-settings-card">
                <div class="v-settings-card-title">🗂️ ${t('settings_api_mgmt')}</div>
                <div class="v-api-links">
                  <a href="https://aistudio.google.com/rate-limit" target="_blank" class="v-api-link-card">
                    <div class="v-api-link-icon google">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </div>
                    <div><span class="v-api-link-name">Google AI Studio</span><span class="v-api-link-desc">${t('settings_api_google_desc')}</span></div>
                  </a>
                  <a href="https://console.groq.com/settings/organization/usage" target="_blank" class="v-api-link-card">
                    <div class="v-api-link-icon groq">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    </div>
                    <div><span class="v-api-link-name">GroqCloud</span><span class="v-api-link-desc">${t('settings_api_groq_desc')}</span></div>
                  </a>
                </div>
              </div>
            </div>

            <!-- Action Buttons at bottom -->
            <div class="v-settings-actions" style="margin-top: 16px;">
              <button class="v-notes-action-btn" id="v-btn-test">${t('settings_btn_test')}</button>
              <button class="v-notes-action-btn primary" id="v-btn-save">${t('settings_btn_save')}</button>
            </div>
            <div class="v-settings-status" id="v-settings-status"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Toggle button
    const toggle = document.createElement('button');
    toggle.id = 'v-right-toggle';
    toggle.title = t('open_panel') || 'Mở Vaxlou Panel';
    toggle.innerHTML = SVG.chevronRight;
    document.body.appendChild(toggle);

    toggle.addEventListener('click', () => toggleRightPanel());

    // Tab switching
    panel.querySelectorAll('.v-panel-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Notes toolbar
    bindNotesToolbar(panel);

    // Notes editor events
    const editor = panel.querySelector('#v-notes-editor');
    const scopeChk = panel.querySelector('#v-note-scope-chk');

    editor.addEventListener('input', () => scheduleNoteSave());
    editor.addEventListener('blur',  () => scheduleNoteSave());
    editor.addEventListener('paste', handleNotePaste);
    editor.addEventListener('drop',  handleNoteDrop);

    scopeChk.checked = state.noteScopeIsSingle || false;
    scopeChk.addEventListener('change', () => {
      state.noteScopeIsSingle = scopeChk.checked;
      saveState();
      loadNoteContent();
      updateNotePlaceholder();
    });

    panel.querySelector('#v-note-clear').addEventListener('click', () => {
      if (confirm(t('confirm_clear_notes'))) {
        editor.innerHTML = '';
        scheduleNoteSave();
        showToast(t('toast_deleted_notes'));
      }
    });

    panel.querySelector('#v-note-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(editor.innerText || '').then(() => showToast(t('toast_copied'))).catch(() => showToast(t('toast_copy_failed'), 'error'));
    });

    // Outline filter
    panel.querySelector('#v-outline-filter').addEventListener('change', () => renderOutline());

    // Settings
    loadSettingsForm(panel);
    bindSettingsEvents(panel);

    // Condenser
    panel.querySelector('#v-btn-condense')?.addEventListener('click', () => executeAIContextCondensing());
    panel.querySelector('#v-btn-condense-continue')?.addEventListener('click', () => continueInNewChatWithSummary());
    panel.querySelector('#v-condenser-copy-btn')?.addEventListener('click', () => {
      const txt = panel.querySelector('#v-condenser-output-text')?.innerText || '';
      navigator.clipboard.writeText(txt).then(() => showToast(t('toast_copied'))).catch(() => showToast(t('toast_copy_failed'), 'error'));
    });

    // Load initial note
    loadNoteContent();
    updateNotePlaceholder();
  };

  const toggleRightPanel = (force) => {
    const panel = document.getElementById('v-right-panel');
    const toggle = document.getElementById('v-right-toggle');
    if (!panel || !toggle) return;

    rightPanelOpen = force !== undefined ? force : !rightPanelOpen;
    panel.classList.toggle('open', rightPanelOpen);
    toggle.classList.toggle('panel-open', rightPanelOpen);
    document.body.classList.toggle('v-right-open', rightPanelOpen);
  };

  const switchTab = (tab) => {
    currentActiveTab = tab;
    const panel = document.getElementById('v-right-panel');
    if (!panel) return;
    panel.querySelectorAll('.v-panel-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    panel.querySelectorAll('.v-tab-content').forEach(c => c.classList.toggle('active', c.id === `v-tab-${tab}`));
    if (tab === 'outline') renderOutline();
    if (tab === 'condenser') renderCondenserStatus();
    if (tab === 'settings') loadSettingsForm(panel);
  };

  // ═══════════════════════════════════════════════════════════
  //   NOTES
  // ═══════════════════════════════════════════════════════════
  const getNoteKey = () => {
    const scopeChk = document.getElementById('v-note-scope-chk');
    const isSingle = scopeChk ? scopeChk.checked : false;
    if (isSingle && currentChatId) return currentChatId;
    return 'global';
  };

  const loadNoteContent = () => {
    const editor = document.getElementById('v-notes-editor');
    if (!editor) return;
    const key = getNoteKey();
    editor.innerHTML = state.chatNotes[key] || '';
    updateNotePlaceholder();
  };

  const updateNotePlaceholder = () => {
    const editor = document.getElementById('v-notes-editor');
    if (!editor) return;
    const scopeChk = document.getElementById('v-note-scope-chk');
    const isSingle = scopeChk ? scopeChk.checked : false;

    if (isSingle && !currentChatId) {
      editor.setAttribute('data-placeholder', t('notes_placeholder_select_chat'));
      editor.contentEditable = 'false';
    } else if (isSingle && currentChatId) {
      editor.setAttribute('data-placeholder', t('notes_placeholder_chat'));
      editor.contentEditable = 'true';
    } else {
      editor.setAttribute('data-placeholder', t('notes_placeholder_global'));
      editor.contentEditable = 'true';
    }
  };

  const setSaveStatus = (status) => {
    const el = document.getElementById('v-save-indicator');
    if (!el) return;
    if (status === 'saving') {
      el.className = 'v-save-indicator saving';
      el.innerHTML = `<span style="width:11px;height:11px;border:2px solid rgba(251,191,36,0.3);border-top-color:#fbbf24;border-radius:50%;display:inline-block;animation:v-spin .8s linear infinite"></span> ${t('notes_saving')}`;
    } else if (status === 'saved') {
      el.className = 'v-save-indicator saved';
      el.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${t('notes_saved_success') || 'Đã lưu'}`;
      setTimeout(() => {
        el.className = 'v-save-indicator';
        el.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-3.64-3.5-3.64-3.5C16.64 8.9 14 7 11 7c-4 0-7 3-7 7"/></svg> ${t('notes_auto_save')}`;
      }, 2000);
    }
  };

  const scheduleNoteSave = () => {
    setSaveStatus('saving');
    clearTimeout(saveNoteTimeout);
    saveNoteTimeout = setTimeout(() => {
      const editor = document.getElementById('v-notes-editor');
      if (!editor) return;
      const key = getNoteKey();
      if (!state.chatNotes) state.chatNotes = {};
      state.chatNotes[key] = editor.innerHTML;
      saveState();
      setSaveStatus('saved');
    }, 700);
  };

  const bindNotesToolbar = (panel) => {
    const exec = (cmd, val) => {
      document.execCommand(cmd, false, val || null);
      document.getElementById('v-notes-editor')?.focus();
    };
    panel.querySelector('#v-tb-bold')?.addEventListener('click',      () => exec('bold'));
    panel.querySelector('#v-tb-italic')?.addEventListener('click',    () => exec('italic'));
    panel.querySelector('#v-tb-underline')?.addEventListener('click', () => exec('underline'));
    panel.querySelector('#v-tb-strike')?.addEventListener('click',    () => exec('strikeThrough'));
  };

  const handleNotePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type.startsWith('image/')) {
          e.preventDefault();
          insertImageFile(file);
        }
      }
    }
  };

  const handleNoteDrop = (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const imgFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imgFiles.length > 0) {
        e.preventDefault();
        imgFiles.forEach(insertImageFile);
      }
    }
  };

  const insertImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const editor = document.getElementById('v-notes-editor');
      if (!editor) return;
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.cssText = 'max-width:100%;border-radius:8px;margin:4px 0;cursor:pointer';
      editor.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          editor.appendChild(img);
        }
      } else {
        editor.appendChild(img);
      }
      scheduleNoteSave();
    };
    reader.readAsDataURL(file);
  };

  // ═══════════════════════════════════════════════════════════
  //   OUTLINE
  // ═══════════════════════════════════════════════════════════
  const getChatOutline = () => {
    const elements = Array.from(document.querySelectorAll('user-query, model-response'));
    const outline = [];

    elements.forEach(el => {
      if (el.tagName === 'USER-QUERY') {
        let text = el.textContent.replace(/⭐/g, '').replace(/^(Bạn đã nói|You said):?\s*/i, '').trim();
        if (text) {
          if (text.length > 55) text = text.slice(0, 52) + '…';
          outline.push({ type: 'prompt', text: `${t('outline_you')}: "${text}"`, element: el, level: 1 });
        }
      } else {
        const headings = Array.from(el.querySelectorAll('h1,h2,h3,h4'));
        if (headings.length === 0) {
          let text = el.textContent.trim().replace(/\s+/g, ' ');
          if (text.length > 65) text = text.slice(0, 62) + '…';
          if (text) outline.push({ type: 'response', text: `Gemini: ${text}`, element: el, level: 2 });
        } else {
          headings.forEach(h => {
            let text = h.textContent.trim().replace(/^[-*•\d.]+\s+/, '');
            if (text.toLowerCase().includes('gemini đã nói') || text.toLowerCase().includes('gemini said')) {
              text = t('gemini_said');
            }
            const level = Math.min(4, parseInt(h.tagName[1]) || 2);
            if (text) outline.push({ type: 'heading', text, element: h, level });
          });
        }
      }
    });
    return outline;
  };

  const renderOutline = () => {
    const container = document.getElementById('v-outline-list');
    if (!container) return;

    if (!currentChatId) {
      container.innerHTML = `<div class="v-outline-empty">${t('outline_empty')}</div>`;
      return;
    }

    const outline = getChatOutline();
    if (outline.length === 0) {
      container.innerHTML = `<div class="v-outline-empty">${t('outline_no_content')}</div>`;
      return;
    }

    const filter = document.getElementById('v-outline-filter')?.value || 'all';
    let filtered = outline;
    if (filter === 'prompts')   filtered = outline.filter(i => i.type === 'prompt');
    if (filter === 'responses') filtered = outline.filter(i => i.type !== 'prompt');

    if (filtered.length === 0) {
      container.innerHTML = `<div class="v-outline-empty">${t('outline_no_match')}</div>`;
      return;
    }

    let html = '';
    filtered.forEach((item, idx) => {
      const cls = item.type === 'prompt' ? 'prompt' : `heading-l${item.level}`;
      const bullet = item.type === 'prompt' ? '💬' : '↳';
      html += `<div class="v-outline-item ${cls}" data-idx="${idx}" style="animation-delay:${idx * 20}ms">`
            + `<span class="v-outline-bullet">${bullet}</span>`
            + `<span class="v-outline-text">${escapeHtml(item.text)}</span></div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.v-outline-item').forEach((el, idx) => {
      el.addEventListener('click', () => {
        const item = filtered[idx];
        if (item?.element) {
          item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          item.element.classList.add('v-bubble-glow');
          setTimeout(() => item.element.classList.remove('v-bubble-glow'), 1200);
        }
      });
    });
  };

  // ═══════════════════════════════════════════════════════════
  //   AI CONTEXT CONDENSER
  // ═══════════════════════════════════════════════════════════
  const getChatConversationText = () => {
    const turns = [];
    document.querySelectorAll('user-query, model-response').forEach(el => {
      const role = el.tagName === 'USER-QUERY' ? 'User' : 'Gemini';
      const text = el.textContent.replace(/⭐/g, '').replace(/^(Bạn đã nói|You said):?\s*/i, '').trim();
      if (text) turns.push(`[${role}]: ${text}`);
    });
    return turns.join('\n\n');
  };

  const renderCondenserStatus = () => {
    const statusEl = document.getElementById('v-condenser-status');
    if (!statusEl) return;

    if (!currentChatId) {
      statusEl.innerHTML = `<div style="color:var(--v-text-dim);font-style:italic;">${t('condenser_select_chat')}</div>`;
      const btn = document.getElementById('v-btn-condense');
      if (btn) btn.disabled = true;
      return;
    }

    const turnsCount = document.querySelectorAll('user-query, model-response').length;
    const activeKey = state.settings.apiKeys[state.settings.activeKeyIndex || 0];
    const hasKey = !!activeKey?.key;
    
    let keyStatusHtml = '';
    if (hasKey) {
      keyStatusHtml = `<span style="color:#4ade80;">${t('condenser_api_ready', { provider: activeKey.provider === 'groq' ? 'Groq' : 'Gemini' })}</span>`;
    } else {
      keyStatusHtml = `<span style="color:#f87171;">${t('condenser_api_missing')}</span>`;
    }

    statusEl.innerHTML = `
      <div>${t('condenser_turns_count', { count: turnsCount })}</div>
      <div style="margin-top: 4px;">🔑 ${t('settings_api_title')}: ${keyStatusHtml}</div>
    `;

    const btn = document.getElementById('v-btn-condense');
    if (btn) {
      btn.disabled = !hasKey || turnsCount === 0;
    }
  };

  const executeAIContextCondensing = async () => {
    const activeKey = state.settings.apiKeys[state.settings.activeKeyIndex || 0];
    if (!activeKey?.key) {
      showToast(t('toast_setup_api'), 'error');
      return;
    }

    const conversationText = getChatConversationText();
    if (!conversationText) {
      showToast(t('toast_empty_chat'), 'error');
      return;
    }

    const btn = document.getElementById('v-btn-condense');
    const progress = document.getElementById('v-condenser-progress');
    const progText = document.getElementById('v-condenser-progress-text');
    const outputBox = document.getElementById('v-condenser-output-box');
    const outputText = document.getElementById('v-condenser-output-text');

    if (btn) btn.disabled = true;
    if (progress) progress.style.display = 'flex';
    if (progText) progText.textContent = t('condenser_progress_extracting');
    if (outputBox) outputBox.style.display = 'none';

    const condensePrompt = t('condense_prompt_template') + `\n\n${conversationText}`;

    if (progText) progText.textContent = t('condenser_progress_ai');

    chrome.runtime.sendMessage({
      action: activeKey.provider === 'groq' ? 'callGroqAPI' : 'callGeminiAPI',
      apiKey: activeKey.key,
      model:  activeKey.model,
      prompt: condensePrompt
    }, res => {
      if (progress) progress.style.display = 'none';
      if (btn) btn.disabled = false;

      if (chrome.runtime.lastError || !res?.success) {
        const err = chrome.runtime.lastError?.message || res?.error || 'Lỗi không xác định';
        showToast(t('toast_condense_failed') + err, 'error');
      } else {
        showToast(t('toast_condense_success'));
        if (outputText) {
          outputText.innerText = res.result || '';
        }
        if (outputBox) {
          outputBox.style.display = 'flex';
        }
      }
    });
  };

  const continueInNewChatWithSummary = () => {
    const summaryText = document.getElementById('v-condenser-output-text')?.innerText || '';
    if (!summaryText.trim()) {
      showToast(t('toast_empty_summary'), 'error');
      return;
    }

    const continueBtn = document.getElementById('v-btn-condense-continue');
    if (continueBtn) continueBtn.disabled = true;

    const fullPrompt = t('continue_prompt_template', { summaryText: summaryText });

    chrome.runtime.sendMessage({
      action: 'openNewChatWithPrompt',
      prompt: fullPrompt
    }, res => {
      if (continueBtn) continueBtn.disabled = false;
      if (res?.success) {
        showToast(t('toast_continued_new_chat'));
      } else {
        navigator.clipboard.writeText(fullPrompt).then(() => {
          showToast(t('toast_continue_fail_copied'), 'error');
        });
      }
    });
  };



  // ═══════════════════════════════════════════════════════════
  //   SETTINGS
  // ═══════════════════════════════════════════════════════════
  const loadSettingsForm = (panel) => {
    if (!panel) panel = document.getElementById('v-right-panel');
    if (!panel) return;

    // API Keys
    const keys = state.settings.apiKeys;
    [0, 1].forEach(i => {
      const keyInput = panel.querySelector(`#v-key-${i}`);
      if (keyInput) {
        keyInput.value = keys[i]?.key || '';
      }
    });

    // Active Model dropdown
    const modelSelect = panel.querySelector('#v-active-model');
    if (modelSelect) {
      const allModels = [...GEMINI_MODELS, ...GROQ_MODELS];
      const activeModel = keys[state.settings.activeKeyIndex || 0]?.model || DEFAULT_MODEL;
      modelSelect.innerHTML = allModels.map(m =>
        `<option value="${m}" ${activeModel === m ? 'selected' : ''}>${m}</option>`
      ).join('');
    }

    // Theme, Shortcuts, Language
    const themeSelect = panel.querySelector('#v-setting-theme');
    if (themeSelect) themeSelect.value = state.settings.themeColor || 'teal-cyan';

    const langSelect = panel.querySelector('#v-setting-lang');
    if (langSelect) langSelect.value = state.settings.uiLanguage || 'vi';

    const shortcutInput = panel.querySelector('#v-setting-shortcut');
    if (shortcutInput) shortcutInput.value = state.settings.shortcutTogglePanel || 'Alt+N';

    const shortcutSidebarInput = panel.querySelector('#v-setting-shortcut-sidebar');
    if (shortcutSidebarInput) shortcutSidebarInput.value = state.settings.shortcutSidebar || 'Alt+S';

    const shortcutBentoInput = panel.querySelector('#v-setting-shortcut-bento');
    if (shortcutBentoInput) shortcutBentoInput.value = state.settings.shortcutBento || 'Alt+B';

    const shortcutAddChatInput = panel.querySelector('#v-setting-shortcut-add-chat');
    if (shortcutAddChatInput) shortcutAddChatInput.value = state.settings.shortcutAddChat || 'Alt+A';

    const shortcutChatOptionsInput = panel.querySelector('#v-setting-shortcut-chat-options');
    if (shortcutChatOptionsInput) shortcutChatOptionsInput.value = state.settings.shortcutChatOptions || 'Alt+O';
  };

  const bindSettingsEvents = (panel) => {
    // Interactive Shortcut Recording Helper
    const setupShortcutRecorder = (input, defaultVal) => {
      if (!input) return;
      input.addEventListener('keydown', e => {
        e.preventDefault();
        e.stopPropagation();

        const key = e.key;

        // Ignore modifier keys standalone press
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
          return;
        }

        // Backspace or Delete clears the shortcut
        if (key === 'Backspace' || key === 'Delete') {
          input.value = '';
          return;
        }

        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');

        let mainKey = key;
        if (key === ' ') {
          mainKey = 'Space';
        } else if (key.length === 1) {
          mainKey = key.toUpperCase();
        } else {
          mainKey = key;
        }

        parts.push(mainKey);
        input.value = parts.join('+');
      });

      input.addEventListener('focus', () => {
        input.placeholder = t('settings_shortcut_press_key') || 'Nhấn tổ hợp phím...';
      });

      input.addEventListener('blur', () => {
        input.placeholder = defaultVal;
      });
    };

    setupShortcutRecorder(panel.querySelector('#v-setting-shortcut'), 'Alt+N');
    setupShortcutRecorder(panel.querySelector('#v-setting-shortcut-sidebar'), 'Alt+S');
    setupShortcutRecorder(panel.querySelector('#v-setting-shortcut-bento'), 'Alt+B');
    setupShortcutRecorder(panel.querySelector('#v-setting-shortcut-add-chat'), 'Alt+A');
    setupShortcutRecorder(panel.querySelector('#v-setting-shortcut-chat-options'), 'Alt+O');

    // Save
    panel.querySelector('#v-btn-save')?.addEventListener('click', () => {
      const selectedModel = panel.querySelector('#v-active-model')?.value || DEFAULT_MODEL;
      const isGroq = GROQ_MODELS.includes(selectedModel);
      const activeIdx = isGroq ? 1 : 0;

      state.settings.activeKeyIndex = activeIdx;

      [0, 1].forEach(i => {
        state.settings.apiKeys[i] = {
          key:      panel.querySelector(`#v-key-${i}`)?.value?.trim() || '',
          model:    i === activeIdx ? selectedModel : (state.settings.apiKeys[i]?.model || (i === 0 ? DEFAULT_MODEL : 'llama-3.3-70b-versatile')),
          provider: i === 0 ? 'gemini' : 'groq'
        };
      });

      // Save custom fields
      state.settings.themeColor = panel.querySelector('#v-setting-theme')?.value || 'teal-cyan';
      state.settings.uiLanguage = panel.querySelector('#v-setting-lang')?.value || 'vi';
      state.settings.shortcutTogglePanel = panel.querySelector('#v-setting-shortcut')?.value?.trim() || 'Alt+N';
      state.settings.shortcutSidebar = panel.querySelector('#v-setting-shortcut-sidebar')?.value?.trim() || 'Alt+S';
      state.settings.shortcutBento = panel.querySelector('#v-setting-shortcut-bento')?.value?.trim() || 'Alt+B';
      state.settings.shortcutAddChat = panel.querySelector('#v-setting-shortcut-add-chat')?.value?.trim() || 'Alt+A';
      state.settings.shortcutChatOptions = panel.querySelector('#v-setting-shortcut-chat-options')?.value?.trim() || 'Alt+O';

      applyTheme();
      saveState();

      // Dynamically rebuild UI to apply color, layout & translations hot reload!
      const oldBar = document.getElementById('v-bookmark-bar');
      const oldPanel = document.getElementById('v-right-panel');
      const isPanelOpen = rightPanelOpen;
      const activeTab = currentActiveTab || 'settings';

      if (oldBar) oldBar.remove();
      if (oldPanel) oldPanel.remove();

      injectBookmarkBar();
      injectRightPanel();

      if (isPanelOpen) {
        const newPanel = document.getElementById('v-right-panel');
        if (newPanel) {
          newPanel.classList.add('open');
          rightPanelOpen = true;
          const toggleBtn = document.getElementById('v-right-toggle');
          if (toggleBtn) toggleBtn.classList.add('panel-open');
          document.body.classList.add('v-right-open');
          switchTab(activeTab);
        }
      }

      showToast(t('toast_saved_config'));
    });

    // Test connection
    panel.querySelector('#v-btn-test')?.addEventListener('click', () => {
      const statusEl = panel.querySelector('#v-settings-status');
      if (!statusEl) return;

      const activeKey = state.settings.apiKeys[state.settings.activeKeyIndex || 0];
      if (!activeKey?.key) {
        statusEl.innerHTML = `<div class="v-status-badge error"><div class="v-status-dot"></div>${t('settings_status_no_key')}</div>`;
        return;
      }

      statusEl.innerHTML = `<div class="v-status-badge testing"><div class="v-status-dot"></div>${t('settings_status_testing')}</div>`;

      chrome.runtime.sendMessage({
        action: activeKey.provider === 'groq' ? 'callGroqAPI' : 'callGeminiAPI',
        apiKey: activeKey.key,
        model:  activeKey.model,
        prompt: 'Reply with "OK" only.'
      }, res => {
        if (chrome.runtime.lastError || !res?.success) {
          const err = chrome.runtime.lastError?.message || res?.error || 'Lỗi không xác định';
          statusEl.innerHTML = `<div class="v-status-badge error" title="${escapeHtml(err)}"><div class="v-status-dot"></div>${t('settings_status_test_fail')}</div>`;
        } else {
          statusEl.innerHTML = `<div class="v-status-badge success"><div class="v-status-dot"></div>${t('settings_status_test_success')}</div>`;
        }
      });
    });

    // Accordion Toggle
    const trigger = panel.querySelector('#v-adv-settings-trigger');
    const content = panel.querySelector('#v-adv-settings-content');
    const chevron = panel.querySelector('.v-accordion-chevron');

    if (trigger && content && chevron) {
      trigger.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'flex' : 'none';
        chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        trigger.classList.toggle('active', isHidden);
      });
    }
  };

  // ═══════════════════════════════════════════════════════════
  //   CANVAS MAXIMIZE (ported from v1, polished)
  // ═══════════════════════════════════════════════════════════
  const detectCanvasController = () => {
    if (!document.querySelector('.v-canvas-maximized')) {
      const ancestors = document.querySelectorAll('.v-canvas-ancestor');
      if (ancestors.length > 0) {
        ancestors.forEach(el => el.classList.remove('v-canvas-ancestor'));
      }
      if (document.body.classList.contains('v-has-maximized-canvas')) {
        document.body.classList.remove('v-has-maximized-canvas');
      }
    }

    const iframe = Array.from(document.querySelectorAll('iframe:not([id^="v-"]):not([data-v-canvas-bound])')).find(f => {
      // Rapid offset check before expensive style calculations to prevent layout thrashing
      if (f.offsetWidth <= 200 || f.offsetHeight <= 200) return false;
      const s = window.getComputedStyle(f);
      return s.display !== 'none' && s.visibility !== 'hidden';
    });
    if (!iframe) return;

    const parent = iframe.parentElement;
    if (!parent || iframe.dataset.vCanvasBound) return;
    iframe.dataset.vCanvasBound = 'true';

    if (window.getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

    const btn = document.createElement('button');
    btn.className = 'v-canvas-maximize-btn';
    btn.innerHTML = SVG.maximize;
    btn.title = 'Phóng to / Thu nhỏ';

    btn.addEventListener('click', e => {
      e.stopPropagation(); e.preventDefault();
      const isMax = iframe.classList.toggle('v-canvas-maximized');
      document.body.classList.toggle('v-has-maximized-canvas', isMax);

      if (isMax) {
        let p = iframe.parentElement;
        while (p && p !== document.documentElement) {
          p.classList.add('v-canvas-ancestor');
          p = p.parentElement;
        }
      } else {
        document.querySelectorAll('.v-canvas-ancestor').forEach(el => el.classList.remove('v-canvas-ancestor'));
      }

      btn.innerHTML = isMax ? SVG.minimize : SVG.maximize;
      showToast(isMax ? t('toast_canvas_max') : t('toast_canvas_min'));
    });

    parent.appendChild(btn);
  };



  // ═══════════════════════════════════════════════════════════
  //   OVERLOAD HANDLER
  // ═══════════════════════════════════════════════════════════
  const isRefusalText = (text) => REFUSAL_PATTERNS.some(p => p.test(text));

  const getConversationContext = () => {
    const turns = [];
    document.querySelectorAll('user-query, model-response').forEach(el => {
      const role = el.tagName === 'USER-QUERY' ? 'user' : 'gemini';
      const text = el.textContent.replace(/⭐/g, '').replace(/^(Bạn đã nói|You said):?\s*/i, '').trim();
      if (text.length > 20) turns.push({ role, text: text.slice(0, 800) });
    });
    return turns;
  };

  const buildContinuePrompt = (turns) => {
    const contextStr = turns.slice(-8).map(t =>
      `[${t.role === 'user' ? 'Người dùng' : 'Gemini'}]: ${t.text}`
    ).join('\n\n');

    return `Tôi đang tiếp tục một nhiệm vụ từ cuộc trò chuyện trước. Gemini đã từ chối hoàn thành task.

Lịch sử hội thoại gần nhất:
${contextStr}

Hãy tiếp tục nhiệm vụ từ đúng điểm bị gián đoạn. Đừng lặp lại những gì đã làm. Hãy thực hiện phần tiếp theo.`;
  };

  const buildContinuePromptWithAI = async (turns) => {
    const activeKey = state.settings.apiKeys[state.settings.activeKeyIndex || 0];
    if (!activeKey?.key) return buildContinuePrompt(turns);

    const contextStr = turns.slice(-6).map(t =>
      `[${t.role === 'user' ? 'User' : 'Gemini'}]: ${t.text}`
    ).join('\n\n');

    const analysisPrompt = `Analyze this conversation and create a concise "continue prompt" in Vietnamese.
The last Gemini response was a refusal. Extract the task that was interrupted and create a prompt to continue from the interruption point.

Conversation:
${contextStr}

Respond with ONLY the continue prompt in Vietnamese (max 400 words). Start directly with the task continuation request.`;

    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: activeKey.provider === 'groq' ? 'callGroqAPI' : 'callGeminiAPI',
        apiKey: activeKey.key,
        model:  activeKey.model,
        prompt: analysisPrompt
      }, res => {
        if (res?.success && res.result) {
          resolve(res.result);
        } else {
          resolve(buildContinuePrompt(turns));
        }
      });
    });
  };

  const injectOverloadCard = (responseEl) => {
    // Don't inject twice for same element
    if (responseEl.dataset.vOverloadShown) return;
    responseEl.dataset.vOverloadShown = 'true';

    const card = document.createElement('div');
    card.className = 'v-overload-card';
    card.innerHTML = `
      <div class="v-overload-header">
        <div class="v-overload-icon">⚡</div>
        <div class="v-overload-title">Vaxlou — Gemini bị quá tải</div>
        <button class="v-overload-dismiss" title="Đóng">${SVG.close}</button>
      </div>
      <div class="v-overload-desc">
        Gemini đã từ chối tiếp tục task. Vaxlou có thể phân tích context và chuyển sang chat mới để làm tiếp.
      </div>
      <div class="v-overload-actions">
        <button class="v-overload-btn primary" id="v-oh-auto">
          ${SVG.arrowRight} Tiếp tục tự động
        </button>
        <button class="v-overload-btn secondary" id="v-oh-copy">
          ${SVG.copy} Sao chép context
        </button>
      </div>
      <div class="v-overload-progress" id="v-oh-progress" style="display:none">
        <div class="v-overload-spinner"></div>
        <span id="v-oh-progress-text">Đang phân tích context...</span>
      </div>
    `;

    // Insert after the response element
    responseEl.insertAdjacentElement('afterend', card);

    card.querySelector('.v-overload-dismiss').addEventListener('click', () => card.remove());

    card.querySelector('#v-oh-copy').addEventListener('click', () => {
      const turns = getConversationContext();
      const prompt = buildContinuePrompt(turns);
      navigator.clipboard.writeText(prompt).then(() => {
        showToast('Đã sao chép context! Paste vào chat mới để tiếp tục.');
      }).catch(() => showToast('Không thể sao chép.', 'error'));
    });

    card.querySelector('#v-oh-auto').addEventListener('click', async () => {
      const autoBtn   = card.querySelector('#v-oh-auto');
      const copyBtn   = card.querySelector('#v-oh-copy');
      const progress  = card.querySelector('#v-oh-progress');
      const progText  = card.querySelector('#v-oh-progress-text');

      autoBtn.disabled = true;
      copyBtn.disabled = true;
      progress.style.display = 'flex';
      progText.textContent = 'Đang phân tích context...';

      try {
        const turns = getConversationContext();

        const hasApiKey = !!state.settings.apiKeys[state.settings.activeKeyIndex || 0]?.key;
        let continuePrompt;

        if (hasApiKey) {
          progText.textContent = 'Đang tạo prompt thông minh qua AI...';
          continuePrompt = await buildContinuePromptWithAI(turns);
        } else {
          continuePrompt = buildContinuePrompt(turns);
        }

        progText.textContent = 'Đang mở chat mới...';

        chrome.runtime.sendMessage({
          action: 'openNewChatWithPrompt',
          prompt: continuePrompt
        }, res => {
          if (res?.success) {
            showToast('Đã chuyển sang chat mới để tiếp tục! 🚀');
            card.remove();
          } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(continuePrompt).then(() => {
              showToast('Đã sao chép! Mở chat mới và dán vào.', 'error');
            });
            progress.style.display = 'none';
            autoBtn.disabled = false;
            copyBtn.disabled = false;
          }
        });
      } catch (err) {
        console.error('[Vaxlou] Overload handler error:', err);
        progress.style.display = 'none';
        autoBtn.disabled = false;
        copyBtn.disabled = false;
        showToast('Có lỗi xảy ra. Hãy thử sao chép context.', 'error');
      }
    });
  };

  const checkLatestResponseForRefusal = () => {
    const latest = document.querySelector('model-response:last-of-type');
    if (!latest) return;

    if (latest === lastRefusalCheckId) return;
    if (latest.dataset.vOverloadShown) return;

    // Wait a bit to ensure response is fully rendered
    const text = latest.textContent.trim();
    if (text.length < 20) return; // Still loading

    lastRefusalCheckId = latest;

    if (isRefusalText(text)) {
      setTimeout(() => injectOverloadCard(latest), 500);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //   INJECT PROMPT INTO NEW TAB (called by background.js message)
  // ═══════════════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectPrompt') {
      injectPromptIntoGemini(request.prompt);
      sendResponse({ success: true });
    }
  });

  const injectPromptIntoGemini = (prompt) => {
    // Try multiple selectors for Gemini's input textarea
    const tryInject = (attempts = 0) => {
      if (attempts > 20) return;

      const textarea = document.querySelector(
        'rich-textarea [contenteditable="true"], ' +
        'textarea[aria-label], ' +
        '[data-testid="text-input"], ' +
        'p[contenteditable="true"]'
      );

      if (!textarea) {
        setTimeout(() => tryInject(attempts + 1), 300);
        return;
      }

      // Focus and set content
      textarea.focus();
      textarea.innerHTML = '';

      // Simulate typing
      document.execCommand('insertText', false, prompt);

      // If execCommand didn't work, try direct setting
      if (!textarea.textContent.trim()) {
        textarea.textContent = prompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Show toast
      showToast(t('toast_insert_success'));
    };

    tryInject();
  };

  // ═══════════════════════════════════════════════════════════
  //   CHAT LIFECYCLE MONITOR
  // ═══════════════════════════════════════════════════════════
  const monitorChatLifecycle = () => {
    const newId = getCurrentChatId();

    if (newId !== currentChatId) {
      currentChatId = newId;
      lastRefusalCheckId = null;

      if (newId) {
        // Update metadata
        if (!state.chatMetadata[newId]) {
          state.chatMetadata[newId] = {
            id: newId,
            title: document.title || 'Đang tải...',
            href: window.location.pathname,
            createdAt: Date.now(),
            lastActive: Date.now()
          };
        } else {
          state.chatMetadata[newId].lastActive = Date.now();
        }
        saveState();
      }

      // Update right panel
      loadNoteContent();
      updateNotePlaceholder();

      // Re-render outline if open
      const outlineTab = document.getElementById('v-tab-outline');
      if (outlineTab?.classList.contains('active')) renderOutline();

      // Re-render condenser status if open
      const condenserTab = document.getElementById('v-tab-condenser');
      if (condenserTab?.classList.contains('active')) renderCondenserStatus();
    }

    // Continuous checks
    detectCanvasController();
    checkLatestResponseForRefusal();

    // Update folder panel active states (Bookmark Bar)
    renderBookmarkBar();

    // Sync toggle button icon
    updateSidebarToggleButtonIcon();

    // Update Bookmark Bar breadcrumbs
    updateBookmarkBarBreadcrumbs();
  };

  // ═══════════════════════════════════════════════════════════
  //   MUTATION OBSERVER — Watch Gemini DOM
  // ═══════════════════════════════════════════════════════════
  const setupObserver = () => {
    // Watch for new model-response elements (for overload detection)
    const responseObserver = new MutationObserver((mutations) => {
      // Ignore mutations originating from Vaxlou's own UI elements to prevent infinite rendering loop
      const isOurMutation = mutations.every(m => {
        const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (!target) return false;
        return target.closest && (
          target.closest('#v-right-panel') ||
          target.closest('#v-bookmark-bar') ||
          target.closest('#v-bb-global-dropdown') ||
          target.closest('.v-context-menu') ||
          target.closest('.v-toast')
        );
      });
      if (isOurMutation) return;

      // Debounce: clear previous timeout and schedule a new one
      clearTimeout(obsTimeout);
      obsTimeout = setTimeout(() => {
        obsTimeout = null;
        checkLatestResponseForRefusal();
        updateSidebarToggleButtonIcon();
        const outlineTab = document.getElementById('v-tab-outline');
        if (outlineTab?.classList.contains('active')) renderOutline();

        const condenserTab = document.getElementById('v-tab-condenser');
        if (condenserTab?.classList.contains('active')) renderCondenserStatus();
      }, 500); // 500ms debounce ensures it only renders once everything settles
    });

    const chatContainer = document.querySelector('chat-window, [class*="chat"], main') || document.body;
    responseObserver.observe(chatContainer, { childList: true, subtree: true });

    // Watch for sidebar changes (new chats appearing)
    const nav = document.querySelector('nav, [role="navigation"], aside');
    if (nav) {
      const navObserver = new MutationObserver(() => {
        if (roTimeout) return;
        roTimeout = setTimeout(() => {
          roTimeout = null;
          requestAnimationFrame(() => {
            renderBookmarkBar();
            updateSidebarToggleButtonIcon();
          });
        }, 250);
      });
      navObserver.observe(nav, { childList: true, subtree: false });
    }
  };

  // ═══════════════════════════════════════════════════════════
  //   INIT
  // ═══════════════════════════════════════════════════════════
  const init = async () => {
    await loadState();

    // Apply color theme dynamically on load
    applyTheme();

    // Inject UI panels
    injectBookmarkBar();
    injectRightPanel();

    // Global keyboard shortcuts to toggle Vaxlou Right Panel, tabs, and Sidebar
    document.addEventListener('keydown', e => {
      // 1. Avoid blocking standard typing when in text fields (unless Ctrl or Alt is held)
      const activeEl = document.activeElement;
      const isEditing = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      if (isEditing && !e.ctrlKey && !e.altKey) {
        return;
      }

      const isShortcutMatch = (shortcutStr) => {
        if (!shortcutStr) return false;
        const keys = shortcutStr.split('+').map(k => k.trim());
        const mainKey = keys.filter(k => !['ctrl', 'alt', 'shift', 'control'].includes(k.toLowerCase()))[0];
        if (!mainKey) return false;
        
        const hasCtrl = keys.some(k => k.toLowerCase() === 'ctrl' || k.toLowerCase() === 'control');
        if (hasCtrl && !e.ctrlKey) return false;
        if (!hasCtrl && e.ctrlKey) return false;
        
        const hasAlt = keys.some(k => k.toLowerCase() === 'alt');
        if (hasAlt && !e.altKey) return false;
        if (!hasAlt && e.altKey) return false;
        
        const hasShift = keys.some(k => k.toLowerCase() === 'shift');
        if (hasShift && !e.shiftKey) return false;
        if (!hasShift && e.shiftKey) return false;
        
        let eventKey = e.key;
        if (eventKey === ' ') eventKey = 'Space';
        return eventKey.toUpperCase() === mainKey.toUpperCase();
      };

      // Check all 5 shortcuts in sequence
      if (isShortcutMatch(state.settings.shortcutTogglePanel || 'Alt+N')) {
        e.preventDefault();
        e.stopPropagation();
        toggleRightPanel();
        return;
      }

      if (isShortcutMatch(state.settings.shortcutSidebar || 'Alt+S')) {
        e.preventDefault();
        e.stopPropagation();
        if (isNativeSidebarClosed()) {
          openNativeSidebar();
        } else {
          closeNativeSidebar();
        }
        setTimeout(updateSidebarToggleButtonIcon, 150);
        return;
      }

      if (isShortcutMatch(state.settings.shortcutBento || 'Alt+B')) {
        e.preventDefault();
        e.stopPropagation();
        const bentoBtn = document.getElementById('v-bb-logo-btn');
        if (bentoBtn) {
          bentoBtn.click();
        }
        return;
      }

      if (isShortcutMatch(state.settings.shortcutAddChat || 'Alt+A')) {
        e.preventDefault();
        e.stopPropagation();
        const addChatBtn = document.getElementById('v-bb-add-chat-btn');
        if (addChatBtn) {
          addChatBtn.click();
        }
        return;
      }

      if (isShortcutMatch(state.settings.shortcutChatOptions || 'Alt+O')) {
        e.preventDefault();
        e.stopPropagation();
        const chatOptionsBtn = document.getElementById('v-bb-chat-options-btn');
        if (chatOptionsBtn) {
          chatOptionsBtn.click();
        }
        return;
      }
    });

    // Initial lifecycle check
    monitorChatLifecycle();

    // Setup MutationObserver
    setupObserver();

    // Polling loop (fallback for SPA navigation detection)
    setInterval(() => {
      monitorChatLifecycle();

      // Ensure panels still exist (Gemini doesn't remove them, but just in case)
      if (!document.getElementById('v-bookmark-bar')) injectBookmarkBar();
      if (!document.getElementById('v-right-panel'))  injectRightPanel();
    }, 1500);
  };

  // Start
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
