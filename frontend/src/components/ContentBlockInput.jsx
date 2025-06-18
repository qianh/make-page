import React from 'react';
import { Card, Form, Input, Select, Button, Typography, Space, Upload, message } from 'antd';
import { CloseOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;

// Basic list of common languages for the code block
const commonLanguages = [
  'plaintext', 'javascript', 'jsx', 'typescript', 'tsx', 'python', 'java', 'csharp', 'php', 'ruby', 'go',
  'swift', 'kotlin', 'rust', 'sql', 'html', 'css', 'json', 'yaml', 'markdown', 'bash', 'shell'
];

const ContentBlockInput = ({ block, index, updateBlock, removeBlock }) => {

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/upload_image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      updateBlock(index, { ...block, image_path: result.file_path });
      message.success(`${file.name} file uploaded successfully.`);
      return Promise.resolve();
    } catch (error) {
      message.error(`${file.name} file upload failed.`);
      return Promise.reject();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateBlock(index, { ...block, [name]: value });
  };

  const handleCodeLanguageChange = (value) => {
    updateBlock(index, { ...block, language: value });
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <Form.Item 
            label={<Text style={{fontWeight: 500}}>Content</Text>} 
            style={{marginBottom: 0}}
          >
            <TextArea
              id={`text-content-${index}`}
              name="content"
              value={block.content}
              onChange={handleInputChange}
              rows={5}
              placeholder="Enter your text here..."
              style={{borderRadius: 8}}
            />
          </Form.Item>
        );
      case 'code':
        return (
          <Space direction="vertical" style={{width: '100%'}} size="middle">
            <Form.Item label={<Text style={{fontWeight: 500}}>Language</Text>} style={{marginBottom: 0}}>
              <Select
                id={`code-language-${index}`}
                value={block.language}
                onChange={handleCodeLanguageChange}
                style={{ width: '100%', borderRadius: 8 }}
                placeholder="Select language"
                showSearch
              >
                {commonLanguages.map(lang => (
                  <Option key={lang} value={lang}>{lang}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={<Text style={{fontWeight: 500}}>Code</Text>} style={{marginBottom: 0}}>
              <TextArea
                id={`code-content-${index}`}
                name="code"
                value={block.code}
                onChange={handleInputChange}
                rows={8}
                placeholder="Enter your code snippet here..."
                style={{fontFamily: 'monospace', borderRadius: 8}}
              />
            </Form.Item>
            <Form.Item label={<Text style={{fontWeight: 500}}>Caption (Optional)</Text>} style={{marginBottom: 0}}>
              <Input
                id={`code-caption-${index}`}
                type="text"
                name="caption"
                value={block.caption || ''}
                onChange={handleInputChange}
                placeholder="Optional caption for the code block"
                style={{borderRadius: 8}}
              />
            </Form.Item>
          </Space>
        );
      case 'image':
        return (
          <Space direction="vertical" style={{width: '100%'}} size="middle">
            <Form.Item label={<Text style={{fontWeight: 500}}>Image</Text>} style={{marginBottom: 0}}>
              <Upload
                customRequest={({ file, onSuccess, onError }) => {
                  handleImageUpload(file)
                    .then(() => onSuccess())
                    .catch(() => onError());
                }}
                showUploadList={true}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
              </Upload>
              {block.image_path && (
                <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                  Uploaded: {block.image_path.split('/').pop()}
                </Text>
              )}
            </Form.Item>
            <Form.Item label={<Text style={{fontWeight: 500}}>Alt Text (Optional)</Text>} style={{marginBottom: 0}}>
              <Input
                id={`image-alt-${index}`}
                type="text"
                name="alt_text"
                value={block.alt_text || ''}
                onChange={handleInputChange}
                placeholder="Descriptive text for accessibility"
                style={{borderRadius: 8}}
              />
            </Form.Item>
            <Form.Item label={<Text style={{fontWeight: 500}}>Caption (Optional)</Text>} style={{marginBottom: 0}}>
              <Input
                id={`image-caption-${index}`}
                type="text"
                name="caption"
                value={block.caption || ''}
                onChange={handleInputChange}
                placeholder="Optional caption for the image"
                style={{borderRadius: 8}}
              />
            </Form.Item>
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      bordered={false} 
      style={{ marginBottom: 24, borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
      headStyle={{borderBottom: '1px solid rgba(0,0,0,0.08)'}}
      title={<Title level={5} style={{marginBottom: 0, fontWeight: 600}}>{block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block</Title>}
      extra={
        <Button 
          type="text" 
          danger 
          icon={<CloseOutlined />} 
          onClick={() => removeBlock(index)} 
          aria-label="Remove block"
          style={{borderRadius: '50%', padding: '4px 8px'}}
        />
      }
    >
      <Form layout="vertical">
        {renderBlockContent()}
      </Form>
    </Card>
  );
};

export default ContentBlockInput;
