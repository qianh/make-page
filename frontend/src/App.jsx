import React, { useState, useEffect, useCallback } from 'react';
import ContentBlockInput from './components/ContentBlockInput';
import LLMSelector from './components/LLMSelector';
import LanguageSelector from './components/LanguageSelector';
import EditableOutput from './components/EditableOutput';
import ObsidianImporter from './components/ObsidianImporter';
import FusionDegreeSelector from './components/FusionDegreeSelector';
import './index.css'; // Global base styles

import {
  Layout, Row, Col, Button, Typography, Space, Empty, Result, Card, Divider, Affix, Spin, message, Modal, Badge
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, CodeOutlined, PictureOutlined, ExperimentOutlined, BulbOutlined, BranchesOutlined, ImportOutlined
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

  useEffect(() => {
    setIsLlmSelectionValid(!!(selectedLlm.provider && selectedLlm.model_name));
  }, [selectedLlm]);

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
      if (counts.hasOwnProperty(block.type)) {
        counts[block.type]++;
      }
    });
    return counts;
  };

  const blockCounts = getBlockCounts();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f8f9' }}> {/* Light grey, Apple-like background */}
      <Header style={{ 
        background: 'rgba(255,255,255,0.8)', /* Translucent white */
        backdropFilter: 'blur(10px)', /* Frosted glass effect */
        padding: '0 48px', 
        borderBottom: '1px solid rgba(0,0,0,0.06)', 
        position: 'fixed', 
        zIndex: 1000, 
        width: '100%' 
      }}>
        <Row justify="space-between" align="middle" style={{height: '100%'}}>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1d1d1f' /* Apple's dark grey */ }}>
              <BranchesOutlined style={{ marginRight: 10, color: '#007aff' /* Apple Blue */}} />
              AI Content Weaver
            </Title>
          </Col>
          <Col>
            {/* Future user profile/settings can go here */}
          </Col>
        </Row>
      </Header>
      <Content style={{ padding: '24px 48px', marginTop: 88 }}> {/* Adjust marginTop for fixed header height */}
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
                style={{ borderRadius: 16, boxShadow: '0 12px 28px rgba(0,0,0,0.06)', minHeight: '600px' }}
                styles={{body: {padding: 0}}} // Control padding internally
              >
                <div style={{padding: 24, borderBottom: '1px solid rgba(0,0,0,0.06)'}}>
                    <Row justify="space-between" align="middle" style={{height: 32}}>
                        <Col style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                            <Title level={4} style={{
                                margin: 0, 
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '20px',
                                lineHeight: '32px',
                                letterSpacing: '0.5px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>Your Content Canvas</Title>
                        </Col>
                        <Col style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                            <Space style={{height: '32px', alignItems: 'center', display: 'flex'}}>
                                <Badge count={blockCounts.text} size="small" offset={[-2, -2]}>
                                    <Button icon={<FileTextOutlined />} onClick={() => setIsTextModalOpen(true)} shape="round">Text</Button>
                                </Badge>
                                <Badge count={blockCounts.code} size="small" offset={[-2, -2]}>
                                    <Button icon={<CodeOutlined />} onClick={() => setIsCodeModalOpen(true)} shape="round">Code</Button>
                                </Badge>
                                <Badge count={blockCounts.image} size="small" offset={[-2, -2]}>
                                    <Button icon={<PictureOutlined />} onClick={() => setIsImageModalOpen(true)} shape="round">Image</Button>
                                </Badge>
                                <Button icon={<ImportOutlined />} onClick={() => setIsObsidianModalOpen(true)} shape="round">Obsidian</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
                <div style={{padding: '0 24px', height: 'calc(100vh - 300px)' }}>
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
                      styles={{image: { height: 100, marginBottom: 24}}}
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
      <Affix offsetBottom={32} style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<ExperimentOutlined />}
            onClick={handleGenerate}
            loading={isLoading}
            disabled={!isLlmSelectionValid || blocks.length === 0}
            style={{ 
              minWidth: 220, 
              height: 50,
              borderRadius: 12, 
              boxShadow: '0 6px 16px rgba(0,122,255,0.3)', /* Apple blue shadow */
              fontWeight: 500,
              fontSize: 16
            }}
          >
            {isLoading ? 'Generating...' : 'Weave My Article!'}
          </Button>
      </Affix>
      <Footer style={{ textAlign: 'center', background: 'transparent', paddingTop: 64, paddingBottom: 32 }}>
        <Text style={{color: 'rgba(0,0,0,0.45)'}}>AI Content Weaver ©2025</Text>
      </Footer>
      
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
            {blocks.filter(block => block.type === 'text').map((block, index) => {
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
            {blocks.filter(block => block.type === 'code').map((block, index) => {
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
            {blocks.filter(block => block.type === 'image').map((block, index) => {
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
    </Layout>
  );
}

export default App;
