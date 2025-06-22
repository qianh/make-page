import React, { useState, useEffect } from 'react';
import { Select, Card, Form, Spin, Alert, Descriptions, Typography, Row, Col, Space, Collapse } from 'antd';
import { useLanguage } from '../contexts/LanguageContext';

const { Option } = Select;
const { Text, Title } = Typography;

const LLMSelector = ({ selectedLlm, onLlmChange, currentBlocks }) => {
  const { t } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLlms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/v1/llms');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProviders(data.providers || []);
        
        if (selectedLlm && selectedLlm.provider && selectedLlm.model_name) {
          const providerExists = data.providers.find(p => p.provider_id === selectedLlm.provider);
          if (providerExists) {
            const modelExists = providerExists.models.find(m => m.model_id === selectedLlm.model_name);
            if (modelExists) {
              setSelectedProviderId(selectedLlm.provider);
              setSelectedModelId(selectedLlm.model_name);
            }
          }
        } else if (data.providers && data.providers.length > 0) {
          const firstProvider = data.providers[0];
          setSelectedProviderId(firstProvider.provider_id);
          if (firstProvider.models && firstProvider.models.length > 0) {
            setSelectedModelId(firstProvider.models[0].model_id);
            onLlmChange({ provider: firstProvider.provider_id, model_name: firstProvider.models[0].model_id });
          }
        }
      } catch (e) {
        console.error("Failed to fetch LLMs:", e);
        setError(t('failedToLoadModels'));
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLlms();
  }, []); // selectedLlm removed from deps to prevent re-fetch on its change by parent.

  useEffect(() => {
    const currentProvider = providers.find(p => p.provider_id === selectedProviderId);
    if (currentProvider && currentProvider.models.length > 0) {
      const currentModelIsValidForProvider = currentProvider.models.some(m => m.model_id === selectedModelId);
      if (!currentModelIsValidForProvider && selectedProviderId) { // Ensure a provider is actually selected
        setSelectedModelId(currentProvider.models[0].model_id);
        onLlmChange({ provider: selectedProviderId, model_name: currentProvider.models[0].model_id });
      } else if (selectedProviderId && selectedModelId) {
        onLlmChange({ provider: selectedProviderId, model_name: selectedModelId });
      }
    } else if (selectedProviderId && (!currentProvider || currentProvider.models.length === 0)) {
        // If the selected provider has no models or is not found, clear model selection
        setSelectedModelId('');
        onLlmChange({ provider: selectedProviderId, model_name: '' });
    }
  }, [selectedProviderId, providers, selectedModelId, onLlmChange]);

  const handleProviderChange = (value) => {
    const newProviderId = value;
    setSelectedProviderId(newProviderId);
    const provider = providers.find(p => p.provider_id === newProviderId);
    if (provider && provider.models.length > 0) {
      const newModelId = provider.models[0].model_id;
      setSelectedModelId(newModelId); // This will trigger the useEffect above
    } else {
      setSelectedModelId(''); // This will trigger the useEffect above
    }
  };

  const handleModelChange = (value) => {
    const newModelId = value;
    setSelectedModelId(newModelId); // This will trigger the useEffect above
  };

  const currentProviderDetails = providers.find(p => p.provider_id === selectedProviderId);
  const currentModelDetails = currentProviderDetails?.models.find(m => m.model_id === selectedModelId);
  const hasImageInput = currentBlocks && currentBlocks.some(block => block.type === 'image');

  if (loading) {
    return (
      <Card variant="filled" style={{ textAlign: 'center', boxShadow: 'none', background: 'transparent' }}>
        <Spin size="large">
          <div style={{ padding: 20 }}>{t('loadingAiModels')}</div>
        </Spin>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert 
        message={<Title level={5} style={{marginBottom: 0}}>{t('loadingError')}</Title>} 
        description={error} 
        type="error" 
        showIcon 
        style={{borderRadius: 12}} 
      />
    );
  }
  
  if (providers.length === 0 && !loading) { // Ensure not to show this during initial load
    return (
      <Alert 
        message={<Title level={5} style={{marginBottom: 0}}>{t('noModelsAvailable')}</Title>} 
        description={t('noModelsFetched')} 
        type="warning" 
        showIcon 
        style={{borderRadius: 12}}
      />
    );
  }

  const modelConfigItems = [
    {
      key: '1',
      label: (
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: 'var(--theme-text)' }}>
          {t('configureAiModel')}
        </Title>
      ),
      children: (
        <>
          <Form layout="vertical">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label={<Text style={{fontWeight: 500, color: 'var(--theme-text)'}}>{t('provider')}</Text>} style={{marginBottom: 16}}>
                  <Select
                    id="llm-provider"
                    value={selectedProviderId}
                    onChange={handleProviderChange}
                    size="large"
                    style={{ width: '100%' }}
                    aria-label="LLM Provider"
                    placeholder={t('selectLlmProvider')}
                  >
                    {providers.map(provider => (
                      <Option key={provider.provider_id} value={provider.provider_id}>
                        {provider.display_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Text style={{fontWeight: 500, color: 'var(--theme-text)'}}>{t('selectModel')}</Text>} style={{marginBottom: 16}}>
                  <Select
                    id="llm-model"
                    value={selectedModelId}
                    onChange={handleModelChange}
                    disabled={!currentProviderDetails || currentProviderDetails.models.length === 0}
                    size="large"
                    style={{ width: '100%' }}
                    aria-label="LLM Model"
                    placeholder={t('selectModel')}
                  >
                    {currentProviderDetails?.models.map(model => (
                      <Option key={model.model_id} value={model.model_id}>
                        {model.display_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          {currentModelDetails && (
            <Card 
              title={<Text style={{fontWeight: 500, color: 'var(--theme-text)'}}>{currentModelDetails.display_name} {t('capabilities')}</Text>} 
              variant="filled" 
              size="small" 
              style={{ 
                marginTop: 20, 
                background: 'var(--theme-surface)', 
                borderRadius: 12,
                border: '1px solid var(--theme-border)'
              }}
            >
              <Descriptions bordered column={1} size="small" styles={{label: {fontWeight: 500, color: 'var(--theme-text)'}}}>
                <Descriptions.Item label={t('supportsImages')}>
                  {currentModelDetails.capabilities.supports_images ? 
                    <Text style={{color: 'var(--theme-success, #52c41a)'}}>{t('yes')}</Text> : 
                    <Text style={{color: 'var(--theme-error, #ff4d4f)'}}>{t('no')}</Text>
                  }
                </Descriptions.Item>
                {currentModelDetails.capabilities.max_input_tokens && 
                  <Descriptions.Item label={t('maxInputTokens')}>
                    <Text style={{color: 'var(--theme-text)'}}>{currentModelDetails.capabilities.max_input_tokens.toLocaleString()}</Text>
                  </Descriptions.Item>
                }
                {currentModelDetails.capabilities.notes && 
                  <Descriptions.Item label={t('note')}>
                    <Text style={{color: 'var(--theme-textSecondary)'}}>{currentModelDetails.capabilities.notes}</Text>
                  </Descriptions.Item>
                }
              </Descriptions>
              {hasImageInput && !currentModelDetails.capabilities.supports_images && (
                <Alert
                  message={t('warning')}
                  description={<Text style={{color: 'var(--theme-text)'}}>{t('imageWarning', { modelName: currentModelDetails.display_name })}</Text>}
                  type="warning"
                  showIcon
                  style={{ 
                    marginTop: 16, 
                    borderRadius: 8,
                    background: 'var(--theme-surface)',
                    border: '1px solid var(--theme-warning)'
                  }}
                />
              )}
            </Card>
          )}
        </>
      ),
    },
  ];

  return (
    <Collapse 
      items={modelConfigItems}
      defaultActiveKey={[]} // Default collapsed
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
};

export default LLMSelector;
