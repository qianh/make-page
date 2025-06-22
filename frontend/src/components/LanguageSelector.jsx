import React, { useState, useEffect } from 'react';
import { Card, Select, Typography, Space, InputNumber, Button, Tooltip, Collapse } from 'antd';
import { GlobalOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' }
];

const LANGUAGE_STYLES = [
  { code: 'formal', name: 'Formal' },
  { code: 'casual', name: 'Casual' },
  { code: 'academic', name: 'Academic' },
  { code: 'conversational', name: 'Conversational' },
  { code: 'professional', name: 'Professional' },
  { code: 'creative', name: 'Creative' },
  { code: 'technical', name: 'Technical' },
  { code: 'journalistic', name: 'Journalistic' }
];

const HTML_STYLES = [
  { code: 'modern', name: 'Modern Minimal', description: 'Clean, minimalist design with subtle shadows' },
  { code: 'classic', name: 'Classic Article', description: 'Traditional newspaper-style layout' },
  { code: 'magazine', name: 'Magazine Style', description: 'Rich colors and typography like a magazine' },
  { code: 'tech', name: 'Tech Blog', description: 'Developer-friendly with syntax highlighting' },
  { code: 'academic', name: 'Academic Paper', description: 'Formal academic document style' },
  { code: 'creative', name: 'Creative Portfolio', description: 'Artistic and visually striking' }
];

const WORD_COUNT_PRESETS = [
  { name: 'Short', min: 200, max: 500 },
  { name: 'Medium', min: 500, max: 1000 },
  { name: 'Long', min: 1000, max: 2000 },
  { name: 'Extra Long', min: 2000, max: 4000 }
];

function LanguageSelector({ 
  selectedLanguage, 
  selectedStyle, 
  onLanguageChange, 
  onStyleChange,
  wordCountRange,
  onWordCountChange,
  selectedHtmlStyle,
  onHtmlStyleChange
}) {
  const [customRange, setCustomRange] = useState({ min: '', max: '' });

  // Initialize customRange when wordCountRange changes
  useEffect(() => {
    if (wordCountRange?.min && wordCountRange?.max) {
      setCustomRange({ 
        min: wordCountRange.min.toString(), 
        max: wordCountRange.max.toString() 
      });
    }
  }, [wordCountRange]);

  const handlePresetClick = (preset) => {
    const newRange = { min: preset.min, max: preset.max };
    setCustomRange({ min: preset.min.toString(), max: preset.max.toString() });
    onWordCountChange(newRange);
  };

  const handleCustomRangeChange = (field, value) => {
    const newCustomRange = { ...customRange, [field]: value?.toString() || '' };
    setCustomRange(newCustomRange);
    
    const min = parseInt(newCustomRange.min) || null;
    const max = parseInt(newCustomRange.max) || null;
    
    // Only update if both values are valid or if clearing
    if ((min && max && min <= max) || (!newCustomRange.min && !newCustomRange.max)) {
      onWordCountChange({ min, max });
    }
  };
  const outputPreferenceItems = [
    {
      key: '1',
      label: (
        <Space>
          <GlobalOutlined style={{ color: 'var(--theme-primary)' }} />
          <Title level={4} style={{ margin: 0, fontWeight: 600, color: 'var(--theme-text)' }}>
            Output Preferences
          </Title>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ marginBottom: 8, display: 'block', color: 'var(--theme-text)' }}>
              Output Language
            </Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select language"
              value={selectedLanguage}
              onChange={onLanguageChange}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {LANGUAGES.map(lang => (
                <Option key={lang.code} value={lang.code}>
                  {lang.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Typography.Text strong style={{ marginBottom: 8, display: 'block', color: 'var(--theme-text)' }}>
              Writing Style
            </Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select writing style"
              value={selectedStyle}
              onChange={onStyleChange}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {LANGUAGE_STYLES.map(style => (
                <Option key={style.code} value={style.code}>
                  {style.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Typography.Text strong style={{ marginBottom: 8, display: 'block', color: 'var(--theme-text)' }}>
              HTML Display Style
            </Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select HTML style"
              value={selectedHtmlStyle}
              onChange={onHtmlStyleChange}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              options={HTML_STYLES.map(style => ({
                value: style.code,
                label: style.name,
                title: style.description
              }))}
              optionRender={(option) => (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ fontWeight: 500, lineHeight: '1.2', color: 'var(--theme-text)' }}>
                    {option.label}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--theme-textSecondary)', 
                    marginTop: '2px',
                    lineHeight: '1.3',
                    whiteSpace: 'normal'
                  }}>
                    {option.title}
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            <Typography.Text strong style={{ marginBottom: 8, display: 'block', color: 'var(--theme-text)' }}>
              Word Count Range
            </Typography.Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                {WORD_COUNT_PRESETS.map(preset => (
                  <Button
                    key={preset.name}
                    size="small"
                    type={
                      wordCountRange?.min === preset.min && wordCountRange?.max === preset.max 
                        ? 'primary' 
                        : 'default'
                    }
                    onClick={() => handlePresetClick(preset)}
                    style={{ borderRadius: 8 }}
                  >
                    {preset.name} ({preset.min}-{preset.max})
                  </Button>
                ))}
              </Space>
              <Space.Compact style={{ width: '100%' }}>
                <Tooltip title="Minimum word count">
                  <InputNumber
                    placeholder="Min"
                    value={customRange.min}
                    onChange={(value) => handleCustomRangeChange('min', value)}
                    min={1}
                    max={10000}
                    style={{ width: '50%' }}
                  />
                </Tooltip>
                <Tooltip title="Maximum word count">
                  <InputNumber
                    placeholder="Max"
                    value={customRange.max}
                    onChange={(value) => handleCustomRangeChange('max', value)}
                    min={1}
                    max={10000}
                    style={{ width: '50%' }}
                  />
                </Tooltip>
              </Space.Compact>
            </Space>
          </div>
        </Space>
      ),
    },
  ];

  return (
    <Collapse 
      items={outputPreferenceItems}
      defaultActiveKey={['1']} // Default expanded
      size="large"
      style={{ 
        borderRadius: 'var(--theme-borderRadius, 16px)', 
        boxShadow: 'var(--theme-shadow, 0 12px 28px rgba(0,0,0,0.06))',
        marginBottom: 24,
        background: 'var(--theme-surface, rgba(255,255,255,0.8))',
        backdropFilter: 'var(--theme-backdrop, blur(10px))',
        border: 'none'
      }}
    />
  );
}

export default LanguageSelector;