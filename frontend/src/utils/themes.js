// 主题配置系统
export const themes = {
  // 默认主题 - 现代简约
  default: {
    id: 'default',
    name: '现代简约',
    description: '清新简洁的现代设计风格',
    colors: {
      primary: '#007aff',
      primaryHover: '#0051d5',
      secondary: '#8e8e93',
      background: '#f8f8f9',
      surface: 'rgba(255,255,255,0.8)',
      surfaceHover: 'rgba(255,255,255,0.9)',
      text: '#1d1d1f',
      textSecondary: 'rgba(0,0,0,0.6)',
      border: 'rgba(0,0,0,0.06)',
      borderHover: 'rgba(0,0,0,0.12)',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      accent: '#667eea',
      accentSecondary: '#764ba2'
    },
    effects: {
      backdrop: 'blur(10px)',
      shadow: '0 12px 28px rgba(0,0,0,0.06)',
      shadowHover: '0 16px 32px rgba(0,0,0,0.12)',
      borderRadius: '16px',
      borderRadiusSmall: '8px'
    }
  },

  // 深空主题 - 深蓝配色
  deepSpace: {
    id: 'deepSpace',
    name: '深空探索',
    description: '神秘深邃的深空色彩',
    colors: {
      primary: '#4f46e5',
      primaryHover: '#3730a3',
      secondary: '#6b7280',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      surface: 'rgba(30, 27, 75, 0.85)',
      surfaceHover: 'rgba(30, 27, 75, 0.95)',
      text: '#f8fafc',
      textSecondary: 'rgba(248, 250, 252, 0.7)',
      border: 'rgba(139, 92, 246, 0.2)',
      borderHover: 'rgba(139, 92, 246, 0.4)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      accent: '#8b5cf6',
      accentSecondary: '#a855f7'
    },
    effects: {
      backdrop: 'blur(15px)',
      shadow: '0 25px 50px rgba(79, 70, 229, 0.25)',
      shadowHover: '0 35px 60px rgba(79, 70, 229, 0.35)',
      borderRadius: '20px',
      borderRadiusSmall: '12px'
    }
  },

  // 渐变幻彩主题
  gradient: {
    id: 'gradient',
    name: '渐变幻彩',
    description: '炫彩渐变的视觉盛宴',
    colors: {
      primary: '#ff6b6b',
      primaryHover: '#ee5a52',
      secondary: '#6c5ce7',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      surface: 'rgba(255, 255, 255, 0.15)',
      surfaceHover: 'rgba(255, 255, 255, 0.25)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(255, 255, 255, 0.2)',
      borderHover: 'rgba(255, 255, 255, 0.4)',
      success: '#00b894',
      warning: '#fdcb6e',
      error: '#e17055',
      accent: '#ff7675',
      accentSecondary: '#74b9ff'
    },
    effects: {
      backdrop: 'blur(20px)',
      shadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
      shadowHover: '0 30px 50px rgba(102, 126, 234, 0.4)',
      borderRadius: '24px',
      borderRadiusSmall: '16px'
    }
  },

  // 自然绿意主题
  nature: {
    id: 'nature',
    name: '自然绿意',
    description: '清新自然的绿色主题',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      secondary: '#6b7280',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 25%, #a7f3d0 50%, #ecfdf5 100%)',
      surface: 'rgba(255, 255, 255, 0.9)',
      surfaceHover: 'rgba(255, 255, 255, 1)',
      text: '#064e3b',
      textSecondary: 'rgba(6, 78, 59, 0.7)',
      border: 'rgba(5, 150, 105, 0.15)',
      borderHover: 'rgba(5, 150, 105, 0.25)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      accent: '#34d399',
      accentSecondary: '#6ee7b7'
    },
    effects: {
      backdrop: 'blur(12px)',
      shadow: '0 15px 30px rgba(5, 150, 105, 0.15)',
      shadowHover: '0 20px 40px rgba(5, 150, 105, 0.25)',
      borderRadius: '18px',
      borderRadiusSmall: '10px'
    }
  },

  // 暗夜模式主题
  dark: {
    id: 'dark',
    name: '暗夜模式',
    description: '护眼的深色主题',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#6b7280',
      background: '#0f0f23',
      surface: 'rgba(30, 30, 30, 0.9)',
      surfaceHover: 'rgba(40, 40, 40, 0.95)',
      text: '#f1f5f9',
      textSecondary: 'rgba(241, 245, 249, 0.7)',
      border: 'rgba(59, 130, 246, 0.2)',
      borderHover: 'rgba(59, 130, 246, 0.3)',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      accent: '#8b5cf6',
      accentSecondary: '#a78bfa'
    },
    effects: {
      backdrop: 'blur(10px)',
      shadow: '0 20px 25px rgba(0, 0, 0, 0.5)',
      shadowHover: '0 25px 35px rgba(0, 0, 0, 0.6)',
      borderRadius: '16px',
      borderRadiusSmall: '8px'
    }
  },

  // 樱花粉主题
  sakura: {
    id: 'sakura',
    name: '樱花季节',
    description: '温柔浪漫的樱花粉主题',
    colors: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      secondary: '#9ca3af',
      background: 'linear-gradient(135deg, #fef7f0 0%, #fce7e7 25%, #fdf2f8 50%, #fff1f2 100%)',
      surface: 'rgba(255, 255, 255, 0.8)',
      surfaceHover: 'rgba(255, 255, 255, 0.95)',
      text: '#881337',
      textSecondary: 'rgba(136, 19, 55, 0.7)',
      border: 'rgba(236, 72, 153, 0.15)',
      borderHover: 'rgba(236, 72, 153, 0.25)',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      accent: '#f472b6',
      accentSecondary: '#fb7185'
    },
    effects: {
      backdrop: 'blur(15px)',
      shadow: '0 15px 35px rgba(236, 72, 153, 0.2)',
      shadowHover: '0 20px 40px rgba(236, 72, 153, 0.3)',
      borderRadius: '20px',
      borderRadiusSmall: '12px'
    }
  }
};

// 应用主题到CSS变量
export const applyTheme = (theme) => {
  const root = document.documentElement;
  
  // 应用颜色变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
  
  // 应用效果变量
  Object.entries(theme.effects).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
  
  // 设置body背景
  document.body.style.background = theme.colors.background;
};

// 获取主题列表
export const getThemeList = () => {
  return Object.values(themes);
};

// 根据ID获取主题
export const getThemeById = (id) => {
  return themes[id] || themes.default;
};

// 保存主题偏好到localStorage
export const saveThemePreference = (themeId) => {
  localStorage.setItem('preferred-theme', themeId);
};

// 从localStorage加载主题偏好
export const loadThemePreference = () => {
  return localStorage.getItem('preferred-theme') || 'default';
};