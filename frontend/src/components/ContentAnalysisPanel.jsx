import React, { useState, useCallback } from 'react';
import { Card, Typography, Space, Button, Row, Col, message, Alert, Spin, Tabs, Empty } from 'antd';
import { 
  ExperimentOutlined, 
  BulbOutlined, 
  ReloadOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import KeywordTags from './KeywordTags';
import MindMap from './MindMap';
import ContentSummary from './ContentSummary';

const { Title, Text } = Typography;

const ContentAnalysisPanel = ({ 
  contentBlocks = [], 
  language = 'zh',
  onJumpToSource = null 
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('keywords');

  // 执行内容分析
  const handleAnalyzeContent = useCallback(async () => {
    if (!contentBlocks || contentBlocks.length === 0) {
      message.warning(language === 'zh' ? '请先添加内容块再进行分析' : 'Please add content blocks before analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const requestPayload = {
        user_input: {
          blocks: contentBlocks.map((block) => {
            const { id: _id, ...blockData } = block;
            return blockData;
          })
        },
        analysis_types: ['keywords', 'mindmap', 'summary'],
        language: language
      };

      const response = await fetch('/api/v1/content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to analyze content. The server returned an unexpected response."
        }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisData(data);
      message.success(language === 'zh' ? '内容分析完成！' : 'Content analysis completed!');
      
    } catch (error) {
      console.error('Content analysis error:', error);
      setError(error.message);
      message.error(`${language === 'zh' ? '分析失败' : 'Analysis failed'}: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [contentBlocks, language]);

  // 清除分析结果
  const handleClearAnalysis = useCallback(() => {
    setAnalysisData(null);
    setError(null);
    setActiveTab('keywords');
  }, []);

  // 获取内容块统计
  const getContentStats = () => {
    const stats = { text: 0, code: 0, image: 0, total: 0 };
    contentBlocks.forEach(block => {
      if (Object.prototype.hasOwnProperty.call(stats, block.type)) {
        stats[block.type]++;
      }
      stats.total++;
    });
    return stats;
  };

  const contentStats = getContentStats();

  // 标签页配置
  const tabItems = [
    {
      key: 'keywords',
      label: (
        <Space>
          <BulbOutlined />
          {language === 'zh' ? '关键词' : 'Keywords'}
          {analysisData?.keywords && (
            <Text type="secondary">({analysisData.keywords.length})</Text>
          )}
        </Space>
      ),
      children: (
        <KeywordTags 
          keywords={analysisData?.keywords} 
          loading={isAnalyzing && activeTab === 'keywords'}
          language={language}
        />
      )
    },
    {
      key: 'mindmap',
      label: (
        <Space>
          <ExperimentOutlined />
          {language === 'zh' ? '思维导图' : 'Mind Map'}
          {analysisData?.mindmap && (
            <Text type="secondary">({analysisData.mindmap.length})</Text>
          )}
        </Space>
      ),
      children: (
        <MindMap 
          mindmapData={analysisData?.mindmap} 
          loading={isAnalyzing && activeTab === 'mindmap'}
          language={language}
        />
      )
    },
    {
      key: 'summary',
      label: (
        <Space>
          <EyeOutlined />
          {language === 'zh' ? '内容概要' : 'Summary'}
          {analysisData?.summary && (
            <Text type="secondary">
              ({analysisData.summary.key_points?.length || 0} {language === 'zh' ? '要点' : 'points'})
            </Text>
          )}
        </Space>
      ),
      children: (
        <ContentSummary 
          summaryData={analysisData?.summary} 
          loading={isAnalyzing && activeTab === 'summary'}
          language={language}
          onJumpToSource={onJumpToSource}
        />
      )
    }
  ];

  return (
    <Card 
      size="small"
      title={
        <Space>
          <ExperimentOutlined style={{ color: 'var(--theme-primary, #007aff)' }} />
          <Title level={4} style={{ margin: 0, color: 'var(--theme-text)' }}>
            {language === 'zh' ? 'AI 内容分析' : 'AI Content Analysis'}
          </Title>
        </Space>
      }
      style={{ 
        background: 'var(--theme-surface, rgba(255,255,255,0.8))',
        border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}
      styles={{
        header: { 
          borderBottom: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          padding: '16px 20px'
        },
        body: { padding: '20px' }
      }}
      extra={
        <Space>
          {contentStats.total > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {contentStats.total} {language === 'zh' ? '个内容块' : 'blocks'} 
              ({contentStats.text} {language === 'zh' ? '文本' : 'text'}, {contentStats.code} {language === 'zh' ? '代码' : 'code'}, {contentStats.image} {language === 'zh' ? '图片' : 'image'})
            </Text>
          )}
          {analysisData && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleClearAnalysis}
              type="text"
            >
              {language === 'zh' ? '清除' : 'Clear'}
            </Button>
          )}
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            onClick={handleAnalyzeContent}
            loading={isAnalyzing}
            disabled={contentStats.total === 0}
            style={{
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--theme-primary, #007aff) 0%, var(--theme-accent, #34c759) 100%)',
              border: 'none'
            }}
          >
            {isAnalyzing 
              ? (language === 'zh' ? '分析中...' : 'Analyzing...') 
              : (language === 'zh' ? '开始分析' : 'Analyze Content')
            }
          </Button>
        </Space>
      }
    >
      {/* 错误提示 */}
      {error && (
        <Alert
          message={language === 'zh' ? '分析失败' : 'Analysis Failed'}
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
          onClose={() => setError(null)}
        />
      )}

      {/* 内容为空时的提示 */}
      {contentStats.total === 0 && (
        <Empty
          image={<ExperimentOutlined style={{ fontSize: 64, color: '#ccc' }} />}
          description={
            <Space direction="vertical" align="center">
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {language === 'zh' ? '准备分析您的内容' : 'Ready to Analyze Your Content'}
              </Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {language === 'zh' 
                  ? '请先添加文本、代码或图片内容块，然后点击"开始分析"按钮' 
                  : 'Please add text, code, or image blocks first, then click "Analyze Content" button'
                }
              </Text>
            </Space>
          }
          style={{ padding: '40px 20px' }}
        />
      )}

      {/* 分析中的加载状态 */}
      {isAnalyzing && !analysisData && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--theme-background, rgba(248,248,249,0.3))',
          borderRadius: '12px',
          border: '1px solid var(--theme-border, rgba(0,0,0,0.06))'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text style={{ fontSize: '16px', color: 'var(--theme-text)' }}>
              {language === 'zh' ? 'AI 正在分析您的内容...' : 'AI is analyzing your content...'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {language === 'zh' ? '这可能需要几秒钟时间' : 'This may take a few seconds'}
            </Text>
          </div>
        </div>
      )}

      {/* 分析结果展示 */}
      {analysisData && !isAnalyzing && (
        <div>
          {/* 分析概览 */}
          <div style={{ 
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, var(--theme-primary, #007aff)10, var(--theme-accent, #34c759)10)',
            borderRadius: '8px',
            border: '1px solid var(--theme-primary, #007aff)20'
          }}>
            <Row gutter={16} align="middle">
              <Col>
                <Text strong style={{ color: 'var(--theme-text)' }}>
                  {language === 'zh' ? '分析完成' : 'Analysis Complete'}:
                </Text>
              </Col>
              <Col>
                <Space size="large">
                  {analysisData.keywords && (
                    <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                      {analysisData.keywords.length} {language === 'zh' ? '个关键词' : 'keywords'}
                    </Text>
                  )}
                  {analysisData.mindmap && (
                    <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                      {analysisData.mindmap.length} {language === 'zh' ? '个节点' : 'nodes'}
                    </Text>
                  )}
                  {analysisData.summary && (
                    <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                      {analysisData.summary.key_points?.length || 0} {language === 'zh' ? '个要点' : 'key points'}
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </div>

          {/* 分析结果标签页 */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="small"
            style={{
              '& .ant-tabs-nav': {
                marginBottom: '16px'
              }
            }}
          />
        </div>
      )}
    </Card>
  );
};

export default ContentAnalysisPanel;