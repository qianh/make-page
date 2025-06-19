import React from 'react';
import { Card, Select, Typography, Space } from 'antd';
import { GlobalOutlined, EditOutlined } from '@ant-design/icons';

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

function LanguageSelector({ selectedLanguage, selectedStyle, onLanguageChange, onStyleChange }) {
  return (
    <Card
      title={
        <Space>
          <GlobalOutlined style={{ color: '#007aff' }} />
          <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
            Language & Style
          </Title>
        </Space>
      }
      bordered={false}
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
      </Space>
    </Card>
  );
}

export default LanguageSelector;