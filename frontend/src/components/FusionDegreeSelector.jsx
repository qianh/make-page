import React from 'react';
import { Card, Form, Select, Typography, Row, Col, Space, Tooltip, Collapse } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text, Title } = Typography;

const FusionDegreeSelector = ({ 
  fusionDegree, 
  onFusionDegreeChange, 
  enableSvgOutput, 
  onSvgOutputChange 
}) => {
  const fusionOptions = [
    {
      value: 'low',
      label: '低融合度',
      description: '保持原始内容的结构和分块，适合需要清晰分段的文档'
    },
    {
      value: 'medium',
      label: '中融合度',
      description: '在保持逻辑清晰的同时适度整合内容，平衡可读性与连贯性'
    },
    {
      value: 'high',
      label: '高融合度',
      description: '深度理解和重构所有内容，打破原有分块，形成高度连贯的整体'
    }
  ];

  const selectedOption = fusionOptions.find(option => option.value === fusionDegree);

  const fusionSettingsItems = [
    {
      key: '1',
      label: (
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: 'var(--theme-text)' }}>
          内容融合设置
        </Title>
      ),
      children: (
        <>
          <Form layout="vertical">
            <Row gutter={24}>
              <Col xs={24} md={16}>
                <Form.Item 
                  label={
                    <Space>
                      <Text style={{fontWeight: 500, color: 'var(--theme-text)'}}>融合程度</Text>
                      <Tooltip title="融合程度决定了AI如何整合你的内容块。高融合度会深度理解和重构内容，低融合度保持原有结构。">
                        <InfoCircleOutlined style={{ color: 'var(--theme-primary)' }} />
                      </Tooltip>
                    </Space>
                  } 
                  style={{marginBottom: 16}}
                >
                  <Select
                    value={fusionDegree}
                    onChange={onFusionDegreeChange}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="选择融合程度"
                    styles={{ dropdown: { maxWidth: '400px' } }}
                    optionLabelProp="label"
                  >
                    {fusionOptions.map(option => (
                      <Option 
                        key={option.value} 
                        value={option.value}
                        label={option.label}
                        style={{ padding: '8px 12px', height: 'auto', minHeight: '60px' }}
                      >
                        <div style={{ lineHeight: '1.4' }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '14px',
                            marginBottom: '4px',
                            color: 'var(--theme-text)'
                          }}>
                            {option.label}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--theme-textSecondary)',
                            lineHeight: '1.4',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {option.description}
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item 
                  label={
                    <Space>
                      <Text style={{fontWeight: 500, color: 'var(--theme-text)'}}>输出格式</Text>
                      <Tooltip title="启用SVG输出将生成带有自定义图表和插图的丰富视觉内容">
                        <InfoCircleOutlined style={{ color: 'var(--theme-primary)' }} />
                      </Tooltip>
                    </Space>
                  } 
                  style={{marginBottom: 16}}
                >
                  <Select
                    value={enableSvgOutput}
                    onChange={onSvgOutputChange}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="选择输出格式"
                  >
                    <Option value={false}>标准HTML</Option>
                    <Option value={true}>SVG增强</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {selectedOption && (
              <Card 
                variant="filled" 
                size="small" 
                style={{ 
                  marginTop: 16, 
                  background: 'var(--theme-surface)', 
                  borderRadius: 12, 
                  border: '1px solid var(--theme-border)' 
                }}
              >
                <Space direction="vertical" size={4}>
                  <Text style={{fontWeight: 500, color: 'var(--theme-primary)'}}>
                    当前设置：{selectedOption.label}
                  </Text>
                  <Text style={{ fontSize: '13px', color: 'var(--theme-textSecondary)' }}>
                    {selectedOption.description}
                  </Text>
                  {enableSvgOutput && (
                    <Text style={{ fontSize: '13px', color: 'var(--theme-success)' }}>
                      + 将生成包含自定义SVG插图的丰富视觉内容
                    </Text>
                  )}
                </Space>
              </Card>
            )}
          </Form>
        </>
      ),
    },
  ];

  return (
    <Collapse 
      items={fusionSettingsItems}
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

export default FusionDegreeSelector;