import React from 'react';
import { Modal, Card, Select, Typography, Space, Row, Col, Tooltip, Button } from 'antd';
import { BgColorsOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { getThemeList } from '../utils/themes';

const { Text, Title } = Typography;
const { Option } = Select;

const ThemeModal = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  const themes = getThemeList();

  const renderThemePreview = (theme) => {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '4px 0',
        minHeight: '40px'
      }}>
        {/* 主题颜色预览 */}
        <div style={{ 
          display: 'flex', 
          gap: '3px',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: theme.colors.primary,
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }} />
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: theme.colors.accent,
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }} />
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: theme.colors.success,
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }} />
        </div>
        
        <div style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginBottom: '2px'
          }}>
            <Text strong style={{ 
              fontSize: '13px',
              marginRight: '6px',
              color: 'var(--theme-text)'
            }}>
              {theme.name}
            </Text>
            {currentTheme === theme.id && (
              <CheckCircleOutlined style={{ 
                color: '#52c41a',
                fontSize: '12px'
              }} />
            )}
          </div>
          <Text type="secondary" style={{ 
            fontSize: '11px',
            lineHeight: '1.2',
            color: 'var(--theme-textSecondary)'
          }}>
            {theme.description}
          </Text>
        </div>
      </div>
    );
  };

  const renderThemeCard = (theme) => {
    const isSelected = currentTheme === theme.id;
    
    return (
      <Tooltip 
        key={theme.id}
        title={`${theme.name} - ${theme.description}`}
        placement="top"
      >
        <Card
          size="small"
          hoverable
          onClick={() => onThemeChange(theme.id)}
          style={{
            cursor: 'pointer',
            borderRadius: '12px',
            border: isSelected ? `2px solid ${theme.colors.primary}` : '1px solid var(--theme-border)',
            background: isSelected ? 'var(--theme-surfaceHover)' : 'var(--theme-surface)',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isSelected 
              ? `0 8px 24px ${theme.colors.primary}40` 
              : 'var(--theme-shadow)'
          }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong style={{ fontSize: '13px', color: 'var(--theme-text)' }}>
                  {theme.name}
                </Text>
              </Col>
              {isSelected && (
                <Col>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                </Col>
              )}
            </Row>
            
            {/* 主题颜色预览条 */}
            <div style={{
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(90deg, 
                ${theme.colors.primary} 0%, 
                ${theme.colors.accent} 50%, 
                ${theme.colors.accentSecondary} 100%
              )`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            
            <Text style={{ fontSize: '11px', lineHeight: '1.2', color: 'var(--theme-textSecondary)' }}>
              {theme.description}
            </Text>
          </Space>
        </Card>
      </Tooltip>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <BgColorsOutlined style={{ color: 'var(--theme-primary, #007aff)' }} />
          <Title level={4} style={{ margin: 0, fontWeight: 600, color: 'var(--theme-text)' }}>
            主题风格设置
          </Title>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={800}
      styles={{
        body: { padding: '24px' }
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 下拉选择器 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block', color: 'var(--theme-text)' }}>
            选择主题
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="选择主题风格"
            value={currentTheme}
            onChange={onThemeChange}
            size="large"
            popupMatchSelectWidth={false}
            dropdownStyle={{
              borderRadius: '12px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
            }}
          >
            {themes.map(theme => (
              <Option key={theme.id} value={theme.id}>
                {renderThemePreview(theme)}
              </Option>
            ))}
          </Select>
        </div>

        {/* 主题卡片网格 */}
        <div>
          <Text strong style={{ marginBottom: 12, display: 'block', color: 'var(--theme-text)' }}>
            快速选择
          </Text>
          <Row gutter={[12, 12]}>
            {themes.map(theme => (
              <Col xs={12} sm={8} md={6} key={theme.id}>
                {renderThemeCard(theme)}
              </Col>
            ))}
          </Row>
        </div>
      </Space>
    </Modal>
  );
};

export default ThemeModal;