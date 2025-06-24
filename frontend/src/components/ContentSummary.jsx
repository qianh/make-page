import React from 'react';
import { Card, Typography, Space, List, Tag, Tooltip, Button, Divider, Empty } from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  LinkOutlined, 
  MessageOutlined,
  BookOutlined,
  HighlightOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// 引用类型图标和颜色映射
const getReferenceIcon = (type) => {
  switch (type) {
    case 'quote': return <MessageOutlined style={{ color: '#1890ff' }} />;
    case 'paraphrase': return <HighlightOutlined style={{ color: '#52c41a' }} />;
    case 'summary': return <BookOutlined style={{ color: '#faad14' }} />;
    default: return <FileTextOutlined style={{ color: '#666' }} />;
  }
};

const getReferenceColor = (type) => {
  switch (type) {
    case 'quote': return '#1890ff';
    case 'paraphrase': return '#52c41a';
    case 'summary': return '#faad14';
    default: return '#666';
  }
};

const getReferenceTypeName = (type, language = 'zh') => {
  const names = {
    zh: {
      quote: '直接引用',
      paraphrase: '转述内容',
      summary: '内容摘要'
    },
    en: {
      quote: 'Direct Quote',
      paraphrase: 'Paraphrase',
      summary: 'Summary'
    }
  };
  return names[language]?.[type] || type;
};

// 引用项组件
const ReferenceItem = ({ reference, onJumpToSource, language = 'zh' }) => {
  const handleJumpToSource = () => {
    if (onJumpToSource) {
      onJumpToSource(reference.source_block_index, reference.start_position, reference.end_position);
    }
  };

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${getReferenceColor(reference.reference_type)}20`,
      background: `${getReferenceColor(reference.reference_type)}08`,
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ marginTop: '2px' }}>
          {getReferenceIcon(reference.reference_type)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Tag 
              size="small" 
              color={getReferenceColor(reference.reference_type)}
              style={{ margin: 0 }}
            >
              {getReferenceTypeName(reference.reference_type, language)}
            </Tag>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {language === 'zh' ? '来源' : 'Source'}: {language === 'zh' ? '块' : 'Block'} {reference.source_block_index + 1}
            </Text>
            {reference.start_position !== undefined && reference.end_position !== undefined && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                [{reference.start_position}-{reference.end_position}]
              </Text>
            )}
          </div>
          <Paragraph 
            style={{ 
              margin: 0, 
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'var(--theme-text)'
            }}
          >
            {reference.source_text}
          </Paragraph>
          {onJumpToSource && (
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={handleJumpToSource}
              style={{
                padding: '0',
                height: 'auto',
                fontSize: '11px',
                marginTop: '4px'
              }}
            >
              {language === 'zh' ? '跳转到原文' : 'Jump to Source'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// 关键要点组件
const KeyPointsList = ({ keyPoints = [] }) => (
  <List
    size="small"
    dataSource={keyPoints}
    renderItem={(point, index) => (
      <List.Item style={{ padding: '8px 0', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
          <CheckCircleOutlined 
            style={{ 
              color: 'var(--theme-primary, #007aff)', 
              marginTop: '2px',
              fontSize: '14px'
            }} 
          />
          <Text style={{ 
            flex: 1, 
            lineHeight: '1.5',
            color: 'var(--theme-text)'
          }}>
            {point}
          </Text>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '11px',
              backgroundColor: 'var(--theme-background, rgba(248,248,249,0.5))',
              padding: '2px 6px',
              borderRadius: '4px',
              marginLeft: '8px'
            }}
          >
            {index + 1}
          </Text>
        </div>
      </List.Item>
    )}
  />
);

const ContentSummary = ({ 
  summaryData = null, 
  loading = false, 
  language = 'zh',
  onJumpToSource = null 
}) => {
  if (!summaryData) {
    return (
      <Card 
        size="small"
        style={{ 
          minHeight: '300px',
          background: 'var(--theme-surface, rgba(255,255,255,0.8))',
          border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          borderRadius: '12px'
        }}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
          <Text type="secondary">
            {language === 'zh' ? '暂无内容概要' : 'No content summary available'}
          </Text>
        </Space>
      </Card>
    );
  }

  const { title, summary, key_points = [], references = [] } = summaryData;

  return (
    <Card 
      size="small"
      title={
        <Space>
          <FileTextOutlined style={{ color: 'var(--theme-primary, #007aff)' }} />
          <Title level={5} style={{ margin: 0, color: 'var(--theme-text)' }}>
            {language === 'zh' ? '内容概要' : 'Content Summary'}
          </Title>
          <Text type="secondary">
            ({key_points.length} {language === 'zh' ? '要点' : 'points'}, {references.length} {language === 'zh' ? '引用' : 'references'})
          </Text>
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
      {/* 内容标题 */}
      <div style={{ marginBottom: '20px' }}>
        <Title 
          level={4} 
          style={{ 
            margin: 0,
            color: 'var(--theme-text)',
            textAlign: 'center',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, var(--theme-primary, #007aff)15, var(--theme-accent, #34c759)15)',
            borderRadius: '12px',
            border: '2px solid var(--theme-primary, #007aff)30'
          }}
        >
          {title}
        </Title>
      </div>

      {/* 核心摘要 */}
      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ 
          color: 'var(--theme-text)', 
          marginBottom: '8px', 
          display: 'block',
          fontSize: '14px'
        }}>
          {language === 'zh' ? '核心摘要' : 'Core Summary'}
        </Text>
        <div style={{
          padding: '16px',
          background: 'var(--theme-background, rgba(248,248,249,0.5))',
          borderRadius: '8px',
          border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          borderLeft: '4px solid var(--theme-primary, #007aff)'
        }}>
          <Paragraph 
            style={{ 
              margin: 0,
              lineHeight: '1.6',
              color: 'var(--theme-text)',
              fontSize: '14px'
            }}
          >
            {summary}
          </Paragraph>
        </div>
      </div>

      {/* 关键要点 */}
      {key_points.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <Text strong style={{ 
            color: 'var(--theme-text)', 
            marginBottom: '12px', 
            display: 'block',
            fontSize: '14px'
          }}>
            {language === 'zh' ? '关键要点' : 'Key Points'} ({key_points.length})
          </Text>
          <div style={{
            padding: '12px',
            background: 'var(--theme-surface, rgba(255,255,255,0.8))',
            borderRadius: '8px',
            border: '1px solid var(--theme-border, rgba(0,0,0,0.06))'
          }}>
            <KeyPointsList keyPoints={key_points} language={language} />
          </div>
        </div>
      )}

      {/* 引用内容 */}
      {references.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Text strong style={{ 
              color: 'var(--theme-text)',
              fontSize: '14px'
            }}>
              {language === 'zh' ? '引用内容' : 'References'} ({references.length})
            </Text>
            <Divider type="vertical" />
            <Space size="small">
              <Tag size="small" color="#1890ff">{getReferenceTypeName('quote', language)}</Tag>
              <Tag size="small" color="#52c41a">{getReferenceTypeName('paraphrase', language)}</Tag>
              <Tag size="small" color="#faad14">{getReferenceTypeName('summary', language)}</Tag>
            </Space>
          </div>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '8px',
            background: 'var(--theme-background, rgba(248,248,249,0.3))',
            borderRadius: '8px',
            border: '1px solid var(--theme-border, rgba(0,0,0,0.06))'
          }}>
            {references.map((reference, index) => (
              <ReferenceItem
                key={index}
                reference={reference}
                onJumpToSource={onJumpToSource}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ContentSummary;