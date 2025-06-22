import React, { useState, useEffect, useCallback } from 'react';
import ContentBlockInput from './components/ContentBlockInput';
import LLMSelector from './components/LLMSelector';
import LanguageSelector from './components/LanguageSelector';
import EditableOutput from './components/EditableOutput';
import ObsidianImporter from './components/ObsidianImporter';
import FusionDegreeSelector from './components/FusionDegreeSelector';
import ThemeModal from './components/ThemeModal';
import { applyTheme, getThemeById, loadThemePreference, saveThemePreference } from './utils/themes';
import './index.css'; // Global base styles

import {
  Layout, Row, Col, Button, Typography, Space, Empty, Result, Card, Divider, Spin, message, Modal, Badge
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, CodeOutlined, PictureOutlined, ExperimentOutlined, BulbOutlined, BranchesOutlined, ImportOutlined, SettingOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const generateId = () => crypto.randomUUID();

function App() {
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
      message.error("Please select an AI provider and model first.");
      setGeneratedArticle({
        status: "error",
        title: "LLM Not Selected",
        subTitle: "Please select an AI provider and model from the configuration section before generating content.",
      });
      return;
    }
    if (blocks.length === 0) {
      message.error("Please add at least one content block before generating.");
      setGeneratedArticle({
        status: "error",
        title: "No Content Blocks",
        subTitle: "Add some content blocks to your canvas to start generating an article.",
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
      message.success("Article generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      message.error(`Content generation failed: ${error.message}`);
      setGeneratedArticle({
        status: "error",
        title: "Content Generation Failed",
        subTitle: error.message || "An unexpected error occurred. Please check your inputs, server logs, or try a different model.",
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
              AI Content Weaver
            </Title>
          </Col>
          <Col>
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              onClick={() => setIsThemeModalOpen(true)}
              style={{
                borderRadius: '12px',
                color: 'var(--theme-text, #1d1d1f)',
                fontSize: '16px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              主题设置
            </Button>
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
                    overflow: 'hidden'
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
                                    }}>Your Content Canvas</Title>
                                </div>
                                <Text className="mobile-subtitle" style={{
                                    color: 'var(--theme-textSecondary, rgba(29,29,31,0.6))',
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    lineHeight: '20px'
                                }}>
                                    Craft your ideas into compelling articles with AI
                                </Text>
                            </Space>
                        </Col>
                        <Col xs={24} md={24} lg={12} xl={10}>
                            <div className="content-buttons-mobile tablet-center" style={{
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                alignItems: 'center', 
                                gap: '12px', 
                                flexWrap: 'wrap'
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
                                    minWidth: 'fit-content'
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
                                            Text
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
                                            Code
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
                                            Image
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
                                        Obsidian
                                    </Button>
                                </div>
                                
                                {/* 生成按钮 */}
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ExperimentOutlined />}
                                    onClick={handleGenerate}
                                    loading={isLoading}
                                    disabled={!isLlmSelectionValid || blocks.length === 0}
                                    style={{ 
                                        minWidth: windowWidth < 768 ? '160px' : '180px',
                                        width: windowWidth < 768 ? '100%' : 'auto',
                                        maxWidth: '200px',
                                        height: '40px',
                                        borderRadius: '20px', 
                                        background: 'linear-gradient(135deg, var(--theme-primary, #007aff) 0%, var(--theme-accent, #34c759) 100%)',
                                        border: 'none',
                                        color: '#ffffff',
                                        boxShadow: '0 4px 12px rgba(var(--theme-primary), 0.3)',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        letterSpacing: '0.3px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(var(--theme-primary), 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(var(--theme-primary), 0.3)';
                                    }}
                                >
                                    <span style={{position: 'relative', zIndex: 2}}>
                                        {isLoading ? '🧠 Weaving...' : '✨ Weave Article!'}
                                    </span>
                                    {/* 按钮光效 */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '-100%',
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                        animation: isLoading ? 'none' : 'shimmer 2s infinite',
                                        zIndex: 1
                                    }} />
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>
                <div style={{padding: '0 24px', minHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
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
                  ) : (
                    <Empty
                      image={<BulbOutlined style={{ fontSize: 72, color: '#007aff' }} />}
                      styles={{image: { height: 100, marginBottom: 24, marginTop: 60}}}
                      description={
                        <Space direction="vertical" align="center">
                          <Title level={5} style={{color: 'rgba(0,0,0,0.6)'}}>Ready to Generate</Title>
                          <Paragraph style={{color: 'rgba(0,0,0,0.45)'}}>Add content using the buttons above, then generate your article.</Paragraph>
                          {blocks.length > 0 && (
                            <Text style={{color: 'rgba(0,0,0,0.6)', fontSize: '14px'}}>
                              {blockCounts.text} Text, {blockCounts.code} Code, {blockCounts.image} Image blocks ready
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Space>
      </Content>
      
      <Modal
        title="Import from Obsidian Vault"
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
        title={`Text Content Management (${blockCounts.text} items)`}
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
              Add New Text Block
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
                description="No text blocks yet. Click above to add your first text block."
              />
            )}
          </Space>
        </div>
      </Modal>

      <Modal
        title={`Code Content Management (${blockCounts.code} items)`}
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
              Add New Code Block
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
                description="No code blocks yet. Click above to add your first code block."
              />
            )}
          </Space>
        </div>
      </Modal>

      <Modal
        title={`Image Content Management (${blockCounts.image} items)`}
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
              Add New Image Block
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
                description="No image blocks yet. Click above to add your first image block."
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

export default App;
