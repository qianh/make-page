import React from 'react';
import { Tag, Typography, Space, Card, Tooltip } from 'antd';
import { TagsOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 根据重要性获取颜色
const getTagColor = (importance) => {
  if (importance >= 0.8) return 'red';
  if (importance >= 0.6) return 'orange';
  if (importance >= 0.4) return 'blue';
  if (importance >= 0.2) return 'green';
  return 'default';
};

// 根据重要性获取标签大小
const getTagSize = (importance) => {
  if (importance >= 0.8) return 'large';
  if (importance >= 0.5) return 'default';
  return 'small';
};


const KeywordTags = ({ keywords = [], loading = false, language = 'zh' }) => {
  if (!keywords || keywords.length === 0) {
    return (
      <Card 
        size="small" 
        style={{ 
          minHeight: '120px',
          background: 'var(--theme-surface, rgba(255,255,255,0.8))',
          border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          borderRadius: '12px'
        }}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '20px' }}>
          <TagsOutlined style={{ fontSize: '32px', color: '#ccc' }} />
          <Text type="secondary">
            {language === 'zh' ? '暂无关键词' : 'No keywords available'}
          </Text>
        </Space>
      </Card>
    );
  }


  // 按重要性排序关键词
  const sortedKeywords = keywords.sort((a, b) => b.importance - a.importance);

  return (
    <Card 
      size="small"
      title={
        <Space>
          <TagsOutlined style={{ color: 'var(--theme-primary, #007aff)' }} />
          <Title level={5} style={{ margin: 0, color: 'var(--theme-text)' }}>
            {language === 'zh' ? '关键词标签' : 'Keyword Tags'}
          </Title>
          <Text type="secondary">({keywords.length})</Text>
        </Space>
      }
      loading={loading}
      style={{ 
        background: 'var(--theme-surface, rgba(255,255,255,0.8))',
        border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
      styles={{
        header: { 
          borderBottom: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          padding: '12px 16px'
        },
        body: { padding: '16px' }
      }}
    >
      {/* 关键词标签展示 */}
      <div>
        <div style={{ marginBottom: '8px' }}></div>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          {sortedKeywords.map((keyword, index) => (
            <Tooltip 
              key={index}
              title={
                <div>
                  <div><strong>{language === 'zh' ? '分类' : 'Category'}:</strong> {keyword.category}</div>
                  <div><strong>{language === 'zh' ? '重要性' : 'Importance'}:</strong> {(keyword.importance * 100).toFixed(0)}%</div>
                </div>
              }
            >
              <Tag
                color={getTagColor(keyword.importance)}
                style={{
                  fontSize: getTagSize(keyword.importance) === 'large' ? '14px' : '12px',
                  padding: getTagSize(keyword.importance) === 'large' ? '4px 12px' : '2px 8px',
                  borderRadius: '20px',
                  fontWeight: keyword.importance >= 0.7 ? 'bold' : 'normal',
                  margin: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: `2px solid ${getTagColor(keyword.importance) === 'default' ? '#ddd' : 'transparent'}`,
                  transform: keyword.importance >= 0.8 ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = keyword.importance >= 0.8 ? 'scale(1.05)' : 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {keyword.keyword}
              </Tag>
            </Tooltip>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default KeywordTags;