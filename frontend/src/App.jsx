import React, { useState, useEffect, useCallback } from 'react';
import ContentBlockInput from './components/ContentBlockInput';
import LLMSelector from './components/LLMSelector';
import LanguageSelector from './components/LanguageSelector';
import EditableOutput from './components/EditableOutput';
import ObsidianImporter from './components/ObsidianImporter';
import FusionDegreeSelector from './components/FusionDegreeSelector';
import ThemeModal from './components/ThemeModal';
import ContentAnalysisPanel from './components/ContentAnalysisPanel';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { applyTheme, getThemeById, loadThemePreference, saveThemePreference } from './utils/themes';
import './index.css'; // Global base styles

import {
  Layout, Row, Col, Button, Typography, Space, Empty, Result, Card, Divider, Spin, message, Modal, Badge, Dropdown, Tabs
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, CodeOutlined, PictureOutlined, ExperimentOutlined, BulbOutlined, BranchesOutlined, ImportOutlined, SettingOutlined, GlobalOutlined, BarChartOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const generateId = () => crypto.randomUUID();

function AppContent() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [blocks, setBlocks] = useState([]);
  const [selectedLlm, setSelectedLlm] = useState({ provider: '', model_name: '' });
  const [selectedLanguage, setSelectedLanguage] = useState('zh');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [selectedHtmlStyle, setSelectedHtmlStyle] = useState('modern');
  const [wordCountRange, setWordCountRange] = useState({ min: 500, max: 1000 });
  const [fusionDegree, setFusionDegree] = useState('medium');
  const [enableSvgOutput, setEnableSvgOutput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [isLlmSelectionValid, setIsLlmSelectionValid] = useState(false);
  const [isObsidianModalOpen, setIsObsidianModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeMainTab, setActiveMainTab] = useState('generate'); // 'generate' or 'analysis'

  useEffect(() => {
    setIsLlmSelectionValid(!!(selectedLlm.provider && selectedLlm.model_name));
  }, [selectedLlm]);

  // 初始化主题
  useEffect(() => {
    const savedTheme = loadThemePreference();
    setCurrentTheme(savedTheme);
    applyTheme(getThemeById(savedTheme));
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 主题变化处理
  const handleThemeChange = useCallback((themeId) => {
    setCurrentTheme(themeId);
    applyTheme(getThemeById(themeId));
    saveThemePreference(themeId);
  }, []);

  const addBlock = (type) => {
    let newBlock;
    const baseBlock = { id: generateId(), type };
    switch (type) {
      case 'text': newBlock = { ...baseBlock, content: '' }; break;
      case 'code': newBlock = { ...baseBlock, language: 'javascript', code: '', caption: '' }; break;
      case 'image': newBlock = { ...baseBlock, image_path: null, alt_text: '', caption: '' }; break;
      default: return;
    }
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index, updatedBlockData) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlockData;
    setBlocks(newBlocks);
  };

  const removeBlock = (index) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const handleLlmChange = useCallback((newSelection) => {
    setSelectedLlm(newSelection);
  }, []);

  const handleLanguageChange = useCallback((language) => {
    setSelectedLanguage(language);
  }, []);

  const handleStyleChange = useCallback((style) => {
    setSelectedStyle(style);
  }, []);

  const handleWordCountChange = useCallback((range) => {
    setWordCountRange(range);
  }, []);

  const handleHtmlStyleChange = useCallback((htmlStyle) => {
    setSelectedHtmlStyle(htmlStyle);
  }, []);

  const handleImportObsidianFiles = useCallback((obsidianFiles) => {
    const newBlocks = obsidianFiles.map(file => ({
      id: generateId(),
      type: 'text',
      content: `# ${file.name}\n\n${file.content}`
    }));
    setBlocks(prev => [...prev, ...newBlocks]);
    setIsObsidianModalOpen(false);
  }, []);

  const handleGenerate = async () => {
    if (!isLlmSelectionValid) {
      message.error(t('invalidLlmSelection'));
      setGeneratedArticle({
        status: "error",
        title: t('invalidLlmSelection'),
        subTitle: t('invalidLlmSelection'),
      });
      return;
    }
    if (blocks.length === 0) {
      message.error(t('noBlocks'));
      setGeneratedArticle({
        status: "error",
        title: t('noBlocks'),
        subTitle: t('noBlocksDesc'),
      });
      return;
    }

    setIsLoading(true);
    setGeneratedArticle(null);
    
    const requestPayload = {
      user_input: {
        blocks: blocks.map(({ id, ...blockData }) => blockData), // eslint-disable-line no-unused-vars
      },
      llm_selection: selectedLlm,
      output_preferences: { 
        desired_length: "medium",
        language: selectedLanguage,
        style: selectedStyle,
        min_word_count: wordCountRange.min,
        max_word_count: wordCountRange.max,
        fusion_degree: fusionDegree,
        enable_svg_output: enableSvgOutput
      }
    };

    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to generate content. The server returned an unexpected response."
        }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGeneratedArticle({ status: "success", ...data });
      message.success(t('generationSuccess') || "Article generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      message.error(`${t('generationError')}: ${error.message}`);
      setGeneratedArticle({
        status: "error",
        title: t('generationError'),
        subTitle: error.message || t('tryAgain'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditedContent = useCallback((editedHtml) => {
    setGeneratedArticle(prev => ({
      ...prev,
      preview_html: editedHtml
    }));
  }, []);

  // 处理跳转到源内容
  const handleJumpToSource = useCallback((blockIndex) => {
    // 切换到生成标签页
    setActiveMainTab('generate');
    
    // 根据块类型打开相应的模态框
    if (blocks[blockIndex]) {
      const block = blocks[blockIndex];
      switch (block.type) {
        case 'text':
          setIsTextModalOpen(true);
          break;
        case 'code':
          setIsCodeModalOpen(true);
          break;
        case 'image':
          setIsImageModalOpen(true);
          break;
        default:
          break;
      }
      
      // 可以在这里添加滚动到特定位置的逻辑
      message.info(
        currentLanguage === 'zh' 
          ? `跳转到${block.type === 'text' ? '文本' : block.type === 'code' ? '代码' : '图片'}块 ${blockIndex + 1}` 
          : `Jump to ${block.type} block ${blockIndex + 1}`
      );
    }
  }, [blocks, currentLanguage]);

  const getBlockCounts = () => {
    const counts = { text: 0, code: 0, image: 0 };
    blocks.forEach(block => {
      if (Object.prototype.hasOwnProperty.call(counts, block.type)) {
        counts[block.type]++;
      }
    });
    return counts;
  };

  const blockCounts = getBlockCounts();

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--theme-background, #f8f8f9)' }}>
      <Header style={{ 
        background: 'var(--theme-surface, rgba(255,255,255,0.8))',
        backdropFilter: 'var(--theme-backdrop, blur(10px))',
        padding: '0 48px', 
        borderBottom: '1px solid var(--theme-border, rgba(0,0,0,0.06))', 
        position: 'fixed', 
        zIndex: 1000, 
        width: '100%' 
      }}>
        <Row justify="space-between" align="middle" style={{height: '100%'}}>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: 600, color: 'var(--theme-text, #1d1d1f)' }}>
              <BranchesOutlined style={{ marginRight: 10, color: 'var(--theme-primary, #007aff)' }} />
              {t('appTitle')}
            </Title>
          </Col>
          <Col>
            <Space size="small">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'zh',
                      label: t('chinese'),
                      onClick: () => changeLanguage('zh')
                    },
                    {
                      key: 'en', 
                      label: t('english'),
                      onClick: () => changeLanguage('en')
                    }
                  ]
                }}
                placement="bottomRight"
              >
                <Button 
                  type="text" 
                  icon={<GlobalOutlined />}
                  style={{
                    borderRadius: '12px',
                    color: 'var(--theme-text, #1d1d1f)',
                    fontSize: '14px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {currentLanguage === 'zh' ? '中文' : 'EN'}
                </Button>
              </Dropdown>
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                onClick={() => setIsThemeModalOpen(true)}
                style={{
                  borderRadius: '12px',
                  color: 'var(--theme-text, #1d1d1f)',
                  fontSize: '14px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {t('settings')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>
      <Content style={{ padding: '24px 48px', marginTop: 88, minHeight: 'calc(100vh - 88px)' }}> {/* Adjust marginTop for fixed header height */}
        <Space direction="vertical" size="large" style={{width: '100%'}}>
          <Row gutter={[32, 32]}> {/* Increased gutter for more spacing */}
            <Col xs={24} lg={8} xl={7}>
              <LLMSelector
                selectedLlm={selectedLlm}
                onLlmChange={handleLlmChange}
                currentBlocks={blocks}
              />
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                selectedStyle={selectedStyle}
                onLanguageChange={handleLanguageChange}
                onStyleChange={handleStyleChange}
                wordCountRange={wordCountRange}
                onWordCountChange={handleWordCountChange}
                selectedHtmlStyle={selectedHtmlStyle}
                onHtmlStyleChange={handleHtmlStyleChange}
              />
              <FusionDegreeSelector
                fusionDegree={fusionDegree}
                onFusionDegreeChange={setFusionDegree}
                enableSvgOutput={enableSvgOutput}
                onSvgOutputChange={setEnableSvgOutput}
              />
            </Col>

            <Col xs={24} lg={16} xl={17}>
              <Card 
                variant="filled"
                style={{ 
                  borderRadius: 'var(--theme-borderRadius, 16px)', 
                  boxShadow: 'var(--theme-shadow, 0 12px 28px rgba(0,0,0,0.06))', 
                  minHeight: 'calc(100vh - 180px)',
                  background: 'var(--theme-surface, rgba(255,255,255,0.8))',
                  backdropFilter: 'var(--theme-backdrop, blur(10px))',
                  border: 'none'
                }}
                styles={{body: {padding: 0}}}
              >
                <div style={{
                    padding: '32px 32px 24px 32px', 
                    borderBottom: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
                    background: 'linear-gradient(135deg, var(--theme-surface, rgba(255,255,255,0.9)) 0%, var(--theme-background, rgba(248,248,249,0.6)) 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 'var(--theme-borderRadius, 16px) var(--theme-borderRadius, 16px) 0 0'
                }}>
                    {/* AI创意背景装饰 */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '200px',
                        height: '100px',
                        background: 'linear-gradient(45deg, var(--theme-primary, #007aff) 0%, transparent 70%)',
                        opacity: 0.03,
                        borderRadius: '0 0 0 50px',
                        zIndex: 0
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '150px',
                        height: '80px',
                        background: 'linear-gradient(-45deg, var(--theme-accent, #34c759) 0%, transparent 70%)',
                        opacity: 0.03,
                        borderRadius: '0 50px 0 0',
                        zIndex: 0
                    }} />
                    
                    <Row justify="space-between" align="top" style={{height: 'auto', minHeight: 56, position: 'relative', zIndex: 1}} gutter={[16, 16]}>
                        <Col xs={24} md={24} lg={12} xl={14}>
                            <Space direction="vertical" size="small" style={{width: '100%'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                    <div style={{
                                        width: '6px',
                                        height: '24px',
                                        background: 'linear-gradient(180deg, var(--theme-primary, #007aff) 0%, var(--theme-accent, #34c759) 100%)',
                                        borderRadius: '3px',
                                        boxShadow: '0 2px 8px rgba(var(--theme-primary), 0.3)'
                                    }} />
                                    <Title level={4} className="mobile-title" style={{
                                        margin: 0, 
                                        fontWeight: 700,
                                        color: 'var(--theme-text)',
                                        fontSize: '22px',
                                        lineHeight: '32px',
                                        letterSpacing: '0.3px',
                                        background: 'linear-gradient(135deg, var(--theme-text, #1d1d1f) 0%, var(--theme-primary, #007aff) 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}>{currentLanguage === 'zh' ? '您的内容画布' : 'Your Content Canvas'}</Title>
                                </div>
                                <Text className="mobile-subtitle" style={{
                                    color: 'var(--theme-textSecondary, rgba(29,29,31,0.6))',
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    lineHeight: '20px'
                                }}>
                                    {t('appDescription')}
                                </Text>
                            </Space>
                        </Col>
                        <Col xs={24} md={24} lg={12} xl={10}>
                            <div className="content-buttons-mobile tablet-center" style={{
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                alignItems: 'center', 
                                gap: '12px', 
                                flexWrap: 'nowrap'
                            }}>
                                {/* 内容块按钮组 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px',
                                    background: 'var(--theme-surface, rgba(255,255,255,0.8))',
                                    borderRadius: '14px',
                                    border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    backdropFilter: 'blur(10px)',
                                    minWidth: 'fit-content',
                                    flexShrink: 0
                                }}>
                                    <Badge count={blockCounts.text} size="small" offset={[-3, -3]} style={{zIndex: 10}}>
                                        <Button 
                                            icon={<FileTextOutlined />} 
                                            onClick={() => setIsTextModalOpen(true)} 
                                            size="small"
                                            style={{
                                                border: 'none',
                                                borderRadius: '10px',
                                                height: '28px',
                                                padding: '0 10px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: 'var(--theme-text)',
                                                background: blockCounts.text > 0 ? 'rgba(0,122,255,0.15)' : 'transparent',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {t('addText')}
                                        </Button>
                                    </Badge>
                                    <Badge count={blockCounts.code} size="small" offset={[-3, -3]} style={{zIndex: 10}}>
                                        <Button 
                                            icon={<CodeOutlined />} 
                                            onClick={() => setIsCodeModalOpen(true)} 
                                            size="small"
                                            style={{
                                                border: 'none',
                                                borderRadius: '10px',
                                                height: '28px',
                                                padding: '0 10px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: 'var(--theme-text)',
                                                background: blockCounts.code > 0 ? 'rgba(52,199,89,0.15)' : 'transparent',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {t('addCode')}
                                        </Button>
                                    </Badge>
                                    <Badge count={blockCounts.image} size="small" offset={[-3, -3]} style={{zIndex: 10}}>
                                        <Button 
                                            icon={<PictureOutlined />} 
                                            onClick={() => setIsImageModalOpen(true)} 
                                            size="small"
                                            style={{
                                                border: 'none',
                                                borderRadius: '10px',
                                                height: '28px',
                                                padding: '0 10px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: 'var(--theme-text)',
                                                background: blockCounts.image > 0 ? 'rgba(255,149,0,0.15)' : 'transparent',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {t('addImage')}
                                        </Button>
                                    </Badge>
                                    <Button 
                                        icon={<ImportOutlined />} 
                                        onClick={() => setIsObsidianModalOpen(true)} 
                                        size="small"
                                        style={{
                                            border: 'none',
                                            borderRadius: '10px',
                                            height: '28px',
                                            padding: '0 10px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            color: 'var(--theme-text)',
                                            background: 'transparent',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {t('importObsidian')}
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
                
                {/* 主内容标签页 */}
                <Tabs
                  activeKey={activeMainTab}
                  onChange={setActiveMainTab}
                  size="large"
                  style={{ 
                    padding: '0 24px',
                    minHeight: 'calc(100vh - 280px)'
                  }}
                  items={[
                    {
                      key: 'generate',
                      label: (
                        <Space>
                          <ExperimentOutlined />
                          {currentLanguage === 'zh' ? '内容生成' : 'Content Generation'}
                        </Space>
                      ),
                      children: (
                        <div style={{ minHeight: 'calc(100vh - 320px)' }}>
                          {/* 生成控制面板 */}
                          <Card 
                            size="small"
                            style={{ 
                              marginBottom: '16px',
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
                            title={
                              <Space>
                                <ExperimentOutlined style={{ color: 'var(--theme-primary, #007aff)' }} />
                                <Title level={5} style={{ margin: 0, color: 'var(--theme-text)' }}>
                                  {currentLanguage === 'zh' ? 'AI 内容编织' : 'AI Content Weaving'}
                                </Title>
                              </Space>
                            }
                            extra={
                              <Space>
                                {blocks.length > 0 && (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {blocks.length} {currentLanguage === 'zh' ? '个内容块' : 'blocks'} 
                                    ({blockCounts.text} {currentLanguage === 'zh' ? '文本' : 'text'}, {blockCounts.code} {currentLanguage === 'zh' ? '代码' : 'code'}, {blockCounts.image} {currentLanguage === 'zh' ? '图片' : 'image'})
                                  </Text>
                                )}
                                <Button
                                  type="primary"
                                  icon={<ExperimentOutlined />}
                                  onClick={handleGenerate}
                                  loading={isLoading}
                                  disabled={!isLlmSelectionValid || blocks.length === 0}
                                  style={{
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, var(--theme-primary, #007aff) 0%, var(--theme-accent, #34c759) 100%)',
                                    border: 'none'
                                  }}
                                >
                                  {isLoading 
                                    ? (currentLanguage === 'zh' ? '编织中...' : 'Weaving...') 
                                    : (currentLanguage === 'zh' ? '编织文章' : 'Weave Article')
                                  }
                                </Button>
                              </Space>
                            }
                          >
                            {/* 内容为空时的提示 */}
                            {blocks.length === 0 && (
                              <Empty
                                image={<BulbOutlined style={{ fontSize: 48, color: '#ccc' }} />}
                                description={
                                  <Space direction="vertical" align="center">
                                    <Text type="secondary" style={{ fontSize: '16px' }}>
                                      {currentLanguage === 'zh' ? '准备编织您的内容' : 'Ready to Weave Your Content'}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                      {currentLanguage === 'zh' 
                                        ? '请先添加文本、代码或图片内容块，然后点击"编织文章"按钮' 
                                        : 'Please add text, code, or image blocks first, then click "Weave Article" button'
                                      }
                                    </Text>
                                  </Space>
                                }
                                style={{ padding: '20px' }}
                              />
                            )}

                            {/* 有内容但未生成时的状态 */}
                            {blocks.length > 0 && !generatedArticle && !isLoading && (
                              <div style={{ 
                                padding: '16px 20px',
                                background: 'linear-gradient(135deg, var(--theme-primary, #007aff)10, var(--theme-accent, #34c759)10)',
                                borderRadius: '8px',
                                border: '1px solid var(--theme-primary, #007aff)20'
                              }}>
                                <Row gutter={16} align="middle">
                                  <Col>
                                    <Text strong style={{ color: 'var(--theme-text)' }}>
                                      {currentLanguage === 'zh' ? '内容已准备就绪' : 'Content Ready'}:
                                    </Text>
                                  </Col>
                                  <Col>
                                    <Space size="large">
                                      <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                                        {blockCounts.text} {currentLanguage === 'zh' ? '个文本块' : 'text blocks'}
                                      </Text>
                                      <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                                        {blockCounts.code} {currentLanguage === 'zh' ? '个代码块' : 'code blocks'}
                                      </Text>
                                      <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                                        {blockCounts.image} {currentLanguage === 'zh' ? '个图片块' : 'image blocks'}
                                      </Text>
                                    </Space>
                                  </Col>
                                </Row>
                              </div>
                            )}

                            {/* 生成中的加载状态 */}
                            {isLoading && (
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px',
                                background: 'var(--theme-background, rgba(248,248,249,0.3))',
                                borderRadius: '8px',
                                border: '1px solid var(--theme-border, rgba(0,0,0,0.06))'
                              }}>
                                <Spin size="large" />
                                <div style={{ marginTop: '16px' }}>
                                  <Text style={{ fontSize: '16px', color: 'var(--theme-text)' }}>
                                    {currentLanguage === 'zh' ? 'AI 正在编织您的文章...' : 'AI is weaving your article...'}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '14px' }}>
                                    {currentLanguage === 'zh' ? '这可能需要几秒钟时间' : 'This may take a few seconds'}
                                  </Text>
                                </div>
                              </div>
                            )}
                          </Card>

                          {/* 生成结果展示 */}
                          {generatedArticle && generatedArticle.status === "success" ? (
                            <EditableOutput 
                              generatedArticle={generatedArticle} 
                              onSave={handleSaveEditedContent}
                              selectedHtmlStyle={selectedHtmlStyle}
                            />
                          ) : generatedArticle && generatedArticle.status === "error" ? (
                            <Result
                              status="error"
                              title={generatedArticle.title}
                              subTitle={generatedArticle.subTitle}
                            />
                          ) : null}
                        </div>
                      )
                    },
                    {
                      key: 'analysis',
                      label: (
                        <Space>
                          <BarChartOutlined />
                          {currentLanguage === 'zh' ? '内容分析' : 'Content Analysis'}
                          {blocks.length > 0 && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              ({blocks.length})
                            </Text>
                          )}
                        </Space>
                      ),
                      children: (
                        <div style={{ paddingTop: '16px' }}>
                          <ContentAnalysisPanel
                            contentBlocks={blocks}
                            language={currentLanguage}
                            onJumpToSource={handleJumpToSource}
                          />
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </Content>
      
      <Modal
        title={t('obsidianImporter')}
        open={isObsidianModalOpen}
        onCancel={() => setIsObsidianModalOpen(false)}
        footer={null}
        width={800}
        styles={{
          body: { padding: 0 }
        }}
      >
        <ObsidianImporter onImportFiles={handleImportObsidianFiles} />
      </Modal>

      <Modal
        title={`${t('addTextBlock')} (${blockCounts.text} ${currentLanguage === 'zh' ? '项' : 'items'})`}
        open={isTextModalOpen}
        onCancel={() => setIsTextModalOpen(false)}
        footer={null}
        width={900}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' }
        }}
      >
        <div style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => addBlock('text')}
              block
              size="large"
            >
              {currentLanguage === 'zh' ? '添加新文本块' : 'Add New Text Block'}
            </Button>
            {blocks.filter(block => block.type === 'text').map((block) => {
              const actualIndex = blocks.findIndex(b => b.id === block.id);
              return (
                <ContentBlockInput
                  key={block.id}
                  block={block}
                  index={actualIndex}
                  updateBlock={updateBlock}
                  removeBlock={removeBlock}
                />
              );
            })}
            {blocks.filter(block => block.type === 'text').length === 0 && (
              <Empty 
                image={<FileTextOutlined style={{ fontSize: 48, color: '#007aff' }} />}
                description={currentLanguage === 'zh' ? '还没有文本块。点击上方添加您的第一个文本块。' : 'No text blocks yet. Click above to add your first text block.'}
              />
            )}
          </Space>
        </div>
      </Modal>

      <Modal
        title={`${t('addCodeBlock')} (${blockCounts.code} ${currentLanguage === 'zh' ? '项' : 'items'})`}
        open={isCodeModalOpen}
        onCancel={() => setIsCodeModalOpen(false)}
        footer={null}
        width={900}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' }
        }}
      >
        <div style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => addBlock('code')}
              block
              size="large"
            >
              {currentLanguage === 'zh' ? '添加新代码块' : 'Add New Code Block'}
            </Button>
            {blocks.filter(block => block.type === 'code').map((block) => {
              const actualIndex = blocks.findIndex(b => b.id === block.id);
              return (
                <ContentBlockInput
                  key={block.id}
                  block={block}
                  index={actualIndex}
                  updateBlock={updateBlock}
                  removeBlock={removeBlock}
                />
              );
            })}
            {blocks.filter(block => block.type === 'code').length === 0 && (
              <Empty 
                image={<CodeOutlined style={{ fontSize: 48, color: '#007aff' }} />}
                description={currentLanguage === 'zh' ? '还没有代码块。点击上方添加您的第一个代码块。' : 'No code blocks yet. Click above to add your first code block.'}
              />
            )}
          </Space>
        </div>
      </Modal>

      <Modal
        title={`${t('addImageBlock')} (${blockCounts.image} ${currentLanguage === 'zh' ? '项' : 'items'})`}
        open={isImageModalOpen}
        onCancel={() => setIsImageModalOpen(false)}
        footer={null}
        width={900}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' }
        }}
      >
        <div style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => addBlock('image')}
              block
              size="large"
            >
              {currentLanguage === 'zh' ? '添加新图片块' : 'Add New Image Block'}
            </Button>
            {blocks.filter(block => block.type === 'image').map((block) => {
              const actualIndex = blocks.findIndex(b => b.id === block.id);
              return (
                <ContentBlockInput
                  key={block.id}
                  block={block}
                  index={actualIndex}
                  updateBlock={updateBlock}
                  removeBlock={removeBlock}
                />
              );
            })}
            {blocks.filter(block => block.type === 'image').length === 0 && (
              <Empty 
                image={<PictureOutlined style={{ fontSize: 48, color: '#007aff' }} />}
                description={currentLanguage === 'zh' ? '还没有图片块。点击上方添加您的第一个图片块。' : 'No image blocks yet. Click above to add your first image block.'}
              />
            )}
          </Space>
        </div>
      </Modal>

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </Layout>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
