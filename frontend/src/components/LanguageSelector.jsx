import React, { useState } from 'react';
import { Card, Select, Typography, Space, InputNumber, Button, Tooltip } from 'antd';
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
  onWordCountChange
}) {
  const [customRange, setCustomRange] = useState({ min: '', max: '' });

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
  return (
    <Card
      title={
        <Space>
          <GlobalOutlined style={{ color: '#007aff' }} />
          <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
            Output Preferences
          </Title>
        </Space>
      }
      variant="borderless"
      style={{ 
        borderRadius: 16, 
        boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
        marginBottom: 24
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
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
          <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
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
          <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
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
    </Card>
  );
}

export default LanguageSelector;