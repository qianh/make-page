import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// 翻译字典
const translations = {
  zh: {
    // 页面标题和描述
    appTitle: 'AI 内容编织器',
    appDescription: '一个智能的内容融合平台，将您的想法编织成精美的文章',
    
    // 按钮
    addText: '添加文本',
    addCode: '添加代码',
    addImage: '添加图片',
    importObsidian: 'Obsidian',
    generateArticle: '✨ 编织文章!',
    generating: '🧠 编织中...',
    settings: '设置',
    
    // 模态框标题
    addTextBlock: '添加文本块',
    addCodeBlock: '添加代码块',
    addImageBlock: '添加图片块',
    obsidianImporter: 'Obsidian 导入器',
    themeSettings: '主题设置',
    
    // 表单标签
    content: '内容',
    codeLanguage: '代码语言',
    imageUrl: '图片URL',
    description: '描述',
    optional: '可选',
    
    // LLM选择器
    configureAiModel: '配置AI模型',
    provider: '提供商',
    selectLlmProvider: '选择大语言模型提供商',
    selectModel: '选择模型',
    loadingAiModels: '加载AI模型中...',
    loadingError: '加载错误',
    failedToLoadModels: '加载AI模型失败。请检查连接或稍后重试。',
    noModelsAvailable: '无可用模型',
    noModelsFetched: '无法获取AI模型。请检查配置或重试。',
    capabilities: '能力',
    supportsImages: '支持图片',
    maxInputTokens: '最大输入令牌',
    note: '注意',
    warning: '警告',
    imageWarning: '您已添加图片，但 \'{modelName}\' 不支持图片输入。图片可能被忽略或导致错误。',
    yes: '是',
    no: '否',
    
    // 语言选择器
    outputLanguage: '输出语言',
    
    // 写作风格
    writingStyle: '写作风格',
    styles: {
      formal: '正式',
      casual: '随意',
      academic: '学术',
      conversational: '对话',
      professional: '专业',
      creative: '创意',
      technical: '技术',
      journalistic: '新闻'
    },
    
    // HTML样式
    htmlStyle: 'HTML样式',
    htmlStyles: {
      minimal: '简约',
      modern: '现代',
      classic: '经典',
      elegant: '优雅',
      vibrant: '活力',
      dark: '深色',
      newspaper: '报纸',
      magazine: '杂志'
    },
    
    // 字数范围
    wordCount: '字数范围',
    wordCountRanges: {
      short: '短文 (300-600)',
      medium: '中文 (600-1200)',
      long: '长文 (1200-2500)',
      custom: '自定义'
    },
    customRange: '自定义范围',
    minWords: '最少字数',
    maxWords: '最多字数',
    
    // 融合度
    fusionDegree: '内容融合度',
    fusionDegrees: {
      low: '低 - 保持独立',
      medium: '中 - 适度融合',
      high: '高 - 深度融合'
    },
    
    // SVG增强
    enableSvgOutput: '启用SVG增强输出',
    svgOutputDesc: '在生成的内容中包含SVG图形和高级HTML样式',
    
    // 错误和状态消息
    noBlocks: '还没有内容块',
    noBlocksDesc: '点击上方按钮添加文本、代码或图片块开始创作',
    generationError: '生成失败',
    generationSuccess: '文章生成成功!',
    tryAgain: '请重试',
    invalidLlmSelection: '请选择有效的语言模型',
    
    // 通用
    cancel: '取消',
    confirm: '确认',
    add: '添加',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    close: '关闭',
    
    // 主题
    theme: '主题',
    themes: {
      default: '默认',
      dark: '深色',
      blue: '蓝色',
      green: '绿色',
      purple: '紫色',
      orange: '橙色'
    },
    
    // Obsidian导入
    selectVaultPath: '选择Vault路径',
    importFiles: '导入文件',
    
    // 语言切换
    language: '语言',
    chinese: '中文',
    english: 'English'
  },
  
  en: {
    // Page title and description
    appTitle: 'AI Content Weaver',
    appDescription: 'An intelligent content fusion platform that weaves your ideas into beautiful articles',
    
    // Buttons
    addText: 'Add Text',
    addCode: 'Add Code', 
    addImage: 'Add Image',
    importObsidian: 'Obsidian',
    generateArticle: '✨ Weave Article!',
    generating: '🧠 Weaving...',
    settings: 'Settings',
    
    // Modal titles
    addTextBlock: 'Add Text Block',
    addCodeBlock: 'Add Code Block',
    addImageBlock: 'Add Image Block',
    obsidianImporter: 'Obsidian Importer',
    themeSettings: 'Theme Settings',
    
    // Form labels
    content: 'Content',
    codeLanguage: 'Code Language',
    imageUrl: 'Image URL',
    description: 'Description',
    optional: 'Optional',
    
    // LLM selector
    configureAiModel: 'Configure AI Model',
    provider: 'Provider',
    selectLlmProvider: 'Select LLM Provider',
    selectModel: 'Select Model',
    loadingAiModels: 'Loading AI Models...',
    loadingError: 'Loading Error',
    failedToLoadModels: 'Failed to load AI models. Please check your connection or try again later.',
    noModelsAvailable: 'No Models Available',
    noModelsFetched: 'No AI models could be fetched. Please check configuration or try again.',
    capabilities: 'Capabilities',
    supportsImages: 'Supports Images',
    maxInputTokens: 'Max Input Tokens',
    note: 'Note',
    warning: 'Warning',
    imageWarning: 'You have added images, but \'{modelName}\' does not support image input. Images may be ignored or cause errors.',
    yes: 'Yes',
    no: 'No',
    
    // Language selector
    outputLanguage: 'Output Language',
    
    // Writing styles
    writingStyle: 'Writing Style',
    styles: {
      formal: 'Formal',
      casual: 'Casual',
      academic: 'Academic',
      conversational: 'Conversational',
      professional: 'Professional',
      creative: 'Creative',
      technical: 'Technical',
      journalistic: 'Journalistic'
    },
    
    // HTML styles
    htmlStyle: 'HTML Style',
    htmlStyles: {
      minimal: 'Minimal',
      modern: 'Modern',
      classic: 'Classic',
      elegant: 'Elegant',
      vibrant: 'Vibrant',
      dark: 'Dark',
      newspaper: 'Newspaper',
      magazine: 'Magazine'
    },
    
    // Word count
    wordCount: 'Word Count',
    wordCountRanges: {
      short: 'Short (300-600)',
      medium: 'Medium (600-1200)',
      long: 'Long (1200-2500)',
      custom: 'Custom'
    },
    customRange: 'Custom Range',
    minWords: 'Min Words',
    maxWords: 'Max Words',
    
    // Fusion degree
    fusionDegree: 'Content Fusion Degree',
    fusionDegrees: {
      low: 'Low - Keep Independent',
      medium: 'Medium - Moderate Fusion',
      high: 'High - Deep Integration'
    },
    
    // SVG enhancement
    enableSvgOutput: 'Enable SVG Enhanced Output',
    svgOutputDesc: 'Include SVG graphics and advanced HTML styling in generated content',
    
    // Error and status messages
    noBlocks: 'No content blocks yet',
    noBlocksDesc: 'Click the buttons above to add text, code, or image blocks to start creating',
    generationError: 'Generation failed',
    generationSuccess: 'Article generated successfully!',
    tryAgain: 'Please try again',
    invalidLlmSelection: 'Please select a valid language model',
    
    // Common
    cancel: 'Cancel',
    confirm: 'Confirm',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    close: 'Close',
    
    // Themes
    theme: 'Theme',
    themes: {
      default: 'Default',
      dark: 'Dark',
      blue: 'Blue',
      green: 'Green',
      purple: 'Purple',
      orange: 'Orange'
    },
    
    // Obsidian import
    selectVaultPath: 'Select Vault Path',
    importFiles: 'Import Files',
    
    // Language switch
    language: 'Language',
    chinese: '中文',
    english: 'English'
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('zh'); // 默认中文

  // 从localStorage加载语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // 保存语言设置到localStorage
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
      localStorage.setItem('preferred-language', lang);
    }
  };

  // 翻译函数
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // 如果找不到翻译，尝试英文版本
        value = translations.en;
        for (const k of keys) {
          if (value && typeof value === 'object') {
            value = value[k];
          } else {
            return key; // 如果都找不到，返回key本身
          }
        }
        break;
      }
    }
    
    let result = value || key;
    
    // 处理参数插值
    if (typeof result === 'string' && params) {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        result = result.replace(new RegExp(placeholder, 'g'), params[paramKey]);
      });
    }
    
    return result;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};