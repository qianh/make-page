import React, { useState, useEffect, useCallback } from 'react';
import ContentBlockInput from './components/ContentBlockInput';
import LLMSelector from './components/LLMSelector';
import LanguageSelector from './components/LanguageSelector';
import './index.css'; // Global base styles

import {
  Layout, Row, Col, Button, Typography, Space, Empty, Result, Card, Divider, Affix, Spin, message, Tabs
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, CodeOutlined, PictureOutlined, ExperimentOutlined, BulbOutlined, BranchesOutlined, CopyOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const generateId = () => crypto.randomUUID();

function App() {
  const [blocks, setBlocks] = useState([]);
  const [selectedLlm, setSelectedLlm] = useState({ provider: '', model_name: '' });
  const [selectedLanguage, setSelectedLanguage] = useState('zh');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [wordCountRange, setWordCountRange] = useState({ min: null, max: null });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [isLlmSelectionValid, setIsLlmSelectionValid] = useState(false);

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
        max_word_count: wordCountRange.max
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

  const handleCopyMarkdown = () => {
    if (generatedArticle && generatedArticle.article_markdown) {
      navigator.clipboard.writeText(generatedArticle.article_markdown)
        .then(() => {
          message.success("Markdown content copied to clipboard!");
        })
        .catch(err => {
          message.error("Failed to copy Markdown content.");
          console.error('Failed to copy text: ', err);
        });
    }
  };

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
              />
            </Col>

            <Col xs={24} lg={16} xl={17}>
              <Card 
                variant="filled"
                style={{ borderRadius: 16, boxShadow: '0 12px 28px rgba(0,0,0,0.06)', height: '100%' }}
                styles={{body: {padding: 0}}} // Control padding internally
              >
                <div style={{padding: 24, borderBottom: '1px solid rgba(0,0,0,0.06)'}}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={4} style={{marginBottom: 0, fontWeight: 600}}>Your Content Canvas</Title>
                        </Col>
                        <Col>
                            <Space>
                                <Button icon={<FileTextOutlined />} onClick={() => addBlock('text')} shape="round">Text</Button>
                                <Button icon={<CodeOutlined />} onClick={() => addBlock('code')} shape="round">Code</Button>
                                <Button icon={<PictureOutlined />} onClick={() => addBlock('image')} shape="round">Image</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
                <div style={{padding: 24, minHeight: 400, maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                  {blocks.length === 0 ? (
                    <Empty
                      image={<BulbOutlined style={{ fontSize: 72, color: '#007aff' }} />}
                      styles={{image: { height: 100, marginBottom: 24}}}
                      description={
                        <Space direction="vertical" align="center">
                          <Title level={5} style={{color: 'rgba(0,0,0,0.6)'}}>Canvas is Empty</Title>
                          <Paragraph style={{color: 'rgba(0,0,0,0.45)'}}>Build your article by adding content blocks.</Paragraph>
                        </Space>
                      }
                    />
                  ) : (
                    <Space direction="vertical" size="large" style={{width: '100%'}}>
                      {blocks.map((block, index) => (
                        <ContentBlockInput
                          key={block.id}
                          block={block}
                          index={index}
                          updateBlock={updateBlock}
                          removeBlock={removeBlock}
                        />
                      ))}
                    </Space>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
          
          {generatedArticle && (
            <Row>
              <Col span={24}>
                {generatedArticle.status === "error" ? (
                  <Result
                    status="error"
                    title={generatedArticle.title}
                    subTitle={generatedArticle.subTitle}
                    style={{background: '#fff', borderRadius: 16, padding: '48px 24px', boxShadow: '0 12px 28px rgba(0,0,0,0.06)'}}
                  />
                ) : (
                  <Card 
                    title={<Title level={4} style={{marginBottom:0, fontWeight: 600}}>Generated Article: <Text style={{fontWeight: 400, color: 'rgba(0,0,0,0.6)'}}>{generatedArticle.title}</Text></Title>}
                    variant="filled"
                    style={{ borderRadius: 16, boxShadow: '0 12px 28px rgba(0,0,0,0.06)', marginTop: 24 }}
                  >
                    <Tabs defaultActiveKey="1" centered type="card" tabBarGutter={8}>
                      <TabPane tab={<Space><FileTextOutlined/>Preview</Space>} key="1">
                        <div 
                          className="html-preview-box" // Keep for potential specific styling of generated HTML
                          dangerouslySetInnerHTML={{ __html: generatedArticle.preview_html }} 
                          style={{padding: '24px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, background: '#f8f8f9', minHeight: 250, lineHeight: 1.6}}
                        />
                      </TabPane>
                      <TabPane tab={<Space><CodeOutlined/>Markdown</Space>} key="2">
                        <div style={{padding: '16px', background: '#2d2d2d', borderRadius: 12, overflowX: 'auto'}}>
                          <Row justify="end" style={{ marginBottom: 8 }}>
                            <Col>
                              <Button
                                icon={<CopyOutlined />}
                                onClick={handleCopyMarkdown}
                                size="small"
                              >
                                Copy Markdown
                              </Button>
                            </Col>
                          </Row>
                          <pre style={{ margin: 0, color: '#f0f0f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            <code>{generatedArticle.article_markdown}</code>
                          </pre>
                        </div>
                      </TabPane>
                      {generatedArticle.suggestions && generatedArticle.suggestions.length > 0 && (
                        <TabPane tab={<Space><BulbOutlined/>Suggestions</Space>} key="3">
                          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                            {generatedArticle.suggestions.map((s, i) => <li key={i}><Text>{s}</Text></li>)}
                          </ul>
                        </TabPane>
                      )}
                    </Tabs>
                  </Card>
                )}
              </Col>
            </Row>
          )}
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
    </Layout>
  );
}

export default App;
